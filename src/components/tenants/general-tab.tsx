"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useActionState } from "react";

import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { idleState, type ActionState } from "@/server/action-state";

export type GeneralTabTenant = {
  name: string;
  slug: string;
  status: "ACTIVE" | "INACTIVE";
  difyAppId: string;
  difyApiBaseUrl: string | null;
  difyApiKeyMasked: string;
};

export function GeneralTab({
  tenant,
  action,
}: {
  tenant: GeneralTabTenant;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, idleState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin tenant</CardTitle>
        <CardDescription>
          Slug <code className="font-mono text-xs">{tenant.slug}</code> được sinh
          tự động và không thay đổi.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Xem chú thích ở new-tenant-form: remount để giữ giá trị khi lỗi. */}
        <form
          key={state.stamp ?? "init"}
          action={formAction}
          className="flex max-w-xl flex-col gap-5"
        >
          <FormField name="name" label="Tên đơn vị" error={state.errors?.name}>
            <Input
              id="name"
              name="name"
              defaultValue={state.values?.name ?? tenant.name}
              required
            />
          </FormField>

          <FormField name="status" label="Trạng thái" error={state.errors?.status}>
            <Select
              id="status"
              name="status"
              defaultValue={state.values?.status ?? tenant.status}
            >
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Đã tắt (widget ngừng trả lời)</option>
            </Select>
          </FormField>

          <FormField
            name="difyAppId"
            label="Dify App ID"
            error={state.errors?.difyAppId}
          >
            <Input
              id="difyAppId"
              name="difyAppId"
              defaultValue={state.values?.difyAppId ?? tenant.difyAppId}
              required
            />
          </FormField>

          <FormField
            name="difyApiKey"
            label="Dify API key"
            hint={`Đang lưu: ${tenant.difyApiKeyMasked}. Để trống nếu không muốn đổi.`}
            error={state.errors?.difyApiKey}
          >
            <Input
              id="difyApiKey"
              name="difyApiKey"
              type="password"
              autoComplete="off"
              placeholder="Nhập key mới để thay thế"
            />
          </FormField>

          <FormField
            name="difyApiBaseUrl"
            label="Dify base URL (tuỳ chọn)"
            hint="Để trống nếu dùng chung DIFY_API_BASE_URL."
            error={state.errors?.difyApiBaseUrl}
          >
            <Input
              id="difyApiBaseUrl"
              name="difyApiBaseUrl"
              defaultValue={state.values?.difyApiBaseUrl ?? tenant.difyApiBaseUrl ?? ""}
              placeholder="https://dify.noi-bo.vn/v1"
            />
          </FormField>

          {state.status !== "idle" && state.message ? (
            <p
              className={
                state.status === "success"
                  ? "flex items-center gap-2 rounded-md bg-success-muted px-3 py-2 text-sm text-success"
                  : "flex items-center gap-2 rounded-md bg-destructive-muted px-3 py-2 text-sm text-destructive"
              }
            >
              {state.status === "success" ? (
                <CheckCircle2 className="size-4 shrink-0" />
              ) : (
                <AlertCircle className="size-4 shrink-0" />
              )}
              {state.message}
            </p>
          ) : null}

          <div className="flex justify-end">
            <SubmitButton>Lưu thay đổi</SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
