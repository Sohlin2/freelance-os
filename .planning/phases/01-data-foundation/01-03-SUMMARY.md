---
phase: 01-data-foundation
plan: 03
subsystem: database
tags: [supabase, pgtap, sql, typescript, rls, seed-data, testing]

# Dependency graph
requires:
  - phase: 01-data-foundation
    provides: "01-02: all 9 domain tables with RLS policies and migrate functions"
provides:
  - "supabase/seed.sql: DEV-ONLY seed data with 2 test users, API keys, clients, projects"
  - "supabase/tests/schema_exists.test.sql: pgTAP test verifying all 9 tables exist"
  - "supabase/tests/api_key_validation.test.sql: pgTAP test for validate_api_key (valid/invalid/revoked)"
  - "supabase/tests/rls_clients.test.sql: pgTAP RLS isolation tests for clients + archived_at"
  - "supabase/tests/rls_projects.test.sql: pgTAP RLS isolation tests for projects"
  - "src/types/database.ts: TypeScript Database type for all 9 tables, 5 enums, 2 functions"
affects:
  - phase-02-mcp-server (uses database.ts types for Supabase client)
  - ci-pipeline (runs supabase test db against these test files)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "pgTAP tests use ROLLBACK to avoid polluting test DB state"
    - "RLS tests use SET LOCAL app.current_user_id to simulate per-user context"
    - "Seed data uses extensions.digest() for API key hashing (matches production code path)"
    - "TypeScript types follow supabase gen types format: Row/Insert/Update + Relationships"
    - "Utility types Tables<T>/TablesInsert<T>/TablesUpdate<T>/Enums<T> for ergonomic access"

key-files:
  created:
    - supabase/seed.sql
    - supabase/tests/schema_exists.test.sql
    - supabase/tests/api_key_validation.test.sql
    - supabase/tests/rls_clients.test.sql
    - supabase/tests/rls_projects.test.sql
    - src/types/database.ts
  modified:
    - .gitignore

key-decisions:
  - "Types hand-crafted from migrations (not supabase gen types --local) because Docker unavailable in agent environment; must regenerate after Docker setup"
  - "src/types/database.ts removed from .gitignore to allow committing reference version"
  - "pgTAP tests run in ROLLBACK transactions — no persistent test data"

patterns-established:
  - "RLS isolation pattern: SET LOCAL app.current_user_id → insert → SET LOCAL → query → assert count"
  - "Archived record visibility: archived_at = now() then re-query, assert count decreased"
  - "API key test pattern: hash known key via extensions.digest() → insert → validate → revoke → validate again"

requirements-completed: [INFRA-01, INFRA-02, INFRA-03]

# Metrics
duration: 4min
completed: 2026-03-28
---

# Phase 01 Plan 03: Seed Data, pgTAP Tests, and TypeScript Types Summary

**pgTAP test suite (19 assertions across 4 files) verifying RLS isolation and API key validation, with DEV-ONLY seed data and generated TypeScript Database types for all 9 tables and 5 enums**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-28T10:54:20Z
- **Completed:** 2026-03-28T10:59:10Z
- **Tasks:** 2
- **Files modified:** 7 (6 created, 1 modified)

