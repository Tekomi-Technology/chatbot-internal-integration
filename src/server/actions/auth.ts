"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/lib/auth";
import {
  collectValues,
  errorState,
  idleState,
  type ActionState,
} from "@/server/action-state";

/** Chỉ nhận đường dẫn nội bộ để callbackUrl không thành lỗ hổng open redirect. */
function safeCallbackUrl(value: FormDataEntryValue | null): string {
  const raw = typeof value === "string" ? value : "";
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: safeCallbackUrl(formData.get("callbackUrl")),
    });
  } catch (error) {
    // signIn thành công sẽ throw NEXT_REDIRECT — phải để nó bay lên trên.
    if (error instanceof AuthError) {
      // Giữ lại email đã nhập (không bao giờ giữ mật khẩu).
      return errorState(
        "Email hoặc mật khẩu không đúng.",
        undefined,
        collectValues(formData, ["email"]),
      );
    }
    throw error;
  }

  return idleState;
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
