---
phase: 02-mcp-server-core
plan: "03"
subsystem: mcp-tools
tags: [mcp, tools, projects, crud, status-tracking, search-filter]
dependency_graph:
  requires: ["02-01", "02-02"]
  provides: ["project-tools"]
  affects: ["src/server.ts", "src/tools/projects.ts"]
tech_stack:
  added: []
  patterns:
    - "registerProjectTools(server, userId) pattern follows same shape as registerClientTools"
    - "withUserContext wraps all DB operations for RLS safety"
    - "Soft delete via archived_at (not hard delete) per D-02"
    - "list_projects uses conditional query chain for optional filters"
key_files:
  created:
    - src/tools/projects.ts
    - tests/tools/projects.test.ts
  modified:
    - src/server.ts
    - tsconfig.json
decisions:
  - "Explicit status: 'active' in create_project insert payload (clear intent, even though DB default covers it)"
  - "get_project joins clients(id, name, email, company) so Claude has client context when discussing a project"
  - "list_projects count via { count: 'exact' } returns pagination metadata"
  - "update_project filters undefined values from spread to avoid overwriting DB fields with undefined"
metrics:
  duration: "~6 minutes"
  completed_date: "2026-03-28"
  tasks: 2
  files: 4
requirements-completed: [CRM-02, CRM-04]
---

# Phase 02 Plan 03: Project MCP Tools Summary

**One-liner:** 5 project CRUD tools (create/get/list/update/archive) with status tracking and name/status/client filters, wired into buildServer() and covered by 14 unit tests.

## What Was Built

### src/tools/projects.ts

Exports `registerProjectTools(server: McpServer, userId: string): void` with 5 MCP tools:

| Tool | Description | Key Behavior |
|------|-------------|--------------|
| `create_project` | Create project linked to client | Defaults status to 'active'; requires client_id |
| `get_project` | Get project with parent client info | Joins clients(id, name, email, company); excludes archived |
| `list_projects` | List/search/filter projects | Status filter (CRM-04), client_id filter, name ILIKE search (CRM-04), pagination |
| `update_project` | Update fields or change status | status enum: active/paused/completed; guards empty update |
| `archive_project` | Soft delete via archived_at | Only archives non-archived projects; returns error if not found |

### src/server.ts

Added `import { registerProjectTools } from './tools/projects.js'` and `registerProjectTools(server, userId)` call inside `buildServer()`, after existing `registerClientTools`.

### tests/tools/projects.test.ts

14 unit tests across 5 describe blocks. Tests verify:
- Success paths return full JSON row as text content
- Error paths return `isError: true` with human-readable message (D-07)
- Status filter calls `.eq('status', value)` (CRM-04)
- Client filter calls `.eq('client_id', value)`
- Name search calls `.ilike('name', '%value%')` (CRM-04)
- No-fields-to-update guard skips DB call entirely
- Archive tool uses `.is('archived_at', null)` to prevent double-archive

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] tsconfig.json missing local node_modules for worktree**
- **Found during:** Task 1 verification (`npx tsc --noEmit`)
- **Issue:** The worktree at `agent-a71b8fd0` has no `node_modules/` directory; `@types/node` and `@types/express` were referenced in root `package.json` but not available to `tsc` running in the worktree context
- **Fix:** Ran `npm install --save-dev @types/node @types/express` in the worktree to create local `node_modules/@types` packages
- **Files modified:** `package.json` (worktree), `package-lock.json` (worktree), `tsconfig.json` (reverted experimental typeRoots change)
- **Commit:** included in `feat(02-03)` commit (tsconfig.json change was ultimately reverted to original, npm install created local node_modules)

## Known Stubs

None. All 5 tools wire directly to Supabase via `withUserContext`. No placeholder data or hardcoded responses.

## Verification Results

- `npx tsc --noEmit`: PASS (0 errors)
- `npx vitest run tests/tools/projects.test.ts`: PASS (14/14 tests)
- `npx vitest run`: PASS (33/33 tests — auth, client, project suites all pass)

## Self-Check: PASSED

Files verified to exist:
- `src/tools/projects.ts` - FOUND
- `tests/tools/projects.test.ts` - FOUND
- `src/server.ts` (modified) - FOUND

Commits verified:
- `801c6d0` — feat(02-03): implement 5 project MCP tools and wire into server
- `8eea003` — test(02-03): add 14 unit tests for all 5 project MCP tools
