import "server-only";

import { env } from "@/lib/env";

export type DifyChatRequest = {
  baseUrl?: string | null;
  apiKey: string;
  query: string;
  /** Định danh người dùng cuối phía Dify — dùng session id của widget. */
  user: string;
  /** Có sẵn khi đây không phải tin nhắn đầu của phiên. */
  conversationId?: string | null;
  inputs?: Record<string, unknown>;
};

export type DifyChatResult = {
  answer: string;
  conversationId: string | null;
  messageId: string | null;
};

export class DifyError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail?: unknown,
  ) {
    super(message);
    this.name = "DifyError";
  }
}

const REQUEST_TIMEOUT_MS = 60_000;

/**
 * Gọi endpoint `/chat-messages` của Dify ở chế độ blocking.
 *
 * Chọn blocking thay vì streaming cho Phase 1: widget chỉ cần hiện câu trả lời
 * hoàn chỉnh, và blocking giúp proxy không phải quản lý SSE hai chặng.
 */
export async function sendDifyChatMessage(
  request: DifyChatRequest,
): Promise<DifyChatResult> {
  const baseUrl = (request.baseUrl?.replace(/\/+$/, "") || env.difyApiBaseUrl);
  const url = `${baseUrl}/chat-messages`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${request.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: request.inputs ?? {},
        query: request.query,
        response_mode: "blocking",
        user: request.user,
        ...(request.conversationId
          ? { conversation_id: request.conversationId }
          : {}),
      }),
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new DifyError("Dify không phản hồi kịp thời.", 504);
    }
    throw new DifyError("Không kết nối được tới Dify.", 502, error);
  } finally {
    clearTimeout(timeout);
  }

  const rawBody = await response.text();
  let parsed: unknown = null;
  try {
    parsed = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    // Dify trả về non-JSON khi lỗi ở tầng gateway; giữ nguyên text để log.
  }

  if (!response.ok) {
    const detail = parsed ?? rawBody.slice(0, 500);
    throw new DifyError(
      `Dify trả về lỗi ${response.status}.`,
      response.status,
      detail,
    );
  }

  const body = (parsed ?? {}) as {
    answer?: string;
    conversation_id?: string;
    message_id?: string;
  };

  return {
    answer: body.answer ?? "",
    conversationId: body.conversation_id ?? null,
    messageId: body.message_id ?? null,
  };
}
