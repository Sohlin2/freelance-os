# Phase 6: Critical Integration Fixes - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix two critical cross-phase integration breaks found by the v1.0 milestone audit — RLS context scope mismatch (BROKEN-02) and missing runtime dependencies (MISSING-01, MISSING-02) — so the system works end-to-end at runtime. Closes gaps BROKEN-02, MISSING-01, MISSING-02, BROKEN-FLOW-01, BROKEN-FLOW-02.

</domain>

<decisions>
## Implementation Decisions

### Migration Strategy
- **D-01:** Create a new migration (000009) that runs `CREATE OR REPLACE` for `set_app_user_id` with `set_config(..., false)` (session scope). Do not edit the original 000008 migration — preserve migration history even though 000008 was never applied to production.
- **D-02:** Update `src/lib/with-user-context.ts` comment to reflect session scope rationale: PostgREST sends each query as a separate transaction, so transaction scope clears user context before data queries execute.

### Dependency Scope
- **D-03:** Move `express` and `zod` from `devDependencies` to `dependencies` in `package.json`. The npm package still only ships skills (`files[]` excludes `src/`), but anyone cloning the repo can run the server without `--include=dev`.
- **D-04:** Add `express` version `^5.2.1` and `zod` version `^4.0.0` to dependencies (matching current devDeps versions). Remove from devDependencies.

### Documentation Reconciliation
- **D-05:** Fix REQUIREMENTS.md checkboxes — update the 10 requirements still showing `[ ]` despite being implemented (PROP-01/03/04, INV-01-04, TIME-01/02).
- **D-06:** Update `with-user-context.ts` code comments to explain session scope choice.
- **D-07:** Skip SUMMARY frontmatter gaps, ROADMAP status inconsistencies, and VERIFICATION.md cosmetic issues — those are non-critical and can be addressed in a separate cleanup pass.

### Testing Approach
- **D-08:** Add a pgTAP test that calls `set_app_user_id` then queries a table to verify RLS sees the user context with session scope. Runs in `supabase test db` alongside existing Phase 1 tests.

### Claude's Discretion
- Exact pgTAP test structure and assertions
- New migration filename/timestamp convention
- Comment wording in with-user-context.ts
- Whether to add a note to existing 000008 migration comment pointing to the corrective 000009

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Audit findings (primary source of truth for this phase)
- `.planning/v1.0-MILESTONE-AUDIT.md` — BROKEN-02 (RLS scope), MISSING-01/02 (runtime deps), BROKEN-FLOW-01/02 (E2E flow breaks), all tech debt items

### Code to fix
- `supabase/migrations/20260328000008_create_set_app_user_id.sql` — Current migration with `set_config(..., true)` that must be corrected via new migration
- `src/lib/with-user-context.ts` — `withUserContext` wrapper with comments explaining transaction scope choice (comments need updating)
- `package.json` — express/zod in devDependencies, need to move to dependencies

### Prior phase context
- `.planning/phases/01-data-foundation/01-CONTEXT.md` — D-09: service role key + session variable pattern, D-05: API key format
- `.planning/phases/02-mcp-server-core/02-CONTEXT.md` — D-09/D-10: Express server structure, withUserContext pattern
- `.planning/phases/05-plugin-packaging/05-CONTEXT.md` — D-07: npm package ships skills only, D-04: API key via userConfig

### Requirements
- `.planning/REQUIREMENTS.md` — INFRA-01, INFRA-03 (affected requirements for this phase)

### Existing tests
- `supabase/tests/` — Existing pgTAP tests from Phase 1 (schema, API key, RLS isolation)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `supabase/tests/` — Existing pgTAP test infrastructure from Phase 1 (can follow same patterns for new RLS scope test)
- `src/lib/with-user-context.ts` — `withUserContext` wrapper already handles the RPC call; only comment update needed, no logic change for the RPC call itself (the fix is in the SQL function)

### Established Patterns
- Supabase migrations in `supabase/migrations/` with timestamp-prefixed filenames
- pgTAP tests run via `supabase test db`
- `createUserClient()` creates service-role Supabase client; `withUserContext()` wraps it with user context RPC

### Integration Points
- Migration 000009 → changes behavior of `set_app_user_id` RPC → affects every `withUserContext` call → affects all 37 MCP tools
- `package.json` dependencies → affects `npm install` → affects self-hosted server startup flow

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The audit provides exact file paths and exact fixes; this phase applies them with proper migration and testing practices.

</specifics>

<deferred>
## Deferred Ideas

- SUMMARY frontmatter gaps across 14 plans — cosmetic, not blocking
- ROADMAP.md phase status inconsistencies (Phase 2/4 still showing "In Progress") — cosmetic
- VERIFICATION.md frontmatter/body inconsistency in Phase 2 — cosmetic
- `.mcp.json` placeholder URL (`mcp.freelanceos.dev`) — requires server deployment, separate concern

</deferred>

---

*Phase: 06-critical-integration-fixes*
*Context gathered: 2026-03-28*
