import { after, type NextRequest } from "next/server";

import { safeEqual } from "@/lib/crypto";
import { env } from "@/lib/env";
import {
  collectHandoverRequests,
  collectHumanEchoes,
  collectTextEvents,
  verifyMessengerSignature,
} from "@/lib/messenger";
import {
  handleHumanTakeovers,
  handleMessengerEvents,
  handleMessengerHandovers,
} from "@/server/messenger-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function join(values: string[]): string {
  return values.length > 0 ? values.join(",") : "-";
}

function eventTypes(items: unknown[]): string {
  const types = new Set<string>();

  for (const raw of items) {
    for (const key of Object.keys((raw ?? {}) as Record<string, unknown>)) {
      if (key !== "sender" && key !== "recipient" && key !== "timestamp") {
        types.add(key);
      }
    }
  }

  return join([...types]);
}

function echoInfo(items: unknown[]): string {
  const marks: string[] = [];

  for (const raw of items) {
    const message = ((raw ?? {}) as {
      message?: { is_echo?: boolean; app_id?: unknown };
    }).message;

    if (!message?.is_echo) continue;

    marks.push(
      message.app_id === undefined || message.app_id === null
        ? "echo(khong-co-app_id)"
        : `echo(app_id=${String(message.app_id)})`,
    );
  }

  return join(marks);
}

function logWebhookReceived(
  payload: unknown,
  textEvents: number,
  handovers: number,
  takeovers: number,
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
      messagingEchoes: echoInfo(items("messaging")),
      standby: items("standby").length,
      standbyTypes: eventTypes(items("standby")),
      standbyEchoes: echoInfo(items("standby")),
      keys: join(Object.keys(entry).filter((key) => key !== "id" && key !== "time")),
    };
  });

  console.info("messenger webhook: WEBHOOK RECEIVED", {
    object: body?.object,
    entries,
    textEvents,
    handovers,
    takeovers,
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
  const takeovers = collectHumanEchoes(payload, env.messenger.appId);

  logWebhookReceived(payload, events.length, handovers.length, takeovers.length);

  if (events.length > 0 || handovers.length > 0 || takeovers.length > 0) {
    after(async () => {
      await handleMessengerHandovers(handovers);
      await handleHumanTakeovers(takeovers);
      await handleMessengerEvents(events);
    });
  }

  return new Response("EVENT_RECEIVED", { status: 200 });
}
