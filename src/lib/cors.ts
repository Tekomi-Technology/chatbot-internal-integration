/**
 * CORS chỉ áp dụng cho `/api/widget/*`. Các route `/api/admin/*` và Server
 * Actions giữ nguyên chính sách same-origin mặc định của Next.js.
 */

const ALLOWED_METHODS = "GET, POST, OPTIONS";
const ALLOWED_HEADERS = "Content-Type, X-Api-Key";

/**
 * Với endpoint đã kiểm tra domain whitelist, echo lại đúng origin được duyệt
 * (không dùng `*`) và thêm `Vary: Origin` để CDN không cache nhầm giữa các site.
 */
export function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };

  // `/api/widget/config` chỉ trả cấu hình hiển thị công khai nên cho phép "*"
  // khi request không kèm Origin (vd gọi từ server hoặc curl).
  headers["Access-Control-Allow-Origin"] = origin ?? "*";
  return headers;
}

export function jsonWithCors(
  body: unknown,
  init: { status?: number; origin: string | null; extraHeaders?: HeadersInit },
): Response {
  return Response.json(body, {
    status: init.status ?? 200,
    headers: {
      ...corsHeaders(init.origin),
      ...Object.fromEntries(new Headers(init.extraHeaders ?? {})),
    },
  });
}

export function preflightResponse(origin: string | null): Response {
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}
