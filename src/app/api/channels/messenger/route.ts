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

  if (events.length > 0 || handovers.length > 0) {
    after(async () => {
      await handleMessengerHandovers(handovers);
      await handleMessengerEvents(events);
    });
  }

  return new Response("EVENT_RECEIVED", { status: 200 });
}
