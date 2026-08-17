"use client";

import { AlertCircle } from "lucide-react";
import { useActionState } from "react";

import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { idleState } from "@/server/action-state";
import { loginAction } from "@/server/actions/auth";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction] = useActionState(loginAction, idleState);

  return (
    <Card>
      <CardContent className="pt-5">
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/"} />

          <div key={state.stamp ?? "init"} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="admin@example.com"
                defaultValue={state.values?.email ?? ""}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {state.status === "error" ? (
            <p className="flex items-center gap-2 rounded-md bg-destructive-muted px-3 py-2 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {state.message}
            </p>
          ) : null}

          <SubmitButton className="mt-1 w-full">Đăng nhập</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
