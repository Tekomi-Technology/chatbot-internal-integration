export type DifyStreamError = {
  status: number;
  code: string | null;
  message: string;
};

export type DifyStreamResult = {
  answer: string;
  conversationId: string | null;
  messageId: string | null;
  error: DifyStreamError | null;
};

type DifyStreamEvent = {
  event?: string;
  answer?: string;
  conversation_id?: string;
  message_id?: string;
  id?: string;
  status?: number;
  code?: string;
  message?: string;
};

export async function aggregateDifyStream(
  body: ReadableStream<Uint8Array>,
): Promise<DifyStreamResult> {
  const reader = body.getReader();
  const decoder = new TextDecoder();

  let answer = "";
  let conversationId: string | null = null;
  let messageId: string | null = null;
  let error: DifyStreamError | null = null;
  let buffer = "";

  const handleFrame = (frame: string) => {
    for (const line of frame.split(/\r?\n/)) {
      if (!line.startsWith("data:")) continue;

      const raw = line.slice(5).trim();
      if (!raw || raw === "[DONE]") continue;

      let payload: DifyStreamEvent;
      try {
        payload = JSON.parse(raw) as DifyStreamEvent;
      } catch {
        continue;
      }

      if (payload.conversation_id) conversationId = payload.conversation_id;
      if (payload.message_id) messageId = payload.message_id;

      switch (payload.event) {
        case "message":
        case "agent_message":
          answer += payload.answer ?? "";
          break;
        case "message_replace":
          answer = payload.answer ?? "";
          break;
        case "message_end":
          if (payload.id) messageId = payload.id;
          break;
        case "error":
          error = {
            status: payload.status ?? 500,
            code: payload.code ?? null,
            message: payload.message ?? "Dify báo lỗi giữa chừng.",
          };
          break;
        default:
          break;
      }
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split(/\r?\n\r?\n/);
    buffer = frames.pop() ?? "";
    frames.forEach(handleFrame);
  }

  buffer += decoder.decode();
  if (buffer.trim()) handleFrame(buffer);

  return { answer, conversationId, messageId, error };
}
