import { after, type NextRequest } from "next/server";

import { safeEqual } from "@/lib/crypto";
import { env } from "@/lib/env";
import {
  collectHandoverRequests,
  collectTextEvents,
  verifyMessengerSignature,
} from "@/lib/messenger";
import {
  handleMessengerEvents,
  handleMessengerHandovers,
} from "@/server/messenger-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Ghi lại CẤU TRÚC của mọi webhook đã qua xác thực chữ ký.
 *
 * Vì sao cần: đường chạy bình thường không ghi log gì cả, nên khi bot im lặng ta
 * không phân biệt được ba tình huống hoàn toàn khác nhau — webhook không tới,
 * webhook tới nhưng payload bị lọc ra 0 sự kiện, hay handler chạy rồi mà lỗi.
 *
 * Trường đáng giá nhất là `standby`. Khi Handover Protocol được bật trên Page mà
 * app không giữ quyền điều khiển thread, Facebook chuyển tin của khách sang
 * `entry[].standby[]` thay vì `entry[].messaging[]`. `collectTextEvents` chỉ đọc
 * `messaging`, nên gặp payload kiểu đó sẽ trả mảng rỗng và bot im hoàn toàn —
 * không phải lỗi code, mà là cấu hình bên Meta.
 *
 * Cố ý KHÔNG ghi nội dung tin nhắn của khách, chỉ ghi hình dạng payload.
 */
function logWebhookReceived(
  payload: unknown,
  textEvents: number,
  handovers: number,
): void {
  const body = payload as { object?: string; entry?: unknown[] };

  const entries = (Array.isArray(body?.entry) ? body.entry : []).map((raw) => {
    const entry = (raw ?? {}) as Record<string, unknown>;
    const count = (key: string) =>
      Array.isArray(entry[key]) ? (entry[key] as unknown[]).length : 0;

    return {
      id: entry.id,
      messaging: count("messaging"),
      standby: count("standby"),
      // Bắt cả những mảng chưa lường trước, để không phải deploy thêm lần nữa
      // mới biết Facebook đặt dữ liệu ở đâu.
      keys: Object.keys(entry).filter((key) => key !== "id" && key !== "time"),
    };
  });

  console.info("messenger webhook: WEBHOOK RECEIVED", {
    object: body?.object,
    entries,
    textEvents,
    handovers,
  });
}

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

  return new Response(challenge, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

export async function POST(request: NextRequest) {
  const { appSecret } = env.messenger;
  if (!appSecret) {
    console.error("messenger webhook: thiếu MESSENGER_APP_SECRET");
    return new Response("Server chưa cấu hình app secret.", { status: 500 });
  }

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
  const handovers = collectHandoverRequests(payload);

  logWebhookReceived(payload, events.length, handovers.length);

  if (events.length > 0 || handovers.length > 0) {
    after(async () => {
      await handleMessengerHandovers(handovers);
      await handleMessengerEvents(events);
    });
  }

  return new Response("EVENT_RECEIVED", { status: 200 });
}
