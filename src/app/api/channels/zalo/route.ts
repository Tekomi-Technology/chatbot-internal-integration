import { after, type NextRequest } from "next/server";

import { env } from "@/lib/env";
import { collectZaloTextEvents, verifyZaloSignature } from "@/lib/zalo";
import { handleZaloEvents } from "@/server/zalo-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export async function POST(request: NextRequest) {
  const { appId, secretKey } = env.zalo;
  if (!appId || !secretKey) {
    console.error("zalo webhook: thiếu ZALO_APP_ID hoặc ZALO_APP_SECRET");
    return new Response("Server chưa cấu hình app Zalo.", { status: 503 });
  }

  const rawBody = await request.text();

  const signatureHeader = request.headers.get("x-zevent-signature");

  if (!verifyZaloSignature(rawBody, signatureHeader, appId, secretKey)) {
    console.warn("zalo webhook: chữ ký không hợp lệ", {
      coHeaderChuKy: signatureHeader !== null,
      headerChuKy: signatureHeader,
      body: rawBody.slice(0, 500),
      cacHeaderNhanDuoc: [...request.headers.keys()].join(", "),
    });

    if (signatureHeader === null) {
      return new Response("EVENT_RECEIVED", { status: 200 });
    }

    return new Response("Invalid signature", { status: 403 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const events = collectZaloTextEvents(payload);
  if (events.length > 0) {
    after(() => handleZaloEvents(events));
  }

  return new Response("EVENT_RECEIVED", { status: 200 });
}
