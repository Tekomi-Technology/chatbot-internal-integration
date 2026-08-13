"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { generateAdminApiKey, generatePublicApiKey } from "@/lib/keys";
import { prisma } from "@/lib/prisma";
import {
  errorState,
  successState,
  type ActionState,
} from "@/server/action-state";
import {
  apiKeyCreateSchema,
  domainCreateSchema,
  fieldErrors,
} from "@/server/validation";

export async function createApiKeyAction(
  tenantId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = apiKeyCreateSchema.safeParse({
    label: formData.get("label") ?? undefined,
    type: formData.get("type") ?? "PUBLIC",
  });

  if (!parsed.success) {
    return errorState("Thông tin key không hợp lệ.", fieldErrors(parsed.error));
  }

  const { label, type } = parsed.data;
  const keyValue =
    type === "ADMIN" ? generateAdminApiKey() : generatePublicApiKey();

  try {
    await prisma.apiKey.create({
      data: { tenantId, keyValue, label: label || null, type },
    });
  } catch (error) {
    console.error("createApiKeyAction", error);
    return errorState("Không tạo được API key.");
  }

  revalidatePath(`/tenants/${tenantId}`);
  return successState("Đã tạo API key mới.", { keyValue });
}

export async function revokeApiKeyAction(tenantId: string, apiKeyId: string) {
  await requireAdmin();

  await prisma.apiKey.update({
    where: { id: apiKeyId, tenantId },
    data: { isActive: false, revokedAt: new Date() },
  });

  revalidatePath(`/tenants/${tenantId}`);
}

export async function reactivateApiKeyAction(tenantId: string, apiKeyId: string) {
  await requireAdmin();

  await prisma.apiKey.update({
    where: { id: apiKeyId, tenantId },
    data: { isActive: true, revokedAt: null },
  });

  revalidatePath(`/tenants/${tenantId}`);
}

export async function deleteApiKeyAction(tenantId: string, apiKeyId: string) {
  await requireAdmin();

  await prisma.apiKey.delete({ where: { id: apiKeyId, tenantId } });

  revalidatePath(`/tenants/${tenantId}`);
}

export async function addDomainAction(
  tenantId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = domainCreateSchema.safeParse({ domain: formData.get("domain") });
  if (!parsed.success) {
    return errorState("Domain không hợp lệ.", fieldErrors(parsed.error));
  }

  try {
    await prisma.domainWhitelist.create({
      data: { tenantId, domain: parsed.data.domain },
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return errorState("Domain này đã có trong whitelist.", {
        domain: "Đã tồn tại.",
      });
    }
    console.error("addDomainAction", error);
    return errorState("Không thêm được domain.");
  }

  revalidatePath(`/tenants/${tenantId}`);
  return successState(`Đã thêm ${parsed.data.domain}.`);
}

export async function removeDomainAction(tenantId: string, domainId: string) {
  await requireAdmin();

  await prisma.domainWhitelist.delete({ where: { id: domainId, tenantId } });

  revalidatePath(`/tenants/${tenantId}`);
}
