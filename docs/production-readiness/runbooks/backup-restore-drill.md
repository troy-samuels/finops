# Backup And Restore Drill Runbook

## Objective
Validate that production data can be restored within target objectives.

## Preconditions
- Snapshot timestamp selected.
- Isolated restore environment prepared.
- Validation queries and expected totals prepared.

## Drill Steps
1. Restore snapshot to isolated environment.
2. Run schema integrity checks.
3. Run reconciliation queries for:
- transactional_events totals
- daily_usage_rollups totals
- key tenant boundary checks
4. Record RTO (time to recover) and RPO (data age at restore).

## Success Criteria
- Restore completes within agreed RTO.
- Data loss within agreed RPO.
- Reconciliation checks pass.
