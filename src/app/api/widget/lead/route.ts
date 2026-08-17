import type { NextRequest } from "next/server";
import { z } from "zod";

import { jsonWithCors, preflightResponse } from "@/lib/cors";
import { hostnameFromHeader, isDomainAllowed } from "@/lib/domain";
import { parseLeadFields, validateLeadExtra } from "@/lib/lead-fields";
import { normalizeVnPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, clientIpFrom } from "@/lib/rate-limit";
import { sendTelegramMessage } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(1).max(20),
  sessionId: z.string().trim().min(1).max(100),
  pageUrl: z.string().trim().max(2000).nullish(),
  extra: z.record(z.string(), z.unknown()).nullish(),
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
      { error: "invalid_body", message: "Vui lòng kiểm tra lại thông tin đã nhập." },
      { status: 400, origin },
    );
  }

  const phone = normalizeVnPhone(parsed.data.phone);
  if (!phone) {
    return jsonWithCors(
      { error: "invalid_phone", message: "Số điện thoại không hợp lệ." },
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
          name: true,
          status: true,
          domains: { select: { domain: true } },
          widgetConfig: { select: { leadFormFields: true } },
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

  const rate = checkRateLimit(`lead:${apiKey.id}:${clientIpFrom(request.headers)}`);
  if (!rate.success) {
    return jsonWithCors(
      { error: "rate_limited", message: "Bạn gửi quá nhanh, vui lòng thử lại sau ít giây." },
      {
        status: 429,
        origin,
        extraHeaders: { "Retry-After": String(rate.retryAfterSeconds ?? 60) },
      },
    );
  }

  const fields = parseLeadFields(tenant.widgetConfig?.leadFormFields);
  const extra = validateLeadExtra(fields, parsed.data.extra);
  if (!extra.ok) {
    return jsonWithCors(
      { error: "invalid_extra", message: extra.message },
      { status: 400, origin },
    );
  }

  const data = {
    fullName: parsed.data.fullName,
    phone,
    pageUrl: parsed.data.pageUrl || null,
    extra: extra.value,
  };

  const existing = await prisma.lead.findUnique({
    where: {
      tenantId_sessionId: { tenantId: tenant.id, sessionId: parsed.data.sessionId },
    },
    select: { id: true },
  });

  try {
    await prisma.lead.upsert({
      where: {
        tenantId_sessionId: { tenantId: tenant.id, sessionId: parsed.data.sessionId },
      },
      create: { tenantId: tenant.id, sessionId: parsed.data.sessionId, ...data },
      update: data,
    });
  } catch (error) {
    console.error("widget/lead", { tenantId: tenant.id, error });
    return jsonWithCors(
      { error: "save_failed", message: "Không lưu được thông tin, vui lòng thử lại." },
      { status: 500, origin },
    );
  }

  // Chỉ báo khi khách để lại thông tin lần đầu — khách sửa lại form (upsert)
  // không nên báo lặp lại cho nhân viên.
  if (!existing) {
    void sendTelegramMessage(
      `📞 <b>Khách mới để lại số điện thoại</b>\n` +
        `Tenant: ${tenant.name}\n` +
        `Họ tên: ${parsed.data.fullName}\n` +
        `SĐT: ${phone}` +
        (parsed.data.pageUrl ? `\nTrang: ${parsed.data.pageUrl}` : ""),
    ).catch((error) => console.error("widget/lead -> telegram", error));
  }

  return jsonWithCors({ ok: true }, { origin });
}
