# 03. AuthN/AuthZ And Tenant Isolation

## Objective
Prove that auth and authorization controls prevent cross-tenant access and privilege escalation.

## Execution Checklist
- Validate all RLS policies and grants against attack scenarios.
- Verify Edge Function auth paths and principal types.
- Test unauthorized read/write attempts for each protected table.
- Validate privileged RPC exposure and execution roles.

## Evidence
- Policy/grant matrix
- Negative-test logs with expected denials
- Privileged access review output

## Exit Criteria
- Zero confirmed tenant-isolation bypasses.
- No unsafe privileged function grants.
