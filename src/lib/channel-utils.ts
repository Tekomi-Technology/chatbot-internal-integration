import "server-only";

const MAX_MESSAGE_LENGTH = 2000;

export function chunkMessage(text: string, limit = MAX_MESSAGE_LENGTH): string[] {
  if (text.length <= limit) return [text];

  const chunks: string[] = [];
  let rest = text;

  while (rest.length > limit) {
    const window = rest.slice(0, limit);
    const breakAt = Math.max(window.lastIndexOf("\n"), window.lastIndexOf(" "));
    const cut = breakAt > limit * 0.6 ? breakAt : limit;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }

  if (rest) chunks.push(rest);
  return chunks;
}

const SEEN_TTL_MS = 10 * 60_000;
const seenIds = new Map<string, number>();

export function markIdSeen(id: string | null): boolean {
  if (!id) return false;

  const now = Date.now();
  for (const [key, expiresAt] of seenIds) {
    if (expiresAt <= now) seenIds.delete(key);
  }

  if (seenIds.has(id)) return true;
  seenIds.set(id, now + SEEN_TTL_MS);
  return false;
}

const NIGHT_WINDOW_TIMEZONE = "Asia/Ho_Chi_Minh";

const nightWindowHourFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: NIGHT_WINDOW_TIMEZONE,
  hour: "2-digit",
  hourCycle: "h23",
});

function isValidHour(value: number | null): value is number {
  return value !== null && Number.isInteger(value) && value >= 0 && value <= 23;
}

export function isWithinNightWindow(
  startHour: number | null,
  endHour: number | null,
  now: Date,
): boolean {
  if (!isValidHour(startHour) || !isValidHour(endHour)) return false;
  if (startHour === endHour) return false;

  const hour = Number(nightWindowHourFormat.format(now));

  return startHour < endHour
    ? hour >= startHour && hour < endHour
    : hour >= startHour || hour < endHour;
}

export const HUMAN_ACTIVE_GRACE_MS = 30 * 60_000;

export function mayAnswerDespiteHuman(
  channel: { nightResumeStartHour: number | null; nightResumeEndHour: number | null },
  conversation: { handoverAt: Date | null },
): boolean {
  const now = new Date();

  if (
    !isWithinNightWindow(channel.nightResumeStartHour, channel.nightResumeEndHour, now)
  ) {
    return false;
  }

  if (
    conversation.handoverAt &&
    now.getTime() - conversation.handoverAt.getTime() < HUMAN_ACTIVE_GRACE_MS
  ) {
    return false;
  }

  return true;
}

const SELF_SENT_TTL_MS = 10 * 60_000;
const selfSentIds = new Map<string, number>();

export function markSelfSent(id: string | null): void {
  if (!id) return;

  const now = Date.now();
  for (const [key, expiresAt] of selfSentIds) {
    if (expiresAt <= now) selfSentIds.delete(key);
  }

  selfSentIds.set(id, now + SELF_SENT_TTL_MS);
}

export function wasSelfSent(id: string | null): boolean {
  if (!id) return false;

  const now = Date.now();
  const expiresAt = selfSentIds.get(id);
  if (expiresAt === undefined || expiresAt <= now) return false;

  return true;
}
