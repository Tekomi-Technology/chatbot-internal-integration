import "server-only";

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
  get difyApiBaseUrl() {
    return (
      process.env.DIFY_API_BASE_URL?.replace(/\/+$/, "") ?? "https://api.dify.ai/v1"
    );
  },

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

  get messenger() {
    return {
      verifyToken: process.env.MESSENGER_VERIFY_TOKEN?.trim() || null,
      appSecret: process.env.MESSENGER_APP_SECRET?.trim() || null,
      graphApiVersion: process.env.MESSENGER_API_VERSION?.trim() || "v21.0",
      appId: process.env.MESSENGER_APP_ID?.trim() || null,
    };
  },

  get zalo() {
    return {
      appId: process.env.ZALO_APP_ID?.trim() || null,
      secretKey: process.env.ZALO_APP_SECRET?.trim() || null,
    };
  },

  get cronSecret() {
    return process.env.CRON_SECRET?.trim() || null;
  },
  get widgetRateLimit() {
    return {
      limit: Number(process.env.WIDGET_RATE_LIMIT ?? 20),
      windowMs: Number(process.env.WIDGET_RATE_LIMIT_WINDOW_MS ?? 60_000),
    };
  },
  get widgetPollRateLimit() {
    return {
      limit: Number(process.env.WIDGET_POLL_RATE_LIMIT ?? 40),
      windowMs: Number(process.env.WIDGET_POLL_RATE_LIMIT_WINDOW_MS ?? 60_000),
    };
  },

  get telegram() {
    return {
      botToken: process.env.TELEGRAM_BOT_TOKEN?.trim() || null,
      chatId: process.env.TELEGRAM_CHAT_ID?.trim() || null,
    };
  },
};
