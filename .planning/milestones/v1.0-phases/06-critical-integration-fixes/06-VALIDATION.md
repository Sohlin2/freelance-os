---
phase: 6
slug: critical-integration-fixes
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-28
---

# Phase 6 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 2.x + pgTAP |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` followed by `npx supabase test db` |
| **Estimated runtime** | ~10 seconds (vitest only; pgTAP requires Docker) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **Before phase completion:** Run full suite including `npx supabase test db` if Docker available
- **Max feedback latency:** 10 seconds

---

## Phase 6 Test Coverage

| Test | File | What It Verifies |
|------|------|------------------|
| RLS session scope | supabase/tests/rls_session_scope.test.sql | set_app_user_id uses session scope (false) so PostgREST queries in separate transactions see user context |
| Runtime dependencies | Verified by npm install + server startup | express and zod resolve at runtime (no module-not-found errors) |
| Existing tool tests | tests/tools/*.test.ts | No regressions from migration 000009 — all 102+ tool tests continue to pass |

---

## Feedback Signals

- `npx vitest run` — all existing tests pass (0 failures); confirms migration 000009 introduced no regressions
- `npx supabase test db` — rls_session_scope.test.sql passes 3 assertions: set_app_user_id executes, User A sees own client, User B sees no clients
- `npm install` — no missing module errors; express and zod resolve from dependencies (not devDependencies)

---

## Compliance Checklist

- [x] Wave 0 tests exist (rls_session_scope.test.sql for pgTAP; existing tests/tools/*.test.ts for regression coverage)
- [x] Quick run command works (`npx vitest run` exits 0)
- [x] Sampling rate defined (after every task commit; full pgTAP suite before phase completion)
- [x] Feedback signals documented (vitest pass count, pgTAP 3-assertion result, npm install clean output)

**Approval:** approved 2026-03-28
