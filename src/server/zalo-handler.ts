import "server-only";

import { markIdSeen, mayAnswerDespiteHuman } from "@/lib/channel-utils";
import { decryptSecret } from "@/lib/crypto";
import { DifyError, sendDifyChatMessage } from "@/lib/dify";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  sendZaloText,
  ZaloError,
  type ZaloHumanEcho,
  type ZaloTextEvent,
} from "@/lib/zalo";
import { getValidAccessToken } from "@/server/zalo-token";

const FALLBACK_MESSAGE =
  "Xin lỗi, trợ lý đang bận. Bạn vui lòng nhắn lại sau ít phút nhé.";

export async function handleZaloEvents(events: ZaloTextEvent[]): Promise<void> {
  for (const event of events) {
    try {
      await handleOne(event);
    } catch (error) {
      console.error("zalo -> handleEvent", { oaId: event.oaId, error });
    }
  }
}

/**
 * Bật cờ khi phát hiện nhân viên đã nhắn tay cho khách qua app Zalo OA.
 *
 * Một chiều: chỉ bật `humanActive`, không bao giờ tắt. Xem spec, mục
 * "Chính sách trả quyền — một chiều, đúng khuôn Messenger".
 */
export async function handleZaloHumanEchoes(echoes: ZaloHumanEcho[]): Promise<void> {
  for (const echo of echoes) {
    try {
      await handleHumanTakeover(echo);
    } catch (error) {
      console.error("zalo -> tiếp quản", { oaId: echo.oaId, error });
    }
  }
}

async function handleHumanTakeover(echo: ZaloHumanEcho): Promise<void> {
  const channel = await prisma.zaloChannel.findUnique({
    where: { oaId: echo.oaId },
    select: { id: true },
  });

  if (!channel) {
    console.warn("zalo -> tiếp quản cho OA chưa kết nối", {
      oaId: echo.oaId,
      userId: echo.userId,
    });
    return;
  }

  // `upsert` vì row chỉ ra đời sau lượt Dify đầu tiên, mà nhân viên hoàn toàn
  // có thể nhắn trước cho một khách bot chưa từng trả lời.
  const before = await prisma.zaloConversation.findUnique({
    where: { channelId_zaloUserId: { channelId: channel.id, zaloUserId: echo.userId } },
    select: { humanActive: true },
  });

  await prisma.zaloConversation.upsert({
    where: { channelId_zaloUserId: { channelId: channel.id, zaloUserId: echo.userId } },
    create: {
      channelId: channel.id,
      zaloUserId: echo.userId,
      humanActive: true,
      handoverAt: new Date(),
    },
    update: { humanActive: true, handoverAt: new Date() },
  });

  // Chỉ ghi log ở LẦN ĐẦU. Nhân viên nhắn mười câu thì có mười echo, ghi hết
  // là rác log mà không thêm thông tin gì.
  if (!before?.humanActive) {
    console.info("zalo -> nhân viên đã tiếp quản hội thoại", {
      oaId: echo.oaId,
      userId: echo.userId,
    });
  }
}

