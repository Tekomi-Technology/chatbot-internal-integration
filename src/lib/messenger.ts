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

export type MessengerTextEvent = {
  pageId: string;
  psid: string;
  text: string;
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

export type MessengerHandoverRequest = {
  pageId: string;
  psid: string;
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

      requests.push({ pageId, psid, requestedOwnerAppId: String(appId) });
    }
  }

  return requests;
}

export type MessengerHumanEcho = {
  pageId: string;

  psid: string;
  senderAppId: string | null;
};

type EchoPayload = {
  object?: string;
  entry?: Array<{
    id?: string;
    messaging?: Array<{
      recipient?: { id?: string };
      message?: { is_echo?: boolean; app_id?: string | number };
    }>;
  }>;
};

export function collectHumanEchoes(
  payload: unknown,
  ownAppId: string | null,
): MessengerHumanEcho[] {
  if (!ownAppId) return [];

  const body = payload as EchoPayload;
  if (body?.object !== "page" || !Array.isArray(body.entry)) return [];

  const echoes: MessengerHumanEcho[] = [];

  for (const entry of body.entry) {
    const pageId = entry?.id;
    if (!pageId || !Array.isArray(entry.messaging)) continue;

    for (const item of entry.messaging) {
      if (!item?.message?.is_echo) continue;

      const psid = item.recipient?.id;
      if (!psid) continue;

      const rawAppId = item.message.app_id;
      const senderAppId =
        rawAppId === undefined || rawAppId === null ? null : String(rawAppId);

      if (senderAppId === ownAppId) continue;

      echoes.push({ pageId, psid, senderAppId });
    }
  }

  return echoes;
}

function graphUrl(path: string): string {
  return `https://graph.facebook.com/${env.messenger.graphApiVersion}/${path}`;
}

async function callSendApi(
  pageAccessToken: string,
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
    } catch {}
    throw new MessengerError(
      `Graph API ${path} trả về lỗi ${response.status}.`,
      response.status,
      detail,
    );
  }
}

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
