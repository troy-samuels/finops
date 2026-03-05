-- ============================================================
-- FinOps Tracker — Chargeback System Migration
-- ============================================================
-- Adds cost centres, allocation rules, and chargeback reports.
-- The killer enterprise differentiator — internal billing by dept/team/feature.
-- ============================================================

-- ============================================================
-- 1. Tables
-- ============================================================

-- 1a. Cost centres (departments, teams, business units)
CREATE TABLE public.cost_centres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL, -- e.g., "ENG-001", "MKT-002"
  parent_id UUID REFERENCES public.cost_centres(id) ON DELETE SET NULL, -- hierarchical
  budget_monthly NUMERIC(20,2), -- optional monthly budget
  owner_email TEXT, -- department owner for report delivery
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, code)
);

CREATE INDEX idx_cost_centres_org_id ON public.cost_centres(org_id);
CREATE INDEX idx_cost_centres_parent_id ON public.cost_centres(parent_id);

CREATE TRIGGER trg_cost_centres_updated_at
  BEFORE UPDATE ON public.cost_centres
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 1b. Cost allocation rules (tag-based mapping of events to cost centres)
CREATE TABLE public.cost_allocation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  cost_centre_id UUID NOT NULL REFERENCES public.cost_centres(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('project', 'provider', 'model', 'tag', 'percentage')),
  -- For project/provider/model rules: match_value is the exact match
  -- For tag rules: match_key + match_value check metadata JSONB
  -- For percentage rules: allocate a % of unallocated costs
  match_key TEXT, -- for tag rules: the metadata key to check
  match_value TEXT, -- the value to match
  allocation_percent NUMERIC(5,2) DEFAULT 100.00 CHECK (allocation_percent > 0 AND allocation_percent <= 100),
  priority INTEGER NOT NULL DEFAULT 0, -- higher priority rules evaluated first
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cost_allocation_rules_org_id ON public.cost_allocation_rules(org_id);
CREATE INDEX idx_cost_allocation_rules_cost_centre_id ON public.cost_allocation_rules(cost_centre_id);

CREATE TRIGGER trg_cost_allocation_rules_updated_at
  BEFORE UPDATE ON public.cost_allocation_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 1c. Chargeback reports (generated monthly or on-demand)
CREATE TABLE public.chargeback_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_by UUID, -- user who triggered it
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'complete', 'failed')),
  total_cost NUMERIC(20,10) NOT NULL DEFAULT 0,
  allocated_cost NUMERIC(20,10) NOT NULL DEFAULT 0,
  unallocated_cost NUMERIC(20,10) NOT NULL DEFAULT 0,
  report_data JSONB NOT NULL DEFAULT '{}', -- full breakdown cached
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chargeback_reports_org_id ON public.chargeback_reports(org_id);
CREATE INDEX idx_chargeback_reports_period ON public.chargeback_reports(org_id, period_start, period_end);

CREATE TRIGGER trg_chargeback_reports_updated_at
  BEFORE UPDATE ON public.chargeback_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 1d. Chargeback line items (one per cost centre per report)
CREATE TABLE public.chargeback_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.chargeback_reports(id) ON DELETE CASCADE,
  cost_centre_id UUID NOT NULL REFERENCES public.cost_centres(id) ON DELETE CASCADE,
  total_cost NUMERIC(20,10) NOT NULL DEFAULT 0,
  event_count INTEGER NOT NULL DEFAULT 0,
  tokens_prompt BIGINT NOT NULL DEFAULT 0,
  tokens_completion BIGINT NOT NULL DEFAULT 0,
  top_models JSONB DEFAULT '[]', -- [{model, cost, percent}]
  top_projects JSONB DEFAULT '[]', -- [{project, cost, percent}]
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chargeback_line_items_report_id ON public.chargeback_line_items(report_id);
CREATE INDEX idx_chargeback_line_items_cost_centre_id ON public.chargeback_line_items(cost_centre_id);

-- ============================================================
-- 2. RLS Policies
-- ============================================================

