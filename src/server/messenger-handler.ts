import "server-only";

import { markIdSeen } from "@/lib/channel-utils";
import { decryptSecret } from "@/lib/crypto";
import { DifyError, sendDifyChatMessage } from "@/lib/dify";
import { env } from "@/lib/env";
import {
  passThreadControl,
  sendMessengerText,
  sendSenderAction,
  type MessengerHandoverRequest,
  type MessengerTextEvent,
} from "@/lib/messenger";
import { prisma } from "@/lib/prisma";

const FALLBACK_MESSAGE =
  "Xin lỗi, trợ lý đang bận. Bạn vui lòng nhắn lại sau ít phút nhé.";

export async function handleMessengerEvents(
  events: MessengerTextEvent[],
): Promise<void> {
  for (const event of events) {
    try {
      await handleOne(event);
    } catch (error) {
      console.error("messenger -> handleEvent", {
        pageId: event.pageId,
        error,
      });
    }
  }
}

/**
 * Xử lý các yêu cầu nhường quyền từ Page Inbox.
 *
 * Một chiều: chỉ bật `humanActive`, không bao giờ tắt. Xem spec, mục "Thiết kế
 * một chiều" — kể cả khi nhân viên bấm "Done", bot vẫn im vĩnh viễn với khách đó.
 */
export async function handleMessengerHandovers(
  requests: MessengerHandoverRequest[],
): Promise<void> {
  for (const request of requests) {
    try {
      await handleHandover(request);
    } catch (error) {
      console.error("messenger -> handover", {
        pageId: request.pageId,
        error,
      });
    }
  }
}

async function handleHandover(
  request: MessengerHandoverRequest,
): Promise<void> {
  const channel = await prisma.messengerChannel.findUnique({
    where: { pageId: request.pageId },
    select: { id: true, pageAccessTokenEncrypted: true },
  });

  if (!channel) {
    console.warn("messenger -> handover cho page chưa kết nối", {
      pageId: request.pageId,
      psid: request.psid,
    });
    return;
  }

  // Nhường quyền TRƯỚC khi ghi cờ. Nếu Graph lỗi thì hàm này throw, cờ không
  // bật, bot vẫn trả lời như cũ — thà thế còn hơn bot im mà nhân viên cũng
  // không nhắn được cho khách.
  await passThreadControl({
    pageAccessToken: decryptSecret(channel.pageAccessTokenEncrypted),
    psid: request.psid,
    targetAppId: request.requestedOwnerAppId,
  });

  // Phải là `upsert`, không phải `update`: row chỉ ra đời sau lượt Dify đầu
  // tiên, mà sự kiện handover hoàn toàn có thể đến trước đó.
  try {
    await prisma.messengerConversation.upsert({
      where: {
        channelId_psid: { channelId: channel.id, psid: request.psid },
      },
      create: {
        channelId: channel.id,
        psid: request.psid,
        humanActive: true,
        handoverAt: new Date(),
      },
      update: {
        humanActive: true,
        handoverAt: new Date(),
      },
    });
  } catch (error) {
    // ĐÃ nhường quyền cho Page Inbox nhưng KHÔNG ghi được cờ humanActive — trạng
    // thái bị chia đôi. Retry webhook không tự sửa được: lần sau passThreadControl
    // sẽ lỗi trước (ta không còn giữ quyền nữa) nên hàm return sớm, không bao giờ
    // chạm lại đoạn upsert này. Phải sửa tay theo (channelId, psid) dưới đây.
    console.error(
      "messenger -> handover: ĐÃ nhường quyền nhưng CHƯA ghi được cờ humanActive, cần sửa tay",
      { pageId: request.pageId, psid: request.psid, error },
    );
    throw error;
  }

  console.info("messenger -> handover thành công, nhân viên đã tiếp quản hội thoại", {
    pageId: request.pageId,
    psid: request.psid,
    targetAppId: request.requestedOwnerAppId,
  });
}

