import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

import { chunkMessage, markSelfSent, wasSelfSent } from "@/lib/channel-utils";
import { env } from "@/lib/env";

export class ZaloError extends Error {
  constructor(
    message: string,
    readonly code: number,
    readonly detail?: unknown,
  ) {
    super(message);
    this.name = "ZaloError";
  }
}

export function verifyZaloSignature(
  rawBody: string,
  signatureHeader: string | null,
  appId: string,
  secretKey: string,
): boolean {
  if (!signatureHeader) return false;

  const received = signatureHeader.startsWith("mac=")
    ? signatureHeader.slice("mac=".length).trim()
    : signatureHeader.trim();
  if (!received) return false;

  let timestamp: string;
  try {
    const parsed = JSON.parse(rawBody) as { timestamp?: unknown };
    if (parsed?.timestamp === undefined || parsed.timestamp === null) return false;
    timestamp = String(parsed.timestamp);
  } catch {
    return false;
  }

  const expected = createHash("sha256")
    .update(appId + rawBody + timestamp + secretKey, "utf8")
    .digest("hex");

  const receivedBuffer = Buffer.from(received, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (receivedBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

export function readOaId(rawBody: string): string | null {
  try {
    const parsed = JSON.parse(rawBody) as {
      event_name?: unknown;
      sender?: { id?: unknown };
      recipient?: { id?: unknown };
    };
    const raw =
      typeof parsed?.event_name === "string" && parsed.event_name.startsWith("oa_send")
        ? parsed?.sender?.id
        : parsed?.recipient?.id;
    return typeof raw === "string" && raw ? raw : null;
  } catch {
    return null;
  }
}

export type ZaloTextEvent = {
  oaId: string;
  userId: string;
  text: string;
  msgId: string | null;
};

type ZaloWebhookPayload = {
  event_name?: string;
  sender?: { id?: string };
  recipient?: { id?: string };
  message?: { text?: string; msg_id?: string };
};

export function collectZaloTextEvents(payload: unknown): ZaloTextEvent[] {
  const body = payload as ZaloWebhookPayload | null;
  if (body?.event_name !== "user_send_text") return [];

  const oaId = body.recipient?.id;
  const userId = body.sender?.id;
  const text = body.message?.text?.trim();

  if (!oaId || !userId || !text) return [];

  return [{ oaId, userId, text, msgId: body.message?.msg_id ?? null }];
}

export type ZaloHumanEcho = {
  oaId: string;
  userId: string;
  msgId: string | null;
};

type ZaloEchoPayload = {
  event_name?: string;
  sender?: { id?: string };
  recipient?: { id?: string };
  message?: { msg_id?: string };
};

export function collectZaloHumanEchoes(payload: unknown): ZaloHumanEcho[] {
  const body = payload as ZaloEchoPayload | null;
  if (body?.event_name !== "oa_send_text") return [];

  const oaId = body.sender?.id;
  const userId = body.recipient?.id;
  if (!oaId || !userId) return [];

  const msgId = body.message?.msg_id ?? null;
  if (wasSelfSent(msgId)) return [];

  return [{ oaId, userId, msgId }];
}

const OAUTH_URL = "https://oauth.zaloapp.com/v4/oa/access_token";
const CS_MESSAGE_URL = "https://openapi.zalo.me/v3.0/oa/message/cs";
const REQUEST_TIMEOUT_MS = 10_000;

export function readZaloResult(status: number, raw: string): unknown {
  let body: unknown;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    throw new ZaloError(
      `Zalo trả về nội dung không phải JSON (HTTP ${status}).`,
      status,
      raw.slice(0, 500),
    );
  }

  if (body === null) {
    throw new ZaloError(`Zalo trả về body rỗng (HTTP ${status}).`, status);
  }

  const payload = body as {
    error?: unknown;
    message?: string;
    error_description?: string;
  };

  const errorCode =
    payload.error === undefined || payload.error === null
      ? undefined
      : Number(payload.error);

  if (errorCode !== undefined && Number.isFinite(errorCode) && errorCode !== 0) {
    const detail = payload.message ?? payload.error_description ?? "không rõ lý do";
    throw new ZaloError(`Zalo báo lỗi ${errorCode}: ${detail}`, errorCode, body);
  }

  if (errorCode !== undefined && !Number.isFinite(errorCode)) {
    throw new ZaloError(
      `Zalo trả về trường \`error\` không phải số (HTTP ${status}).`,
      status,
      body,
    );
  }

  if (errorCode === undefined && (status < 200 || status >= 300)) {
    throw new ZaloError(`Zalo trả về HTTP ${status}.`, status, body);
  }

  return body;
}

async function callZalo(
  url: string,
  init: RequestInit,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ZaloError("Zalo không phản hồi kịp thời.", 504);
    }
    throw new ZaloError("Không kết nối được tới Zalo.", 502, error);
  } finally {
    clearTimeout(timeout);
  }

  return readZaloResult(response.status, await response.text());
}

function requireZaloApp(): { appId: string; secretKey: string } {
  const { appId, secretKey } = env.zalo;
  if (!appId || !secretKey) {
    throw new ZaloError(
      "Thiếu ZALO_APP_ID hoặc ZALO_APP_SECRET trong biến môi trường.",
      500,
    );
  }
  return { appId, secretKey };
}

export type ZaloTokenSet = {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
};

export async function exchangeRefreshToken(
  refreshToken: string,
): Promise<ZaloTokenSet> {
  const { appId, secretKey } = requireZaloApp();

  const body = await callZalo(OAUTH_URL, {
    method: "POST",
    headers: {
      secret_key: secretKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      app_id: appId,
      grant_type: "refresh_token",
    }).toString(),
  });

  const result = body as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: string | number;
  };

  if (!result.access_token || !result.refresh_token) {
    const diagnostic = body as { error?: number; expires_in?: string | number };
    throw new ZaloError("Zalo không trả về đủ cặp token.", 500, {
      hasAccessToken: Boolean(result.access_token),
      hasRefreshToken: Boolean(result.refresh_token),
      expiresIn: diagnostic.expires_in,
      errorCode: diagnostic.error,
    });
  }

  const expiresInSeconds = Number(result.expires_in ?? 3600);

  return {
    accessToken: result.access_token,
    refreshToken: result.refresh_token,
    expiresInSeconds: Number.isFinite(expiresInSeconds) ? expiresInSeconds : 3600,
  };
}

export async function sendZaloText(options: {
  accessToken: string;
  userId: string;
  text: string;
}): Promise<void> {
  for (const chunk of chunkMessage(options.text)) {
    const body = (await callZalo(CS_MESSAGE_URL, {
      method: "POST",
      headers: {
        access_token: options.accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { user_id: options.userId },
        message: { text: chunk },
      }),
    })) as { data?: { message_id?: string } };

    const messageId = body?.data?.message_id ?? null;
    if (!messageId) {
      console.warn(
        "zalo -> gửi tin thành công nhưng thiếu message_id, không đăng ký được là tin tự gửi",
        { userId: options.userId },
      );
    }
    markSelfSent(messageId);
  }
}
