import "server-only";

/**
 * Giới hạn cứng của cả Messenger Send API lẫn Zalo CS API. Câu trả lời dài hơn
 * phải cắt thành nhiều tin.
 */
const MAX_MESSAGE_LENGTH = 2000;

/** Cắt câu trả lời dài thành nhiều tin nhắn, ưu tiên cắt ở ranh giới dòng/khoảng trắng. */
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

// --- Chống xử lý trùng ------------------------------------------------------

const SEEN_TTL_MS = 10 * 60_000;
const seenIds = new Map<string, number>();

/**
 * Đánh dấu một ID tin nhắn là đã xử lý, trả `true` nếu trước đó đã gặp.
 *
 * Dùng chung cho `mid` của Messenger và `msg_id` của Zalo.
 *
 * GIỚI HẠN ĐÃ BIẾT: lưu trong bộ nhớ tiến trình nên chỉ đúng với 1 instance.
 * Chấp nhận được vì webhook đã ack 200 ngay lập tức, nền tảng hầu như không
 * retry. Khi scale nhiều instance, thay bằng Redis SETNX — giữ nguyên chữ ký hàm.
 */
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
