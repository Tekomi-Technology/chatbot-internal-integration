"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button, type ButtonProps } from "@/components/ui/button";

export function CopyButton({
  value,
  label = "Copy code",
  ...props
}: { value: string; label?: string } & Omit<ButtonProps, "value">) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      toast.error("Trình duyệt chặn clipboard. Hãy bôi đen và copy thủ công.");
    }
  }

  return (
    <Button type="button" onClick={onCopy} {...props}>
      {copied ? <Check /> : <Copy />}
      {copied ? "Đã copy" : label}
    </Button>
  );
}
