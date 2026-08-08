/**
 * Chuẩn hoá domain do admin nhập: bỏ scheme, path, port, "www.", lowercase.
 * Trả về null nếu chuỗi không phải hostname hợp lệ.
 *
 * Cho phép pattern wildcard một cấp: "*.example.com".
 */
export function normalizeDomain(input: string): string | null {
  let value = input.trim().toLowerCase();
  if (!value) return null;

  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, ""); // bỏ scheme
  value = value.split("/")[0]; // bỏ path
  value = value.split("?")[0];
  value = value.replace(/:\d+$/, ""); // bỏ port
  value = value.replace(/\.$/, ""); // bỏ trailing dot

  const wildcard = value.startsWith("*.");
  let host = wildcard ? value.slice(2) : value;

  // Luôn lưu apex domain: "www.example.com" -> "example.com". isDomainAllowed
  // chấp nhận cả hai dạng, nên lưu apex mới phủ được cả khách vào không có www.
  if (!wildcard && host.startsWith("www.") && host.split(".").length > 2) {
    host = host.slice(4);
  }

  // localhost là trường hợp hợp lệ đặc biệt (dev/test).
  const isLocalhost = host === "localhost";
  const isHostname = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/.test(
    host,
  );

  if (!isLocalhost && !isHostname) return null;
  return wildcard ? `*.${host}` : host;
}

/** Lấy hostname từ header Origin hoặc Referer. */
export function hostnameFromHeader(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Kiểm tra hostname của request có khớp whitelist không.
 *
 * - "example.com" khớp chính xác "example.com" **và** "www.example.com"
 * - "*.example.com" khớp mọi subdomain, kể cả chính "example.com"
 */
export function isDomainAllowed(
  hostname: string | null,
  whitelist: readonly string[],
): boolean {
  if (!hostname || whitelist.length === 0) return false;
  const host = hostname.toLowerCase();

  return whitelist.some((entry) => {
    if (entry.startsWith("*.")) {
      const base = entry.slice(2);
      return host === base || host.endsWith(`.${base}`);
    }
    return host === entry || host === `www.${entry}`;
  });
}
