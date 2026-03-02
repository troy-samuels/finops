// ============================================================
// track-event — Ingestion API for telemetry and discovery
// ============================================================
// Auth: x-api-key header (SHA-256 hashed, matched against api_keys)
// Payloads: telemetry (LLM/API events) and discovery (resources)
// Smart pricing: subscription coverage → model_pricing → unmapped
// ============================================================

import { getServiceClient } from "../_shared/supabase-client.ts";
import { CORS_HEADERS, corsResponse, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { hashApiKey } from "../_shared/crypto.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import type {
  ResolvedApiKey,
  TelemetryPayload,
  DiscoveryPayload,
  TrackEventPayload,
  TrackEventResult,
  TransactionalEventInsert,
  DiscoveredResourceInsert,
  ValidationResult,
  EventType,
  ResourceStatus,
} from "../_shared/types.ts";

// --- Constants ---

const MAX_BATCH_SIZE = 1000;
const VALID_EVENT_TYPES: ReadonlySet<string> = new Set(["llm", "api"]);
const VALID_RESOURCE_STATUSES: ReadonlySet<string> = new Set([
  "active",
  "inactive",
  "pending",
  "error",
]);

// --- Validation ---

function validateTelemetry(
  raw: Record<string, unknown>,
): ValidationResult<TelemetryPayload> {
  if (!VALID_EVENT_TYPES.has(raw["event_type"] as string)) {
    return { valid: false, error: "event_type must be 'llm' or 'api'" };
  }
  if (typeof raw["provider"] !== "string" || raw["provider"] === "") {
    return { valid: false, error: "provider is required" };
  }
  if (
    typeof raw["model_or_endpoint"] !== "string" ||
    raw["model_or_endpoint"] === ""
  ) {
    return { valid: false, error: "model_or_endpoint is required" };
  }
  if (
    !Number.isInteger(raw["tokens_prompt"]) ||
    (raw["tokens_prompt"] as number) < 0
  ) {
    return {
      valid: false,
      error: "tokens_prompt must be a non-negative integer",
    };
  }
  if (
    !Number.isInteger(raw["tokens_completion"]) ||
    (raw["tokens_completion"] as number) < 0
  ) {
    return {
      valid: false,
      error: "tokens_completion must be a non-negative integer",
    };
  }
  if (
    raw["metadata"] !== undefined &&
    (typeof raw["metadata"] !== "object" || raw["metadata"] === null)
  ) {
    return { valid: false, error: "metadata must be an object if provided" };
  }
  if (raw["timestamp"] !== undefined && typeof raw["timestamp"] !== "string") {
    return {
      valid: false,
      error: "timestamp must be an ISO 8601 string if provided",
    };
  }

  return {
    valid: true,
    data: {
      type: "telemetry",
      event_type: raw["event_type"] as EventType,
      provider: raw["provider"] as string,
      model_or_endpoint: raw["model_or_endpoint"] as string,
      tokens_prompt: raw["tokens_prompt"] as number,
      tokens_completion: raw["tokens_completion"] as number,
      metadata: raw["metadata"] as Record<string, unknown> | undefined,
      timestamp: raw["timestamp"] as string | undefined,
    },
  };
}

function validateDiscovery(
  raw: Record<string, unknown>,
): ValidationResult<DiscoveryPayload> {
  if (typeof raw["resource_type"] !== "string" || raw["resource_type"] === "") {
    return { valid: false, error: "resource_type is required" };
  }
  if (typeof raw["provider"] !== "string" || raw["provider"] === "") {
    return { valid: false, error: "provider is required" };
  }
  if (!VALID_RESOURCE_STATUSES.has(raw["status"] as string)) {
    return {
      valid: false,
      error: "status must be 'active', 'inactive', 'pending', or 'error'",
    };
  }
  if (
    raw["metadata"] !== undefined &&
    (typeof raw["metadata"] !== "object" || raw["metadata"] === null)
  ) {
    return { valid: false, error: "metadata must be an object if provided" };
  }

  return {
    valid: true,
    data: {
      type: "discovery",
      resource_type: raw["resource_type"] as string,
      provider: raw["provider"] as string,
      status: raw["status"] as ResourceStatus,
      metadata: raw["metadata"] as Record<string, unknown> | undefined,
    },
  };
}

function validatePayload(
  raw: unknown,
): ValidationResult<TrackEventPayload> {
  if (typeof raw !== "object" || raw === null) {
    return { valid: false, error: "Event must be an object" };
  }

  const obj = raw as Record<string, unknown>;
  const payloadType = obj["type"];

  if (payloadType === "telemetry") {
    return validateTelemetry(obj);
  }
  if (payloadType === "discovery") {
    return validateDiscovery(obj);
  }

  return { valid: false, error: "type must be 'telemetry' or 'discovery'" };
}

// --- API Key Authentication ---

