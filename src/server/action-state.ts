export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string>;
  values?: Record<string, string>;
  stamp?: number;
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
