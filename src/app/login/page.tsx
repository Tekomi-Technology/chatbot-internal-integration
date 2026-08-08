import { Bot } from "lucide-react";
import type { Metadata } from "next";

import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Đăng nhập · Chatbot Dashboard" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Bot className="size-6" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Chatbot Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Đăng nhập để quản lý tenant và widget.
            </p>
          </div>
        </div>

        <LoginForm callbackUrl={callbackUrl} />
      </div>
    </main>
  );
}
