-- ============================================================
-- Daily Usage Rollups — Aggregation & Lifecycle Migration
-- ============================================================
-- Creates the daily_usage_rollups table for pre-aggregated metrics,
-- a rollup_old_data() function to compact transactional_events older
-- than 30 days, and a pg_cron schedule to run it nightly at 02:00 UTC.
-- ============================================================

-- ============================================================
-- 0. Extensions
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================
-- 1. Table: daily_usage_rollups
-- ============================================================

CREATE TABLE public.daily_usage_rollups (
  project_id              UUID           NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  date                    DATE           NOT NULL,
  provider                TEXT           NOT NULL,
  model_or_endpoint       TEXT           NOT NULL,
  event_type              TEXT           NOT NULL CHECK (event_type IN ('llm', 'api')),
  total_cost              NUMERIC(20,10) NOT NULL DEFAULT 0,
  total_tokens_prompt     BIGINT         NOT NULL DEFAULT 0,
  total_tokens_completion BIGINT         NOT NULL DEFAULT 0,
  event_count             INTEGER        NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ    NOT NULL DEFAULT now(),

  PRIMARY KEY (project_id, date, provider, model_or_endpoint, event_type)
);

CREATE TRIGGER trg_daily_usage_rollups_updated_at
  BEFORE UPDATE ON public.daily_usage_rollups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 2. Indexes
-- ============================================================

-- Date-range scans for the rollup function and admin queries
CREATE INDEX idx_daily_usage_rollups_date
  ON public.daily_usage_rollups (date);

-- Per-provider breakdown queries on the dashboard
CREATE INDEX idx_daily_usage_rollups_project_provider
  ON public.daily_usage_rollups (project_id, provider);

-- ============================================================
-- 3. Row Level Security
-- ============================================================

ALTER TABLE public.daily_usage_rollups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view rollups in their orgs"
  ON public.daily_usage_rollups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      JOIN public.org_members ON org_members.org_id = projects.org_id
      WHERE projects.id = daily_usage_rollups.project_id
        AND org_members.user_id = auth.uid()
    )
  );

-- No INSERT/UPDATE/DELETE policies — writes only via SECURITY DEFINER function.

-- ============================================================
-- 4. Function: rollup_old_data()
-- ============================================================

CREATE OR REPLACE FUNCTION public.rollup_old_data()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff_date DATE;
  v_deleted_count INTEGER := 0;
BEGIN
  -- Events on the cutoff date itself are retained (< 30 full days old).
  v_cutoff_date := (now() - INTERVAL '30 days')::date;

  -- Step 1: Aggregate eligible events into daily_usage_rollups.
  -- ON CONFLICT DO UPDATE adds to existing totals for idempotency.
  INSERT INTO public.daily_usage_rollups (
    project_id,
    date,
    provider,
    model_or_endpoint,
    event_type,
    total_cost,
    total_tokens_prompt,
    total_tokens_completion,
    event_count
  )
  SELECT
    te.project_id,
    te.timestamp::date        AS date,
    te.provider,
    te.model_or_endpoint,
    te.event_type,
    SUM(te.cost_incurred)     AS total_cost,
    SUM(te.tokens_prompt)     AS total_tokens_prompt,
    SUM(te.tokens_completion) AS total_tokens_completion,
    COUNT(*)::integer         AS event_count
  FROM public.transactional_events te
  WHERE te.timestamp::date < v_cutoff_date
    AND te.is_unmapped = false
  GROUP BY
    te.project_id,
    te.timestamp::date,
    te.provider,
    te.model_or_endpoint,
    te.event_type
  ON CONFLICT (project_id, date, provider, model_or_endpoint, event_type)
  DO UPDATE SET
    total_cost              = daily_usage_rollups.total_cost              + EXCLUDED.total_cost,
    total_tokens_prompt     = daily_usage_rollups.total_tokens_prompt     + EXCLUDED.total_tokens_prompt,
    total_tokens_completion = daily_usage_rollups.total_tokens_completion + EXCLUDED.total_tokens_completion,
    event_count             = daily_usage_rollups.event_count             + EXCLUDED.event_count,
    updated_at              = now();

  -- Step 2: Delete the raw events that were just aggregated.
  -- Unmapped events (is_unmapped = true) are preserved for future backfill.
  DELETE FROM public.transactional_events
  WHERE timestamp::date < v_cutoff_date
    AND is_unmapped = false;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$;

-- ============================================================
-- 5. Grants
-- ============================================================

GRANT SELECT ON public.daily_usage_rollups TO authenticated;
GRANT EXECUTE ON FUNCTION public.rollup_old_data() TO authenticated;

-- ============================================================
-- 6. pg_cron Schedule — daily at 02:00 UTC
-- ============================================================

SELECT cron.schedule(
  'nightly-rollup-old-events',
  '0 2 * * *',
  $$SELECT public.rollup_old_data()$$
);
