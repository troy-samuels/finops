# FinOps Tracker — Coding Standards & Project Rules

## Stack
- **Monorepo**: Turborepo + pnpm workspaces
- **Frontend**: Next.js App Router (`apps/dashboard`)
- **UI**: shadcn/ui (Radix primitives + Tailwind CSS)
- **Backend**: Supabase (Postgres, Auth, Edge Functions)
- **SDK**: `packages/sdk` — lightweight TypeScript telemetry/event SDK

## TypeScript Rules
- **Strict mode everywhere** — `strict: true` in all tsconfigs
- **No `any` types** — use `unknown` and narrow, or define proper interfaces
- **No type assertions** (`as`) unless absolutely unavoidable and commented why

## SDK Guardrails
The SDK (`packages/sdk`) must **never crash the host application**:
1. All public methods must be wrapped in try/catch — errors are logged internally, never thrown
2. Max queue size enforced (drop oldest events when full)
3. All network errors are swallowed silently — the SDK is fire-and-forget
4. No unhandled promise rejections — all async paths must have catch handlers

## Workflow Rules
- Work is organized into Epics, delivered sequentially
- **Always ask for permission** before moving to the next Epic
- **Create a Git commit** after completing each Epic
- Commit messages follow: `feat(scope): description` / `fix(scope): description`

## Project Structure
```
/apps/dashboard    — Next.js App Router frontend
/packages/sdk      — TypeScript event/telemetry SDK
/supabase          — DB migrations + Edge Functions
```
