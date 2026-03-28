---
phase: 03-full-tool-suite
plan: 04
subsystem: api
tags: [mcp, supabase, scope-management, scope-creep, typescript, vitest, tdd]

# Dependency graph
requires:
  - phase: 01-data-foundation
    provides: scope_definitions and scope_changes tables with UNIQUE project_id constraint and scope_change_classification enum
  - phase: 02-mcp-server-core
    provides: McpServer registration pattern, withUserContext helper, registerTool pattern
provides:
  - registerScopeTools: 6 MCP tools for scope definition and change tracking
  - create_scope tool: insert scope_definitions with deliverables, boundaries, assumptions, exclusions
  - get_scope tool: retrieve scope definition by project_id
  - update_scope tool: patch scope fields
  - log_scope_change tool: insert scope_changes with in_scope/out_of_scope/needs_review classification
  - list_scope_changes tool: filtered and paginated scope change history
  - check_scope tool: parallel fetch of scope + changes for Claude's scope creep reasoning
affects:
  - 03-05 (time tools — may need scope context)
  - skills layer (check_scope provides data for scope-creep detection skill)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Promise.all inside withUserContext for parallel DB queries in check_scope"
    - "maybeSingle() instead of single() when no-rows is valid (not an error)"
    - "Bare insert for unique-constrained tables — conflict error message guides user to update instead"

key-files:
  created:
    - src/tools/scope.ts
    - tests/tools/scope.test.ts
  modified: []

key-decisions:
  - "Use bare insert (not upsert) for create_scope — unique constraint on project_id surfaces the conflict as an actionable error message"
  - "check_scope uses maybeSingle() not single() — no-rows is a valid state (scope not yet defined), not a DB error"
  - "check_scope uses Promise.all for parallel scope_definitions + scope_changes fetch — single withUserContext call"
  - "check_scope returns explicit message 'No scope has been defined for this project yet.' when scope is null — gives Claude context to explain the situation to the user"
  - "log_scope_change uses needs_review (not gray_area) matching actual DB enum scope_change_classification"

patterns-established:
  - "Promise.all pattern: parallel queries inside one withUserContext using destructured [resultA, resultB]"
  - "maybeSingle pattern: use when zero rows is a valid non-error outcome"
  - "Scope empty-state: return { scope: null, scope_changes: [], message: '...' } rather than isError"

requirements-completed: [SCOPE-01, SCOPE-02, SCOPE-03, SCOPE-04]

# Metrics
duration: 4min
completed: 2026-03-28
---

# Phase 3 Plan 04: Scope Management Tools Summary

**6 MCP scope tools with Promise.all parallel fetch in check_scope and maybeSingle empty-state handling for scope creep detection**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-28T15:13:14Z
- **Completed:** 2026-03-28T15:17:06Z
- **Tasks:** 2 (TDD: RED + GREEN)
- **Files modified:** 2

## Accomplishments

- All 6 scope tools implemented: create_scope, get_scope, update_scope, log_scope_change, list_scope_changes, check_scope
- check_scope uses Promise.all to fetch scope definition + change history in parallel in a single withUserContext call
- check_scope gracefully handles no-scope state with explicit message rather than an error, giving Claude context to explain to the user
- 13 unit tests pass covering success and error paths for all 6 tools
- No TypeScript errors

## Task Commits

1. **Task 1: Create scope tool tests (RED)** - `b4defef` (test)
2. **Task 2: Implement scope tools (GREEN + test fix)** - `fb4a8f8` (feat)

## Files Created/Modified

- `src/tools/scope.ts` - 6 MCP tools: registerScopeTools export with create_scope, get_scope, update_scope, log_scope_change, list_scope_changes, check_scope
- `tests/tools/scope.test.ts` - 13 unit tests covering all 6 tools including check_scope empty state and needs_review classification

## Decisions Made

- Used bare insert (not upsert) for create_scope — the unique constraint on project_id is intentional; if a scope already exists, the error message tells the user to update instead
- check_scope uses `.maybeSingle()` not `.single()` — zero rows is valid (scope not yet defined), not a DB error; `.single()` would throw PGRST116 needlessly
- check_scope returns `{ scope: null, scope_changes: [], message: "No scope has been defined for this project yet." }` instead of `isError: true` — no-scope is an expected state, not a failure
- Promise.all pattern established for parallel queries inside one withUserContext

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test mock for classification filter assertion**

- **Found during:** Task 2 (running tests after implementation)
- **Issue:** The `list_scope_changes` classification filter test used a nested mock structure that only tracked the first `eq()` call; after `eq('project_id', ...)`, the returned chain object didn't track subsequent calls, so `classificationFilterCalled` was never set to true
- **Fix:** Rewrote the mock using a recursive `makeChain()` factory that records all `eq()` call arguments in a flat array; assertion checks the recorded calls for a classification entry
- **Files modified:** tests/tools/scope.test.ts
- **Verification:** All 13 tests pass
- **Committed in:** fb4a8f8 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug in test mock)
**Impact on plan:** Necessary to ensure the classification filter is verified correctly. No scope creep.

## Issues Encountered

None beyond the test mock fix documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Scope tools ready; registerScopeTools can be wired into the MCP server index
- Plan 05 (time entry tools) is independent and can proceed
- check_scope provides the data layer for the planned scope-creep detection skill

---
*Phase: 03-full-tool-suite*
*Completed: 2026-03-28*
