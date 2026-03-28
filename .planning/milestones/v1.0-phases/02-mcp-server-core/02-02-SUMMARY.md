---
phase: 02-mcp-server-core
plan: 02
subsystem: client-tools
tags: [mcp-tools, client-crm, crud, search, pagination, soft-delete]
dependency_graph:
  requires: [02-01]
  provides: [client-tools-registered, CRM-01, CRM-03, CRM-04]
  affects: [src/server.ts, src/tools/clients.ts]
tech_stack:
  added: []
  patterns:
    - withUserContext for RLS-safe DB access in all tool handlers
    - Supabase relationship join (select with nested tables) for get_client
    - Conditional query builder for list_clients search/filter/pagination
    - Soft delete via archived_at timestamp for archive_client
    - isError: true pattern for MCP tool error responses (D-07)
    - vi.spyOn(server, 'registerTool') to capture handlers for unit testing
key_files:
  created:
    - src/tools/clients.ts
    - tests/tools/clients.test.ts
  modified:
    - src/server.ts
    - package.json
    - package-lock.json
decisions:
  - "@types/node and @types/express were missing from devDependencies despite being required by existing src files; installed as Rule 3 auto-fix to unblock TypeScript compilation"
metrics:
  duration: 185 seconds
  tasks_completed: 2
  files_created: 2
  files_modified: 3
  completed_date: "2026-03-28"
requirements-completed: [CRM-01, CRM-03, CRM-04]
---

# Phase 02 Plan 02: Client MCP Tools Summary

**One-liner:** Five client CRUD MCP tools (create, get, list, update, archive) with relationship joins, ILIKE search, and soft-delete wired into the server's buildServer factory.

## What Was Built

### Task 1: Implement all 5 client MCP tools

Created `src/tools/clients.ts` exporting `registerClientTools(server, userId)` which registers:

1. **create_client** — Inserts a new client row with user_id scoped via withUserContext
2. **get_client** — Fetches client + projects + follow_ups via Supabase relationship join (CRM-03)
3. **list_clients** — Lists active clients with optional ILIKE name search (CRM-04), sort field/direction, and limit/offset pagination
4. **update_client** — Updates client fields; returns early with isError if no fields provided
5. **archive_client** — Soft-deletes via `archived_at = NOW()`, only matches non-archived rows

Updated `src/server.ts` to import and call `registerClientTools(server, userId)` inside `buildServer()`.

### Task 2: Write unit tests for all client tools

Created `tests/tools/clients.test.ts` with 13 tests across 5 describe blocks:
- `create_client`: success path, DB error path
- `get_client`: success with relations (verifies projects + follow_ups arrays), not-found path
- `list_clients`: basic list, ILIKE search filter verification, pagination range verification, DB error
- `update_client`: success, no-fields-provided guard, DB error
- `archive_client`: success with archived_at set, already-archived error

Testing strategy: mock `withUserContext` to call the fn with a chainable mock Supabase builder; spy on `server.registerTool` to capture handler callbacks for direct invocation.

## Verification Results

- `npx tsc --noEmit` — 0 errors
- `npx vitest run tests/tools/clients.test.ts` — 13/13 pass
- `npx vitest run` — 19/19 pass (auth + client tests)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing @types/node and @types/express**
- **Found during:** Task 1 TypeScript verification
- **Issue:** `npx tsc --noEmit` produced 18 errors from pre-existing files (src/lib/supabase.ts, src/lib/with-user-context.ts, src/middleware/auth.ts, src/server.ts) due to missing Node.js and Express type declarations; the plan required 0 tsc errors
- **Fix:** `npm install --save-dev @types/node @types/express`
- **Files modified:** package.json, package-lock.json
- **Commit:** 2612ab1

## Commits

| Hash | Message |
|------|---------|
| 2612ab1 | feat(02-02): implement 5 client MCP tools and wire into server |
| fb7050a | test(02-02): add 13 unit tests for all 5 client MCP tools |

## Known Stubs

None — all tools are fully wired to `withUserContext` and Supabase. No hardcoded data, no placeholder responses.

## Self-Check: PASSED

- src/tools/clients.ts: FOUND
- tests/tools/clients.test.ts: FOUND
- Commit 2612ab1: FOUND
- Commit fb7050a: FOUND
