import { after, type NextRequest } from "next/server";

import { decryptSecret } from "@/lib/crypto";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { collectZaloTextEvents, verifyZaloSignature } from "@/lib/zalo";
import { handleZaloEvents } from "@/server/zalo-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readOaId(rawBody: string): string | null {
  try {
    const parsed = JSON.parse(rawBody) as { recipient?: { id?: unknown } };
    const oaId = parsed?.recipient?.id;
    return typeof oaId === "string" && oaId ? oaId : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const { appId } = env.zalo;
  if (!appId) {
    console.error("zalo webhook: thiếu ZALO_APP_ID");
    return new Response("Server chưa cấu hình app Zalo.", { status: 503 });
  }

  const rawBody = await request.text();

  const oaId = readOaId(rawBody);
  if (!oaId) {
    console.warn("zalo webhook: body không đọc được oa_id");
    return new Response("EVENT_RECEIVED", { status: 200 });
  }

  const channel = await prisma.zaloChannel.findUnique({
    where: { oaId },
    select: { oaSecretKeyEncrypted: true },
  });

  if (!channel) {
    console.warn("zalo webhook: oa_id chưa kết nối", { oaId });
    return new Response("EVENT_RECEIVED", { status: 200 });
  }

  if (!channel.oaSecretKeyEncrypted) {
    console.warn(
      "zalo webhook: kênh chưa có OA Secret Key nên không kiểm được chữ ký, bỏ qua sự kiện",
      { oaId },
    );
    return new Response("EVENT_RECEIVED", { status: 200 });
  }

  let oaSecretKey: string;
  try {
    oaSecretKey = decryptSecret(channel.oaSecretKeyEncrypted);
  } catch (error) {
    console.error("zalo webhook: giải mã OA Secret Key thất bại", { oaId, error });
    return new Response("EVENT_RECEIVED", { status: 200 });
  }

  const signatureHeader = request.headers.get("x-zevent-signature");

  if (!verifyZaloSignature(rawBody, signatureHeader, appId, oaSecretKey)) {
    console.warn("zalo webhook: chữ ký không hợp lệ", { oaId });
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
