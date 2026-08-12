import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "@/lib/env";

/** Giới hạn cứng của Send API. Câu trả lời dài hơn phải cắt thành nhiều tin. */
const MAX_MESSAGE_LENGTH = 2000;
const SEND_TIMEOUT_MS = 15_000;

export class MessengerError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail?: unknown,
  ) {
    super(message);
    this.name = "MessengerError";
  }
}

/**
 * Đối chiếu header `X-Hub-Signature-256` với HMAC-SHA256 của body.
 *
 * QUAN TRỌNG: `rawBody` phải là chuỗi gốc đọc bằng `request.text()`. Nếu parse
 * JSON rồi stringify lại thì thứ tự key và khoảng trắng đổi, chữ ký sẽ luôn sai.
 */
export function verifyMessengerSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;

  const received = signatureHeader.slice("sha256=".length).trim();
  const expected = createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  const receivedBuffer = Buffer.from(received, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (receivedBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

/** Một tin nhắn text đã lọc ra từ payload webhook. */
export type MessengerTextEvent = {
  /** `entry[].id` — khoá tra ngược ra tenant. */
  pageId: string;
  /** Page-Scoped ID của người gửi. */
  psid: string;
  text: string;
  /** ID tin nhắn của Meta, dùng để chống xử lý trùng khi có retry. */
  mid: string | null;
};

type WebhookPayload = {
  object?: string;
  entry?: Array<{
    id?: string;
    messaging?: Array<{
      sender?: { id?: string };
      message?: { mid?: string; text?: string; is_echo?: boolean };
      postback?: { mid?: string; title?: string; payload?: string };
    }>;
  }>;
};

/**
 * Rút các sự kiện đáng trả lời khỏi payload webhook.
 *
 * Bỏ qua có chủ đích: echo (tin do chính page gửi, nếu không sẽ thành vòng lặp),
 * event `delivery`/`read`, và tin chỉ có attachment (chưa hỗ trợ ảnh/file).
 */
export function collectTextEvents(payload: unknown): MessengerTextEvent[] {
  const body = payload as WebhookPayload;
  if (body?.object !== "page" || !Array.isArray(body.entry)) return [];

  const events: MessengerTextEvent[] = [];

  for (const entry of body.entry) {
    const pageId = entry?.id;
    if (!pageId || !Array.isArray(entry.messaging)) continue;

    for (const item of entry.messaging) {
      const psid = item?.sender?.id;
      if (!psid) continue;

      if (item.message && !item.message.is_echo && item.message.text?.trim()) {
        events.push({
          pageId,
          psid,
          text: item.message.text.trim(),
          mid: item.message.mid ?? null,
        });
        continue;
      }

      // Nút "Bắt đầu" và các quick reply dạng postback cũng nên được trả lời.
      const postbackText = item.postback?.title ?? item.postback?.payload;
      if (postbackText?.trim()) {
        events.push({
          pageId,
          psid,
          text: postbackText.trim(),
          mid: item.postback?.mid ?? null,
        });
      }
    }
  }

  return events;
}

// --- Chống xử lý trùng ------------------------------------------------------

const MID_TTL_MS = 10 * 60_000;
const seenMids = new Map<string, number>();

/**
 * Đánh dấu một `mid` là đã xử lý, trả `true` nếu trước đó đã gặp.
 *
 * GIỚI HẠN ĐÃ BIẾT: lưu trong bộ nhớ tiến trình nên chỉ đúng với 1 instance.
 * Chấp nhận được vì webhook đã ack 200 ngay lập tức, Meta hầu như không retry.
 * Khi scale nhiều instance, thay bằng Redis SETNX — giữ nguyên chữ ký hàm.
 */
export function markMidSeen(mid: string | null): boolean {
  if (!mid) return false;

  const now = Date.now();
  for (const [key, expiresAt] of seenMids) {
    if (expiresAt <= now) seenMids.delete(key);
  }

  if (seenMids.has(mid)) return true;
  seenMids.set(mid, now + MID_TTL_MS);
  return false;
}

// --- Send API ---------------------------------------------------------------

function graphUrl(path: string): string {
  return `https://graph.facebook.com/${env.messenger.graphApiVersion}/${path}`;
}

async function callSendApi(
  pageAccessToken: string,
  body: Record<string, unknown>,
): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(graphUrl("me/messages"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === "AbortError") {
      throw new MessengerError("Send API không phản hồi kịp thời.", 504);
    }
    throw new MessengerError("Không kết nối được tới Send API.", 502, error);
  }

  clearTimeout(timeout);

  if (!response.ok) {
    const raw = await response.text();
    let detail: unknown = raw.slice(0, 500);
    try {
      detail = raw ? JSON.parse(raw) : null;
    } catch {
      // Giữ nguyên chuỗi thô nếu Meta không trả JSON.
    }
    throw new MessengerError(
      `Send API trả về lỗi ${response.status}.`,
      response.status,
      detail,
    );
  }
}

/** Cắt câu trả lời dài thành nhiều tin nhắn, ưu tiên cắt ở ranh giới dòng/khoảng trắng. */
export function chunkMessage(text: string, limit = MAX_MESSAGE_LENGTH): string[] {
  if (text.length <= limit) return [text];

  const chunks: string[] = [];
  let rest = text;

  while (rest.length > limit) {
    const window = rest.slice(0, limit);
    const breakAt = Math.max(window.lastIndexOf("\n"), window.lastIndexOf(" "));
    const cut = breakAt > limit * 0.6 ? breakAt : limit;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }

  if (rest) chunks.push(rest);
  return chunks;
}

/** Gửi text về cho người dùng Messenger, tự cắt nếu vượt 2000 ký tự. */
export async function sendMessengerText(options: {
  pageAccessToken: string;
  psid: string;
  text: string;
}): Promise<void> {
  for (const chunk of chunkMessage(options.text)) {
    await callSendApi(options.pageAccessToken, {
      recipient: { id: options.psid },
      messaging_type: "RESPONSE",
      message: { text: chunk },
    });
  }
}

/** Bật/tắt chấm "đang soạn tin". Chỉ là trang trí — lỗi ở đây không đáng chặn luồng. */
export async function sendSenderAction(options: {
  pageAccessToken: string;
  psid: string;
  action: "mark_seen" | "typing_on" | "typing_off";
}): Promise<void> {
  await callSendApi(options.pageAccessToken, {
    recipient: { id: options.psid },
    sender_action: options.action,
  });
}
