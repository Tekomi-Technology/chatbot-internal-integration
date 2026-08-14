"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  collectValues,
  errorState,
  successState,
  type ActionState,
} from "@/server/action-state";

import { fieldErrors, widgetConfigSchema } from "@/server/validation";

const WIDGET_ECHO_FIELDS = [
  "mode",
  "position",
  "botName",
  "primaryColor",
  "logoUrl",
  "welcomeMessage",
  "inputPlaceholder",
] as const;

export async function updateWidgetConfigAction(
  tenantId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = widgetConfigSchema.safeParse({
    mode: formData.get("mode"),
    position: formData.get("position"),
    botName: formData.get("botName"),
    primaryColor: formData.get("primaryColor"),
    logoUrl: formData.get("logoUrl") ?? "",
    welcomeMessage: formData.get("welcomeMessage"),
    inputPlaceholder: formData.get("inputPlaceholder"),
  });

  if (!parsed.success) {
    return errorState(
      "Vui lòng kiểm tra lại cấu hình.",
      fieldErrors(parsed.error),
      collectValues(formData, WIDGET_ECHO_FIELDS),
    );
  }

  try {
    // upsert vì tenant tạo từ trước bản này có thể chưa có bản ghi config.
    await prisma.widgetConfig.upsert({
      where: { tenantId },
      create: { tenantId, ...parsed.data },
      update: parsed.data,
    });
  } catch (error) {
    console.error("updateWidgetConfigAction", error);
    return errorState(
      "Không lưu được cấu hình widget.",
      undefined,
      collectValues(formData, WIDGET_ECHO_FIELDS),
    );
  }

  revalidatePath(`/tenants/${tenantId}`);
  return successState("Đã lưu cấu hình widget.");
}
