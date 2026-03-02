-- ============================================================
-- FinOps Tracker — Foundation Schema Migration
-- ============================================================
-- Creates the full multi-tenant schema: organizations, projects,
-- API keys, model pricing registry, recurring subscriptions,
-- transactional events, and discovered resources.
-- Includes RLS policies, indexes, and RPC functions.
-- ============================================================

-- ============================================================
-- 0. Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. Utility: auto-update updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 2. Tables (in FK-dependency order)
-- ============================================================

-- 2a. organizations
CREATE TABLE public.organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2b. org_members (auth mapping for RLS)
CREATE TABLE public.org_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL,  -- maps to auth.users(id); no cross-schema FK
  role        TEXT NOT NULL DEFAULT 'member'
                CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (org_id, user_id)
);

-- 2c. projects
CREATE TABLE public.projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (org_id, slug)
);

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2d. api_keys
CREATE TABLE public.api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  label         TEXT NOT NULL DEFAULT 'default',
  key_hash      TEXT NOT NULL,  -- store hash only, never plaintext
  last_used_at  TIMESTAMPTZ,
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2e. model_pricing (global registry)
CREATE TABLE public.model_pricing (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider                 TEXT NOT NULL,
  model_name               TEXT NOT NULL,
  prompt_price_per_1k      NUMERIC(20,10) NOT NULL,
  completion_price_per_1k  NUMERIC(20,10) NOT NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (provider, model_name)
);

CREATE TRIGGER trg_model_pricing_updated_at
  BEFORE UPDATE ON public.model_pricing
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2f. recurring_subscriptions
CREATE TABLE public.recurring_subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id            UUID REFERENCES public.projects(id) ON DELETE CASCADE,  -- NULL = org-wide
  provider              TEXT NOT NULL,
  monthly_cost          NUMERIC(20,10) NOT NULL,
  scope                 TEXT NOT NULL CHECK (scope IN ('organization', 'project')),
  covers_metered_usage  BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Integrity: scope must match project_id presence
  CONSTRAINT chk_scope_project_consistency
    CHECK (
      (scope = 'organization' AND project_id IS NULL)
      OR
      (scope = 'project' AND project_id IS NOT NULL)
    )
);

CREATE TRIGGER trg_recurring_subscriptions_updated_at
  BEFORE UPDATE ON public.recurring_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2g. transactional_events (high-volume, append-mostly)
CREATE TABLE public.transactional_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  timestamp           TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type          TEXT NOT NULL CHECK (event_type IN ('llm', 'api')),
  provider            TEXT NOT NULL,
  model_or_endpoint   TEXT NOT NULL,
  cost_incurred       NUMERIC(20,10) NOT NULL DEFAULT 0,
  tokens_prompt       INTEGER NOT NULL DEFAULT 0,
  tokens_completion   INTEGER NOT NULL DEFAULT 0,
  billing_mode        TEXT NOT NULL DEFAULT 'metered'
                        CHECK (billing_mode IN ('metered', 'subscription_covered')),
  is_unmapped         BOOLEAN NOT NULL DEFAULT false,
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- No updated_at trigger — append-mostly table. Mutations only via backfill RPC.

-- 2h. discovered_resources
CREATE TABLE public.discovered_resources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  resource_type   TEXT NOT NULL,
  provider        TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'inactive', 'pending', 'error')),
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_discovered_resources_updated_at
  BEFORE UPDATE ON public.discovered_resources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 3. Indexes
-- ============================================================

-- org_members: RLS hot path — every policy checks user_id = auth.uid()
CREATE INDEX idx_org_members_user_id ON public.org_members (user_id);

-- projects: filter by org
CREATE INDEX idx_projects_org_id ON public.projects (org_id);

-- api_keys: lookup by project
CREATE INDEX idx_api_keys_project_id ON public.api_keys (project_id);

-- recurring_subscriptions: TCO queries filter by org + project
CREATE INDEX idx_recurring_subscriptions_org_id ON public.recurring_subscriptions (org_id);
CREATE INDEX idx_recurring_subscriptions_project_id ON public.recurring_subscriptions (project_id)
  WHERE project_id IS NOT NULL;

-- transactional_events: primary query pattern (project + time range)
CREATE INDEX idx_transactional_events_project_timestamp
  ON public.transactional_events (project_id, timestamp);

-- transactional_events: backfill query (only unmapped rows)
CREATE INDEX idx_transactional_events_unmapped
  ON public.transactional_events (is_unmapped)
  WHERE is_unmapped = true;

-- transactional_events: join with model_pricing during backfill
CREATE INDEX idx_transactional_events_provider_model
  ON public.transactional_events (provider, model_or_endpoint);

