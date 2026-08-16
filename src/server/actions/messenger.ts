"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import {
  collectValues,
  errorState,
  successState,
  type ActionState,
} from "@/server/action-state";
import { fieldErrors, messengerChannelSchema } from "@/server/validation";

const META_ECHO_FIELDS = [
  "pageId",
  "pageName",
  "isActive",
  "nightResumeStartHour",
  "nightResumeEndHour",
] as const;

/** Ô để trống nghĩa là tắt khung giờ. Zod đã chặn mọi giá trị ngoài 0-23. */
function parseHour(value: string | undefined): number | null {
  return value ? Number(value) : null;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

export async function updateMessengerChannelAction(
  tenantId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = messengerChannelSchema.safeParse({
    pageId: formData.get("pageId"),
    pageName: formData.get("pageName") ?? "",
    pageAccessToken: formData.get("pageAccessToken") ?? "",
    isActive: formData.get("isActive"),
    nightResumeStartHour: formData.get("nightResumeStartHour") ?? "",
    nightResumeEndHour: formData.get("nightResumeEndHour") ?? "",
  });

  if (!parsed.success) {
    return errorState(
      "Vui lòng kiểm tra lại thông tin kết nối.",
      fieldErrors(parsed.error),
      collectValues(formData, META_ECHO_FIELDS),
    );
  }

  const { pageId, pageName, pageAccessToken, isActive } = parsed.data;
  const nightResumeStartHour = parseHour(parsed.data.nightResumeStartHour);
  const nightResumeEndHour = parseHour(parsed.data.nightResumeEndHour);

  const existing = await prisma.messengerChannel.findUnique({
    where: { tenantId },
    select: { id: true },
  });

  if (!existing && !pageAccessToken) {
    return errorState(
      "Vui lòng kiểm tra lại thông tin kết nối.",
      { pageAccessToken: "Bắt buộc nhập Page Access Token khi kết nối lần đầu." },
      collectValues(formData, META_ECHO_FIELDS),
    );
  }

  try {
    if (pageAccessToken && !existing) {
      await prisma.messengerChannel.create({
        data: {
          tenantId,
          pageId,
          pageName,
          pageAccessTokenEncrypted: encryptSecret(pageAccessToken),
          isActive: isActive === "ACTIVE",
          nightResumeStartHour,
          nightResumeEndHour,
        },
      });
    } else {
      await prisma.messengerChannel.update({
        where: { tenantId },
        data: {
          pageId,
          pageName,
          isActive: isActive === "ACTIVE",
          nightResumeStartHour,
          nightResumeEndHour,
          ...(pageAccessToken
            ? { pageAccessTokenEncrypted: encryptSecret(pageAccessToken) }
            : {}),
        },
      });
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      return errorState(
        "Page này đã được kết nối với một tenant khác.",
        { pageId: "Page ID đã thuộc về tenant khác." },
        collectValues(formData, META_ECHO_FIELDS),
      );
    }

    console.error("updateMessengerChannelAction", error);
    return errorState(
      "Không lưu được kết nối Meta.",
      undefined,
      collectValues(formData, META_ECHO_FIELDS),
    );
  }

  revalidatePath(`/tenants/${tenantId}`);
  return successState("Đã lưu kết nối Meta.");
}

export async function disconnectMessengerChannelAction(
  tenantId: string,
): Promise<void> {
  await requireAdmin();

  await prisma.messengerChannel.deleteMany({ where: { tenantId } });

  revalidatePath(`/tenants/${tenantId}`);
}
