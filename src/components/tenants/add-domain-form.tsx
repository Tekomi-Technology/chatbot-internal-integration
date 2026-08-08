"use client";

import { Plus } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { idleState, type ActionState } from "@/server/action-state";

export function AddDomainForm({
  action,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, idleState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <Input
          name="domain"
          placeholder="example.com hoặc *.example.com"
          className="max-w-sm"
          aria-label="Domain"
          required
        />
        <SubmitButton variant="outline">
          <Plus />
          Thêm domain
        </SubmitButton>
      </div>
      {state.status === "error" ? (
        <p className="text-xs text-destructive">
          {state.errors?.domain ?? state.message}
        </p>
      ) : null}
    </form>
  );
}