async function authenticateApiKey(
  rawKey: string,
): Promise<ResolvedApiKey | null> {
  const supabase = getServiceClient();
  const hashedKey = await hashApiKey(rawKey);

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, project_id, projects!inner(org_id)")
    .eq("key_hash", hashedKey)
    .is("revoked_at", null)
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  // Extract org_id from the joined projects row
  const projects = data.projects as unknown as { org_id: string };

  return {
    apiKeyId: data.id as string,
    projectId: data.project_id as string,
    orgId: projects.org_id,
  };
}

// --- Subscription Coverage Check ---

async function getCoveredProviders(
  orgId: string,
  projectId: string,
): Promise<Set<string>> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("recurring_subscriptions")
    .select("provider")
    .eq("org_id", orgId)
    .eq("covers_metered_usage", true)
    .or(
      `and(scope.eq.organization,project_id.is.null),and(scope.eq.project,project_id.eq.${projectId})`,
    );

  if (error || !data) {
    return new Set();
  }

  return new Set(data.map((row) => (row as { provider: string }).provider));
}

// --- Model Pricing Lookup ---

interface PricingEntry {
  prompt_price_per_1k: number;
  completion_price_per_1k: number;
}

async function getPricingMap(
  providerModelPairs: ReadonlyArray<{ provider: string; model: string }>,
): Promise<Map<string, PricingEntry>> {
  const pricingMap = new Map<string, PricingEntry>();

  if (providerModelPairs.length === 0) {
    return pricingMap;
  }

  const supabase = getServiceClient();

  // Build OR filter for each unique (provider, model_name) pair
  const orClauses = providerModelPairs
    .map(
      (pair) =>
        `and(provider.eq.${pair.provider},model_name.eq.${pair.model})`,
    )
    .join(",");

  const { data, error } = await supabase
    .from("model_pricing")
    .select("provider, model_name, prompt_price_per_1k, completion_price_per_1k")
    .or(orClauses);

  if (error || !data) {
    return pricingMap;
  }

  for (const row of data) {
    const r = row as {
      provider: string;
      model_name: string;
      prompt_price_per_1k: number;
      completion_price_per_1k: number;
    };
    const key = `${r.provider}::${r.model_name}`;
    pricingMap.set(key, {
      prompt_price_per_1k: r.prompt_price_per_1k,
      completion_price_per_1k: r.completion_price_per_1k,
    });
  }

  return pricingMap;
}

// --- Cost Calculation ---

function calculateCost(
  tokens_prompt: number,
  tokens_completion: number,
  pricing: PricingEntry,
): number {
  return (
    (tokens_prompt / 1000.0) * pricing.prompt_price_per_1k +
    (tokens_completion / 1000.0) * pricing.completion_price_per_1k
  );
}

// --- Main Handler ---

