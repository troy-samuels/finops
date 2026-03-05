-- ============================================================
-- Restrict privileged RPC execution to service_role only
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.backfill_unmapped_costs() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rollup_old_data() FROM authenticated;

GRANT EXECUTE ON FUNCTION public.backfill_unmapped_costs() TO service_role;
GRANT EXECUTE ON FUNCTION public.rollup_old_data() TO service_role;
