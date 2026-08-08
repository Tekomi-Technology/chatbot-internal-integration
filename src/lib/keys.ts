import "server-only";

import { randomBytes } from "node:crypto";

// Bỏ các ký tự dễ nhìn nhầm (0/O, 1/l/I) để admin đọc/đọc lại key bớt sai.
const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Sinh chuỗi ngẫu nhiên dùng CSPRNG, loại bỏ modulo-bias bằng rejection sampling.
 */
function randomString(length: number): string {
  const max = Math.floor(256 / ALPHABET.length) * ALPHABET.length;
  let out = "";

  while (out.length < length) {
    const chunk = randomBytes(length * 2);
    for (const byte of chunk) {
      if (byte >= max) continue; // loại bỏ để phân phối đều
      out += ALPHABET[byte % ALPHABET.length];
      if (out.length === length) break;
    }
  }
  return out;
}

/** Public key phát cho widget. 40 ký tự random ≈ 231 bit entropy. */
export function generatePublicApiKey(): string {
  return `pk_${randomString(40)}`;
}

/** Key dùng cho tích hợp server-to-server của tenant. */
export function generateAdminApiKey(): string {
  return `sk_${randomString(40)}`;
}

/** Chuyển tên tenant thành slug URL-safe. */
export function slugify(input: string): string {
  const base = input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // bỏ dấu tiếng Việt
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return base || `tenant-${randomString(6).toLowerCase()}`;
}
