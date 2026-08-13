import type { NextRequest } from "next/server";

import { safeEqual } from "@/lib/crypto";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getValidAccessToken } from "@/server/zalo-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REFRESH_AHEAD_MS = 2 * 60 * 60_000;

export async function POST(request: NextRequest) {
  const secret = env.cronSecret;
  if (!secret) {
    console.error("cron zalo-refresh: thiếu CRON_SECRET");
    return Response.json({ error: "Server chưa cấu hình CRON_SECRET." }, { status: 503 });
  }

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  if (!provided || !safeEqual(provided, secret)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const channels = await prisma.zaloChannel.findMany({
    where: {
      isActive: true,
      tenant: { status: "ACTIVE" },
      OR: [
        { accessTokenExpiresAt: null },
        { accessTokenExpiresAt: { lt: new Date(Date.now() + REFRESH_AHEAD_MS) } },
      ],
    },
    select: { id: true, oaId: true },
  });

  let refreshed = 0;
  let failed = 0;

  for (const channel of channels) {
    try {
      await getValidAccessToken(channel.id);
      refreshed += 1;
    } catch (error) {
      failed += 1;
      console.error("cron zalo-refresh", { oaId: channel.oaId, error });
    }
  }

  return Response.json({ refreshed, failed, scanned: channels.length });
}
