# 01. System And Data Flow Review

## Objective
Produce an approved architecture and trust-boundary map for all ingress/egress paths.

## Scope
- Browser and dashboard app routes
- SDK event flow
- Supabase Edge Functions and Postgres
- Scheduled jobs (pricing sync and rollups)
- External dependencies (OpenRouter, Upstash)

## Execution Checklist
- Build DFD for `browser/app -> SDK -> track-event -> DB -> rollups/pricing`.
- Identify data classes and retention requirements.
- Tag every boundary with auth method and owner.

## Evidence
- Architecture diagram
- Data inventory
- Dependency inventory with trust assumptions

## Exit Criteria
- Every data path has a control owner.
- Every external integration has failure-mode handling documented.
