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

// --- Khung giờ bot tự trả lời lại ban đêm ------------------------------------

/**
 * Múi giờ dùng để đọc giờ hiện tại, cố định thay vì đọc `TZ` của tiến trình.
 *
 * Vì sao cố định: test phải cho cùng kết quả trên máy lập trình viên lẫn trên
 * VPS, và đổi cấu hình Docker không được âm thầm làm lệch khung giờ của khách.
 */
const NIGHT_WINDOW_TIMEZONE = "Asia/Ho_Chi_Minh";

const nightWindowHourFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: NIGHT_WINDOW_TIMEZONE,
  hour: "2-digit",
  // `h23` cho 00-23. Đừng đổi sang `hour12: false` — cách đó trả "24" cho nửa
  // đêm ở một số phiên bản Node.
  hourCycle: "h23",
});

function isValidHour(value: number | null): value is number {
  return value !== null && Number.isInteger(value) && value >= 0 && value <= 23;
}

/**
 * Bây giờ có nằm trong khung giờ bot được phép trả lời lại không?
 *
 * Dùng chung cho Messenger và Zalo, để đè lên cờ `humanActive` ban đêm khi
 * nhân viên đã nghỉ. Cố ý KHÔNG sửa cờ: hết khung giờ là hội thoại tự quay về
 * trạng thái nhân viên giữ, không cần job dọn dẹp nào.
 *
 * Quy ước: giờ bắt đầu tính vào khung, giờ kết thúc thì không — `1, 6` nghĩa
 * là 01:00 đến 05:59. Khung qua nửa đêm (`22, 6`) hợp lệ.
 *
 * Trả `false` khi chưa cấu hình, cấu hình sai, hoặc hai giờ bằng nhau. Riêng
 * ca bằng nhau: hiểu thành "chạy 24/24" thì bot đè lên nhân viên vĩnh viễn,
 * nên coi là tắt an toàn hơn.
 */
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

/**
 * Nhân viên vừa nhắn trong bao lâu thì vẫn coi là đang trực.
 *
 * Trong khung giờ đêm, bot chỉ nhận việc khi khoảng này đã trôi qua — để không
 * nhảy vào giữa lúc có người trực khuya đang chat dở với khách.
 */
export const HUMAN_ACTIVE_GRACE_MS = 30 * 60_000;

/**
 * Hội thoại đang do nhân viên giữ, nhưng bot có được phép trả lời lúc này không?
 *
 * Dùng chung cho Messenger và Zalo. Chỉ đúng khi đang trong khung giờ đêm của
 * kênh VÀ nhân viên đã im đủ lâu. Không sửa cờ `humanActive` — hết khung giờ
 * là hội thoại tự quay về trạng thái nhân viên giữ.
 */
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

// --- Đăng ký tin bot tự gửi, để phân biệt với nhân viên gửi tay -------------

const SELF_SENT_TTL_MS = 10 * 60_000;
const selfSentIds = new Map<string, number>();

/** Đánh dấu một ID tin nhắn là do CHÍNH bot vừa gửi qua API — không phải nhân viên gõ tay. */
export function markSelfSent(id: string | null): void {
  if (!id) return;

  const now = Date.now();
  for (const [key, expiresAt] of selfSentIds) {
    if (expiresAt <= now) selfSentIds.delete(key);
  }

  selfSentIds.set(id, now + SELF_SENT_TTL_MS);
}

/**
 * ID tin nhắn này có phải do bot tự gửi không?
 *
 * Dùng để lọc sự kiện `oa_send_text` của Zalo: nền tảng bắn sự kiện này cho
 * MỌI tin OA gửi ra khách, kể cả tin bot tự gửi qua API — không lọc thì bot tự
 * thấy tin của mình rồi coi là nhân viên vừa gõ tay, tự bịt miệng mình ngay.
 *
 * GIỚI HẠN ĐÃ BIẾT: lưu trong bộ nhớ tiến trình, chỉ đúng với 1 instance —
 * giống `markIdSeen`. Nếu Zalo không trả `message_id` cho một lần gửi (hiếm),
 * tin đó sẽ bị coi nhầm là nhân viên gửi tay.
 */
export function wasSelfSent(id: string | null): boolean {
  if (!id) return false;

  const now = Date.now();
  const expiresAt = selfSentIds.get(id);
  if (expiresAt === undefined || expiresAt <= now) return false;

  return true;
}
