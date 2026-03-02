-- ============================================================
-- Add index on api_keys.key_hash for O(1) authentication lookup
-- ============================================================
-- The track-event Edge Function authenticates every request by
-- hashing the x-api-key header and looking up the hash.
-- Without this index, every ingestion request causes a seq scan.
-- ============================================================

CREATE INDEX idx_api_keys_key_hash ON public.api_keys (key_hash);
