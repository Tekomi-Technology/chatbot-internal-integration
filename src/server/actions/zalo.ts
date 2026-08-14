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
import { fieldErrors, zaloChannelSchema } from "@/server/validation";

const ZALO_ECHO_FIELDS = ["oaId", "oaName", "isActive"] as const;

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

export async function updateZaloChannelAction(
  tenantId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = zaloChannelSchema.safeParse({
    oaId: formData.get("oaId"),
    oaName: formData.get("oaName") ?? "",
    refreshToken: formData.get("refreshToken") ?? "",
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    return errorState(
      "Vui lòng kiểm tra lại thông tin kết nối.",
      fieldErrors(parsed.error),
      collectValues(formData, ZALO_ECHO_FIELDS),
    );
  }

  const { oaId, oaName, refreshToken, isActive } = parsed.data;

  const existing = await prisma.zaloChannel.findUnique({
    where: { tenantId },
    select: { id: true, oaId: true },
  });

  if (!existing && !refreshToken) {
    return errorState(
      "Vui lòng kiểm tra lại thông tin kết nối.",
      { refreshToken: "Bắt buộc nhập Refresh Token khi kết nối lần đầu." },
      collectValues(formData, ZALO_ECHO_FIELDS),
    );
  }


  if (existing && oaId !== existing.oaId && !refreshToken) {
    return errorState(
      "Vui lòng kiểm tra lại thông tin kết nối.",
      {
        refreshToken:
          "Đổi sang OA khác thì phải dán Refresh Token mới — token cũ chỉ dùng được cho OA cũ.",
      },
      collectValues(formData, ZALO_ECHO_FIELDS),
    );
  }

  try {
    if (!existing) {
      await prisma.zaloChannel.create({
        data: {
          tenantId,
          oaId,
          oaName,
          refreshTokenEncrypted: encryptSecret(refreshToken),
          refreshTokenUpdatedAt: new Date(),
          isActive: isActive === "ACTIVE",
        },
      });
    } else {
      await prisma.zaloChannel.update({
        where: { tenantId },
        data: {
          oaId,
          oaName,
          isActive: isActive === "ACTIVE",
          ...(refreshToken
            ? {
                refreshTokenEncrypted: encryptSecret(refreshToken),
                refreshTokenUpdatedAt: new Date(),
                accessTokenEncrypted: null,
                accessTokenExpiresAt: null,
                lastRefreshError: null,
              }
            : {}),
        },
      });
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      return errorState(
        "OA này đã được kết nối với một tenant khác.",
        { oaId: "OA ID đã thuộc về tenant khác." },
        collectValues(formData, ZALO_ECHO_FIELDS),
      );
    }

    console.error("updateZaloChannelAction", error);
    return errorState(
      "Không lưu được kết nối Zalo.",
      undefined,
      collectValues(formData, ZALO_ECHO_FIELDS),
    );
  }

  revalidatePath(`/tenants/${tenantId}`);
  return successState("Đã lưu kết nối Zalo.");
}

export async function disconnectZaloChannelAction(tenantId: string): Promise<void> {
  await requireAdmin();

  await prisma.zaloChannel.deleteMany({ where: { tenantId } });

  revalidatePath(`/tenants/${tenantId}`);
}
