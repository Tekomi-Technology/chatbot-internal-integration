import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import { env } from "@/lib/env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit nonce, khuyến nghị của GCM
const PREFIX = "v1";

/**
 * ENCRYPTION_KEY chấp nhận 64 ký tự hex hoặc 44 ký tự base64 (đều = 32 byte).
 * Sinh key mới: `openssl rand -hex 32`
 */
function getKey(): Buffer {
  const raw = env.encryptionKey.trim();
  const key = /^[0-9a-fA-F]{64}$/.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64");

  if (key.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY phải là 32 byte (64 ký tự hex hoặc 44 ký tự base64). Sinh bằng: openssl rand -hex 32",
    );
  }
  return key;
}

/** Mã hoá chuỗi bí mật. Kết quả dạng `v1:<iv>:<authTag>:<ciphertext>` (base64). */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    PREFIX,
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

/** Giải mã chuỗi do `encryptSecret` tạo ra. Throw nếu ciphertext bị sửa đổi. */
export function decryptSecret(payload: string): string {
  const parts = payload.split(":");
  if (parts.length !== 4 || parts[0] !== PREFIX) {
    throw new Error("Ciphertext không đúng định dạng mong đợi.");
  }

  const [, ivB64, tagB64, dataB64] = parts;
  const decipher = createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

/** So sánh chuỗi không phụ thuộc thời gian, dùng khi đối chiếu token/key. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Che bớt secret khi hiển thị trên UI: `app-xxxx…4f2a`. */
export function maskSecret(secret: string): string {
  if (secret.length <= 8) return "••••••••";
  return `${secret.slice(0, 4)}${"•".repeat(8)}${secret.slice(-4)}`;
}
