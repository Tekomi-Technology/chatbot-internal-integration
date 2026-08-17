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
