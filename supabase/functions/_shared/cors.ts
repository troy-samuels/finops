// ============================================================
// CORS headers and response helpers for Edge Functions
// ============================================================

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key, Authorization",
  "Access-Control-Max-Age": "86400",
};

export function corsResponse(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export function jsonResponse(body: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

export function errorResponse(
  status: number,
  error: string,
  details?: unknown,
): Response {
  const body: Record<string, unknown> = { error };
  if (details !== undefined) {
    body["details"] = details;
  }
  return jsonResponse(body, status);
}
