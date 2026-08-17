const VN_MOBILE = /^(?:0|\+84)(?:3|5|7|8|9)\d{8}$/;

export function normalizeVnPhone(raw: string): string | null {
  const compact = raw.replace(/[\s.\-()]/g, "");
  if (!VN_MOBILE.test(compact)) return null;
  return compact.startsWith("+84") ? `0${compact.slice(3)}` : compact;
}
