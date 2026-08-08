"use client";

import { useState } from "react";

import { SubmitButton } from "@/components/submit-button";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Nút mở hộp thoại xác nhận rồi mới chạy Server Action.
 *
 * `action` là Server Action đã bind sẵn tham số ở phía server, nên component
 * này không cần biết id nào cả.
 */
export function ConfirmActionButton({
  action,
  title,
  description,
  confirmLabel = "Xác nhận",
  confirmVariant = "destructive",
  children,
  ...triggerProps
}: {
  action: () => Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: ButtonProps["variant"];
} & ButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" {...triggerProps}>
          {children}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Huỷ
          </Button>
          <form
            action={async () => {
              await action();
              setOpen(false);
            }}
          >
            <SubmitButton variant={confirmVariant}>{confirmLabel}</SubmitButton>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
