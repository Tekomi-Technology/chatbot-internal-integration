"use client";

import { AlertCircle } from "lucide-react";
import { useActionState } from "react";

import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { idleState } from "@/server/action-state";
import { createTenantAction } from "@/server/actions/tenants";

export function NewTenantForm() {
  const [state, formAction] = useActionState(createTenantAction, idleState);

  return (
    <Card>
      <CardContent className="pt-5">
        {/* key đổi sau mỗi lần lỗi: React 19 reset form sau action, remount để
            input nhận lại giá trị người dùng vừa nhập thay vì trắng trơn. */}
        <form
          key={state.stamp ?? "init"}
          action={formAction}
          className="flex flex-col gap-5"
        >
          <FormField
            name="name"
            label="Tên đơn vị"
            hint="Ví dụ: Công ty Cổ phần ABC"
            error={state.errors?.name}
          >
            <Input
              id="name"
              name="name"
              defaultValue={state.values?.name ?? ""}
              required
              autoFocus
            />
          </FormField>

          <FormField
            name="difyAppId"
            label="Dify App ID"
            hint="ID của app tương ứng bên Dify.ai"
            error={state.errors?.difyAppId}
          >
            <Input
              id="difyAppId"
              name="difyAppId"
              defaultValue={state.values?.difyAppId ?? ""}
              required
            />
          </FormField>

          <FormField
            name="difyApiKey"
            label="Dify API key"
            hint="Được mã hoá AES-256-GCM trước khi lưu; sau khi lưu sẽ không hiển thị lại."
            error={state.errors?.difyApiKey}
          >
            <Input
              id="difyApiKey"
              name="difyApiKey"
              type="password"
              autoComplete="off"
              required
            />
          </FormField>

          <FormField
            name="difyApiBaseUrl"
            label="Dify base URL (tuỳ chọn)"
            hint="Để trống nếu dùng chung DIFY_API_BASE_URL trong biến môi trường."
            error={state.errors?.difyApiBaseUrl}
          >
            <Input
              id="difyApiBaseUrl"
              name="difyApiBaseUrl"
              defaultValue={state.values?.difyApiBaseUrl ?? ""}
              placeholder="https://dify.noi-bo.vn/v1"
            />
          </FormField>

          {state.status === "error" && !state.errors ? (
            <p className="flex items-center gap-2 rounded-md bg-destructive-muted px-3 py-2 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {state.message}
            </p>
          ) : null}

          <div className="flex justify-end">
            <SubmitButton>Tạo tenant</SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
