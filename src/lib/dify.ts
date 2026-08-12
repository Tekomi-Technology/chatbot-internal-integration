import "server-only";

import { aggregateDifyStream, stripReasoningBlocks } from "@/lib/dify-stream";
import { env } from "@/lib/env";

export type DifyChatRequest = {
  baseUrl?: string | null;
  apiKey: string;
  query: string;
  user: string;
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
        response_mode: "streaming",
        user: request.user,
        ...(request.conversationId
          ? { conversation_id: request.conversationId }
          : {}),
      }),
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === "AbortError") {
      throw new DifyError("Dify không phản hồi kịp thời.", 504);
    }
    throw new DifyError("Không kết nối được tới Dify.", 502, error);
  }

  try {
    if (!response.ok) {
      const rawBody = await response.text();
      let parsed: unknown = null;
      try {
        parsed = rawBody ? JSON.parse(rawBody) : null;
      } catch {
      }
      throw new DifyError(
        `Dify trả về lỗi ${response.status}.`,
        response.status,
        parsed ?? rawBody.slice(0, 500),
      );
    }

    if (!response.body) {
      throw new DifyError("Dify không trả về nội dung stream.", 502);
    }

    const stream = await aggregateDifyStream(response.body);

    if (stream.error) {
      throw new DifyError(
        `Dify trả về lỗi ${stream.error.status}.`,
        stream.error.status,
        stream.error,
      );
    }

    return {
      answer: stripReasoningBlocks(stream.answer),
      conversationId: stream.conversationId,
      messageId: stream.messageId,
    };
  } catch (error) {
    if (error instanceof DifyError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new DifyError("Dify không phản hồi kịp thời.", 504);
    }
    throw new DifyError("Đứt kết nối khi đang đọc phản hồi từ Dify.", 502, error);
  } finally {
    clearTimeout(timeout);
  }
}
