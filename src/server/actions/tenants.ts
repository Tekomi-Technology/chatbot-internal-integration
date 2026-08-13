"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";
import { generatePublicApiKey, slugify } from "@/lib/keys";
import { prisma } from "@/lib/prisma";
import {
  collectValues,
  errorState,
  successState,
  type ActionState,
} from "@/server/action-state";

import {
  fieldErrors,
  tenantCreateSchema,
  tenantUpdateSchema,
} from "@/server/validation";

const TENANT_ECHO_FIELDS = ["name", "difyAppId", "difyApiBaseUrl", "status"] as const;

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const clash = await prisma.tenant.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!clash) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function createTenantAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = tenantCreateSchema.safeParse({
    name: formData.get("name"),
    difyAppId: formData.get("difyAppId"),
    difyApiKey: formData.get("difyApiKey"),
    difyApiBaseUrl: formData.get("difyApiBaseUrl") ?? "",
  });

  if (!parsed.success) {
    return errorState(
      "Vui lòng kiểm tra lại thông tin.",
      fieldErrors(parsed.error),
      collectValues(formData, TENANT_ECHO_FIELDS),
    );
  }

  const { name, difyAppId, difyApiKey, difyApiBaseUrl } = parsed.data;

  let tenantId: string;
  try {
    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug: await uniqueSlug(name),
        difyAppId,
        difyApiKeyEncrypted: encryptSecret(difyApiKey),
        difyApiBaseUrl,
        apiKeys: {
          create: { keyValue: generatePublicApiKey(), label: "Key mặc định" },
        },
        widgetConfig: { create: { botName: `Trợ lý ${name}` } },
      },
      select: { id: true },
    });
    tenantId = tenant.id;
  } catch (error) {
    console.error("createTenantAction", error);
    return errorState(
      "Không tạo được tenant. Xem log server để biết chi tiết.",
      undefined,
      collectValues(formData, TENANT_ECHO_FIELDS),
    );
  }

  revalidatePath("/tenants");
  redirect(`/tenants/${tenantId}`);
}

export async function updateTenantAction(
  tenantId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = tenantUpdateSchema.safeParse({
    name: formData.get("name"),
    difyAppId: formData.get("difyAppId"),
    difyApiKey: formData.get("difyApiKey") ?? "",
    difyApiBaseUrl: formData.get("difyApiBaseUrl") ?? "",
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return errorState(
      "Vui lòng kiểm tra lại thông tin.",
      fieldErrors(parsed.error),
      collectValues(formData, TENANT_ECHO_FIELDS),
    );
  }

  const { name, difyAppId, difyApiKey, difyApiBaseUrl, status } = parsed.data;

  try {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name,
        difyAppId,
        difyApiBaseUrl,
        status,
        ...(difyApiKey ? { difyApiKeyEncrypted: encryptSecret(difyApiKey) } : {}),
      },
    });
  } catch (error) {
    console.error("updateTenantAction", error);
    return errorState(
      "Không cập nhật được tenant.",
      undefined,
      collectValues(formData, TENANT_ECHO_FIELDS),
    );
  }

  revalidatePath("/tenants");
  revalidatePath(`/tenants/${tenantId}`);
  return successState("Đã lưu thông tin tenant.");
}

export async function setTenantStatusAction(
  tenantId: string,
  status: "ACTIVE" | "INACTIVE",
) {
  await requireAdmin();

  await prisma.tenant.update({ where: { id: tenantId }, data: { status } });

  revalidatePath("/tenants");
  revalidatePath(`/tenants/${tenantId}`);
}

export async function deleteTenantAction(tenantId: string) {
  await requireAdmin();

  await prisma.tenant.delete({ where: { id: tenantId } });

  revalidatePath("/tenants");
  redirect("/tenants");
}
