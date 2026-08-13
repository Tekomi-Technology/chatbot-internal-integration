/** Đầu số di động Việt Nam đang lưu hành: 03, 05, 07, 08, 09 + 8 chữ số. */
const VN_MOBILE = /^(?:0|\+84)(?:3|5|7|8|9)\d{8}$/;

/**
 * Chuẩn hoá số điện thoại khách nhập về đúng một dạng `0xxxxxxxxx`.
 *
 * Khách gõ số theo đủ kiểu (khoảng trắng, dấu chấm, gạch nối, +84), nên phải gom
 * về một dạng trước khi lưu — nếu không cùng một người sẽ thành nhiều lead khác
 * nhau và đội tư vấn không lọc trùng được.
 *
 * Trả `null` khi số không hợp lệ.
 */
export function normalizeVnPhone(raw: string): string | null {
  const compact = raw.replace(/[\s.\-()]/g, "");
  if (!VN_MOBILE.test(compact)) return null;
  return compact.startsWith("+84") ? `0${compact.slice(3)}` : compact;
}
