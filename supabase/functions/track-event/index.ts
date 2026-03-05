// ============================================================
// track-event — Ingestion API for telemetry and discovery
// ============================================================
// Auth: x-api-key header (SHA-256 hashed, matched against api_keys)
// Payloads: telemetry (LLM/API events) and discovery (resources)
// Smart pricing: subscription coverage → model_pricing → unmapped
// ============================================================

import { getServiceClient } from "../_shared/supabase-client.ts";
import { corsResponse, jsonResponse, errorResponse } from "../_shared/cors.ts";
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

function parsePositiveIntEnv(name: string, fallback: number): number {
  const raw = Deno.env.get(name);
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return fallback;
}

const MAX_BATCH_SIZE = 1000;
const MAX_BODY_BYTES = parsePositiveIntEnv("MAX_INGEST_BODY_BYTES", 1_048_576);
const MAX_METADATA_BYTES = parsePositiveIntEnv("MAX_METADATA_BYTES", 16_384);
const MAX_PROVIDER_LENGTH = 64;
const MAX_MODEL_OR_ENDPOINT_LENGTH = 160;
const MAX_RESOURCE_TYPE_LENGTH = 64;
const MAX_TOKENS_PER_FIELD = 10_000_000;
const MAX_EVENT_AGE_MS = parsePositiveIntEnv("MAX_EVENT_AGE_SECONDS", 900) * 1000;
const MAX_FUTURE_SKEW_MS = parsePositiveIntEnv("MAX_FUTURE_SKEW_SECONDS", 120) * 1000;
const REQUIRE_EVENT_IDENTITY =
  (Deno.env.get("REQUIRE_EVENT_IDENTITY") ?? "true").toLowerCase() === "true";
const REQUIRE_REPLAY_REGISTRATION =
  (Deno.env.get("REQUIRE_REPLAY_REGISTRATION") ?? "true").toLowerCase() === "true";

const VALID_EVENT_TYPES: ReadonlySet<string> = new Set(["llm", "api"]);
const VALID_RESOURCE_STATUSES: ReadonlySet<string> = new Set([
  "active",
  "inactive",
  "pending",
  "error",
]);
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;

// --- Validation Helpers ---

function hasValidLength(value: string, maxLength: number): boolean {
  return value.length > 0 && value.length <= maxLength;
}

function validateMetadata(raw: unknown): ValidationResult<Record<string, unknown> | undefined> {
  if (raw === undefined) {
    return { valid: true, data: undefined };
  }

  if (typeof raw !== "object" || raw === null) {
    return { valid: false, error: "metadata must be an object if provided" };
  }

  let encoded = "";
  try {
    encoded = JSON.stringify(raw);
  } catch {
    return { valid: false, error: "metadata must be JSON-serializable" };
  }

  if (new TextEncoder().encode(encoded).length > MAX_METADATA_BYTES) {
    return {
      valid: false,
      error: `metadata exceeds ${String(MAX_METADATA_BYTES)} bytes`,
    };
  }

  return { valid: true, data: raw as Record<string, unknown> };
}

function validateIsoString(value: unknown, fieldName: string): ValidationResult<string | undefined> {
  if (value === undefined) {
    return { valid: true, data: undefined };
  }

  if (typeof value !== "string") {
    return { valid: false, error: `${fieldName} must be an ISO 8601 string if provided` };
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return { valid: false, error: `${fieldName} must be a valid ISO 8601 string` };
  }

  return { valid: true, data: value };
}

function validateIdentity(
  raw: Record<string, unknown>,
): ValidationResult<{ request_id: string; sent_at: string }> {
  const requestIdRaw = raw["request_id"];
  const sentAtRaw = raw["sent_at"];

  if (requestIdRaw === undefined || sentAtRaw === undefined) {
    if (REQUIRE_EVENT_IDENTITY) {
      return { valid: false, error: "request_id and sent_at are required" };
    }

    return {
      valid: true,
      data: {
        request_id: crypto.randomUUID(),
        sent_at: new Date().toISOString(),
      },
    };
  }

  if (typeof requestIdRaw !== "string" || !REQUEST_ID_PATTERN.test(requestIdRaw)) {
    return {
      valid: false,
      error: "request_id must match [A-Za-z0-9._:-] and be 8-128 chars",
    };
  }

  if (typeof sentAtRaw !== "string") {
    return { valid: false, error: "sent_at must be an ISO 8601 string" };
  }

  const sentAtMs = Date.parse(sentAtRaw);
  if (Number.isNaN(sentAtMs)) {
    return { valid: false, error: "sent_at must be a valid ISO 8601 string" };
  }

  const now = Date.now();
  if (now - sentAtMs > MAX_EVENT_AGE_MS) {
    return { valid: false, error: "sent_at is too old" };
  }

  if (sentAtMs - now > MAX_FUTURE_SKEW_MS) {
    return { valid: false, error: "sent_at is too far in the future" };
  }

  return {
    valid: true,
    data: {
      request_id: requestIdRaw,
      sent_at: sentAtRaw,
    },
  };
}

