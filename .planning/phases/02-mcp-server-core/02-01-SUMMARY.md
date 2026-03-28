---
phase: 02-mcp-server-core
plan: "01"
subsystem: infra
tags: [mcp, express, supabase, auth, api-keys, streamable-http, vitest, typescript]

# Dependency graph
requires:
  - phase: 01-data-foundation
    provides: Supabase schema with api_keys, validate_api_key RPC, set_app_user_id migration target, database TypeScript types

provides:
  - Express MCP server with Streamable HTTP transport at POST /mcp
  - API key auth middleware rejecting invalid/missing keys with 401 before MCP processing
  - Singleton admin Supabase client for auth-only calls
  - Per-request user-scoped Supabase client with transaction-scoped user context
  - set_app_user_id SQL migration for RLS policy user context setting
  - Vitest test framework configured for Node environment
  - 6 auth middleware unit tests

affects: [02-mcp-server-core, tool-plans, integration-tests]

# Tech tracking
tech-stack:
  added:
    - "@modelcontextprotocol/sdk ^1.12.1 (Streamable HTTP transport, McpServer)"
    - "express (HTTP server for MCP transport)"
    - "@types/node (TypeScript Node types)"
    - "@types/express (TypeScript Express types)"
    - "tsup (bundler for npm distribution)"
  patterns:
    - "buildServer(userId) factory pattern threads userId into tool handlers via closure"
    - "Stateless Streamable HTTP — new McpServer + transport per request, sessionIdGenerator: undefined"
    - "Singleton admin client for validate_api_key, fresh client per request for user-scoped queries"
    - "Transaction scope (true) for set_config — context clears at transaction end, not session end"

key-files:
  created:
    - src/server.ts
    - src/middleware/auth.ts
    - src/lib/supabase.ts
    - src/lib/with-user-context.ts
    - vitest.config.ts
    - tests/middleware/auth.test.ts
    - supabase/migrations/20260328000008_create_set_app_user_id.sql
    - .env.example
  modified:
    - package.json (added MCP SDK, express, @types/node, @types/express, tsup)
    - src/types/database.ts (added set_app_user_id function type)

key-decisions:
  - "Transaction scope (true) for set_app_user_id over session scope (false) — context auto-clears at transaction end, preventing cross-request user leakage"
  - "Stateless Streamable HTTP — new McpServer + transport per request avoids session state complexity and matches research pattern 1"
  - "buildServer(userId) factory closes over userId at request time, threading auth identity into all tool handlers without global state"
  - "Singleton admin client for validate_api_key only; fresh client per withUserContext call prevents cross-user state leakage"

patterns-established:
  - "Pattern: All tool files import zod from zod/v4 (per CLAUDE.md Zod v4 requirement)"
  - "Pattern: All local imports use .js extension (Node16 module resolution)"
  - "Pattern: Auth middleware sets req.userId before MCP processing — tools never handle auth"

requirements-completed: [CRM-01]

# Metrics
duration: 5min
completed: "2026-03-28"
---

# Phase 2 Plan 01: MCP Server Bootstrap Summary

**Express MCP server with Streamable HTTP transport, API key auth middleware via validate_api_key RPC, per-request user-scoped Supabase client with transaction-safe context isolation, and 6-test vitest suite**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-28T13:39:49Z
- **Completed:** 2026-03-28T13:44:59Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- Express server with Streamable HTTP transport at POST /mcp — all tool plans build on this
- Auth middleware gates every MCP request with API key validation before any MCP processing
- withUserContext helper ensures RLS policies fire correctly via transaction-scoped session variable
- set_app_user_id migration created (push deferred to user setup with Supabase credentials)
- Vitest configured and 6 auth unit tests passing

## Task Commits

1. **Task 1: Install dependencies, create migration, configure vitest** - `b97e0b1` (chore)
2. **Task 2: Create server entry point, auth middleware, Supabase helpers** - `02ad78b` (feat)
3. **Task 3: Create auth middleware unit tests** - `6a66db9` (test)

## Files Created/Modified

- `src/server.ts` - Express app with Streamable HTTP transport, buildServer(userId) factory
- `src/middleware/auth.ts` - API key auth middleware, 401 before MCP processing
- `src/lib/supabase.ts` - Singleton admin Supabase client for auth-only calls
- `src/lib/with-user-context.ts` - Per-request user-scoped client with transaction-scope safety
- `vitest.config.ts` - Test framework config for Node environment
- `tests/middleware/auth.test.ts` - 6 unit tests for auth middleware
- `supabase/migrations/20260328000008_create_set_app_user_id.sql` - RPC function for RLS context
- `.env.example` - Documents required env vars (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PORT)
- `package.json` - Added @modelcontextprotocol/sdk, express, @types/node, @types/express, tsup
- `src/types/database.ts` - Added set_app_user_id function type

## Decisions Made

- **Transaction scope for set_app_user_id:** Used `set_config(..., true)` (transaction scope) over `false` (session scope). Transaction scope clears context automatically at transaction end, preventing cross-request user leakage if connection is reused by the pool.
- **Stateless Streamable HTTP:** New McpServer + transport per request, `sessionIdGenerator: undefined`. Avoids session state complexity; matches MCP research pattern 1 for remote servers.
- **buildServer(userId) factory:** Closes over userId at request time. Tool handlers can access userId via closure without global state or thread-local hacks.
- **Singleton admin client:** createAdminClient() is a singleton used only for validate_api_key. withUserContext creates a fresh client per call so user context never bleeds between requests.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added set_app_user_id to database.ts function types**
- **Found during:** Task 2 (creating with-user-context.ts)
- **Issue:** The `db.rpc('set_app_user_id', ...)` call would fail TypeScript compilation without the function type in database.ts. The plan listed database.ts as not modified but the type was required for correctness.
- **Fix:** Added `set_app_user_id: { Args: { p_user_id: string }; Returns: undefined }` to the Functions section
- **Files modified:** src/types/database.ts
- **Verification:** `npx tsc --noEmit` exits with 0 errors
- **Committed in:** b97e0b1 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 - missing critical type)
**Impact on plan:** Essential for TypeScript compilation. No scope creep.

## Issues Encountered

- **Supabase push not executed:** `npx supabase db push` requires the project to be linked (`supabase link`) with a valid access token and project ref. These are not present in this worktree. The migration SQL file is created correctly and will be pushed when the user runs `npx supabase link` and `npx supabase db push` with their credentials. Documented in user_setup in the plan frontmatter.

## User Setup Required

Supabase migration push requires manual configuration:

1. Run `npx supabase login` and `npx supabase link --project-ref <your-project-ref>`
2. Copy `.env.example` to `.env` and fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
3. Run `npx supabase db push` to deploy the `set_app_user_id` migration
4. Verify: `curl -X POST http://localhost:3000/mcp` should return 401 after starting the server

## Known Stubs

None — no hardcoded data or placeholder values in created files. The `buildServer(userId)` factory has comments indicating where tool registrations will go in Plans 02/03, but this is intentional scaffolding per the plan objective.

## Next Phase Readiness

- Server entry point ready for tool registration (Plans 02/03 add registerClientTools, registerProjectTools)
- Auth middleware wired and tested — all tool plans can assume req.userId is always set
- withUserContext ready for all CRUD operations — import and call with the userId from req
- TypeScript compiles cleanly, all imports use .js extensions
- Blocker: Supabase migration must be pushed before server can process authenticated requests

---
*Phase: 02-mcp-server-core*
*Completed: 2026-03-28*
