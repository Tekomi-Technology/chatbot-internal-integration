import { z } from "zod";

export const LEAD_FIELD_TYPES = ["text", "email"] as const;
export type LeadFieldType = (typeof LEAD_FIELD_TYPES)[number];

export type LeadField = {
  key: string;
  label: string;
  type: LeadFieldType;
  required: boolean;
};

export const MAX_LEAD_FIELDS = 10;
export const MAX_LEAD_VALUE_LENGTH = 500;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const leadFieldSchema = z.object({
  key: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]{1,40}$/, "Khoá trường không hợp lệ."),
  label: z.string().trim().min(1, "Trường phải có nhãn.").max(60),
  type: z.enum(LEAD_FIELD_TYPES),
  required: z.boolean(),
});

export const leadFieldsSchema = z
  .array(leadFieldSchema)
  .max(MAX_LEAD_FIELDS, `Tối đa ${MAX_LEAD_FIELDS} trường phụ.`)
  .superRefine((fields, ctx) => {
    const seen = new Set<string>();
    for (const field of fields) {
      if (seen.has(field.key)) {
        ctx.addIssue({ code: "custom", message: "Có hai trường trùng khoá." });
        return;
      }
      seen.add(field.key);
    }
  });

export function parseLeadFields(value: unknown): LeadField[] {
  const parsed = leadFieldsSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}

export function slugifyLabel(label: string): string {
  const base = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);

  return base || "truong";
}

export function uniqueKey(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;

  for (let index = 2; index < 100; index += 1) {
    const candidate = `${base.slice(0, 37)}_${index}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${base.slice(0, 32)}_${Date.now().toString(36).slice(-6)}`;
}

export type LeadExtraResult =
  | { ok: true; value: Record<string, string> }
  | { ok: false; message: string };

export function validateLeadExtra(
  fields: LeadField[],
  raw: unknown,
): LeadExtraResult {
  if (raw !== undefined && raw !== null && typeof raw !== "object") {
    return { ok: false, message: "Dữ liệu gửi lên không hợp lệ." };
  }

  const input = (raw ?? {}) as Record<string, unknown>;
  const value: Record<string, string> = {};

  for (const field of fields) {
    const rawValue = input[field.key];
    const text = typeof rawValue === "string" ? rawValue.trim() : "";

    if (!text) {
      if (field.required) {
        return { ok: false, message: `Vui lòng nhập ${field.label.toLowerCase()}.` };
      }
      continue;
    }

    if (text.length > MAX_LEAD_VALUE_LENGTH) {
      return { ok: false, message: `${field.label} quá dài.` };
    }

    if (field.type === "email" && !EMAIL.test(text)) {
      return { ok: false, message: `${field.label} không đúng định dạng email.` };
    }

    value[field.key] = text;
  }

  return { ok: true, value };
}

export function readLeadExtra(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const result: Record<string, string> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (typeof item === "string") result[key] = item;
  }
  return result;
}