// --- Validation ---

function validateTelemetry(
  raw: Record<string, unknown>,
): ValidationResult<TelemetryPayload> {
  if (!VALID_EVENT_TYPES.has(raw["event_type"] as string)) {
    return { valid: false, error: "event_type must be 'llm' or 'api'" };
  }

  if (
    typeof raw["provider"] !== "string" ||
    !hasValidLength(raw["provider"], MAX_PROVIDER_LENGTH)
  ) {
    return { valid: false, error: "provider is required and must be <= 64 chars" };
  }

  if (
    typeof raw["model_or_endpoint"] !== "string" ||
    !hasValidLength(raw["model_or_endpoint"], MAX_MODEL_OR_ENDPOINT_LENGTH)
  ) {
    return {
      valid: false,
      error: "model_or_endpoint is required and must be <= 160 chars",
    };
  }

  if (
    !Number.isInteger(raw["tokens_prompt"]) ||
    (raw["tokens_prompt"] as number) < 0 ||
    (raw["tokens_prompt"] as number) > MAX_TOKENS_PER_FIELD
  ) {
    return {
      valid: false,
      error: "tokens_prompt must be a non-negative integer within limits",
    };
  }

  if (
    !Number.isInteger(raw["tokens_completion"]) ||
    (raw["tokens_completion"] as number) < 0 ||
    (raw["tokens_completion"] as number) > MAX_TOKENS_PER_FIELD
  ) {
    return {
      valid: false,
      error: "tokens_completion must be a non-negative integer within limits",
    };
  }

  const metadataResult = validateMetadata(raw["metadata"]);
  if (!metadataResult.valid) {
    return metadataResult;
  }

  const timestampResult = validateIsoString(raw["timestamp"], "timestamp");
  if (!timestampResult.valid) {
    return timestampResult;
  }

  const identityResult = validateIdentity(raw);
  if (!identityResult.valid) {
    return identityResult;
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
      metadata: metadataResult.data,
      timestamp: timestampResult.data,
      request_id: identityResult.data.request_id,
      sent_at: identityResult.data.sent_at,
    },
  };
}