async function handleOne(event: ZaloTextEvent): Promise<void> {
  if (markIdSeen(event.msgId)) return;

  const channel = await prisma.zaloChannel.findUnique({
    where: { oaId: event.oaId },
    select: {
      id: true,
      isActive: true,
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
    console.warn("zalo -> bỏ qua sự kiện", {
      oaId: event.oaId,
      reason: !channel ? "oa_chua_ket_noi" : "channel_hoac_tenant_inactive",
    });
    return;
  }

  const user = `zalo:${event.userId}`;

  if (!checkRateLimit(user).success) {
    console.warn("zalo -> vượt rate limit", { oaId: event.oaId });
    return;
  }

  const conversation = await prisma.zaloConversation.findUnique({
    where: { channelId_zaloUserId: { channelId: channel.id, zaloUserId: event.userId } },
    select: { difyConversationId: true, humanActive: true, handoverAt: true },
  });

  // Đọc hội thoại TRƯỚC khi lấy access token: nhân viên đang giữ hội thoại thì
  // không cần tốn một lượt gọi refresh token cho việc sẽ im lặng ngay sau đó.
  if (conversation?.humanActive && !mayAnswerDespiteHuman(channel, conversation)) {
    console.warn("zalo -> nhân viên đang giữ hội thoại, bot im", {
      oaId: event.oaId,
      userId: event.userId,
    });
    return;
  }

  // Lấy token TRƯỚC khi gọi Dify: hỏng token thì không tiêu quota Dify vô ích,
  // và cũng không gửi nổi câu xin lỗi.
  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(channel.id);
  } catch (error) {
    console.error("zalo -> getValidAccessToken", {
      oaId: event.oaId,
      error: error instanceof ZaloError ? { code: error.code, detail: error.detail } : error,
    });
    return;
  }

  const startedAt = Date.now();
  let result;
  try {
    result = await askDify({
      tenant: channel.tenant,
      query: event.text,
      user,
      conversationId: conversation?.difyConversationId ?? null,
    });
  } catch (error) {
    console.error("zalo -> dify", {
      tenantId: channel.tenant.id,
      error: error instanceof DifyError ? { status: error.status, detail: error.detail } : error,
    });
    await sendZaloText({ accessToken, userId: event.userId, text: FALLBACK_MESSAGE }).catch(
      (sendError) => console.error("zalo -> fallback", sendError),
    );
    return;
  }

  const latencyMs = Date.now() - startedAt;

  await prisma.zaloConversation.upsert({
    where: { channelId_zaloUserId: { channelId: channel.id, zaloUserId: event.userId } },
    create: {
      channelId: channel.id,
      zaloUserId: event.userId,
      difyConversationId: result.conversationId,
      lastMessageAt: new Date(),
    },
    update: {
      difyConversationId: result.conversationId,
      lastMessageAt: new Date(),
    },
  });

  try {
    await sendZaloText({
      accessToken,
      userId: event.userId,
      text: result.answer.trim() || FALLBACK_MESSAGE,
    });
  } catch (error) {
    // Ngoài cửa sổ 7 ngày thì gửi lại cũng hỏng vì cùng lý do — chỉ log, không thử lại.
    console.error("zalo -> gửi CS message", {
      oaId: event.oaId,
      error: error instanceof ZaloError ? { code: error.code, detail: error.detail } : error,
    });
  }

  await prisma.zaloChannel
    .update({ where: { id: channel.id }, data: { lastEventAt: new Date() } })
    .catch((error) => console.error("zalo -> lastEventAt", error));

  if (env.enableConversationLog) {
    await prisma.conversationLog
      .create({
        data: {
          tenantId: channel.tenant.id,
          sessionId: user,
          difyConversationId: result.conversationId,
          requestPayload: { message: event.text, oaId: event.oaId },
          responsePayload: { answer: result.answer, messageId: result.messageId },
          latencyMs,
        },
      })
      .catch((error) => console.error("zalo -> conversationLog", error));
  }
}

/** Hội thoại Dify có thể bị xoá phía Dify; gặp 404 thì bắt đầu lại mạch mới. */
async function askDify(options: {
  tenant: { difyApiKeyEncrypted: string; difyApiBaseUrl: string | null };
  query: string;
  user: string;
  conversationId: string | null;
}) {
  const request = {
    baseUrl: options.tenant.difyApiBaseUrl,
    apiKey: decryptSecret(options.tenant.difyApiKeyEncrypted),
    query: options.query,
    user: options.user,
  };

  try {
    return await sendDifyChatMessage({ ...request, conversationId: options.conversationId });
  } catch (error) {
    const conversationGone =
      options.conversationId && error instanceof DifyError && error.status === 404;

    if (!conversationGone) throw error;

    return await sendDifyChatMessage({ ...request, conversationId: null });
  }
}
