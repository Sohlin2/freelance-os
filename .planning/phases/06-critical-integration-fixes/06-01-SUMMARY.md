---
phase: 06-critical-integration-fixes
plan: 01
subsystem: infrastructure
tags: [rls, session-scope, dependencies, pgtap, bug-fix]
dependency_graph:
  requires: []
  provides: [rls-session-scope-fix, runtime-deps-fix]
  affects: [all-37-mcp-tools, server-startup]
tech_stack:
  added: []
  patterns: [session-scoped-set_config, pgtap-rpc-testing]
key_files:
  created:
    - supabase/migrations/20260328000009_fix_set_app_user_id_scope.sql
    - supabase/tests/rls_session_scope.test.sql
  modified:
    - src/lib/with-user-context.ts
    - package.json
decisions:
  - "Session scope (set_config false) is correct for PostgREST because each .from().select() is a separate HTTP request / transaction — transaction scope clears context before data queries execute"
  - "express and zod must be in runtime dependencies (not devDependencies) because they are imported by the server process at runtime"
metrics:
  duration: ~180s
  completed: 2026-03-28
  tasks_completed: 2
  files_modified: 4
---

# Phase 06 Plan 01: Critical Integration Fixes Summary

**One-liner:** Fixed RLS silent failure (set_config transaction→session scope) and missing runtime deps (express+zod) that blocked all 37 MCP tools and server startup post-npm-install.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix RLS session scope — migration, pgTAP test, comment update | 550666a | supabase/migrations/20260328000009_fix_set_app_user_id_scope.sql, supabase/tests/rls_session_scope.test.sql, src/lib/with-user-context.ts |
| 2 | Fix runtime dependencies and reconcile REQUIREMENTS.md | b52fc18 | package.json |

## What Was Built

### RLS Session Scope Fix (BROKEN-02)

The original `set_app_user_id` SQL function used `set_config('app.current_user_id', ..., true)` — transaction scope. Since Supabase JS sends each `.from().select()` as a separate PostgREST HTTP request (separate Postgres transaction), the transaction-scoped config was cleared before data queries executed, causing RLS to evaluate the user as NULL and return empty results for all queries.

**Fix:** Migration `000009` replaces the function using `set_config(..., false)` — session scope. The session config persists across the separate transactions within the same PostgREST connection. Connection pooling prevents cross-user leakage because each pool checkout starts with a clean session.

A pgTAP test (`rls_session_scope.test.sql`) proves the fix with 3 assertions:
1. `set_app_user_id` executes without error
2. User A sees their own client after the RPC call (session scope persists)
3. User B sees no clients after switching context (RLS isolation confirmed)

Comments in `with-user-context.ts` updated to explain the session scope rationale and reference migration 000009.

### Runtime Dependencies Fix (MISSING-01, MISSING-02)

`express` and `zod` were only in `devDependencies`, meaning `npm install --production` (or the default npm install for consumers) would not install them. The MCP server imports both at runtime.

**Fix:** Moved `express: ^5.2.1` and `zod: ^4.0.0` to `dependencies`. `@types/express` remains in `devDependencies` (type-only, not needed at runtime).

### REQUIREMENTS.md

All target checkboxes (PROP-01, PROP-03, PROP-04, INV-01–04, TIME-01–02) were already marked `[x]` and the traceability entries for INFRA-01 and INFRA-03 already referenced Phase 6 — no changes required.

## Deviations from Plan

**1. [Rule 1 - Bug] express not present in devDependencies**
- **Found during:** Task 2
- **Issue:** Plan stated to move `express` from devDependencies to dependencies, but `express` was already absent from devDependencies (only `@types/express` was present). The fix was to simply add `express` to `dependencies`.
- **Fix:** Added `express: ^5.2.1` to `dependencies` directly (no move needed).
- **Files modified:** package.json
- **Commit:** b52fc18

**2. REQUIREMENTS.md already reconciled**
- **Found during:** Task 2 verification
- **Issue:** Plan warned that checkboxes might already be `[x]` — confirmed they were. No checkbox changes needed.
- **Fix:** No action required; plan's contingency was correct.
- **Impact:** None — acceptance criteria still met.

## Known Stubs

None. All changes are corrective fixes to existing functional code — no placeholder data or unresolved TODOs.

## Self-Check: PASSED

- supabase/migrations/20260328000009_fix_set_app_user_id_scope.sql: FOUND
- supabase/tests/rls_session_scope.test.sql: FOUND
- src/lib/with-user-context.ts contains "session scope": CONFIRMED
- package.json express in dependencies: CONFIRMED
- package.json zod in dependencies: CONFIRMED
- Commit 550666a: FOUND
- Commit b52fc18: FOUND
