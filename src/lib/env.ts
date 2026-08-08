import "server-only";

/**
 * Đọc biến môi trường một cách lười (lazy) — không throw lúc import module, vì
 * `next build` sẽ import các module này khi collect page data mà chưa chắc có
 * đủ env của runtime.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Thiếu biến môi trường \`${name}\`. Xem .env.example để biết cách khai báo.`,
    );
  }
  return value;
}

export const env = {
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  get encryptionKey() {
    return required("ENCRYPTION_KEY");
  },
  /** Base URL mặc định của Dify (bản self-hosted). Tenant có thể override riêng. */
  get difyApiBaseUrl() {
    return (
      process.env.DIFY_API_BASE_URL?.replace(/\/+$/, "") ?? "https://api.dify.ai/v1"
    );
  },
  /**
   * Origin công khai của dashboard, dùng để sinh script nhúng.
   *
   * Cố tình KHÔNG đặt tên `NEXT_PUBLIC_*`: biến có tiền tố đó bị Next.js thay
   * bằng hằng số lúc build, nên đổi origin sẽ phải build lại. Ở đây chỉ dùng
   * phía server nên đọc runtime là đúng hơn.
   */
  get publicAppUrl() {
    const raw =
      process.env.APP_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
      "http://localhost:3000";
    return raw.replace(/\/+$/, "");
  },
  get enableConversationLog() {
    return process.env.ENABLE_CONVERSATION_LOG === "true";
  },
  get widgetRateLimit() {
    return {
      /** Số request tối đa cho mỗi cửa sổ. */
      limit: Number(process.env.WIDGET_RATE_LIMIT ?? 20),
      /** Độ dài cửa sổ, tính bằng mili giây. */
      windowMs: Number(process.env.WIDGET_RATE_LIMIT_WINDOW_MS ?? 60_000),
    };
  },
};
