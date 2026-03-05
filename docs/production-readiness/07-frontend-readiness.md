# 07. Frontend Application Readiness

## Objective
Move from mock-driven prototype behavior to production-authenticated data flows.

## Execution Checklist
- Produce route-by-route readiness map.
- Replace launch-critical mocks with real typed Supabase queries.
- Validate route protection for authenticated surfaces.
- Validate no sensitive material is exposed client-side.

## Evidence
- Route readiness map
- Integration gap backlog with owners
- Auth and data access test output

## Exit Criteria
- No launch-critical route depends on mock data.
- All production routes enforce expected authz boundaries.
