import "server-only";

import { markIdSeen, mayAnswerDespiteHuman } from "@/lib/channel-utils";
import { decryptSecret } from "@/lib/crypto";
import { DifyError, sendDifyChatMessage } from "@/lib/dify";
import { env } from "@/lib/env";
import {
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

  await passThreadControl({
    pageAccessToken: decryptSecret(channel.pageAccessTokenEncrypted),
    psid: request.psid,
    targetAppId: request.requestedOwnerAppId,
  });

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
  if (markIdSeen(event.mid)) {
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
