---
phase: 01-data-foundation
plan: 02
subsystem: database
tags: [postgres, supabase, rls, migrations, sql, pgcrypto]

# Dependency graph
requires:
  - phase: 01-data-foundation/01-01
    provides: pgcrypto + moddatetime extensions in extensions schema, project_status/proposal_status/invoice_status/scope_change_classification/follow_up_type enums, current_app_user_id() RLS helper
provides:
  - api_keys table with SHA-256 key hashing and validate_api_key() function
  - clients table with soft delete, billing_rate, currency
  - projects table with project_status enum and client FK
  - proposals table with proposal_status enum and client/project FKs
  - invoices table with invoice_status enum, line_items jsonb, tax fields, nullable proposal FK
  - time_entries table with duration_minutes and billable flag
  - scope_definitions table with unique(project_id) constraint
  - scope_changes table with scope_change_classification enum
  - follow_ups table with follow_up_type enum, nullable project FK
  - All 9 domain tables with RLS, moddatetime triggers, soft delete
affects: [01-03, 02-mcp-server, 03-skill-pack]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - RLS with (select current_app_user_id()) subquery optimization on every domain table
    - Soft delete via archived_at timestamptz column; SELECT policies filter archived_at IS NULL
    - No DELETE RLS policies anywhere — updates to archived_at handle all deletions
    - moddatetime trigger using extensions.moddatetime (schema-qualified to avoid search_path issues)
    - validate_api_key() uses extensions.digest (schema-qualified SHA-256) with SECURITY DEFINER
    - Foreign keys to auth.users ON DELETE CASCADE for all domain tables
    - Nullable FKs for optional relationships (invoices.proposal_id, follow_ups.project_id)

key-files:
  created:
    - supabase/migrations/20260328000003_create_api_keys.sql
    - supabase/migrations/20260328000004_create_clients_projects.sql
    - supabase/migrations/20260328000005_create_proposals_invoices.sql
    - supabase/migrations/20260328000006_create_time_scope.sql
    - supabase/migrations/20260328000007_create_follow_ups.sql
  modified: []

key-decisions:
  - "api_keys stores key_prefix (display) + key_hash (SHA-256 for validation) separately — never stores plaintext key"
  - "validate_api_key() is SECURITY DEFINER so it can read api_keys table despite RLS, called by MCP server auth middleware"
  - "scope_definitions has unique(project_id) — enforces exactly one scope definition per project"
  - "follow_ups.project_id is nullable ON DELETE SET NULL — follow-ups can be client-level without a project"
  - "invoices.proposal_id is nullable — invoices can be created independently of proposals"
  - "All domain tables use (select current_app_user_id()) subquery in RLS policies for plan-cache optimization"

patterns-established:
  - "Pattern: Domain table = user_id FK + created_at + updated_at + archived_at + moddatetime trigger + RLS + SELECT/INSERT/UPDATE policies (no DELETE)"
  - "Pattern: RLS SELECT policies always include archived_at IS NULL filter"
  - "Pattern: RLS INSERT WITH CHECK never includes archived_at IS NULL (would block restore operations)"
  - "Pattern: All moddatetime and digest calls are schema-qualified (extensions.X) to prevent search_path pollution"

requirements-completed: [INFRA-01, INFRA-02, INFRA-03]

# Metrics
duration: 2min
completed: 2026-03-28
---

# Phase 01 Plan 02: Domain Table Migrations Summary

**All 9 FreelanceOS domain tables created as Supabase migrations with RLS, SHA-256 API key validation, soft delete, and per-table moddatetime triggers covering the complete freelance lifecycle**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-28T10:49:59Z
- **Completed:** 2026-03-28T10:51:48Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created api_keys table with validate_api_key() function using SHA-256 hashing (security definer, extensions.digest)
- Created clients, projects, proposals, invoices, time_entries, scope_definitions, scope_changes, follow_ups tables (8 domain tables)
- Applied consistent RLS pattern (SELECT/INSERT/UPDATE policies, no DELETE, subquery-optimized current_app_user_id()) across all 9 tables

## Task Commits

Each task was committed atomically:

1. **Task 1: Create api_keys and clients/projects migrations** - `94441d2` (feat)
2. **Task 2: Create proposals, invoices, time, scope, and follow_ups migrations** - `ce5470e` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `supabase/migrations/20260328000003_create_api_keys.sql` - api_keys table + validate_api_key() SECURITY DEFINER function
- `supabase/migrations/20260328000004_create_clients_projects.sql` - clients and projects tables with FK relationship
- `supabase/migrations/20260328000005_create_proposals_invoices.sql` - proposals and invoices with enum statuses, line_items jsonb
- `supabase/migrations/20260328000006_create_time_scope.sql` - time_entries, scope_definitions (unique per project), scope_changes
- `supabase/migrations/20260328000007_create_follow_ups.sql` - follow_ups with nullable project_id

## Decisions Made
- validate_api_key() declared SECURITY DEFINER so MCP server can call it without setting the app.current_user_id session variable first (chicken-and-egg: need to validate key to know user_id, need user_id to read api_keys via RLS)
- scope_definitions unique(project_id) constraint enforces the one-scope-per-project domain rule at the database level
- follow_ups.project_id nullable with ON DELETE SET NULL preserves follow-up history even if a project is deleted

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect column reference in projects index**
- **Found during:** Task 1 (clients/projects migration)
- **Issue:** `create index idx_projects_client_id on projects (project_id)` used wrong column — should be `client_id`
- **Fix:** Changed column reference from `project_id` to `client_id` in the index definition
- **Files modified:** supabase/migrations/20260328000004_create_clients_projects.sql
- **Verification:** Index name matches the column it indexes
- **Committed in:** 94441d2 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Minor correction — wrong column reference in an index would cause a SQL error when the migration is applied.

## Issues Encountered
None beyond the column reference bug above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 9 domain tables defined with RLS, triggers, and relationships
- Plan 03 can proceed to create seed data, pgTAP tests, and generate TypeScript types
- MCP server (Phase 02) depends on this schema being finalized — no breaking changes should be made after Phase 02 begins

---
*Phase: 01-data-foundation*
*Completed: 2026-03-28*
