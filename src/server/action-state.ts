/** Kiểu trả về chung cho mọi Server Action dùng với `useActionState`. */
export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  /** Lỗi theo từng field, key trùng tên input trong form. */
  errors?: Record<string, string>;
  /**
   * Giá trị người dùng vừa nhập, echo lại khi có lỗi.
   *
   * React 19 tự gọi form.reset() sau mỗi form action, nên input không kiểm soát
   * sẽ mất sạch nội dung khi validate hỏng. Form đọc lại từ đây làm defaultValue
   * và dùng `stamp` làm key để remount input với giá trị mới.
   */
  values?: Record<string, string>;
  /** Đổi sau mỗi lần submit lỗi; dùng làm React key để ép remount input. */
  stamp?: number;
  /** Dữ liệu phụ trả kèm khi thành công, ví dụ API key vừa sinh. */
  data?: Record<string, string>;
};

export const idleState: ActionState = { status: "idle" };

export function errorState(
  message: string,
  errors?: Record<string, string>,
  values?: Record<string, string>,
): ActionState {
  return { status: "error", message, errors, values, stamp: Date.now() };
}

export function successState(
  message: string,
  data?: Record<string, string>,
): ActionState {
  return { status: "success", message, data, stamp: Date.now() };
}

/**
 * Gom các field text của form thành map string, bỏ qua field nhạy cảm.
 * Không bao giờ echo lại mật khẩu hay API key.
 */
export function collectValues(
  formData: FormData,
  fields: readonly string[],
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of fields) {
    const value = formData.get(field);
    if (typeof value === "string") values[field] = value;
  }
  return values;
}
