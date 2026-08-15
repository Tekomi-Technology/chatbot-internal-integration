import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { chunkMessage } from "@/lib/channel-utils";
import { env } from "@/lib/env";

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

/** Một yêu cầu nhường quyền điều khiển hội thoại, do Page Inbox gửi tới. */
export type MessengerHandoverRequest = {
  /** `entry[].id` — khoá tra ngược ra tenant. */
  pageId: string;
  /** PSID của khách hàng mà nhân viên muốn tiếp quản. */
  psid: string;
  /** App ID của bên xin quyền (Page Inbox). Đọc từ payload, KHÔNG hardcode. */
  requestedOwnerAppId: string;
};

type HandoverPayload = {
  object?: string;
  entry?: Array<{
    id?: string;
    messaging?: Array<{
      sender?: { id?: string };
      request_thread_control?: { requested_owner_app_id?: string | number };
    }>;
  }>;
};

/**
 * Rút các yêu cầu nhường quyền khỏi payload webhook.
 *
 * Hàm riêng, chạy song song với `collectTextEvents` trên cùng payload. Không gộp
 * vào hàm đó vì nó lọc bỏ mọi thứ không phải `message`/`postback` — nhồi vào là
 * làm hỏng một hàm đang chạy tốt.
 *
 * Bỏ qua có chủ đích: `pass_thread_control`. Thiết kế này một chiều, nhân viên
 * bấm "Done" cũng không trả quyền lại cho AI. Xem spec, mục "Thiết kế một chiều".
 */
export function collectHandoverRequests(
  payload: unknown,
): MessengerHandoverRequest[] {
  const body = payload as HandoverPayload;
  if (body?.object !== "page" || !Array.isArray(body.entry)) return [];

  const requests: MessengerHandoverRequest[] = [];

  for (const entry of body.entry) {
    const pageId = entry?.id;
    if (!pageId || !Array.isArray(entry.messaging)) continue;

    for (const item of entry.messaging) {
      const psid = item?.sender?.id;
      const appId = item?.request_thread_control?.requested_owner_app_id;
      if (!psid || !appId) continue;

      // Meta có lúc gửi app id dạng số, có lúc dạng chuỗi. Chuẩn hoá về chuỗi.
      requests.push({ pageId, psid, requestedOwnerAppId: String(appId) });
    }
  }

  return requests;
}

// --- Send API ---------------------------------------------------------------

function graphUrl(path: string): string {
  return `https://graph.facebook.com/${env.messenger.graphApiVersion}/${path}`;
}

async function callSendApi(
  pageAccessToken: string,
  /** Path Graph API, ví dụ `me/messages` hoặc `me/pass_thread_control`. */
  path: string,
  body: Record<string, unknown>,
): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(graphUrl(path), {
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
      throw new MessengerError(`Graph API ${path} không phản hồi kịp thời.`, 504);
    }
    throw new MessengerError(`Không kết nối được tới Graph API ${path}.`, 502, error);
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
      `Graph API ${path} trả về lỗi ${response.status}.`,
      response.status,
      detail,
    );
  }
}

/** Gửi text về cho người dùng Messenger, tự cắt nếu vượt 2000 ký tự. */
export async function sendMessengerText(options: {
  pageAccessToken: string;
  psid: string;
  text: string;
}): Promise<void> {
  for (const chunk of chunkMessage(options.text)) {
    await callSendApi(options.pageAccessToken, "me/messages", {
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
  await callSendApi(options.pageAccessToken, "me/messages", {
    recipient: { id: options.psid },
    sender_action: options.action,
  });
}

/**
 * Nhường quyền điều khiển hội thoại cho app khác — ở đây luôn là Page Inbox.
 *
 * App của ta là primary receiver: KHÔNG gọi hàm này thì Page Inbox không nhắn
 * cho khách được, dù nhân viên đã kéo hội thoại sang "Inbox". Ghi cờ trong DB
 * thôi là chưa đủ.
 *
 * `targetAppId` đọc từ `requested_owner_app_id` trong payload, không hardcode.
 */
export async function passThreadControl(options: {
  pageAccessToken: string;
  psid: string;
  targetAppId: string;
}): Promise<void> {
  await callSendApi(options.pageAccessToken, "me/pass_thread_control", {
    recipient: { id: options.psid },
    target_app_id: options.targetAppId,
  });
}
