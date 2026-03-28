---
phase: 03-full-tool-suite
plan: 01
subsystem: api
tags: [mcp-tools, proposals, scope-management, supabase, zod, typescript]

# Dependency graph
requires:
  - phase: 02-mcp-server-core
    provides: registerClientTools and registerProjectTools patterns, withUserContext helper, McpServer setup
provides:
  - registerProposalTools export with 5 MCP tools: create, get, list, update, accept
  - accept_proposal transactional tool that auto-seeds scope_definitions from proposal content
  - TDD test suite for all 5 proposal tools (14 test cases)
affects: [03-02, 03-03, 03-04, 03-05, scope-management, invoice-tools]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "accept_proposal uses single withUserContext call for 3 sequential DB operations (fetch → update → upsert)"
    - "scope_definitions seeded via upsert with onConflict: project_id (one-scope-per-project guarantee)"
    - "list_proposals uses conditional query chain for optional project_id, client_id, status filters"

key-files:
  created:
    - src/tools/proposals.ts
    - tests/tools/proposals.test.ts
  modified: []

key-decisions:
  - "accept_proposal performs 3 sequential DB operations inside single withUserContext to minimize connection overhead"
  - "scope upsert failure after proposal update returns partial success (proposal accepted, scope: null, error message) rather than blocking the accept"
  - "proposal enum values: 'declined' (not 'rejected') and 'expired' — sourced from database.ts Constants, not CONTEXT.md"

patterns-established:
  - "Transactional tool pattern: multi-step operations inside one withUserContext callback"
  - "Partial success pattern: if secondary operation fails after primary succeeds, return both results rather than isError"

requirements-completed: [PROP-01, PROP-03, PROP-04]

# Metrics
duration: 3min
completed: 2026-03-28
---

# Phase 03 Plan 01: Proposal Tools Summary

**5 MCP proposal tools including accept_proposal that auto-seeds scope_definitions via upsert with onConflict project_id**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-28T16:12:56Z
- **Completed:** 2026-03-28T16:15:58Z
- **Tasks:** 2 (TDD: test RED + implementation GREEN)
- **Files modified:** 2

## Accomplishments

- Created `tests/tools/proposals.test.ts` with 14 test cases covering all 5 proposal tools including scope upsert verification
- Implemented `src/tools/proposals.ts` with `registerProposalTools` export following the established clients/projects pattern
- `accept_proposal` correctly performs 3 sequential DB operations in one context call and seeds scope_definitions via `upsert({ onConflict: 'project_id' })`

## Task Commits

1. **Task 1: Create proposal tool tests (RED)** - `b78de4a` (test)
2. **Task 2: Implement proposal tools (GREEN)** - `2c2845b` (feat)

**Plan metadata:** (docs commit to follow)

_Note: TDD tasks — test commit then implementation commit._

## Files Created/Modified

- `src/tools/proposals.ts` - registerProposalTools with 5 tools: create_proposal, get_proposal, list_proposals, update_proposal, accept_proposal
- `tests/tools/proposals.test.ts` - 14 unit tests covering all tools, mock patterns matching clients.test.ts structure

## Decisions Made

- `accept_proposal` performs 3 sequential Supabase calls inside one `withUserContext` callback to minimize connection churn
- If scope upsert fails after a successful status update, we return partial success (`{ proposal, scope: null, error }`) rather than `isError: true` — the proposal is already accepted at that point and blocking would leave data inconsistent
- Enum values sourced directly from `database.ts` Constants — `'declined'` (not `'rejected'`), `'expired'` included

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Proposal tools complete and tested; ready for 03-02 (scope tools), 03-03 (time entry tools)
- `accept_proposal` provides the critical link from PROP-03: proposal acceptance auto-seeds project scope
- registerProposalTools follows the established pattern — consistent with registerClientTools and registerProjectTools

---
*Phase: 03-full-tool-suite*
*Completed: 2026-03-28*
