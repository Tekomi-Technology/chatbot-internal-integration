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
import { LeadFieldEditor } from "@/components/tenants/lead-field-editor";
import { WidgetPreview } from "@/components/tenants/widget-preview";
import type { LeadField } from "@/lib/lead-fields";
import { idleState, type ActionState } from "@/server/action-state";

export type WidgetConfigValues = {
  mode: "BUBBLE" | "INLINE";
  position: "BOTTOM_RIGHT" | "BOTTOM_LEFT";
  botName: string;
  logoUrl: string | null;
  primaryColor: string;
  welcomeMessage: string;
  inputPlaceholder: string;
  leadFormEnabled: boolean;
  leadFormTitle: string;
  leadFormDescription: string;
  leadFormSubmitLabel: string;
  leadFormNameLabel: string;
  leadFormPhoneLabel: string;
  leadFormFields: LeadField[];
};

export function WidgetConfigTab({
  config,
  action,
}: {
  config: WidgetConfigValues;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, idleState);

  const [draft, setDraft] = useState<WidgetConfigValues>({
    ...config,
    logoUrl: config.logoUrl ?? "",
  });

  function set<K extends keyof WidgetConfigValues>(
    field: K,
    value: WidgetConfigValues[K],
  ) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <Card>
        <CardHeader>
          <CardTitle>Cấu hình widget</CardTitle>
          <CardDescription>
            Widget đọc cấu hình này mỗi lần tải trang, nên thay đổi có hiệu lực
            ngay mà tenant không phải dán lại mã nhúng.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            key={state.stamp ?? "init"}
            action={formAction}
            className="flex max-w-xl flex-col gap-5"
          >
            <FormField name="mode" label="Chế độ hiển thị" error={state.errors?.mode}>
              <Select
                id="mode"
                name="mode"
                value={draft.mode}
                onChange={(event) =>
                  set("mode", event.target.value as WidgetConfigValues["mode"])
                }
              >
                <option value="BUBBLE">Bubble — bong bóng nổi ở góc màn hình</option>
                <option value="INLINE">Inline — nhúng cố định vào một div</option>
              </Select>
            </FormField>

            {draft.mode === "BUBBLE" ? (
              <FormField
                name="position"
                label="Vị trí bong bóng"
                error={state.errors?.position}
              >
                <Select
                  id="position"
                  name="position"
                  value={draft.position}
                  onChange={(event) =>
                    set(
                      "position",
                      event.target.value as WidgetConfigValues["position"],
                    )
                  }
                >
                  <option value="BOTTOM_RIGHT">Góc dưới bên phải</option>
                  <option value="BOTTOM_LEFT">Góc dưới bên trái</option>
                </Select>
              </FormField>
            ) : (
              <input type="hidden" name="position" value={draft.position} />
            )}

            <FormField name="botName" label="Tên bot" error={state.errors?.botName}>
              <Input
                id="botName"
                name="botName"
                value={draft.botName}
                onChange={(event) => set("botName", event.target.value)}
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
                  value={draft.primaryColor}
                  onChange={(event) => set("primaryColor", event.target.value)}
                  className="size-9 cursor-pointer rounded-md border border-input bg-card p-1"
                  aria-label="Chọn màu chủ đạo"
                />
                <Input
                  id="primaryColor"
                  name="primaryColor"
                  value={draft.primaryColor}
                  onChange={(event) => set("primaryColor", event.target.value)}
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
                value={draft.logoUrl ?? ""}
                onChange={(event) => set("logoUrl", event.target.value)}
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
                value={draft.welcomeMessage}
                onChange={(event) => set("welcomeMessage", event.target.value)}
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
                value={draft.inputPlaceholder}
                onChange={(event) => set("inputPlaceholder", event.target.value)}
                required
              />
            </FormField>

            <fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
              <legend className="px-1 text-sm font-medium">
                Form thu thập thông tin
              </legend>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="leadFormEnabled"
                  checked={draft.leadFormEnabled}
                  onChange={(event) =>
                    set("leadFormEnabled", event.target.checked)
                  }
                  className="mt-0.5 size-4 cursor-pointer accent-primary"
                />
                <span className="text-sm">
                  Bắt khách điền họ tên và số điện thoại trước khi chat
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Khách mở widget sẽ thấy form thay cho ô nhập, điền xong mới
                    gửi được tin nhắn. Thông tin hiện ở tab “Khách hàng”.
                  </span>
                </span>
              </label>

              {draft.leadFormEnabled ? (
                <>
                  <FormField
                    name="leadFormTitle"
                    label="Tiêu đề form"
                    error={state.errors?.leadFormTitle}
                  >
                    <Input
                      id="leadFormTitle"
                      name="leadFormTitle"
                      value={draft.leadFormTitle}
                      onChange={(event) => set("leadFormTitle", event.target.value)}
                      required
                    />
                  </FormField>

                  <FormField
                    name="leadFormDescription"
                    label="Mô tả form"
                    error={state.errors?.leadFormDescription}
                  >
                    <Textarea
                      id="leadFormDescription"
                      name="leadFormDescription"
                      value={draft.leadFormDescription}
                      onChange={(event) =>
                        set("leadFormDescription", event.target.value)
                      }
                      required
                    />
                  </FormField>

                  <FormField
                    name="leadFormSubmitLabel"
                    label="Nhãn nút gửi"
                    error={state.errors?.leadFormSubmitLabel}
                  >
                    <Input
                      id="leadFormSubmitLabel"
                      name="leadFormSubmitLabel"
                      value={draft.leadFormSubmitLabel}
                      onChange={(event) =>
                        set("leadFormSubmitLabel", event.target.value)
                      }
                      required
                    />
                  </FormField>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      name="leadFormNameLabel"
                      label="Nhãn ô họ tên"
                      error={state.errors?.leadFormNameLabel}
                    >
                      <Input
                        id="leadFormNameLabel"
                        name="leadFormNameLabel"
                        value={draft.leadFormNameLabel}
                        onChange={(event) =>
                          set("leadFormNameLabel", event.target.value)
                        }
                        required
                      />
                    </FormField>

                    <FormField
                      name="leadFormPhoneLabel"
                      label="Nhãn ô số điện thoại"
                      error={state.errors?.leadFormPhoneLabel}
                    >
                      <Input
                        id="leadFormPhoneLabel"
                        name="leadFormPhoneLabel"
                        value={draft.leadFormPhoneLabel}
                        onChange={(event) =>
                          set("leadFormPhoneLabel", event.target.value)
                        }
                        required
                      />
                    </FormField>
                  </div>

                  <LeadFieldEditor
                    fields={draft.leadFormFields}
                    onChange={(fields) => set("leadFormFields", fields)}
                    error={state.errors?.leadFormFields}
                  />
                </>
              ) : (
                <>
                  <input type="hidden" name="leadFormTitle" value={draft.leadFormTitle} />
                  <input
                    type="hidden"
                    name="leadFormDescription"
                    value={draft.leadFormDescription}
                  />
                  <input
                    type="hidden"
                    name="leadFormSubmitLabel"
                    value={draft.leadFormSubmitLabel}
                  />
                  <input
                    type="hidden"
                    name="leadFormNameLabel"
                    value={draft.leadFormNameLabel}
                  />
                  <input
                    type="hidden"
                    name="leadFormPhoneLabel"
                    value={draft.leadFormPhoneLabel}
                  />
                  <input
                    type="hidden"
                    name="leadFormFields"
                    value={JSON.stringify(draft.leadFormFields)}
                  />
                </>
              )}
            </fieldset>

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

      <Card className="xl:sticky xl:top-6">
        <CardHeader>
          <CardTitle>Xem trước</CardTitle>
          <CardDescription>
            Cập nhật ngay theo cấu hình đang nhập, kể cả khi chưa bấm lưu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WidgetPreview config={draft} />
        </CardContent>
      </Card>
    </div>
  );
}
