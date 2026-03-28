---
phase: 3
slug: full-tool-suite
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-28
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 2.x |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run tests/tools/proposals.test.ts tests/tools/invoices.test.ts tests/tools/time-entries.test.ts tests/tools/scope.test.ts tests/tools/follow-ups.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/tools/<entity>.test.ts` for the changed entity
- **After every plan wave:** Run `npx vitest run`
- **Before phase completion:** Full suite must be green (102 tests, 8 files)
- **Max feedback latency:** 5 seconds

---

## Phase 3 Test Coverage

| Test | File | What It Verifies |
|------|------|------------------|
| Proposal tools | tests/tools/proposals.test.ts | create_proposal, get_proposal, list_proposals, update_proposal, accept_proposal (5 tools) |
| Invoice tools | tests/tools/invoices.test.ts | create_invoice, get_invoice, list_invoices, update_invoice (4 tools) |
| Time entry tools | tests/tools/time-entries.test.ts | create_time_entry, get_time_entry, list_time_entries, update_time_entry, archive_time_entry, aggregate_time (6 tools) |
| Scope tools | tests/tools/scope.test.ts | create_scope, get_scope, update_scope, list_scope_changes, log_scope_change, check_scope (6 tools) |
| Follow-up tools | tests/tools/follow-ups.test.ts | create_followup, get_followup, list_followups, update_followup, mark_followup_sent, get_followup_context (6 tools) |

---

## Feedback Signals

- `npx vitest run` — 102 tests pass across 8 files, 0 failures
- `npx tsc --noEmit` — exits 0, no type errors
- Test output reports per-file counts and duration

---

## Compliance Checklist

- [x] Wave 0 tests exist (5 test files covering all 27 new tools)
- [x] Quick run command works (`npx vitest run` exits 0 with 102 tests passing)
- [x] Sampling rate defined (per-entity file after each commit, full suite after each plan wave)
- [x] Feedback signals documented (vitest test count per file, overall pass/fail)

**Approval:** approved 2026-03-28
