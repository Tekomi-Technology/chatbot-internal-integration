import { z } from "zod";

import { normalizeDomain } from "@/lib/domain";
import { leadFieldsSchema } from "@/lib/lead-fields";

export const tenantCreateSchema = z.object({
  name: z.string().trim().min(2, "Tên tenant tối thiểu 2 ký tự.").max(120),
  difyAppId: z.string().trim().min(1, "Bắt buộc nhập Dify App ID.").max(200),
  difyApiKey: z.string().trim().min(1, "Bắt buộc nhập Dify API key.").max(500),
  difyApiBaseUrl: z
    .union([z.string().trim().url("Base URL không hợp lệ."), z.literal("")])
    .optional()
    .transform((value) => (value ? value.replace(/\/+$/, "") : null)),
});

export const tenantUpdateSchema = tenantCreateSchema
  .extend({
    difyApiKey: z.string().trim().max(500).optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]),
  })
  .transform((value) => ({
    ...value,
    difyApiKey: value.difyApiKey ? value.difyApiKey : undefined,
  }));

export const apiKeyCreateSchema = z.object({
  label: z.string().trim().max(80).optional(),
  type: z.enum(["PUBLIC", "ADMIN"]).default("PUBLIC"),
});

export const domainCreateSchema = z.object({
  domain: z
    .string()
    .trim()
    .min(1, "Bắt buộc nhập domain.")
    .transform((value, ctx) => {
      const normalized = normalizeDomain(value);
      if (!normalized) {
        ctx.addIssue({
          code: "custom",
          message:
            'Domain không hợp lệ. Ví dụ hợp lệ: example.com, app.example.com, *.example.com',
        });
        return z.NEVER;
      }
      return normalized;
    }),
});

export const messengerChannelSchema = z.object({
  pageId: z
    .string()
    .trim()
    .min(1, "Bắt buộc nhập Page ID.")
    .regex(/^\d{5,32}$/, "Page ID chỉ gồm chữ số, copy từ trang cài đặt Page."),
  pageName: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => (value ? value : null)),
  pageAccessToken: z.string().trim().max(500).optional(),
  isActive: z.enum(["ACTIVE", "INACTIVE"]),
});

export const zaloChannelSchema = z.object({
  oaId: z.string().trim().min(1, "Bắt buộc nhập OA ID.").max(64),
  oaName: z.string().trim().max(120).optional().default(""),
  refreshToken: z.string().trim().max(2000).optional().default(""),
  isActive: z.enum(["ACTIVE", "INACTIVE"]),
});

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const widgetConfigSchema = z.object({
  mode: z.enum(["BUBBLE", "INLINE"]),
  position: z.enum(["BOTTOM_RIGHT", "BOTTOM_LEFT"]),
  botName: z.string().trim().min(1, "Bắt buộc nhập tên bot.").max(60),
  primaryColor: z
    .string()
    .trim()
    .regex(HEX_COLOR, "Màu phải ở dạng hex, ví dụ #4F46E5."),
  logoUrl: z
    .union([z.string().trim().url("Logo URL không hợp lệ."), z.literal("")])
    .transform((value) => (value ? value : null)),
  welcomeMessage: z.string().trim().min(1, "Bắt buộc nhập tin nhắn chào.").max(500),
  inputPlaceholder: z.string().trim().min(1).max(120),
  leadFormEnabled: z.unknown().transform((value) => value === "on"),
  leadFormTitle: z
    .string()
    .trim()
    .min(1, "Bắt buộc nhập tiêu đề form.")
    .max(80),
  leadFormDescription: z
    .string()
    .trim()
    .min(1, "Bắt buộc nhập mô tả form.")
    .max(300),
  leadFormSubmitLabel: z
    .string()
    .trim()
    .min(1, "Bắt buộc nhập nhãn nút gửi.")
    .max(40),
  leadFormNameLabel: z
    .string()
    .trim()
    .min(1, "Bắt buộc nhập nhãn ô họ tên.")
    .max(60),
  leadFormPhoneLabel: z
    .string()
    .trim()
    .min(1, "Bắt buộc nhập nhãn ô số điện thoại.")
    .max(60),
  leadFormFields: z
    .string()
    .transform((value, ctx) => {
      try {
        return JSON.parse(value || "[]") as unknown;
      } catch {
        ctx.addIssue({ code: "custom", message: "Danh sách trường không hợp lệ." });
        return z.NEVER;
      }
    })
    .pipe(leadFieldsSchema),
});

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    result[key] ??= issue.message;
  }
  return result;
}
