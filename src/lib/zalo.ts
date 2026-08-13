import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

import { chunkMessage } from "@/lib/channel-utils";
import { env } from "@/lib/env";

export class ZaloError extends Error {
  constructor(
    message: string,
    /** Mã lỗi Zalo trả trong body. 0 nghĩa là thành công nên không bao giờ xuất hiện ở đây. */
    readonly code: number,
    readonly detail?: unknown,
  ) {
    super(message);
    this.name = "ZaloError";
  }
}

/**
 * Đối chiếu header `X-ZEvent-Signature` với sha256(appId + rawBody + timestamp + secretKey).
 *
 * QUAN TRỌNG: `rawBody` phải là chuỗi gốc đọc bằng `request.text()`. Nếu parse
 * JSON rồi stringify lại thì thứ tự key và khoảng trắng đổi, chữ ký sẽ luôn sai.
 *
 * `timestamp` lấy từ chính body — không phải header — theo đúng công thức của Zalo.
 *
 * Chấp nhận cả `mac=<hash>` lẫn hash trần: tài liệu Zalo chưa kiểm chứng được
 * trực tiếp về tiền tố này, nhận cả hai thì không phụ thuộc vào chi tiết đó.
 */
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

/** Một tin nhắn văn bản đã lọc ra từ payload webhook. */
export type ZaloTextEvent = {
  /** OA ID — khoá tra ngược ra tenant. Nằm ở `recipient.id` với event user gửi tới OA. */
  oaId: string;
  /** User ID của người gửi, chỉ duy nhất trong phạm vi một OA. */
  userId: string;
  text: string;
  /** `msg_id` của Zalo, dùng để chống xử lý trùng khi có retry. */
  msgId: string | null;
};

type ZaloWebhookPayload = {
  event_name?: string;
  sender?: { id?: string };
  recipient?: { id?: string };
  message?: { text?: string; msg_id?: string };
};

/**
 * Rút sự kiện đáng trả lời khỏi payload webhook.
 *
 * Khác Messenger, mỗi request của Zalo chỉ chứa MỘT sự kiện. Vẫn trả mảng để
 * nơi gọi dùng chung khuôn mẫu với `collectTextEvents` của Messenger.
 *
 * Bỏ qua có chủ đích: mọi `event_name` khác `user_send_text` — gồm follow,
 * unfollow, ảnh/file, và tin do chính OA gửi (nếu không sẽ thành vòng lặp).
 */
export function collectZaloTextEvents(payload: unknown): ZaloTextEvent[] {
  const body = payload as ZaloWebhookPayload | null;
  if (body?.event_name !== "user_send_text") return [];

  const oaId = body.recipient?.id;
  const userId = body.sender?.id;
  const text = body.message?.text?.trim();

  if (!oaId || !userId || !text) return [];

  return [{ oaId, userId, text, msgId: body.message?.msg_id ?? null }];
}

// --- Gọi API Zalo -----------------------------------------------------------

const OAUTH_URL = "https://oauth.zaloapp.com/v4/oa/access_token";
const CS_MESSAGE_URL = "https://openapi.zalo.me/v3.0/oa/message/cs";
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Đọc kết quả một lời gọi API Zalo.
 *
 * QUAN TRỌNG: Zalo trả HTTP 200 kể cả khi lỗi nghiệp vụ, mã lỗi thật nằm ở
 * trường `error` trong body. Chỉ kiểm `response.ok` là bỏ lọt gần hết lỗi.
 *
 * Zalo có HAI hình dạng phản hồi khác nhau tuỳ endpoint:
 * - CS Message API luôn trả `error: 0` khi thành công, khác 0 khi lỗi.
 * - OAuth access-token endpoint trả thẳng `{access_token, refresh_token,
 *   expires_in}` khi thành công — KHÔNG có trường `error` nào cả.
 * Vì vậy thiếu trường `error` không được coi là thất bại vô điều kiện: chỉ
 * khi thiếu `error` VÀ HTTP status cũng nằm ngoài 2xx thì mới ném lỗi (lỗi
 * tầng vận chuyển, ví dụ 401 kèm body JSON hợp lệ nhưng không có `error`).
 */
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

  const payload = body as { error?: number; message?: string; error_description?: string };

  if (typeof payload.error === "number" && payload.error !== 0) {
    const detail = payload.message ?? payload.error_description ?? "không rõ lý do";
    throw new ZaloError(`Zalo báo lỗi ${payload.error}: ${detail}`, payload.error, body);
  }

  // Không có trường `error` mà HTTP cũng hỏng → coi là lỗi tầng vận chuyển.
  if (payload.error === undefined && (status < 200 || status >= 300)) {
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

/**
 * Đổi refresh token lấy cặp token mới.
 *
 * CẢNH BÁO: gọi hàm này là HUỶ `refreshToken` truyền vào — Zalo chỉ cho dùng một
 * lần. Bên gọi BẮT BUỘC phải lưu `refreshToken` mới trả về, nếu không kênh chết
 * vĩnh viễn. Chỉ được gọi từ `src/server/zalo-token.ts`, nơi có advisory lock.
 */
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
    // KHÔNG gắn `body` thô vào đây: nếu Zalo trả về nửa vời (vd. có
    // access_token nhưng thiếu refresh_token) thì `body` chứa một access
    // token thật — gắn nguyên văn sẽ làm token đó lọt thẳng vào log. Chỉ ghi
    // lại thông tin chẩn đoán không nhạy cảm: trường nào có/thiếu, cộng các
    // trường vốn không bí mật như `expires_in` hay mã lỗi (nếu Zalo có kèm).
    const diagnostic = body as { error?: number; expires_in?: string | number };
    throw new ZaloError("Zalo không trả về đủ cặp token.", 500, {
      hasAccessToken: Boolean(result.access_token),
      hasRefreshToken: Boolean(result.refresh_token),
      expiresIn: diagnostic.expires_in,
      errorCode: diagnostic.error,
    });
  }

  // `expires_in` của Zalo là chuỗi nên phải ép kiểu số. Giá trị trả về là hạn
  // thô, CHƯA trừ hao gì cả — biên an toàn (vd. coi là hết hạn sớm hơn vài
  // phút) là trách nhiệm của `getValidAccessToken`, không phải ở đây.
  const expiresInSeconds = Number(result.expires_in ?? 3600);

  return {
    accessToken: result.access_token,
    refreshToken: result.refresh_token,
    expiresInSeconds: Number.isFinite(expiresInSeconds) ? expiresInSeconds : 3600,
  };
}

/** Gửi tin tư vấn (CS message) cho người dùng, tự cắt nếu vượt 2000 ký tự. */
export async function sendZaloText(options: {
  accessToken: string;
  userId: string;
  text: string;
}): Promise<void> {
  for (const chunk of chunkMessage(options.text)) {
    await callZalo(CS_MESSAGE_URL, {
      method: "POST",
      headers: {
        access_token: options.accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { user_id: options.userId },
        message: { text: chunk },
      }),
    });
  }
}