async function handleOne(event: MessengerTextEvent): Promise<void> {
  if (markIdSeen(event.mid)) return;

  const channel = await prisma.messengerChannel.findUnique({
    where: { pageId: event.pageId },
    select: {
      id: true,
      isActive: true,
      pageAccessTokenEncrypted: true,
      tenant: {
        select: {
          id: true,
          status: true,
          difyApiKeyEncrypted: true,
          difyApiBaseUrl: true,
        },
      },
    },
  });

  if (!channel || !channel.isActive || channel.tenant.status !== "ACTIVE") {
    console.warn("messenger -> bỏ qua sự kiện", {
      pageId: event.pageId,
      reason: !channel ? "page_chua_ket_noi" : "channel_hoac_tenant_inactive",
    });
    return;
  }

  const pageAccessToken = decryptSecret(channel.pageAccessTokenEncrypted);

  // Đọc hội thoại TRƯỚC typing_on. Cửa chặn phải nằm trước mọi tín hiệu gửi ra
  // ngoài, không chỉ trước lời gọi Dify — nếu không khách vẫn thấy chấm "đang
  // soạn tin" trong lúc nhân viên đang chat, trông rất lạ.
  const conversation = await prisma.messengerConversation.findUnique({
    where: { channelId_psid: { channelId: channel.id, psid: event.psid } },
    select: { id: true, difyConversationId: true, humanActive: true },
  });

  if (conversation?.humanActive) {
    console.warn("messenger -> nhân viên đang giữ hội thoại, bot im", {
      pageId: event.pageId,
      psid: event.psid,
    });
    return;
  }

  await sendSenderAction({
    pageAccessToken,
    psid: event.psid,
    action: "typing_on",
  }).catch((error) => console.error("messenger -> typing_on", error));

  const startedAt = Date.now();
  let result;
  try {
    result = await askDify({
      tenant: channel.tenant,
      query: event.text,
      psid: event.psid,
      conversationId: conversation?.difyConversationId ?? null,
    });
  } catch (error) {
    console.error("messenger -> dify", {
      tenantId: channel.tenant.id,
      error:
        error instanceof DifyError
          ? { status: error.status, detail: error.detail }
          : error,
    });
    await sendMessengerText({
      pageAccessToken,
      psid: event.psid,
      text: FALLBACK_MESSAGE,
    }).catch((sendError) => console.error("messenger -> fallback", sendError));
    return;
  }

  const latencyMs = Date.now() - startedAt;

  await prisma.messengerConversation.upsert({
    where: { channelId_psid: { channelId: channel.id, psid: event.psid } },
    create: {
      channelId: channel.id,
      psid: event.psid,
      difyConversationId: result.conversationId,
      lastMessageAt: new Date(),
    },
    update: {
      difyConversationId: result.conversationId,
      lastMessageAt: new Date(),
    },
  });

  await sendMessengerText({
    pageAccessToken,
    psid: event.psid,
    text: result.answer.trim() || FALLBACK_MESSAGE,
  });

  if (env.enableConversationLog) {
    await prisma.conversationLog
      .create({
        data: {
          tenantId: channel.tenant.id,
          sessionId: `messenger:${event.psid}`,
          difyConversationId: result.conversationId,
          requestPayload: { message: event.text, pageId: event.pageId },
          responsePayload: {
            answer: result.answer,
            messageId: result.messageId,
          },
          latencyMs,
        },
      })
      .catch((error) => console.error("messenger -> conversationLog", error));
  }
}

async function askDify(options: {
  tenant: { difyApiKeyEncrypted: string; difyApiBaseUrl: string | null };
  query: string;
  psid: string;
  conversationId: string | null;
}) {
  const request = {
    baseUrl: options.tenant.difyApiBaseUrl,
    apiKey: decryptSecret(options.tenant.difyApiKeyEncrypted),
    query: options.query,
    user: `messenger:${options.psid}`,
  };

  try {
    return await sendDifyChatMessage({
      ...request,
      conversationId: options.conversationId,
    });
  } catch (error) {
    const conversationGone =
      options.conversationId &&
      error instanceof DifyError &&
      error.status === 404;

    if (!conversationGone) throw error;

    return await sendDifyChatMessage({ ...request, conversationId: null });
  }
}
