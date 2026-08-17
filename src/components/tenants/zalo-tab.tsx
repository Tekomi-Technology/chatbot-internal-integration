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

export type ZaloTabChannel = {
  oaId: string;
  oaName: string | null;
  isActive: boolean;
  refreshTokenMasked: string;
  oaSecretKeyMasked: string | null;
  refreshTokenUpdatedAtLabel: string;
  accessTokenExpiresAtLabel: string | null;
  lastRefreshError: string | null;
};

function StatusBadge({ channel }: { channel: ZaloTabChannel | null }) {
  if (!channel) return <Badge variant="neutral">Chưa kết nối</Badge>;
  if (channel.lastRefreshError) {
    return <Badge variant="destructive">Cần kiểm tra</Badge>;
  }
  return (
    <Badge variant={channel.isActive ? "success" : "neutral"}>
      {channel.isActive ? "Đang kết nối" : "Đã tạm dừng"}
    </Badge>
  );
}

export function ZaloTab({
  channel,
  webhookUrl,
  appConfigured,
  action,
  disconnectAction,
}: {
  channel: ZaloTabChannel | null;
  webhookUrl: string;
  appConfigured: boolean;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  disconnectAction: () => Promise<void>;
}) {
  const [state, formAction] = useActionState(action, idleState);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Cấu hình webhook bên Zalo</CardTitle>
          <CardDescription>
            Dán URL này vào mục Webhook của app Zalo. Khác Meta, Zalo không có mã
            xác minh riêng — nó gửi thẳng một sự kiện thử vào URL. Cùng một URL
            dùng chung cho mọi tenant.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex max-w-2xl flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium">Webhook URL</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-xs">
                {webhookUrl}
              </code>
              <CopyButton value={webhookUrl} label="Copy" />
            </div>
            <p className="text-xs text-muted-foreground">
              Phải chạy trên HTTPS công khai thì Zalo mới gọi được.
            </p>
          </div>

          {appConfigured ? null : (
            <p className="flex items-center gap-2 rounded-md bg-destructive-muted px-3 py-2 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              Chưa đặt ZALO_APP_ID và ZALO_APP_SECRET trong biến môi trường —
              webhook sẽ không hoạt động.
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            Nhớ bật xác thực MAC trong app Zalo và đăng ký sự kiện{" "}
            <code className="font-mono">user_send_text</code>.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <CardTitle className="flex items-center gap-2">
                Zalo OA của tenant
                <StatusBadge channel={channel} />
              </CardTitle>
              <CardDescription>
                Lấy OA ID và Refresh Token sau khi cấp quyền OA cho app Zalo. Hệ
                thống tự đổi token mới mỗi giờ từ refresh token này.
              </CardDescription>
            </div>

            {channel ? (
              <ConfirmActionButton
                action={disconnectAction}
                variant="outline"
                size="sm"
                title="Ngắt kết nối OA?"
                description="Xoá OA ID, toàn bộ token và ánh xạ hội thoại của tenant này. Kết nối lại sẽ bắt đầu ngữ cảnh mới."
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
              name="oaId"
              label="OA ID"
              hint="Dãy số định danh Official Account."
              error={state.errors?.oaId}
            >
              <Input
                id="oaId"
                name="oaId"
                inputMode="numeric"
                defaultValue={state.values?.oaId ?? channel?.oaId ?? ""}
                required
              />
            </FormField>

            <FormField
              name="oaName"
              label="Tên OA (tuỳ chọn)"
              hint="Chỉ để dễ nhận ra trên dashboard."
              error={state.errors?.oaName}
            >
              <Input
                id="oaName"
                name="oaName"
                defaultValue={state.values?.oaName ?? channel?.oaName ?? ""}
              />
            </FormField>

            <FormField
              name="refreshToken"
              label="Refresh Token"
              hint={
                channel
                  ? `Đang lưu: ${channel.refreshTokenMasked}. Để trống nếu không muốn đổi. Dán token mới sẽ bắt đầu lại chuỗi token từ đầu.`
                  : "Refresh token lấy sau khi cấp quyền OA, được mã hoá trước khi lưu."
              }
              error={state.errors?.refreshToken}
            >
              <Input
                id="refreshToken"
                name="refreshToken"
                type="password"
                autoComplete="off"
                placeholder={channel ? "Nhập token mới để thay thế" : ""}
                required={!channel}
              />
            </FormField>

            <FormField
              name="oaSecretKey"
              label="OA Secret Key"
              hint={
                channel?.oaSecretKeyMasked
                  ? `Đang lưu: ${channel.oaSecretKeyMasked}. Để trống nếu không muốn đổi.`
                  : "Lấy ở trang Webhook trong app Zalo (KHÔNG phải Khoá bí mật của ứng dụng). Thiếu khoá này thì tin nhắn đến bị bỏ qua vì không xác thực được."
              }
              error={state.errors?.oaSecretKey}
            >
              <Input
                id="oaSecretKey"
                name="oaSecretKey"
                type="password"
                autoComplete="off"
                placeholder={
                  channel?.oaSecretKeyMasked ? "Nhập khoá mới để thay thế" : ""
                }
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
            <div className="flex flex-col gap-2 rounded-md border border-dashed p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                Bot trả lời lại ban đêm
              </p>

              <div className="flex items-end gap-3">
                <FormField name="nightResumeStartHour" label="Từ giờ">
                  <Input
                    id="nightResumeStartHour"
                    name="nightResumeStartHour"
                    inputMode="numeric"
                    className="w-24"
                    placeholder="1"
                  />
                </FormField>

                <FormField name="nightResumeEndHour" label="Đến giờ">
                  <Input
                    id="nightResumeEndHour"
                    name="nightResumeEndHour"
                    inputMode="numeric"
                    className="w-24"
                    placeholder="6"
                  />
                </FormField>
              </div>
            </div>

            {channel ? (
              <div className="flex flex-col gap-1 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                <p>
                  Refresh token cập nhật lần cuối:{" "}
                  {channel.refreshTokenUpdatedAtLabel}
                </p>
                <p>
                  Access token hết hạn:{" "}
                  {channel.accessTokenExpiresAtLabel ?? "chưa refresh lần nào"}
                </p>
                {channel.lastRefreshError ? (
                  <p className="text-destructive">
                    Lần refresh gần nhất thất bại: {channel.lastRefreshError}.
                    Nếu tình trạng này lặp lại, hãy dán lại Refresh Token mới ở
                    trên.
                  </p>
                ) : null}
              </div>
            ) : null}

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
                {channel ? "Lưu thay đổi" : "Kết nối OA"}
              </SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
