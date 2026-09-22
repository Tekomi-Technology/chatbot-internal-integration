import "server-only";

export function isStaffResumeExpired(
  lastStaffReplyAt: Date | null,
  staffResumeHours: number,
  now: Date,
): boolean {
  if (!lastStaffReplyAt) return true;

  const elapsedMs = now.getTime() - lastStaffReplyAt.getTime();
  return elapsedMs >= staffResumeHours * 60 * 60_000;
}

export type DifyIdentity = {
  user: string;
  inputs: Record<string, unknown>;
};

/**
 * Dify cần biết đang trò chuyện với ai. Khi chưa có `conversationId` (tin đầu
 * tiên), gửi kèm inputs customer_name/customer_phone — prompt Dify đọc hai
 * biến này. Từ tin thứ hai trở đi Dify đã nhớ qua conversation_id nên không
 * cần gửi lại inputs.
 */
export function resolveDifyIdentity(
  lead: { fullName: string; phone: string } | null,
  sessionId: string,
  conversationId: string | null,
): DifyIdentity {
  if (!lead) return { user: sessionId, inputs: {} };

  return {
    user: lead.phone,
    inputs: conversationId
      ? {}
      : { customer_name: lead.fullName, customer_phone: lead.phone },
  };
}

export type WidgetMessagePayload = {
  sender: "CUSTOMER" | "BOT" | "STAFF";
  text: string;
  createdAt: string;
};

export function serializeWidgetMessage(message: {
  sender: string;
  text: string;
  createdAt: Date;
}): WidgetMessagePayload {
  return {
    sender: message.sender as WidgetMessagePayload["sender"],
    text: message.text,
    createdAt: message.createdAt.toISOString(),
  };
}
