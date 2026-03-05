// ============================================================
// Rate Limiting via Upstash Redis REST API
// ============================================================
// Fixed-window INCR/EXPIRE with 1-second windows.
// Infra behavior is configurable via RATE_LIMIT_FAIL_OPEN.
// ============================================================

export interface RateLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  retryAfterMs: number;
  degraded: boolean;
  reason?: "rate_limited" | "infrastructure_unavailable";
}

const DEFAULT_LIMIT = 100;
const WINDOW_SIZE_S = 1;

function shouldFailOpenOnInfraError(): boolean {
  return Deno.env.get("RATE_LIMIT_FAIL_OPEN") === "true";
}

/**
 * Check rate limit for a given API key.
 * On infra failures, behavior is controlled by RATE_LIMIT_FAIL_OPEN.
 */
export async function checkRateLimit(
  apiKeyId: string,
  limit: number = DEFAULT_LIMIT,
): Promise<RateLimitResult> {
  const ALLOWED: RateLimitResult = {
    allowed: true,
    current: 0,
    limit,
    retryAfterMs: 0,
    degraded: false,
  };
  const INFRA_BLOCKED: RateLimitResult = {
    allowed: false,
    current: 0,
    limit,
    retryAfterMs: 1000,
    degraded: true,
    reason: "infrastructure_unavailable",
  };

  try {
    const redisUrl = Deno.env.get("UPSTASH_REDIS_REST_URL");
    const redisToken = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

    if (!redisUrl || !redisToken) {
      return shouldFailOpenOnInfraError() ? ALLOWED : INFRA_BLOCKED;
    }

    const now = Date.now();
    const windowKey = Math.floor(now / (WINDOW_SIZE_S * 1000));
    const redisKey = `rl:track:${apiKeyId}:${String(windowKey)}`;

    const response = await fetch(`${redisUrl}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, WINDOW_SIZE_S + 1],
      ]),
      signal: AbortSignal.timeout(1000),
    });

    if (!response.ok) {
      console.warn(`[rate-limit] Upstash returned HTTP ${String(response.status)}`);
      return shouldFailOpenOnInfraError() ? ALLOWED : INFRA_BLOCKED;
    }

    const body = (await response.json()) as Array<{
      result: number | null;
      error?: string;
    }>;

    const incrResult = body[0];
    if (!incrResult || incrResult.error) {
      console.warn(`[rate-limit] INCR error: ${incrResult?.error ?? "missing"}`);
      return shouldFailOpenOnInfraError() ? ALLOWED : INFRA_BLOCKED;
    }

    const current = incrResult.result ?? 0;

    if (current > limit) {
      const windowStartMs = windowKey * WINDOW_SIZE_S * 1000;
      const windowEndMs = windowStartMs + WINDOW_SIZE_S * 1000;
      const retryAfterMs = Math.max(windowEndMs - Date.now(), 100);

      return {
        allowed: false,
        current,
        limit,
        retryAfterMs,
        degraded: false,
        reason: "rate_limited",
      };
    }

    return {
      allowed: true,
      current,
      limit,
      retryAfterMs: 0,
      degraded: false,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown";
    console.warn(`[rate-limit] Redis check failed: ${message}`);
    return shouldFailOpenOnInfraError() ? ALLOWED : INFRA_BLOCKED;
  }
}
