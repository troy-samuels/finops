# Incident Response Runbook

## Severity Levels
- SEV1: Confirmed customer impact or data isolation breach.
- SEV2: Significant degradation with workaround.
- SEV3: Limited degradation, no material customer impact.

## First 15 Minutes
1. Declare severity and assign incident commander.
2. Freeze risky deploys.
3. Capture initial timeline and impacted services.
4. Open internal incident channel and status updates.

## Containment Checklist
- Rotate compromised keys/tokens if credential abuse suspected.
- Apply temporary ingress protections (rate limits, block rules).
- Gate risky write paths if data integrity is at risk.

## Recovery Checklist
- Confirm mitigation effectiveness.
- Validate tenant isolation and financial correctness after recovery.
- Publish internal and customer-facing comms as needed.

## Post-Incident
- Produce postmortem within 48 hours.
- Track remediation in roadmap with owners/dates.
