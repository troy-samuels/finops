// ============================================================
// CORS headers and response helpers for Edge Functions
// ============================================================

const DEFAULT_ALLOWED_HEADERS =
  "Content-Type, x-api-key, Authorization, x-request-id, x-request-timestamp";
const DEFAULT_ALLOWED_METHODS = "POST, OPTIONS";
const DEFAULT_MAX_AGE = "86400";

function parseAllowedOrigins(): string[] {
  const raw = Deno.env.get("ALLOWED_ORIGINS");
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function resolveAllowedOrigin(req?: Request): string {
  const allowedOrigins = parseAllowedOrigins();
  if (allowedOrigins.includes("*")) {
    return "*";
  }

  const requestOrigin = req?.headers.get("origin");
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }

  // Non-browser clients typically do not send Origin. Keep the
  // default restrictive when no explicit allowlist is configured.
  return allowedOrigins[0] ?? "null";
}

function buildCorsHeaders(req?: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
    "Access-Control-Allow-Methods": DEFAULT_ALLOWED_METHODS,
    "Access-Control-Allow-Headers": DEFAULT_ALLOWED_HEADERS,
    "Access-Control-Max-Age": DEFAULT_MAX_AGE,
    Vary: "Origin",
  };
}

export function corsResponse(req?: Request): Response {
  return new Response(null, { status: 204, headers: buildCorsHeaders(req) });
}

export function jsonResponse(
  body: unknown,
  status: number = 200,
  req?: Request,
  extraHeaders?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...buildCorsHeaders(req),
      "Content-Type": "application/json",
      ...(extraHeaders ?? {}),
    },
  });
}

export function errorResponse(
  status: number,
  error: string,
  details?: unknown,
  req?: Request,
  extraHeaders?: Record<string, string>,
): Response {
  const body: Record<string, unknown> = { error };
  if (details !== undefined) {
    body["details"] = details;
  }
  return jsonResponse(body, status, req, extraHeaders);
}
