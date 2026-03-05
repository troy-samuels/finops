# 08. Reliability, Performance, And Resiliency

## Objective
Validate service behavior under expected and failure conditions.

## Execution Checklist
- Define SLOs for ingestion and core query flows.
- Run load tests with steady-state and burst profiles.
- Inject dependency failures (Redis/OpenRouter/Supabase partial outages).
- Validate retry, timeout, and degradation behavior.

## Evidence
- Load test reports (latency/error/resource)
- Failure injection reports
- SLO compliance summary

## Exit Criteria
- SLOs met for defined production profiles.
- Degraded modes are controlled and observable.
