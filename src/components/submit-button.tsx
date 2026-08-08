"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * Nút submit tự khoá khi form đang pending. Phải nằm *bên trong* <form> thì
 * useFormStatus mới đọc được trạng thái.
 */
export function SubmitButton({ children, disabled, ...props }: ButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending ? <Loader2 className="animate-spin" /> : null}
      {children}
    </Button>
  );
}