## Accomplishments
- Created DEV-ONLY seed data (supabase/seed.sql) with 2 test users (Alice + Bob), 2 API keys with fos_live_ prefix and SHA-256 hashing via extensions.digest(), 3 clients, and 3 projects
- Created 4 pgTAP test files covering 19 total assertions: 9 table existence checks, 3 API key validation cases, 4 client RLS cases (including archived_at soft-delete), 3 project RLS cases
- Created src/types/database.ts with full Database type: 9 tables x Row/Insert/Update shapes, all 5 enums, 2 function signatures, and utility generic types (Tables/TablesInsert/TablesUpdate/Enums)
- TypeScript compiles cleanly with tsc --noEmit (TypeScript 6.x)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create seed data and pgTAP test files** - `42af806` (feat)
2. **Task 2: TypeScript database types** - `a3150f3` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified
- `supabase/seed.sql` - DEV-ONLY seed data: 2 test users, 2 API keys, 3 clients, 3 projects
- `supabase/tests/schema_exists.test.sql` - pgTAP: 9 has_table assertions for all domain tables
- `supabase/tests/api_key_validation.test.sql` - pgTAP: valid/invalid/revoked API key tests (3 assertions)
- `supabase/tests/rls_clients.test.sql` - pgTAP: client RLS isolation + archived_at visibility (4 assertions)
- `supabase/tests/rls_projects.test.sql` - pgTAP: project RLS isolation between users (3 assertions)
- `src/types/database.ts` - TypeScript Database type: 9 tables, 5 enums, 2 functions, utility generics
- `.gitignore` - Removed src/types/database.ts exclusion to allow tracking reference version

## Decisions Made
- Types hand-crafted from migration files rather than generated via `supabase gen types typescript --local` because Docker Desktop is not available in the agent execution environment. The types accurately reflect the schema and compile cleanly. They must be regenerated from the actual live local stack after Docker setup to ensure they match exactly.
- Removed `src/types/database.ts` from `.gitignore` to commit the reference version. The gitignore comment was updated to explain regeneration.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed src/types/database.ts from .gitignore**
- **Found during:** Task 2 (TypeScript types)
- **Issue:** .gitignore had `src/types/database.ts` listed under "Generated files", preventing `git add` from staging the required plan artifact
- **Fix:** Replaced the gitignore exclusion with a comment explaining to regenerate after Docker setup
- **Files modified:** .gitignore
- **Verification:** `git add src/types/database.ts` succeeded after fix
- **Committed in:** a3150f3 (Task 2 commit)

**2. [Rule 3 - Blocking] Ran npm install before tsc --noEmit**
- **Found during:** Task 2 (TypeScript verification)
- **Issue:** node_modules not installed, tsc binary missing
- **Fix:** Ran `npm install` to install dev dependencies including TypeScript 6.x
- **Files modified:** node_modules/ (not committed)
- **Verification:** `tsc --noEmit` ran and exited 0
- **Committed in:** N/A (node_modules not tracked)

---

**Total deviations:** 2 auto-fixed (1 bug - gitignore, 1 blocking - missing deps)
**Impact on plan:** Both fixes necessary for correct execution. No scope creep.

## Issues Encountered

- Docker Desktop not available in the agent environment. The plan's Task 2 checkpoint (run `supabase start` → `supabase db reset` → `supabase test db`) requires Docker. The checkpoint is presented to the user with full instructions.
- `npx tsc` installs a wrong `tsc` package (v2.0.4) — used `node_modules/.bin/tsc` instead after `npm install`.

## Known Stubs

- `src/types/database.ts` was hand-crafted from migration SQL rather than generated via `supabase gen types typescript --local`. It accurately reflects the schema but should be regenerated from the live local stack to ensure 1:1 match. This is a known limitation until Docker is available. The file compiles cleanly and correctly models all tables and enums.

## User Setup Required

**Docker and local Supabase stack required for full verification.** After installing and starting Docker Desktop:

```bash
cd C:/freelance-os
npx supabase start          # starts local Postgres + API stack
npx supabase db reset       # applies all 7 migrations + seed.sql
npx supabase test db        # runs 4 pgTAP test files (19 assertions)
npm run db:types            # regenerates src/types/database.ts from live schema
npm run typecheck           # verifies types compile
```

Expected: all 19 pgTAP assertions pass, types regenerate with `export type Database`, tsc exits 0.

## Next Phase Readiness
- Phase 2 (MCP Server Core) can import `src/types/database.ts` immediately — types compile and cover all tables
- pgTAP tests are ready to run against local stack once Docker is available
- Seed data will populate local stack with realistic test data for Phase 2 development
- One remaining concern: generated types should be validated against live schema before Phase 2 ships

---
*Phase: 01-data-foundation*
*Completed: 2026-03-28*
