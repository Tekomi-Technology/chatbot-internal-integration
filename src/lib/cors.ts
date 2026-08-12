const ALLOWED_METHODS = "GET, POST, OPTIONS";
const ALLOWED_HEADERS = "Content-Type, X-Api-Key";

export function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
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
