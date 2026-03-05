# Hard Go/No-Go Gates

A release candidate is `NO-GO` if any gate below fails.

## Gate Checklist
- Security Gate: no unresolved Critical/High vulnerabilities.
- Isolation Gate: no tenant-boundary violations in adversarial tests.
- Financial Gate: reconciliation variance explained and within tolerance.
- Reliability Gate: SLO targets met under normal and degraded tests.
- Operational Gate: CI/CD, observability, incident response, and backup drills validated.
- Compliance Gate: required SOC2 evidence complete and traceable.

## Decision Process
1. Owners mark each gate as Pass/Fail in the launch memo.
2. Security and engineering leads confirm evidence links.
3. Product/leadership signs final decision.