function validateDiscovery(
  raw: Record<string, unknown>,
): ValidationResult<DiscoveryPayload> {
  if (
    typeof raw["resource_type"] !== "string" ||
    !hasValidLength(raw["resource_type"], MAX_RESOURCE_TYPE_LENGTH)
  ) {
    return { valid: false, error: "resource_type is required and must be <= 64 chars" };
  }

  if (
    typeof raw["provider"] !== "string" ||
    !hasValidLength(raw["provider"], MAX_PROVIDER_LENGTH)
  ) {
    return { valid: false, error: "provider is required and must be <= 64 chars" };
  }

  if (!VALID_RESOURCE_STATUSES.has(raw["status"] as string)) {
    return {
      valid: false,
      error: "status must be 'active', 'inactive', 'pending', or 'error'",
    };
  }

  const metadataResult = validateMetadata(raw["metadata"]);
  if (!metadataResult.valid) {
    return metadataResult;
  }

  const identityResult = validateIdentity(raw);
  if (!identityResult.valid) {
    return identityResult;
  }

  return {
    valid: true,
    data: {
      type: "discovery",
      resource_type: raw["resource_type"] as string,
      provider: raw["provider"] as string,
      status: raw["status"] as ResourceStatus,
      metadata: metadataResult.data,
      request_id: identityResult.data.request_id,
      sent_at: identityResult.data.sent_at,
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

  const projects = data.projects as unknown as { org_id: string };

  return {
    apiKeyId: data.id as string,
    projectId: data.project_id as string,
    orgId: projects.org_id,
  };
}

interface ReplayRegistrationResult {
  accepted: boolean;
  duplicate: boolean;
  reason?: string;
}

async function registerIngestionRequest(
  resolved: ResolvedApiKey,
  requestId: string,
  payloadCount: number,
  payloadChecksum: string,
): Promise<ReplayRegistrationResult> {
  const supabase = getServiceClient();

  const { error } = await supabase
    .from("ingest_request_log")
    .insert({
      api_key_id: resolved.apiKeyId,
      project_id: resolved.projectId,
      org_id: resolved.orgId,
      request_id: requestId,
      payload_count: payloadCount,
      payload_checksum: payloadChecksum,
      received_at: new Date().toISOString(),
    });

  if (!error) {
    return { accepted: true, duplicate: false };
  }

  if (error.code === "23505") {
    return {
      accepted: false,
      duplicate: true,
      reason: "Duplicate request_id for this API key",
    };
  }

  if (!REQUIRE_REPLAY_REGISTRATION) {
    console.warn(`[track-event] replay registration bypassed: ${error.message}`);
    return { accepted: true, duplicate: false };
  }

  return {
    accepted: false,
    duplicate: false,
    reason: `Failed replay registration: ${error.message}`,
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
    const pricingRow = row as {
      provider: string;
      model_name: string;
      prompt_price_per_1k: number;
      completion_price_per_1k: number;
    };

    const key = `${pricingRow.provider}::${pricingRow.model_name}`;
    pricingMap.set(key, {
      prompt_price_per_1k: pricingRow.prompt_price_per_1k,
      completion_price_per_1k: pricingRow.completion_price_per_1k,
    });
  }

  return pricingMap;
}

// --- Cost Calculation ---

function calculateCost(
  tokensPrompt: number,
  tokensCompletion: number,
  pricing: PricingEntry,
): number {
  return (
    (tokensPrompt / 1000.0) * pricing.prompt_price_per_1k +
    (tokensCompletion / 1000.0) * pricing.completion_price_per_1k
  );
}

function mergeIngestMetadata(
  metadata: Record<string, unknown> | undefined,
  payloadRequestId: string,
  payloadSentAt: string,
  batchRequestId: string,
): Record<string, unknown> {
  return {
    ...(metadata ?? {}),
    _ingest: {
      request_id: payloadRequestId,
      sent_at: payloadSentAt,
      batch_request_id: batchRequestId,
    },
  };
}

// --- Main Handler ---

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return corsResponse(req);
  }

  if (req.method !== "POST") {
    return errorResponse(405, "Method not allowed", undefined, req);
  }

  try {
    const rawApiKey = req.headers.get("x-api-key");
    if (!rawApiKey) {
      return errorResponse(401, "Missing x-api-key header", undefined, req);
    }

    const resolved = await authenticateApiKey(rawApiKey);
    if (!resolved) {
      return errorResponse(401, "Invalid or revoked API key", undefined, req);
    }

    const rateCheck = await checkRateLimit(resolved.apiKeyId);
    if (!rateCheck.allowed) {
      if (rateCheck.reason === "infrastructure_unavailable") {
        return errorResponse(
          503,
          "Rate limiting infrastructure unavailable",
          { retry_after_ms: rateCheck.retryAfterMs },
          req,
          { "Retry-After": "1" },
        );
      }

      const retryAfterS = Math.max(Math.ceil(rateCheck.retryAfterMs / 1000), 1);
      return errorResponse(
        429,
        "Rate limit exceeded",
        {
          limit: rateCheck.limit,
          current: rateCheck.current,
          retry_after_ms: rateCheck.retryAfterMs,
        },
        req,
        { "Retry-After": String(retryAfterS) },
      );
    }

    const headerRequestId = req.headers.get("x-request-id");
    if (headerRequestId && !REQUEST_ID_PATTERN.test(headerRequestId)) {
      return errorResponse(400, "Invalid x-request-id format", undefined, req);
    }

    const headerRequestTimestamp = req.headers.get("x-request-timestamp");
    if (headerRequestTimestamp) {
      const parsedTimestamp = Date.parse(headerRequestTimestamp);
      if (Number.isNaN(parsedTimestamp)) {
        return errorResponse(400, "Invalid x-request-timestamp", undefined, req);
      }

      const now = Date.now();
      if (now - parsedTimestamp > MAX_EVENT_AGE_MS || parsedTimestamp - now > MAX_FUTURE_SKEW_MS) {
        return errorResponse(400, "x-request-timestamp is outside allowed window", undefined, req);
      }
    }

    const rawBodyText = await req.text();
    if (rawBodyText.length === 0) {
      return errorResponse(400, "Request body is required", undefined, req);
    }

    const bodySize = new TextEncoder().encode(rawBodyText).length;
    if (bodySize > MAX_BODY_BYTES) {
      return errorResponse(
        413,
        `Request body exceeds ${String(MAX_BODY_BYTES)} bytes`,
        undefined,
        req,
      );
    }

    let rawBody: unknown;
    try {
      rawBody = JSON.parse(rawBodyText);
    } catch {
      return errorResponse(400, "Invalid JSON body", undefined, req);
    }

    const payloads: unknown[] = Array.isArray(rawBody) ? rawBody : [rawBody];

    if (payloads.length === 0) {
      return errorResponse(400, "Request body must contain at least one event", undefined, req);
    }

    if (payloads.length > MAX_BATCH_SIZE) {
      return errorResponse(
        400,
        `Batch size exceeds maximum of ${MAX_BATCH_SIZE} events`,
        undefined,
        req,
      );
    }

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
      return errorResponse(400, "Validation failed", validationErrors, req);
    }

    const payloadChecksum = await hashApiKey(rawBodyText);
    const batchRequestId = headerRequestId ?? `body-${payloadChecksum.slice(0, 48)}`;

    const replayRegistration = await registerIngestionRequest(
      resolved,
      batchRequestId,
      payloads.length,
      payloadChecksum,
    );

    if (!replayRegistration.accepted) {
      if (replayRegistration.duplicate) {
        return errorResponse(
          409,
          "Duplicate request rejected",
          { request_id: batchRequestId },
          req,
        );
      }

      return errorResponse(503, "Request replay check unavailable", replayRegistration.reason, req);
    }

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
        telemetryItems.push({ index: item.index, payload: item.payload });
      } else {
        discoveryItems.push({ index: item.index, payload: item.payload });
      }
    }

    const results: TrackEventResult[] = [...validationErrors];
    const supabase = getServiceClient();

    if (telemetryItems.length > 0) {
      const coveredProviders = await getCoveredProviders(resolved.orgId, resolved.projectId);

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

      const pricingMap = await getPricingMap(Array.from(uncoveredPairs.values()));

      const telemetryRows: TransactionalEventInsert[] = [];
      const telemetryIndexMap: number[] = [];

      for (const item of telemetryItems) {
        const { payload } = item;
        const pricingKey = `${payload.provider}::${payload.model_or_endpoint}`;

        let costIncurred = 0;
        let billingMode: "metered" | "subscription_covered" = "metered";
        let isUnmapped = false;

        if (coveredProviders.has(payload.provider)) {
          costIncurred = 0;
          billingMode = "subscription_covered";
        } else {
          const pricing = pricingMap.get(pricingKey);
          if (pricing) {
            costIncurred = calculateCost(
              payload.tokens_prompt,
              payload.tokens_completion,
              pricing,
            );
          } else {
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
          metadata: mergeIngestMetadata(
            payload.metadata,
            payload.request_id,
            payload.sent_at,
            batchRequestId,
          ),
        });
        telemetryIndexMap.push(item.index);
      }

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
          metadata: mergeIngestMetadata(
            payload.metadata,
            payload.request_id,
            payload.sent_at,
            batchRequestId,
          ),
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

    supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", resolved.apiKeyId)
      .then(() => {})
      .catch(() => {});

    const processed = results.filter((result) => result.status === "ok").length;
    const errors = results.filter((result) => result.status === "error").length;

    results.sort((a, b) => a.index - b.index);

    return jsonResponse(
      {
        success: true,
        processed,
        errors,
        request_id: batchRequestId,
        results,
      },
      200,
      req,
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("track-event unexpected error:", message);
    return errorResponse(500, "Internal server error", undefined, req);
  }
});
