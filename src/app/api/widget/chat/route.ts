import type { NextRequest } from "next/server";
import { z } from "zod";

import { jsonWithCors, preflightResponse } from "@/lib/cors";
import { decryptSecret } from "@/lib/crypto";
import { DifyError, sendDifyChatMessage } from "@/lib/dify";
import { hostnameFromHeader, isDomainAllowed } from "@/lib/domain";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, clientIpFrom } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  message: z.string().trim().min(1).max(4000),
  sessionId: z.string().trim().min(1).max(100),
  conversationId: z.string().trim().max(100).nullish(),
  apiKey: z.string().trim().max(100).optional(),
});

export async function OPTIONS(request: NextRequest) {
  return preflightResponse(request.headers.get("origin"));
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return jsonWithCors(
      { error: "invalid_json", message: "Body phải là JSON hợp lệ." },
      { status: 400, origin },
    );
  }

  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return jsonWithCors(
      { error: "invalid_body", message: "Dữ liệu gửi lên không hợp lệ." },
      { status: 400, origin },
    );
  }

  const keyValue =
    request.headers.get("x-api-key")?.trim() || parsed.data.apiKey?.trim();
  if (!keyValue) {
    return jsonWithCors(
      { error: "missing_api_key", message: "Thiếu API key." },
      { status: 401, origin },
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
          difyApiKeyEncrypted: true,
          difyApiBaseUrl: true,
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

  const tenant = apiKey.tenant;

  const callerHost =
    hostnameFromHeader(origin) ?? hostnameFromHeader(request.headers.get("referer"));

  const allowedDomains = tenant.domains.map((entry) => entry.domain);
  if (!isDomainAllowed(callerHost, allowedDomains)) {
    return jsonWithCors(
      {
        error: "domain_not_allowed",
        message: `Domain "${callerHost ?? "không xác định"}" chưa được cấp phép cho tenant này.`,
      },
      { status: 403, origin },
    );
  }

  const rate = checkRateLimit(`${apiKey.id}:${clientIpFrom(request.headers)}`);
  const rateHeaders = {
    "X-RateLimit-Limit": String(rate.limit),
    "X-RateLimit-Remaining": String(rate.remaining),
    "X-RateLimit-Reset": String(Math.ceil(rate.resetAt / 1000)),
  };

  if (!rate.success) {
    return jsonWithCors(
      { error: "rate_limited", message: "Bạn gửi quá nhanh, vui lòng thử lại sau ít giây." },
      {
        status: 429,
        origin,
        extraHeaders: {
          ...rateHeaders,
          "Retry-After": String(rate.retryAfterSeconds ?? 60),
        },
      },
    );
  }

  const startedAt = Date.now();
  let result;
  try {
    result = await sendDifyChatMessage({
      baseUrl: tenant.difyApiBaseUrl,
      apiKey: decryptSecret(tenant.difyApiKeyEncrypted),
      query: parsed.data.message,
      user: parsed.data.sessionId,
      conversationId: parsed.data.conversationId ?? null,
    });
  } catch (error) {
    console.error("widget/chat -> dify", {
      tenantId: tenant.id,
      error: error instanceof DifyError ? { status: error.status, detail: error.detail } : error,
    });

    const status = error instanceof DifyError && error.status === 504 ? 504 : 502;
    return jsonWithCors(
      { error: "upstream_error", message: "Trợ lý đang bận, vui lòng thử lại sau." },
      { status, origin, extraHeaders: rateHeaders },
    );
  }

  const latencyMs = Date.now() - startedAt;

  void prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch((error) => console.error("widget/chat -> lastUsedAt", error));

  if (env.enableConversationLog) {
    void prisma.conversationLog
      .create({
        data: {
          tenantId: tenant.id,
          sessionId: parsed.data.sessionId,
          difyConversationId: result.conversationId,
          requestPayload: { message: parsed.data.message, origin: callerHost },
          responsePayload: { answer: result.answer, messageId: result.messageId },
          latencyMs,
        },
      })
      .catch((error) => console.error("widget/chat -> conversationLog", error));
  }

  return jsonWithCors(
    {
      answer: result.answer,
      conversationId: result.conversationId,
      messageId: result.messageId,
    },
    { origin, extraHeaders: rateHeaders },
  );
}
