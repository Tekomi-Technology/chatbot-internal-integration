import type { NextRequest } from "next/server";

import { jsonWithCors, preflightResponse } from "@/lib/cors";
import { hostnameFromHeader, isDomainAllowed } from "@/lib/domain";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, clientIpFrom } from "@/lib/rate-limit";
import { serializeWidgetMessage } from "@/lib/widget-chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS(request: NextRequest) {
  return preflightResponse(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");

  const keyValue = request.headers.get("x-api-key")?.trim();
  if (!keyValue) {
    return jsonWithCors(
      { error: "missing_api_key", message: "Thiếu API key." },
      { status: 401, origin },
    );
  }

  const sessionId = request.nextUrl.searchParams.get("sessionId")?.trim();
  if (!sessionId) {
    return jsonWithCors(
      { error: "missing_session_id", message: "Thiếu sessionId." },
      { status: 400, origin },
    );
  }

  const since = request.nextUrl.searchParams.get("since")?.trim();
  const sinceDate = since ? new Date(since) : null;
  if (since && (!sinceDate || Number.isNaN(sinceDate.getTime()))) {
    return jsonWithCors(
      { error: "invalid_since", message: "Tham số since không hợp lệ." },
      { status: 400, origin },
    );
  }

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyValue },
    select: {
      id: true,
      isActive: true,
      tenant: {
        select: {
          id: true,
          status: true,
          domains: { select: { domain: true } },
        },
      },
    },
  });

  if (!apiKey?.isActive || apiKey.tenant.status !== "ACTIVE") {
    return jsonWithCors(
      { error: "invalid_api_key", message: "API key không hợp lệ hoặc đã bị vô hiệu hoá." },
      { status: 401, origin },
    );
  }

  const callerHost =
    hostnameFromHeader(origin) ?? hostnameFromHeader(request.headers.get("referer"));
  const allowedDomains = apiKey.tenant.domains.map((entry) => entry.domain);
  if (!isDomainAllowed(callerHost, allowedDomains)) {
    return jsonWithCors(
      {
        error: "domain_not_allowed",
        message: `Domain "${callerHost ?? "không xác định"}" chưa được cấp phép cho tenant này.`,
      },
      { status: 403, origin },
    );
  }

  const rate = checkRateLimit(
    `${apiKey.id}:${clientIpFrom(request.headers)}`,
    env.widgetPollRateLimit,
  );
  if (!rate.success) {
    return jsonWithCors(
      { error: "rate_limited", message: "Bạn kiểm tra tin quá nhanh, vui lòng thử lại sau ít giây." },
      { status: 429, origin, extraHeaders: { "Retry-After": String(rate.retryAfterSeconds ?? 30) } },
    );
  }

  const conversation = await prisma.widgetConversation.findUnique({
    where: { tenantId_sessionId: { tenantId: apiKey.tenant.id, sessionId } },
    select: { id: true },
  });

  if (!conversation) {
    return jsonWithCors({ messages: [] }, { origin });
  }

  const messages = await prisma.widgetMessage.findMany({
    where: {
      conversationId: conversation.id,
      sender: { in: ["BOT", "STAFF"] },
      ...(sinceDate ? { createdAt: { gt: sinceDate } } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: { sender: true, text: true, createdAt: true },
  });

  return jsonWithCors(
    { messages: messages.map(serializeWidgetMessage) },
    { origin },
  );
}
