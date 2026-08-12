import { after, type NextRequest } from "next/server";

import { safeEqual } from "@/lib/crypto";
import { env } from "@/lib/env";
import { collectTextEvents, verifyMessengerSignature } from "@/lib/messenger";
import { handleMessengerEvents } from "@/server/messenger-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Callback URL dùng chung cho mọi tenant — dán vào ô "URL gọi lại" của Meta App.
 *
 * URL cố tình KHÔNG mang tenantId: hệ thống dùng một Meta App duy nhất, nên
 * việc định tuyến dựa vào Page ID (`entry[].id`) tra trong bảng messenger_channels.
 */

/** Bước xác minh webhook: Meta gọi GET và chờ nhận lại đúng `hub.challenge`. */
export async function GET(request: NextRequest) {
  const { verifyToken } = env.messenger;
  if (!verifyToken) {
    console.error("messenger webhook: thiếu MESSENGER_VERIFY_TOKEN");
    return new Response("Server chưa cấu hình verify token.", { status: 500 });
  }

  const params = request.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode !== "subscribe" || !token || !challenge || !safeEqual(token, verifyToken)) {
    return new Response("Forbidden", { status: 403 });
  }

  // Meta yêu cầu trả lại challenge nguyên văn, không bọc JSON.
  return new Response(challenge, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

/**
 * Nhận sự kiện tin nhắn.
 *
 * Trả 200 ngay sau khi xác thực chữ ký rồi mới gọi Dify trong `after()`: Dify có
 * thể mất vài chục giây, mà Meta sẽ gửi lại webhook nếu không nhận được 200 sớm
 * — dẫn tới bot trả lời trùng.
 */
export async function POST(request: NextRequest) {
  const { appSecret } = env.messenger;
  if (!appSecret) {
    console.error("messenger webhook: thiếu MESSENGER_APP_SECRET");
    return new Response("Server chưa cấu hình app secret.", { status: 500 });
  }

  // Phải đọc dạng text: chữ ký được tính trên đúng bytes gốc của body.
  const rawBody = await request.text();

  if (
    !verifyMessengerSignature(
      rawBody,
      request.headers.get("x-hub-signature-256"),
      appSecret,
    )
  ) {
    console.warn("messenger webhook: chữ ký không hợp lệ");
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const events = collectTextEvents(payload);
  if (events.length > 0) {
    after(() => handleMessengerEvents(events));
  }

  return new Response("EVENT_RECEIVED", { status: 200 });
}
