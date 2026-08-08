"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useActionState, useState } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import { idleState, type ActionState } from "@/server/action-state";

export type WidgetConfigValues = {
  mode: "BUBBLE" | "INLINE";
  position: "BOTTOM_RIGHT" | "BOTTOM_LEFT";
  botName: string;
  logoUrl: string | null;
  primaryColor: string;
  welcomeMessage: string;
  inputPlaceholder: string;
};

export function WidgetConfigTab({
  config,
  action,
}: {
  config: WidgetConfigValues;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, idleState);
  // Giữ ở state cục bộ để ô color và ô text hex luôn khớp nhau.
  const [color, setColor] = useState(config.primaryColor);
  const [mode, setMode] = useState(config.mode);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cấu hình widget</CardTitle>
        <CardDescription>
          Widget đọc cấu hình này mỗi lần tải trang, nên thay đổi có hiệu lực ngay
          mà tenant không phải dán lại mã nhúng.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Xem chú thích ở new-tenant-form: remount để giữ giá trị khi lỗi. */}
        <form
          key={state.stamp ?? "init"}
          action={formAction}
          className="flex max-w-xl flex-col gap-5"
        >
          <FormField name="mode" label="Chế độ hiển thị" error={state.errors?.mode}>
            <Select
              id="mode"
              name="mode"
              value={mode}
              onChange={(event) =>
                setMode(event.target.value as WidgetConfigValues["mode"])
              }
            >
              <option value="BUBBLE">Bubble — bong bóng nổi ở góc màn hình</option>
              <option value="INLINE">Inline — nhúng cố định vào một div</option>
            </Select>
          </FormField>

          {mode === "BUBBLE" ? (
            <FormField
              name="position"
              label="Vị trí bong bóng"
              error={state.errors?.position}
            >
              <Select
                id="position"
                name="position"
                defaultValue={state.values?.position ?? config.position}
              >
                <option value="BOTTOM_RIGHT">Góc dưới bên phải</option>
                <option value="BOTTOM_LEFT">Góc dưới bên trái</option>
              </Select>
            </FormField>
          ) : (
            // Mode inline không dùng position, nhưng vẫn phải gửi giá trị để
            // schema validate được và cấu hình cũ không bị mất.
            <input
              type="hidden"
              name="position"
              value={state.values?.position ?? config.position}
            />
          )}

          <FormField name="botName" label="Tên bot" error={state.errors?.botName}>
            <Input
              id="botName"
              name="botName"
              defaultValue={state.values?.botName ?? config.botName}
              required
            />
          </FormField>

          <FormField
            name="primaryColor"
            label="Màu chủ đạo"
            error={state.errors?.primaryColor}
          >
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                className="size-9 cursor-pointer rounded-md border border-input bg-card p-1"
                aria-label="Chọn màu chủ đạo"
              />
              <Input
                id="primaryColor"
                name="primaryColor"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                className="w-32 font-mono"
              />
            </div>
          </FormField>

          <FormField
            name="logoUrl"
            label="Logo URL (tuỳ chọn)"
            hint="Ảnh vuông, tối thiểu 64×64. Để trống sẽ hiển thị chữ cái đầu của tên bot."
            error={state.errors?.logoUrl}
          >
            <Input
              id="logoUrl"
              name="logoUrl"
              defaultValue={state.values?.logoUrl ?? config.logoUrl ?? ""}
              placeholder="https://example.com/logo.png"
            />
          </FormField>

          <FormField
            name="welcomeMessage"
            label="Tin nhắn chào"
            error={state.errors?.welcomeMessage}
          >
            <Textarea
              id="welcomeMessage"
              name="welcomeMessage"
              defaultValue={state.values?.welcomeMessage ?? config.welcomeMessage}
              required
            />
          </FormField>

          <FormField
            name="inputPlaceholder"
            label="Placeholder ô nhập"
            error={state.errors?.inputPlaceholder}
          >
            <Input
              id="inputPlaceholder"
              name="inputPlaceholder"
              defaultValue={state.values?.inputPlaceholder ?? config.inputPlaceholder}
              required
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
            <SubmitButton>Lưu cấu hình</SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
