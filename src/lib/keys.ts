import "server-only";

import { randomBytes } from "node:crypto";

const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomString(length: number): string {
  const max = Math.floor(256 / ALPHABET.length) * ALPHABET.length;
  let out = "";

  while (out.length < length) {
    const chunk = randomBytes(length * 2);
    for (const byte of chunk) {
      if (byte >= max) continue; 
      out += ALPHABET[byte % ALPHABET.length];
      if (out.length === length) break;
    }
  }
  return out;
}

export function generatePublicApiKey(): string {
  return `pk_${randomString(40)}`;
}

export function generateAdminApiKey(): string {
  return `sk_${randomString(40)}`;
}

export function slugify(input: string): string {
  const base = input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return base || `tenant-${randomString(6).toLowerCase()}`;
}
