"use client";

import { AlertCircle } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/utils";
import { idleState, type ActionState } from "@/server/action-state";
import {
  releaseStaffControlAction,
  sendStaffReplyAction,
} from "@/server/actions/widget-conversations";

export type ThreadMessage = {
  sender: "CUSTOMER" | "BOT" | "STAFF";
  text: string;
  createdAt: string;
};

const SENDER_LABEL: Record<ThreadMessage["sender"], string> = {
  CUSTOMER: "Khách",
  BOT: "Bot",
  STAFF: "Nhân viên",
};

const SENDER_CLASS: Record<ThreadMessage["sender"], string> = {
  CUSTOMER: "self-end bg-primary text-primary-foreground",
  BOT: "self-start bg-card border border-border",
  STAFF: "self-start bg-blue-50 border border-blue-200",
};

const POLL_INTERVAL_MS = 4000;

export function ConversationThread({
  tenantId,
  conversationId,
  initialMessages,
  staffActive,
}: {
  tenantId: string;
  conversationId: string;
  initialMessages: ThreadMessage[];
  staffActive: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [isStaffActive, setIsStaffActive] = useState(staffActive);
  const lastSeenAtRef = useRef(
    initialMessages.length > 0
      ? initialMessages[initialMessages.length - 1].createdAt
      : new Date(0).toISOString(),
  );

  useEffect(() => {
    const timer = setInterval(function poll() {
      fetch(
        `/api/admin/tenants/${tenantId}/conversations/${conversationId}/messages?since=${encodeURIComponent(lastSeenAtRef.current)}`,
      )
        .then((response) => (response.ok ? response.json() : null))
        .then((payload: { messages?: ThreadMessage[] } | null) => {
          if (!payload?.messages?.length) return;
          setMessages((current) => [...current, ...payload.messages!]);
          lastSeenAtRef.current =
            payload.messages![payload.messages!.length - 1].createdAt;
        })
        .catch(() => {
          /* im lặng, thử lại ở lượt sau */
        });
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [tenantId, conversationId]);

  const [state, formAction] = useActionState<ActionState, FormData>(
    async (prev, formData) => {
      const result = await sendStaffReplyAction(conversationId, prev, formData);
      if (result.status === "success") {
        const text = String(formData.get("text") ?? "");
        const optimistic: ThreadMessage = {
          sender: "STAFF",
          text,
          createdAt: new Date().toISOString(),
        };
        setMessages((current) => [...current, optimistic]);
        lastSeenAtRef.current = optimistic.createdAt;
        setIsStaffActive(true);
      }
      return result;
    },
    idleState,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {isStaffActive
            ? "Bot đang tạm dừng cho hội thoại này — nhân viên đang xử lý."
            : "Bot đang tự trả lời hội thoại này."}
        </p>

        {isStaffActive ? (
          <form
            action={async () => {
              await releaseStaffControlAction(conversationId);
              setIsStaffActive(false);
            }}
          >
            <Button type="submit" variant="outline" size="sm">
              Trả lại cho AI
            </Button>
          </form>
        ) : null}
      </div>

      <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto rounded-md border border-border bg-muted/30 p-4">
        {messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Chưa có tin nhắn nào.
          </p>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.createdAt}-${index}`}
              className={`flex max-w-[80%] flex-col gap-0.5 rounded-lg px-3 py-2 text-sm ${SENDER_CLASS[message.sender]}`}
            >
              <span className="text-xs font-medium opacity-70">
                {SENDER_LABEL[message.sender]} · {formatDateTime(message.createdAt)}
              </span>
              <span className="whitespace-pre-wrap">{message.text}</span>
            </div>
          ))
        )}
      </div>

      <form key={state.stamp ?? "init"} action={formAction} className="flex flex-col gap-2">
        <FormField name="text" label="Nhắn cho khách" error={state.errors?.text}>
          <Textarea id="text" name="text" rows={3} required />
        </FormField>

        {state.status === "error" && state.message ? (
          <p className="flex items-center gap-2 rounded-md bg-destructive-muted px-3 py-2 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {state.message}
          </p>
        ) : null}

        <div className="flex justify-end">
          <SubmitButton>Gửi</SubmitButton>
        </div>
      </form>
    </div>
  );
}