Deno.serve(async (req: Request): Promise<Response> => {
  // Step 1: CORS preflight
  if (req.method === "OPTIONS") {
    return corsResponse();
  }

  // Step 2: Method check
  if (req.method !== "POST") {
    return errorResponse(405, "Method not allowed");
  }

  try {
    // Step 3: Authenticate
    const rawApiKey = req.headers.get("x-api-key");
    if (!rawApiKey) {
      return errorResponse(401, "Missing x-api-key header");
    }

    const resolved = await authenticateApiKey(rawApiKey);
    if (!resolved) {
      return errorResponse(401, "Invalid or revoked API key");
    }

    // Step 3b: Rate limit (per authenticated API key)
    const rateCheck = await checkRateLimit(resolved.apiKeyId);
    if (!rateCheck.allowed) {
      const retryAfterS = Math.max(Math.ceil(rateCheck.retryAfterMs / 1000), 1);
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          limit: rateCheck.limit,
          current: rateCheck.current,
          retry_after_ms: rateCheck.retryAfterMs,
        }),
        {
          status: 429,
          headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/json",
            "Retry-After": String(retryAfterS),
          },
        },
      );
    }

    // Step 4: Parse and validate body
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return errorResponse(400, "Invalid JSON body");
    }

    // Normalize to array
    const payloads: unknown[] = Array.isArray(rawBody) ? rawBody : [rawBody];

    if (payloads.length === 0) {
      return errorResponse(
        400,
        "Request body must contain at least one event",
      );
    }
    if (payloads.length > MAX_BATCH_SIZE) {
      return errorResponse(
        400,
        `Batch size exceeds maximum of ${MAX_BATCH_SIZE} events`,
      );
    }

    // Validate all payloads
    const validated: Array<{
      index: number;
      payload: TrackEventPayload;
    }> = [];
    const validationErrors: TrackEventResult[] = [];

    for (let i = 0; i < payloads.length; i++) {
      const result = validatePayload(payloads[i]);
      if (result.valid) {
        validated.push({ index: i, payload: result.data });
      } else {
        validationErrors.push({ index: i, status: "error", error: result.error });
      }
    }

    if (validated.length === 0 && validationErrors.length > 0) {
      return errorResponse(400, "Validation failed", validationErrors);
    }

    // Separate telemetry and discovery payloads
    const telemetryItems: Array<{
      index: number;
      payload: TelemetryPayload;
    }> = [];
    const discoveryItems: Array<{
      index: number;
      payload: DiscoveryPayload;
    }> = [];

    for (const item of validated) {
      if (item.payload.type === "telemetry") {
        telemetryItems.push({
          index: item.index,
          payload: item.payload,
        });
      } else {
        discoveryItems.push({
          index: item.index,
          payload: item.payload,
        });
      }
    }

    const results: TrackEventResult[] = [...validationErrors];
    const supabase = getServiceClient();

    // Step 5: Process telemetry events
    if (telemetryItems.length > 0) {
      // 5a: Batch subscription coverage check
      const coveredProviders = await getCoveredProviders(
        resolved.orgId,
        resolved.projectId,
      );

      // 5b: Batch pricing lookup for uncovered providers
      const uncoveredPairs = new Map<string, { provider: string; model: string }>();
      for (const item of telemetryItems) {
        if (!coveredProviders.has(item.payload.provider)) {
          const key = `${item.payload.provider}::${item.payload.model_or_endpoint}`;
          if (!uncoveredPairs.has(key)) {
            uncoveredPairs.set(key, {
              provider: item.payload.provider,
              model: item.payload.model_or_endpoint,
            });
          }
        }
      }

      const pricingMap = await getPricingMap(
        Array.from(uncoveredPairs.values()),
      );

      // 5c: Build insert rows
      const telemetryRows: TransactionalEventInsert[] = [];
      const telemetryIndexMap: number[] = [];

      for (const item of telemetryItems) {
        const { payload } = item;
        const pricingKey = `${payload.provider}::${payload.model_or_endpoint}`;

        let costIncurred = 0;
        let billingMode: "metered" | "subscription_covered" = "metered";
        let isUnmapped = false;

        if (coveredProviders.has(payload.provider)) {
          // Subscription covers this provider
          costIncurred = 0;
          billingMode = "subscription_covered";
        } else {
          const pricing = pricingMap.get(pricingKey);
          if (pricing) {
            // Calculate from model_pricing
            costIncurred = calculateCost(
              payload.tokens_prompt,
              payload.tokens_completion,
              pricing,
            );
          } else {
            // Model not in pricing table — mark as unmapped
            isUnmapped = true;
          }
        }

        telemetryRows.push({
          project_id: resolved.projectId,
          timestamp: payload.timestamp ?? new Date().toISOString(),
          event_type: payload.event_type,
          provider: payload.provider,
          model_or_endpoint: payload.model_or_endpoint,
          cost_incurred: costIncurred,
          tokens_prompt: payload.tokens_prompt,
          tokens_completion: payload.tokens_completion,
          billing_mode: billingMode,
          is_unmapped: isUnmapped,
          metadata: payload.metadata ?? {},
        });
        telemetryIndexMap.push(item.index);
      }

      // 5d: Batch insert
      const { data: insertedEvents, error: insertError } = await supabase
        .from("transactional_events")
        .insert(telemetryRows)
        .select("id");

      if (insertError) {
        for (const idx of telemetryIndexMap) {
          results.push({
            index: idx,
            status: "error",
            error: `Insert failed: ${insertError.message}`,
          });
        }
      } else if (insertedEvents) {
        for (let i = 0; i < insertedEvents.length; i++) {
          const inserted = insertedEvents[i] as { id: string };
          results.push({
            index: telemetryIndexMap[i] ?? i,
            status: "ok",
            id: inserted.id,
          });
        }
      }
    }

    // Step 6: Process discovery events
    if (discoveryItems.length > 0) {
      const discoveryRows: DiscoveredResourceInsert[] = [];
      const discoveryIndexMap: number[] = [];

      for (const item of discoveryItems) {
        const { payload } = item;
        discoveryRows.push({
          project_id: resolved.projectId,
          resource_type: payload.resource_type,
          provider: payload.provider,
          status: payload.status,
          metadata: payload.metadata ?? {},
        });
        discoveryIndexMap.push(item.index);
      }

      const { data: insertedResources, error: insertError } = await supabase
        .from("discovered_resources")
        .insert(discoveryRows)
        .select("id");

      if (insertError) {
        for (const idx of discoveryIndexMap) {
          results.push({
            index: idx,
            status: "error",
            error: `Insert failed: ${insertError.message}`,
          });
        }
      } else if (insertedResources) {
        for (let i = 0; i < insertedResources.length; i++) {
          const inserted = insertedResources[i] as { id: string };
          results.push({
            index: discoveryIndexMap[i] ?? i,
            status: "ok",
            id: inserted.id,
          });
        }
      }
    }

    // Step 7: Fire-and-forget last_used_at update
    supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", resolved.apiKeyId)
      .then(() => {})
      .catch(() => {});

    // Step 8: Return results
    const processed = results.filter((r) => r.status === "ok").length;
    const errors = results.filter((r) => r.status === "error").length;

    // Sort results by original index
    results.sort((a, b) => a.index - b.index);

    return jsonResponse({
      success: true,
      processed,
      errors,
      results,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    console.error("track-event unexpected error:", message);
    return errorResponse(500, "Internal server error");
  }
});
