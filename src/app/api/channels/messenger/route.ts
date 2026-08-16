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
/** Nối thành chuỗi để không bị `util.inspect` cắt thành `[Array]`. Xem `keys` bên dưới. */
function join(values: string[]): string {
  return values.length > 0 ? values.join(",") : "-";
}

/**
 * Liệt kê CÁC LOẠI sự kiện có trong một mảng `messaging[]` / `standby[]`.
 *
 * Chỉ đếm số phần tử là không đủ: `messaging: 1, textEvents: 0, handovers: 0`
 * có thể là payload rác, mà cũng có thể là `pass_thread_control` — thứ code
 * đang cố ý bỏ qua theo thiết kế một chiều. Hai tình huống đó đòi hai cách xử
 * lý khác hẳn nhau, nên phải nhìn thấy được tên sự kiện.
 *
 * Chỉ đọc TÊN trường, không đọc giá trị — nội dung tin nhắn của khách không lọt
 * vào log.
 */
function eventTypes(items: unknown[]): string {
  const types = new Set<string>();

  for (const raw of items) {
    for (const key of Object.keys((raw ?? {}) as Record<string, unknown>)) {
      // Ba trường bọc ngoài có mặt ở mọi sự kiện, nêu ra chỉ tổ nhiễu.
      if (key !== "sender" && key !== "recipient" && key !== "timestamp") {
        types.add(key);
      }
    }
  }

  return join([...types]);
}

function logWebhookReceived(
  payload: unknown,
  textEvents: number,
  handovers: number,
): void {
  const body = payload as { object?: string; entry?: unknown[] };

  const entries = (Array.isArray(body?.entry) ? body.entry : []).map((raw) => {
    const entry = (raw ?? {}) as Record<string, unknown>;
    const items = (key: string) =>
      Array.isArray(entry[key]) ? (entry[key] as unknown[]) : [];

    return {
      id: entry.id,
      messaging: items("messaging").length,
      messagingTypes: eventTypes(items("messaging")),
      standby: items("standby").length,
      standbyTypes: eventTypes(items("standby")),
      // Bắt cả những mảng chưa lường trước, để không phải deploy thêm lần nữa
      // mới biết Facebook đặt dữ liệu ở đâu.
      //
      // Phải nối thành CHUỖI, không để nguyên mảng: `console.info` dùng
      // `util.inspect` với `depth: 2`, mà trường này nằm ở tầng 3
      // (`{...}` → `entries[]` → `entry{}` → đây) nên để mảng thì in ra
      // `[Array]` — tức là trường sinh ra để chống bất ngờ lại tự giấu mất
      // đúng thứ bất ngờ đó.
      keys: join(Object.keys(entry).filter((key) => key !== "id" && key !== "time")),
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
    // Không log thì lúc đăng ký lại webhook, Facebook chỉ báo lỗi chung chung
    // còn server hoàn toàn câm. Ghi rõ vế nào hỏng, KHÔNG ghi giá trị token.
    console.warn("messenger webhook: xác minh GET thất bại", {
      mode,
      hasToken: token !== null,
      hasChallenge: challenge !== null,
      tokenKhop: token !== null && safeEqual(token, verifyToken),
    });
    return new Response("Forbidden", { status: 403 });
  }

  return new Response(challenge, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

/**
 * Ghi nhận request VỪA CHẠM tới route, trước mọi bước kiểm tra.
 *
 * `logWebhookReceived` bên dưới chỉ chạy sau khi chữ ký đã qua, nên khi bot im
 * ta vẫn không tách được hai tình huống cần tách nhất: Facebook không gọi tới
 * (webhook bị huỷ đăng ký, DNS/TLS/reverse-proxy chặn) và Facebook có gọi nhưng
 * bị chặn ngay ở cửa (sai chữ ký, thiếu app secret, body không phải JSON).
 *
 * Chỉ ghi hình dạng request, không ghi body và không ghi giá trị chữ ký.
 */
function logRequestArrived(request: NextRequest): void {
  console.info("messenger webhook: REQUEST ARRIVED", {
    hasSignature: request.headers.get("x-hub-signature-256") !== null,
    contentLength: request.headers.get("content-length"),
    userAgent: request.headers.get("user-agent"),
  });
}

export async function POST(request: NextRequest) {
  logRequestArrived(request);

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
    console.warn("messenger webhook: body không phải JSON hợp lệ");
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
