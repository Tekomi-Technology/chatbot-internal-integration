"use client";

import { AlertCircle, CheckCircle2, Unplug } from "lucide-react";
import { useActionState } from "react";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { CopyButton } from "@/components/copy-button";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
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

export type MetaTabChannel = {
  pageId: string;
  pageName: string | null;
  isActive: boolean;
  pageAccessTokenMasked: string;
};

/** Dòng chỉ để đọc + copy, dùng cho Callback URL và Verify token. */
function ReadOnlyRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-xs">
          {value}
        </code>
        <CopyButton value={value} label="Copy" />
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function MetaTab({
  channel,
  callbackUrl,
  verifyToken,
  action,
  disconnectAction,
}: {
  channel: MetaTabChannel | null;
  callbackUrl: string;
  /** null khi chưa đặt MESSENGER_VERIFY_TOKEN — hiện cảnh báo thay vì để trống. */
  verifyToken: string | null;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  disconnectAction: () => Promise<void>;
}) {
  const [state, formAction] = useActionState(action, idleState);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Cấu hình webhook bên Meta</CardTitle>
          <CardDescription>
            Dán hai giá trị này vào mục “1. Đặt cấu hình webhook” trong Meta App,
            rồi bấm “Xác minh và lưu”. Cùng một cặp giá trị dùng chung cho mọi
            tenant.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex max-w-2xl flex-col gap-5">
          <ReadOnlyRow
            label="URL gọi lại (Callback URL)"
            value={callbackUrl}
            hint="Phải chạy trên HTTPS công khai thì Meta mới xác minh được."
          />

          {verifyToken ? (
            <ReadOnlyRow
              label="Xác minh mã (Verify Token)"
              value={verifyToken}
              hint="Đọc từ biến môi trường MESSENGER_VERIFY_TOKEN."
            />
          ) : (
            <p className="flex items-center gap-2 rounded-md bg-destructive-muted px-3 py-2 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              Chưa đặt MESSENGER_VERIFY_TOKEN và MESSENGER_APP_SECRET trong biến
              môi trường — webhook sẽ không hoạt động.
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            Sau khi xác minh, nhớ đăng ký (subscribe) trường{" "}
            <code className="font-mono">messages</code> và{" "}
            <code className="font-mono">messaging_postbacks</code> cho Page.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <CardTitle className="flex items-center gap-2">
                Facebook Page của tenant
                {channel ? (
                  <Badge variant={channel.isActive ? "success" : "neutral"}>
                    {channel.isActive ? "Đang kết nối" : "Đã tạm dừng"}
                  </Badge>
                ) : (
                  <Badge variant="neutral">Chưa kết nối</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Lấy Page ID và Page Access Token ở mục “2. Tạo mã truy cập” trong
                Meta App.
              </CardDescription>
            </div>

            {channel ? (
              <ConfirmActionButton
                action={disconnectAction}
                variant="outline"
                size="sm"
                title="Ngắt kết nối Page?"
                description="Xoá Page ID, token và toàn bộ ánh xạ hội thoại của tenant này. Kết nối lại sẽ bắt đầu ngữ cảnh mới."
                confirmLabel="Ngắt kết nối"
              >
                <Unplug />
                Ngắt kết nối
              </ConfirmActionButton>
            ) : null}
          </div>
        </CardHeader>

        <CardContent>
          <form
            key={state.stamp ?? "init"}
            action={formAction}
            className="flex max-w-xl flex-col gap-5"
          >
            <FormField
              name="pageId"
              label="Page ID"
              hint="Dãy số định danh Page, ví dụ 102938475610293."
              error={state.errors?.pageId}
            >
              <Input
                id="pageId"
                name="pageId"
                inputMode="numeric"
                defaultValue={state.values?.pageId ?? channel?.pageId ?? ""}
                required
              />
            </FormField>

            <FormField
              name="pageName"
              label="Tên Page (tuỳ chọn)"
              hint="Chỉ để dễ nhận ra trên dashboard."
              error={state.errors?.pageName}
            >
              <Input
                id="pageName"
                name="pageName"
                defaultValue={state.values?.pageName ?? channel?.pageName ?? ""}
              />
            </FormField>

            <FormField
              name="pageAccessToken"
              label="Page Access Token"
              hint={
                channel
                  ? `Đang lưu: ${channel.pageAccessTokenMasked}. Để trống nếu không muốn đổi.`
                  : "Token dài hạn của Page, được mã hoá trước khi lưu."
              }
              error={state.errors?.pageAccessToken}
            >
              <Input
                id="pageAccessToken"
                name="pageAccessToken"
                type="password"
                autoComplete="off"
                placeholder={
                  channel ? "Nhập token mới để thay thế" : "EAAG..."
                }
                required={!channel}
              />
            </FormField>

            <FormField
              name="isActive"
              label="Trạng thái"
              error={state.errors?.isActive}
            >
              <Select
                id="isActive"
                name="isActive"
                defaultValue={
                  state.values?.isActive ??
                  (channel && !channel.isActive ? "INACTIVE" : "ACTIVE")
                }
              >
                <option value="ACTIVE">Đang bật (bot trả lời tin nhắn)</option>
                <option value="INACTIVE">Tạm dừng (bỏ qua tin nhắn đến)</option>
              </Select>
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
              <SubmitButton>
                {channel ? "Lưu thay đổi" : "Kết nối Page"}
              </SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