-- discovered_resources: filter by project
CREATE INDEX idx_discovered_resources_project_id ON public.discovered_resources (project_id);

-- ============================================================
-- 4. Row Level Security
-- ============================================================

ALTER TABLE public.organizations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_pricing           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactional_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovered_resources    ENABLE ROW LEVEL SECURITY;

-- ---- organizations ----

CREATE POLICY "Users can view their organizations"
  ON public.organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = organizations.id
        AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Org admins can update organizations"
  ON public.organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = organizations.id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('owner', 'admin')
    )
  );

-- ---- org_members ----

CREATE POLICY "Users can view members of their orgs"
  ON public.org_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members AS self
      WHERE self.org_id = org_members.org_id
        AND self.user_id = auth.uid()
    )
  );

CREATE POLICY "Org admins can insert members"
  ON public.org_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members AS self
      WHERE self.org_id = org_members.org_id
        AND self.user_id = auth.uid()
        AND self.role IN ('owner', 'admin')
    )
    -- Also allow self-insert when creating a new org (no members exist yet)
    OR (
      org_members.user_id = auth.uid()
      AND org_members.role = 'owner'
      AND NOT EXISTS (
        SELECT 1 FROM public.org_members AS existing
        WHERE existing.org_id = org_members.org_id
      )
    )
  );

CREATE POLICY "Org admins can update members"
  ON public.org_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members AS self
      WHERE self.org_id = org_members.org_id
        AND self.user_id = auth.uid()
        AND self.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org admins can delete members"
  ON public.org_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members AS self
      WHERE self.org_id = org_members.org_id
        AND self.user_id = auth.uid()
        AND self.role IN ('owner', 'admin')
    )
  );

-- ---- projects ----

CREATE POLICY "Users can view projects in their orgs"
  ON public.projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = projects.org_id
        AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Org admins can insert projects"
  ON public.projects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = projects.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org admins can update projects"
  ON public.projects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = projects.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org admins can delete projects"
  ON public.projects FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = projects.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('owner', 'admin')
    )
  );

-- ---- api_keys ----

CREATE POLICY "Users can view api_keys in their orgs"
  ON public.api_keys FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      JOIN public.org_members ON org_members.org_id = projects.org_id
      WHERE projects.id = api_keys.project_id
        AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Org admins can insert api_keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      JOIN public.org_members ON org_members.org_id = projects.org_id
      WHERE projects.id = api_keys.project_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org admins can update api_keys"
  ON public.api_keys FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      JOIN public.org_members ON org_members.org_id = projects.org_id
      WHERE projects.id = api_keys.project_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org admins can delete api_keys"
  ON public.api_keys FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      JOIN public.org_members ON org_members.org_id = projects.org_id
      WHERE projects.id = api_keys.project_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('owner', 'admin')
    )
  );

-- ---- model_pricing (globally readable) ----

CREATE POLICY "Authenticated users can read model pricing"
  ON public.model_pricing FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Writes to model_pricing happen via service_role key (bypasses RLS).
-- No INSERT/UPDATE/DELETE policies needed for regular users.

-- ---- recurring_subscriptions ----

CREATE POLICY "Users can view subscriptions in their orgs"
  ON public.recurring_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = recurring_subscriptions.org_id
        AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Org admins can insert subscriptions"
  ON public.recurring_subscriptions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = recurring_subscriptions.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org admins can update subscriptions"
  ON public.recurring_subscriptions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = recurring_subscriptions.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org admins can delete subscriptions"
  ON public.recurring_subscriptions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = recurring_subscriptions.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('owner', 'admin')
    )
  );

-- ---- transactional_events (SELECT + INSERT only from client) ----

CREATE POLICY "Users can view events in their orgs"
  ON public.transactional_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      JOIN public.org_members ON org_members.org_id = projects.org_id
      WHERE projects.id = transactional_events.project_id
        AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert events in their orgs"
  ON public.transactional_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      JOIN public.org_members ON org_members.org_id = projects.org_id
      WHERE projects.id = transactional_events.project_id
        AND org_members.user_id = auth.uid()
    )
  );

-- No UPDATE/DELETE policies — events are immutable from the client.
-- The backfill_unmapped_costs RPC runs as SECURITY DEFINER.

-- ---- discovered_resources ----

CREATE POLICY "Users can view discovered resources in their orgs"
  ON public.discovered_resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      JOIN public.org_members ON org_members.org_id = projects.org_id
      WHERE projects.id = discovered_resources.project_id
        AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Org admins can insert discovered resources"
  ON public.discovered_resources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      JOIN public.org_members ON org_members.org_id = projects.org_id
      WHERE projects.id = discovered_resources.project_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org admins can update discovered resources"
  ON public.discovered_resources FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      JOIN public.org_members ON org_members.org_id = projects.org_id
      WHERE projects.id = discovered_resources.project_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org admins can delete discovered resources"
  ON public.discovered_resources FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      JOIN public.org_members ON org_members.org_id = projects.org_id
      WHERE projects.id = discovered_resources.project_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('owner', 'admin')
    )
  );

