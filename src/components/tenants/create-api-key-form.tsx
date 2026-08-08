"use client";

import { Plus } from "lucide-react";
import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { toast } from "sonner";

import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { idleState, type ActionState } from "@/server/action-state";

export function CreateApiKeyForm({
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
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-wrap items-end gap-3"
    >
      <div className="min-w-56 flex-1">
        <Input name="label" placeholder="Nhãn key (tuỳ chọn), vd: Website chính" />
      </div>
      <Select name="type" className="w-56" defaultValue="PUBLIC">
        <option value="PUBLIC">Public (cho widget)</option>
        <option value="ADMIN">Admin (server-to-server)</option>
      </Select>
      <SubmitButton variant="outline">
        <Plus />
        Tạo key
      </SubmitButton>
    </form>
  );
}
