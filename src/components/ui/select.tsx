import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Select gốc của trình duyệt thay vì Radix Select: nó hoạt động trong form
 * Server Action mà không cần state phía client, và dashboard chỉ dùng vài
 * dropdown đơn giản (mode, position, status).
 */
export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "flex h-9 w-full appearance-none rounded-md border border-input bg-card px-3 py-1 text-sm shadow-xs transition-colors",
        "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke-width=%222%22 stroke=%22%2364748b%22%3E%3Cpath stroke-linecap=%22round%22 stroke-linejoin=%22round%22 d=%22m19.5 8.25-7.5 7.5-7.5-7.5%22/%3E%3C/svg%3E')] bg-[length:1rem] bg-[right_0.625rem_center] bg-no-repeat pr-9",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
