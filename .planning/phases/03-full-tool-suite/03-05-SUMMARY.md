---
phase: 03-full-tool-suite
plan: "05"
subsystem: mcp-tools
tags: [follow-ups, mcp, tdd, server-wiring]
dependency_graph:
  requires: [03-01, 03-02, 03-03, 03-04]
  provides: [follow-up-tools, complete-tool-suite-registration]
  affects: [server.ts, all-tool-registrations]
tech_stack:
  added: []
  patterns: [Promise.all parallel queries, sent_at timestamp guard, TDD red-green]
key_files:
  created:
    - src/tools/follow-ups.ts
    - tests/tools/follow-ups.test.ts
  modified:
    - src/server.ts
decisions:
  - mark_followup_sent uses sent_at IS NOT NULL pattern (no status enum) — consistent with schema design decision from Phase 01
  - get_followup_context uses Promise.all for three parallel Supabase queries inside one withUserContext call — avoids sequential latency
  - list_followups sent filter: .not('sent_at', 'is', null) for sent=true, .is('sent_at', null) for sent=false
metrics:
  duration: 238s
  completed: "2026-03-28"
  tasks_completed: 3
  files_created: 2
  files_modified: 1
---

# Phase 3 Plan 05: Follow-Up Tools and Full Server Wiring Summary

6 follow-up MCP tools implemented with Promise.all context aggregation, sent_at timestamp guard on mark_followup_sent, and all 5 new entity tool files wired into server.ts completing the Phase 3 tool suite (37 total tools).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (RED) | Create follow-up tool tests | f9170fd | tests/tools/follow-ups.test.ts |
| 2 (GREEN) | Implement follow-up tools | aec854e | src/tools/follow-ups.ts, tests/tools/follow-ups.test.ts |
| 3 | Wire all new tools into server.ts | 8a66342 | src/server.ts |

## What Was Built

### src/tools/follow-ups.ts

6 MCP tools for the full follow-up lifecycle:

- **create_followup**: Stores drafted follow-up with type (from follow_up_type enum), subject, content
- **get_followup**: Retrieves a single follow-up by ID (excludes archived)
- **list_followups**: Lists follow-ups with filters for client_id, project_id, type, sent status; pagination support
- **update_followup**: Updates follow-up content/details
- **mark_followup_sent**: Sets sent_at to ISO timestamp with `.is('sent_at', null)` guard preventing double-marking
- **get_followup_context**: Aggregates client info + outstanding invoices (status 'sent'/'overdue') + last 5 follow-ups via Promise.all

### tests/tools/follow-ups.test.ts

15 test cases covering all 6 tools including:
- mark_followup_sent guard verification (`.is('sent_at', null)`)
- get_followup_context with/without project_id narrowing
- list_followups sent/draft filtering
- Error paths for all tools

### src/server.ts

Updated buildServer() with all 5 new entity tool file imports and registrations:
- registerProposalTools, registerInvoiceTools, registerTimeEntryTools
- registerScopeTools, registerFollowUpTools

## Verification

- `npm test`: 102 tests across 8 files — all pass
- `npx tsc --noEmit`: No TypeScript errors
- Total tool count: 10 (Phase 2) + 27 (Phase 3) = 37 tools registered in server.ts

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test mock chain order for sent=false filter**
- **Found during:** Task 2 (GREEN phase)
- **Issue:** The list_followups test for `sent=false` used a single-level mock that only captured the first `.is()` call (which is `archived_at`, not `sent_at`). The implementation correctly calls `.is('archived_at', null)` first (from the base query), then `.is('sent_at', null)` for the filter — but the mock's flat chain structure only intercepted the first call.
- **Fix:** Replaced flat mock with a recursive chainable mock that tracks ALL `.is()` calls and checks for any call with `field === 'sent_at' && value === null`. Same pattern applied to the `sent=true` `.not()` filter test.
- **Files modified:** tests/tools/follow-ups.test.ts
- **Commit:** aec854e

## Known Stubs

None — all 6 tools query real Supabase tables with no placeholder data.

## Self-Check: PASSED
