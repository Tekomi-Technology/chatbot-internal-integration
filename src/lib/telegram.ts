import "server-only";

import { env } from "@/lib/env";

const SEND_MESSAGE_TIMEOUT_MS = 10_000;

export async function sendTelegramMessage(text: string): Promise<void> {
  const { botToken, chatId } = env.telegram;
  if (!botToken || !chatId) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEND_MESSAGE_TIMEOUT_MS);

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("telegram -> sendMessage lỗi", {
        status: response.status,
        body: (await response.text()).slice(0, 500),
      });
    }
  } catch (error) {
    console.error("telegram -> sendMessage không kết nối được", error);
  } finally {
    clearTimeout(timeout);
  }
}
