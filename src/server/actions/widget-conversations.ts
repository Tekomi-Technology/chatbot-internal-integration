"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  collectValues,
  errorState,
  successState,
  type ActionState,
} from "@/server/action-state";
import { fieldErrors } from "@/server/validation";

const replySchema = z.object({
  text: z.string().trim().min(1, "Vui lòng nhập nội dung tin nhắn.").max(4000),
});

export async function sendStaffReplyAction(
  conversationId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = replySchema.safeParse({ text: formData.get("text") });
  if (!parsed.success) {
    return errorState(
      "Vui lòng kiểm tra lại nội dung.",
      fieldErrors(parsed.error),
      collectValues(formData, ["text"]),
    );
  }

  const conversation = await prisma.widgetConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, tenantId: true },
  });

  if (!conversation) {
    return errorState("Không tìm thấy hội thoại này.");
  }

  try {
    await prisma.widgetMessage.create({
      data: { conversationId: conversation.id, sender: "STAFF", text: parsed.data.text },
    });

    await prisma.widgetConversation.update({
      where: { id: conversation.id },
      data: { staffActive: true, lastStaffReplyAt: new Date(), lastMessageAt: new Date() },
    });
  } catch (error) {
    console.error("sendStaffReplyAction", error);
    return errorState("Không gửi được tin nhắn.");
  }

  revalidatePath(`/tenants/${conversation.tenantId}/conversations/${conversation.id}`);
  revalidatePath(`/tenants/${conversation.tenantId}?tab=leads`);

  return successState("Đã gửi.");
}

export async function releaseStaffControlAction(conversationId: string): Promise<void> {
  await requireAdmin();

  const conversation = await prisma.widgetConversation.update({
    where: { id: conversationId },
    data: { staffActive: false },
    select: { tenantId: true },
  });

  revalidatePath(`/tenants/${conversation.tenantId}/conversations/${conversationId}`);
  revalidatePath(`/tenants/${conversation.tenantId}?tab=leads`);
}