-- ============================================================
-- 5. RPC Functions
-- ============================================================

-- 5a. get_project_tco
--     Aggregates the Total Cost of Ownership for a project over a date range.
--     Part 1: Amortized daily cost of recurring_subscriptions (org-wide + project-specific).
--     Part 2: Sum of cost_incurred from transactional_events.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_project_tco(
  p_project_id UUID,
  p_start      DATE,
  p_end        DATE
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  v_org_id            UUID;
  v_subscription_cost NUMERIC := 0;
  v_event_cost        NUMERIC := 0;
BEGIN
  -- Resolve the org that owns this project
  SELECT org_id INTO v_org_id
  FROM public.projects
  WHERE id = p_project_id;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Project % not found', p_project_id;
  END IF;

  IF p_start > p_end THEN
    RAISE EXCEPTION 'Invalid date range: start (%) must be <= end (%)', p_start, p_end;
  END IF;

  -- Part 1: Amortized subscription cost
  -- For each subscription × calendar month in [p_start, p_end]:
  --   daily_rate = monthly_cost / days_in_that_month
  --   contribution = daily_rate × overlap_days
  SELECT COALESCE(SUM(
    s.monthly_cost
      * (
          -- Overlap days between [p_start, p_end] and [month_start, month_end]
          LEAST(p_end, (date_trunc('month', m.month_start) + interval '1 month' - interval '1 day')::date)
          - GREATEST(p_start, m.month_start::date)
          + 1
        )
      / (
          -- Total days in this calendar month
          EXTRACT(DAY FROM (date_trunc('month', m.month_start) + interval '1 month' - interval '1 day'))
        )
  ), 0)
  INTO v_subscription_cost
  FROM public.recurring_subscriptions s
  CROSS JOIN generate_series(
    date_trunc('month', p_start::timestamp),
    date_trunc('month', p_end::timestamp),
    interval '1 month'
  ) AS m(month_start)
  WHERE s.org_id = v_org_id
    AND (
      (s.scope = 'organization' AND s.project_id IS NULL)
      OR
      (s.scope = 'project' AND s.project_id = p_project_id)
    );

  -- Part 2: Transactional event cost
  SELECT COALESCE(SUM(cost_incurred), 0)
  INTO v_event_cost
  FROM public.transactional_events
  WHERE project_id = p_project_id
    AND timestamp >= p_start::timestamptz
    AND timestamp < (p_end + 1)::timestamptz;

  RETURN v_subscription_cost + v_event_cost;
END;
$$;

-- ============================================================
-- 5b. backfill_unmapped_costs
--     Recalculates cost_incurred for events where is_unmapped = true
--     by joining with model_pricing. Respects subscription coverage.
--     Runs as SECURITY DEFINER to bypass RLS (system-level operation).
-- ============================================================

CREATE OR REPLACE FUNCTION public.backfill_unmapped_costs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  WITH pricing_lookup AS (
    SELECT
      te.id AS event_id,
      mp.prompt_price_per_1k,
      mp.completion_price_per_1k,
      -- Check if any subscription covers metered usage for this provider+project
      EXISTS (
        SELECT 1
        FROM public.recurring_subscriptions rs
        JOIN public.projects p ON p.id = te.project_id
        WHERE rs.org_id = p.org_id
          AND rs.provider = te.provider
          AND rs.covers_metered_usage = true
          AND (
            (rs.scope = 'organization' AND rs.project_id IS NULL)
            OR
            (rs.scope = 'project' AND rs.project_id = te.project_id)
          )
      ) AS is_covered
    FROM public.transactional_events te
    JOIN public.model_pricing mp
      ON mp.provider = te.provider
      AND mp.model_name = te.model_or_endpoint
    WHERE te.is_unmapped = true
  )
  UPDATE public.transactional_events te
  SET
    cost_incurred = CASE
      WHEN pl.is_covered THEN 0
      ELSE (te.tokens_prompt / 1000.0 * pl.prompt_price_per_1k)
         + (te.tokens_completion / 1000.0 * pl.completion_price_per_1k)
    END,
    billing_mode = CASE
      WHEN pl.is_covered THEN 'subscription_covered'
      ELSE 'metered'
    END,
    is_unmapped = false
  FROM pricing_lookup pl
  WHERE te.id = pl.event_id;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RETURN v_updated_count;
END;
$$;

-- ============================================================
-- 6. Grants
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_project_tco(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.backfill_unmapped_costs() TO authenticated;
