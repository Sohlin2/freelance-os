---
phase: 1
slug: data-foundation
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-28
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pgTAP (Supabase built-in) + vitest 2.x (TypeScript unit tests) |
| **Config file** | `supabase/config.toml` (Supabase init); `vitest.config.ts` (added Phase 2) |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx supabase test db && npx vitest run` |
| **Estimated runtime** | ~15 seconds (vitest only; pgTAP requires Docker) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx supabase test db && npx vitest run`
- **Before phase completion:** Full suite must be green (Docker required for pgTAP)
- **Max feedback latency:** 15 seconds

---

## Phase 1 Test Coverage

| Test | File | What It Verifies |
|------|------|------------------|
| Schema exists | supabase/tests/schema_exists.test.sql | All 9 domain tables present (plan 9 assertions) |
| API key validation | supabase/tests/api_key_validation.test.sql | validate_api_key returns user_id for valid key, NULL for invalid/revoked (plan 3 assertions) |
| RLS clients isolation | supabase/tests/rls_clients.test.sql | User A data not visible to User B via app.current_user_id (plan 4 assertions) |
| RLS projects isolation | supabase/tests/rls_projects.test.sql | Cross-user project isolation (plan 3 assertions) |
| TypeScript types compile | npx tsc --noEmit | src/types/database.ts compiles without errors |

---

## Feedback Signals

- `npx vitest run` — all TypeScript tests pass (0 failures)
- `npx supabase test db` — 19 pgTAP assertions pass across 4 SQL test files (requires Docker)
- `npx tsc --noEmit` — exits 0, no type errors

---

## Compliance Checklist

- [x] Wave 0 tests exist (pgTAP test SQL files and TypeScript type compilation)
- [x] Quick run command works (`npx vitest run` exits 0)
- [x] Sampling rate defined (after every task commit + after every plan wave)
- [x] Feedback signals documented (vitest pass count, pgTAP assertion count, tsc exit code)

**Approval:** approved 2026-03-28
