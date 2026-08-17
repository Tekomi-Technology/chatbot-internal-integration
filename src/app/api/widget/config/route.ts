import type { NextRequest } from "next/server";

import { jsonWithCors, preflightResponse } from "@/lib/cors";
import { parseLeadFields } from "@/lib/lead-fields";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const key = request.nextUrl.searchParams.get("key")?.trim();

  if (!key) {
    return jsonWithCors(
      { error: "missing_api_key", message: "Thiếu tham số `key`." },
      { status: 400, origin },
    );
  }

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyValue: key },
    select: {
      isActive: true,
      tenant: {
        select: {
          name: true,
          status: true,
          widgetConfig: {
            select: {
              mode: true,
              botName: true,
              logoUrl: true,
              primaryColor: true,
              welcomeMessage: true,
              inputPlaceholder: true,
              position: true,
              leadFormEnabled: true,
              leadFormTitle: true,
              leadFormDescription: true,
              leadFormSubmitLabel: true,
              leadFormNameLabel: true,
              leadFormPhoneLabel: true,
              leadFormFields: true,
            },
          },
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

  const config = apiKey.tenant.widgetConfig;

  return jsonWithCors(
    {
      tenantName: apiKey.tenant.name,
      widget: {
        mode: (config?.mode ?? "BUBBLE").toLowerCase(),
        position: (config?.position ?? "BOTTOM_RIGHT").toLowerCase().replace("_", "-"),
        botName: config?.botName ?? apiKey.tenant.name,
        logoUrl: config?.logoUrl ?? null,
        primaryColor: config?.primaryColor ?? "#4F46E5",
        welcomeMessage:
          config?.welcomeMessage ?? "Xin chào! Tôi có thể giúp gì cho bạn?",
        inputPlaceholder: config?.inputPlaceholder ?? "Nhập câu hỏi của bạn...",
        leadForm: {
          enabled: config?.leadFormEnabled ?? false,
          title: config?.leadFormTitle ?? "Trước khi bắt đầu",
          description:
            config?.leadFormDescription ??
            "Vui lòng để lại thông tin để chúng tôi tư vấn chính xác hơn.",
          submitLabel: config?.leadFormSubmitLabel ?? "Bắt đầu chat",
          nameLabel: config?.leadFormNameLabel ?? "Họ và tên",
          phoneLabel: config?.leadFormPhoneLabel ?? "Số điện thoại",
          fields: parseLeadFields(config?.leadFormFields),
        },
      },
    },
    {
      origin,
      extraHeaders: { "Cache-Control": "public, max-age=60" },
    },
  );
}

export async function OPTIONS(request: NextRequest) {
  return preflightResponse(request.headers.get("origin"));
}
