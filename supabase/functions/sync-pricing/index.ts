// ============================================================
// sync-pricing — Daily cron to fetch LLM pricing from OpenRouter,
// upsert into model_pricing, and backfill unmapped costs.
// ============================================================
// Auth: Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
// Source: https://openrouter.ai/api/v1/models
// ============================================================

import { getServiceClient } from "../_shared/supabase-client.ts";
import { jsonResponse, errorResponse } from "../_shared/cors.ts";
import type {
  OpenRouterResponse,
  ModelPricingUpsert,
} from "../_shared/types.ts";

// --- Constants ---

const OPENROUTER_URL = "https://openrouter.ai/api/v1/models";
const FETCH_TIMEOUT_MS = 30_000;

// --- Authorization ---

function isAuthorized(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return false;

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey) return false;

  // Accept "Bearer <key>" format
  const token = authHeader.replace(/^Bearer\s+/i, "");
  return token === serviceKey;
}

// --- OpenRouter Fetch & Parse ---

async function fetchOpenRouterModels(): Promise<{
  models: ModelPricingUpsert[];
  totalFetched: number;
  skipped: number;
}> {
  const response = await fetch(OPENROUTER_URL, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(
      `OpenRouter returned status ${response.status}: ${response.statusText}`,
    );
  }

  const body = (await response.json()) as OpenRouterResponse;

  if (!body.data || !Array.isArray(body.data)) {
    throw new Error("OpenRouter response missing 'data' array");
  }

  const models: ModelPricingUpsert[] = [];
  let skipped = 0;

  for (const model of body.data) {
    // Skip if pricing is missing
    if (!model.pricing?.prompt || !model.pricing?.completion) {
      skipped++;
      continue;
    }

    const promptPerToken = parseFloat(model.pricing.prompt);
    const completionPerToken = parseFloat(model.pricing.completion);

    // Skip if pricing is zero or invalid
    if (
      isNaN(promptPerToken) ||
      isNaN(completionPerToken) ||
      (promptPerToken === 0 && completionPerToken === 0)
    ) {
      skipped++;
      continue;
    }

    // Split "provider/model-name" on first "/" only
    const slashIndex = model.id.indexOf("/");
    if (slashIndex === -1) {
      skipped++;
      continue;
    }

    const provider = model.id.substring(0, slashIndex);
    const modelName = model.id.substring(slashIndex + 1);

    if (!provider || !modelName) {
      skipped++;
      continue;
    }

    models.push({
      provider,
      model_name: modelName,
      prompt_price_per_1k: promptPerToken * 1000,
      completion_price_per_1k: completionPerToken * 1000,
    });
  }

  return {
    models,
    totalFetched: body.data.length,
    skipped,
  };
}

// --- Main Handler ---

Deno.serve(async (req: Request): Promise<Response> => {
  // CORS preflight (not typical for cron, but harmless)
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  try {
    // Step 1: Authorize
    if (!isAuthorized(req)) {
      return errorResponse(401, "Unauthorized", undefined, req);
    }

    // Step 2: Fetch from OpenRouter
    let fetchResult: Awaited<ReturnType<typeof fetchOpenRouterModels>>;
    try {
      fetchResult = await fetchOpenRouterModels();
    } catch (fetchErr: unknown) {
      const message =
        fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      console.error("OpenRouter fetch failed:", message);
      return errorResponse(
        502,
        "Failed to fetch pricing from OpenRouter",
        { cause: message },
        req,
      );
    }

    const { models, totalFetched, skipped } = fetchResult;

    if (models.length === 0) {
      return jsonResponse(
        {
          success: true,
          models_fetched: totalFetched,
          models_skipped: skipped,
          models_upserted: 0,
          backfill_updated: 0,
        },
        200,
        req,
      );
    }

    // Step 3: Upsert into model_pricing
    const supabase = getServiceClient();

    const { error: upsertError, count } = await supabase
      .from("model_pricing")
      .upsert(models, {
        onConflict: "provider,model_name",
        ignoreDuplicates: false,
        count: "exact",
      });

    if (upsertError) {
      console.error("model_pricing upsert failed:", upsertError.message);
      return errorResponse(
        500,
        "Failed to upsert model pricing",
        { message: upsertError.message },
        req,
      );
    }

    // Step 4: Backfill unmapped costs
    let backfillCount = 0;
    const { data: backfillData, error: backfillError } =
      await supabase.rpc("backfill_unmapped_costs");

    if (backfillError) {
      // Log but don't fail — pricing was already updated successfully
      console.error("Backfill RPC failed:", backfillError.message);
      backfillCount = -1; // Signal partial failure
    } else {
      backfillCount = (backfillData as number | null) ?? 0;
    }

    // Step 5: Return summary
    return jsonResponse(
      {
        success: true,
        models_fetched: totalFetched,
        models_skipped: skipped,
        models_upserted: count ?? models.length,
        backfill_updated: backfillCount,
      },
      200,
      req,
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    console.error("sync-pricing unexpected error:", message);
    return errorResponse(500, "Internal server error", undefined, req);
  }
});