ALTER TABLE public.cost_centres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_allocation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chargeback_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chargeback_line_items ENABLE ROW LEVEL SECURITY;

-- Cost centres: org members can view, admins can modify
CREATE POLICY cost_centres_select_policy ON public.cost_centres
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY cost_centres_insert_policy ON public.cost_centres
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY cost_centres_update_policy ON public.cost_centres
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY cost_centres_delete_policy ON public.cost_centres
  FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Cost allocation rules: org members can view, admins can modify
CREATE POLICY cost_allocation_rules_select_policy ON public.cost_allocation_rules
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY cost_allocation_rules_insert_policy ON public.cost_allocation_rules
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY cost_allocation_rules_update_policy ON public.cost_allocation_rules
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY cost_allocation_rules_delete_policy ON public.cost_allocation_rules
  FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Chargeback reports: org members can view, admins can create
CREATE POLICY chargeback_reports_select_policy ON public.chargeback_reports
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY chargeback_reports_insert_policy ON public.chargeback_reports
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY chargeback_reports_update_policy ON public.chargeback_reports
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Chargeback line items: org members can view (via report join)
CREATE POLICY chargeback_line_items_select_policy ON public.chargeback_line_items
  FOR SELECT
  USING (
    report_id IN (
      SELECT id FROM public.chargeback_reports 
      WHERE org_id IN (
        SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- 3. RPC Function: Generate Chargeback Report
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_chargeback_report(
  p_org_id UUID,
  p_start DATE,
  p_end DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report_id UUID;
  v_cost_centre RECORD;
  v_total_cost NUMERIC(20,10) := 0;
  v_allocated_cost NUMERIC(20,10) := 0;
  v_line_item_cost NUMERIC(20,10);
  v_event_count INTEGER;
  v_tokens_prompt BIGINT;
  v_tokens_completion BIGINT;
  v_top_models JSONB;
  v_top_projects JSONB;
BEGIN
  -- Create report record
  INSERT INTO public.chargeback_reports (
    org_id, period_start, period_end, status, generated_by
  )
  VALUES (
    p_org_id, p_start, p_end, 'generating', auth.uid()
  )
  RETURNING id INTO v_report_id;

  -- Calculate total cost for the period (join through projects to resolve org)
  SELECT COALESCE(SUM(te.cost_incurred), 0)
  INTO v_total_cost
  FROM public.transactional_events te
  INNER JOIN public.projects p ON p.id = te.project_id
  WHERE p.org_id = p_org_id
    AND te.timestamp >= p_start::timestamptz
    AND te.timestamp < (p_end + 1)::timestamptz
    AND te.is_unmapped = false;

  -- For each cost centre, calculate allocated costs
  FOR v_cost_centre IN
    SELECT id, name, code
    FROM public.cost_centres
    WHERE org_id = p_org_id
  LOOP
    -- Calculate cost for this cost centre based on allocation rules
    -- Join transactional_events → projects to get org_id, then match against rules
    WITH matched_events AS (
      SELECT DISTINCT ON (te.id) te.*
      FROM public.transactional_events te
      INNER JOIN public.projects p ON p.id = te.project_id
      INNER JOIN public.cost_allocation_rules car ON car.org_id = p.org_id
      WHERE p.org_id = p_org_id
        AND te.timestamp >= p_start::timestamptz
        AND te.timestamp < (p_end + 1)::timestamptz
        AND te.is_unmapped = false
        AND car.cost_centre_id = v_cost_centre.id
        AND (
          -- Project rule: match project_id
          (car.rule_type = 'project' AND te.project_id::text = car.match_value)
          -- Provider rule: match provider name
          OR (car.rule_type = 'provider' AND te.provider = car.match_value)
          -- Model rule: match model_or_endpoint
          OR (car.rule_type = 'model' AND te.model_or_endpoint = car.match_value)
          -- Tag rule: match metadata key/value
          OR (car.rule_type = 'tag' AND te.metadata->>car.match_key = car.match_value)
        )
      ORDER BY te.id, car.priority DESC
    )
    SELECT
      COALESCE(SUM(cost_incurred), 0),
      COUNT(*)::integer,
      COALESCE(SUM(tokens_prompt), 0)::bigint,
      COALESCE(SUM(tokens_completion), 0)::bigint
    INTO v_line_item_cost, v_event_count, v_tokens_prompt, v_tokens_completion
    FROM matched_events;

    -- Build top models JSON
    WITH model_costs AS (
      SELECT
        te.model_or_endpoint AS model,
        SUM(te.cost_incurred) AS cost,
        ROUND((SUM(te.cost_incurred) / NULLIF(v_line_item_cost, 0) * 100)::numeric, 2) AS percent
      FROM public.transactional_events te
      INNER JOIN public.projects p ON p.id = te.project_id
      INNER JOIN public.cost_allocation_rules car ON car.org_id = p.org_id
      WHERE p.org_id = p_org_id
        AND te.timestamp >= p_start::timestamptz
        AND te.timestamp < (p_end + 1)::timestamptz
        AND te.is_unmapped = false
        AND car.cost_centre_id = v_cost_centre.id
        AND (
          (car.rule_type = 'project' AND te.project_id::text = car.match_value)
          OR (car.rule_type = 'provider' AND te.provider = car.match_value)
          OR (car.rule_type = 'model' AND te.model_or_endpoint = car.match_value)
          OR (car.rule_type = 'tag' AND te.metadata->>car.match_key = car.match_value)
        )
      GROUP BY te.model_or_endpoint
      ORDER BY cost DESC
      LIMIT 3
    )
    SELECT COALESCE(jsonb_agg(row_to_json(model_costs)), '[]'::jsonb)
    INTO v_top_models
    FROM model_costs;

    -- Build top projects JSON
    WITH project_costs AS (
      SELECT
        p.name AS project,
        SUM(te.cost_incurred) AS cost,
        ROUND((SUM(te.cost_incurred) / NULLIF(v_line_item_cost, 0) * 100)::numeric, 2) AS percent
      FROM public.transactional_events te
      INNER JOIN public.projects p ON p.id = te.project_id
      INNER JOIN public.cost_allocation_rules car ON car.org_id = p.org_id
      WHERE p.org_id = p_org_id
        AND te.timestamp >= p_start::timestamptz
        AND te.timestamp < (p_end + 1)::timestamptz
        AND te.is_unmapped = false
        AND car.cost_centre_id = v_cost_centre.id
        AND (
          (car.rule_type = 'project' AND te.project_id::text = car.match_value)
          OR (car.rule_type = 'provider' AND te.provider = car.match_value)
          OR (car.rule_type = 'model' AND te.model_or_endpoint = car.match_value)
          OR (car.rule_type = 'tag' AND te.metadata->>car.match_key = car.match_value)
        )
      GROUP BY p.name
      ORDER BY cost DESC
      LIMIT 3
    )
    SELECT COALESCE(jsonb_agg(row_to_json(project_costs)), '[]'::jsonb)
    INTO v_top_projects
    FROM project_costs;

    -- Only insert line item if there's actual cost
    IF v_line_item_cost > 0 THEN
      INSERT INTO public.chargeback_line_items (
        report_id,
        cost_centre_id,
        total_cost,
        event_count,
        tokens_prompt,
        tokens_completion,
        top_models,
        top_projects
      )
      VALUES (
        v_report_id,
        v_cost_centre.id,
        v_line_item_cost,
        v_event_count,
        v_tokens_prompt,
        v_tokens_completion,
        v_top_models,
        v_top_projects
      );

      v_allocated_cost := v_allocated_cost + v_line_item_cost;
    END IF;
  END LOOP;

  -- Update report with totals
  UPDATE public.chargeback_reports
  SET
    status = 'complete',
    total_cost = v_total_cost,
    allocated_cost = v_allocated_cost,
    unallocated_cost = v_total_cost - v_allocated_cost
  WHERE id = v_report_id;

  RETURN v_report_id;
END;
$$;
