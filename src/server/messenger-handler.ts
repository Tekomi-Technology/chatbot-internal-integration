import "server-only";

import { markIdSeen } from "@/lib/channel-utils";
import { decryptSecret } from "@/lib/crypto";
import { DifyError, sendDifyChatMessage } from "@/lib/dify";
import { env } from "@/lib/env";
import {
  isWithinNightWindow,
  passThreadControl,
  sendMessengerText,
  sendSenderAction,
  type MessengerHandoverRequest,
  type MessengerHumanEcho,
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

/**
 * Bật cờ khi phát hiện người khác đã nhắn cho khách từ phía Page.
 *
 * Đường chính để tính năng này hoạt động trên Meta Business Suite, nơi
 * `request_thread_control` không bao giờ bắn. Khác `handleMessengerHandovers` ở
 * một điểm quan trọng: KHÔNG gọi Graph API nào, chỉ ghi DB — nên không có cảnh
 * "đã nhường quyền nhưng chưa ghi được cờ" như bên kia.
 *
 * Vẫn một chiều: chỉ bật, không bao giờ tắt. Xem spec.
 */
export async function handleHumanTakeovers(
  echoes: MessengerHumanEcho[],
): Promise<void> {
  for (const echo of echoes) {
    try {
      await handleHumanTakeover(echo);
    } catch (error) {
      console.error("messenger -> tiếp quản", {
        pageId: echo.pageId,
        error,
      });
    }
  }
}

async function handleHumanTakeover(echo: MessengerHumanEcho): Promise<void> {
  const channel = await prisma.messengerChannel.findUnique({
    where: { pageId: echo.pageId },
    select: { id: true },
  });

  if (!channel) {
    console.warn("messenger -> tiếp quản cho page chưa kết nối", {
      pageId: echo.pageId,
      psid: echo.psid,
    });
    return;
  }

  // `upsert` vì row chỉ ra đời sau lượt Dify đầu tiên, mà nhân viên hoàn toàn có
  // thể nhắn trước cho một khách bot chưa từng trả lời.
  const before = await prisma.messengerConversation.findUnique({
    where: { channelId_psid: { channelId: channel.id, psid: echo.psid } },
    select: { humanActive: true },
  });

  await prisma.messengerConversation.upsert({
    where: { channelId_psid: { channelId: channel.id, psid: echo.psid } },
    create: {
      channelId: channel.id,
      psid: echo.psid,
      humanActive: true,
      handoverAt: new Date(),
    },
    update: { humanActive: true, handoverAt: new Date() },
  });

  // Chỉ ghi log ở LẦN ĐẦU. Nhân viên nhắn mười câu thì có mười echo, ghi hết là
  // rác log mà không thêm thông tin gì.
  if (!before?.humanActive) {
    console.info("messenger -> nhân viên đã tiếp quản hội thoại", {
      pageId: echo.pageId,
      psid: echo.psid,
      senderAppId: echo.senderAppId,
    });
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

/**
 * Nhân viên vừa nhắn trong bao lâu thì vẫn coi là đang trực.
 *
 * Trong khung giờ đêm, bot chỉ nhận việc khi khoảng này đã trôi qua — để không
 * nhảy vào giữa lúc có người trực khuya đang chat dở với khách.
 */
const HUMAN_ACTIVE_GRACE_MS = 30 * 60_000;

/**
 * Hội thoại đang do nhân viên giữ, nhưng bot có được phép trả lời lúc này không?
 *
 * Chỉ đúng khi đang trong khung giờ đêm của Page VÀ nhân viên đã im đủ lâu.
 * Không sửa cờ `humanActive` — hết khung giờ là hội thoại tự quay về trạng thái
 * nhân viên giữ, không cần job dọn dẹp nào.
 */
function mayAnswerDespiteHuman(
  channel: { nightResumeStartHour: number | null; nightResumeEndHour: number | null },
  conversation: { handoverAt: Date | null },
): boolean {
  const now = new Date();

  if (
    !isWithinNightWindow(
      channel.nightResumeStartHour,
      channel.nightResumeEndHour,
      now,
    )
  ) {
    return false;
  }

  if (
    conversation.handoverAt &&
    now.getTime() - conversation.handoverAt.getTime() < HUMAN_ACTIVE_GRACE_MS
  ) {
    return false;
  }

  return true;
}

async function handleOne(event: MessengerTextEvent): Promise<void> {
  if (markIdSeen(event.mid)) {
    // Bỏ im lặng ở đây thì trùng `mid` trong 10 phút cũng khiến bot câm, biểu
    // hiện giống hệt mọi nguyên nhân khác khiến bot không trả lời.
    console.info("messenger -> bỏ qua tin trùng mid", {
      pageId: event.pageId,
      mid: event.mid,
    });
    return;
  }

  const channel = await prisma.messengerChannel.findUnique({
    where: { pageId: event.pageId },
    select: {
      id: true,
      isActive: true,
      pageAccessTokenEncrypted: true,
      nightResumeStartHour: true,
      nightResumeEndHour: true,
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
    select: {
      id: true,
      difyConversationId: true,
      humanActive: true,
      handoverAt: true,
    },
  });

  if (conversation?.humanActive && !mayAnswerDespiteHuman(channel, conversation)) {
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
