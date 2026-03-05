-- ============================================================
-- Ingestion Replay Log
-- ============================================================
-- Tracks request-level identities for idempotency/replay protection.
-- Inserts are expected from service_role (Edge Function with service key).
-- ============================================================

CREATE TABLE public.ingest_request_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id       UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  project_id       UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  org_id           UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  request_id       TEXT NOT NULL,
  payload_count    INTEGER NOT NULL CHECK (payload_count > 0),
  payload_checksum TEXT NOT NULL,
  received_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_ingest_request_log_api_key_request
  ON public.ingest_request_log (api_key_id, request_id);

CREATE INDEX idx_ingest_request_log_received_at
  ON public.ingest_request_log (received_at);

ALTER TABLE public.ingest_request_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can view ingest request logs"
  ON public.ingest_request_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.org_members
      WHERE org_members.org_id = ingest_request_log.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('owner', 'admin')
    )
  );

GRANT SELECT ON public.ingest_request_log TO authenticated;
