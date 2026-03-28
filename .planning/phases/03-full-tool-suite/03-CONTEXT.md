# Phase 3: Full Tool Suite - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

All remaining freelance domain entity tools — proposals, invoices, time entries, scope definitions, scope changes, and follow-ups — have working MCP tools backed by domain logic. Covers PROP-01, PROP-03, PROP-04, INV-01, INV-02, INV-03, INV-04, TIME-01, TIME-02, SCOPE-01, SCOPE-02, SCOPE-03, SCOPE-04, FLLW-01, FLLW-03.

</domain>

<decisions>
## Implementation Decisions

### Proposal Workflow
- **D-01:** Tools store user-provided content — Claude composes proposal text conversationally, then calls `create_proposal` to persist structured data (title, scope_summary, deliverables, total_amount, payment_terms, valid_until, notes). No content generation inside the tool.
- **D-02:** Deliverables stored as `text[]` (Postgres text array). Simple strings like "Website redesign - 5 pages". Not structured JSONB.
- **D-03:** Proposal statuses: `draft`, `sent`, `accepted`, `rejected`. Four states, no `expired` status.
- **D-04:** `accept_proposal` tool handles PROP-03 (auto-seed scope) — sets proposal status to `accepted` AND creates a `scope_definitions` record from the proposal's deliverables, scope_summary, and total_amount. Both operations in one transaction.
- **D-05:** Standard CRUD tools following Phase 2 pattern: `create_proposal`, `get_proposal`, `list_proposals`, `update_proposal`, plus the special `accept_proposal` tool.

### Invoice Generation
- **D-06:** Line items stored as JSONB array on the invoices table. Each item has description, quantity, unit, rate, amount. No separate line_items table.
- **D-07:** Claude assembles invoice data, tool stores — Claude calls `list_time_entries`, `get_proposal`, etc. to gather data, composes line items, then calls `create_invoice` with the complete payload. Same philosophy as proposals: tools are data stores, Claude is the brain.
- **D-08:** Dedicated `aggregate_time` tool for TIME-02 — returns total hours, total amount, entry count, and date range for a project. DB-side SUM for accuracy. Accepts optional start_date/end_date filters.
- **D-09:** Standard CRUD tools: `create_invoice`, `get_invoice`, `list_invoices`, `update_invoice`. Invoice statuses: `draft`, `sent`, `paid`, `overdue` (from existing DB enum).

### Time Entries
- **D-10:** Standard CRUD: `create_time_entry`, `get_time_entry`, `list_time_entries`, `update_time_entry`, `delete_time_entry`. Plus `aggregate_time` (see D-08).
- **D-11:** `list_time_entries` supports filtering by project_id, date range. Same filter pattern as Phase 2 list tools.

### Scope Management
- **D-12:** `check_scope` tool takes project_id and request_description, returns agreed scope (deliverables, boundaries) alongside the request and existing scope changes. Claude compares and advises — all AI reasoning stays in Claude, not in the tool.
- **D-13:** Scope change classifications: `in_scope`, `out_of_scope`, `gray_area`. Three-way classification with gray_area for ambiguous requests.
- **D-14:** Claude always asks the user before logging a scope change — no auto-logging. Freelancers need control over what's recorded (they may absorb small changes).
- **D-15:** Standard CRUD: `create_scope`, `get_scope`, `list_scope_changes`, `log_scope_change`. Plus `check_scope` (see D-12).

### Follow-up Drafting
- **D-16:** Two-step pattern: `get_followup_context` fetches all relevant data for a client/project (overdue invoices, project status, days since last contact, past follow-ups), then `create_followup` stores the draft with type and content.
- **D-17:** Follow-up types: `invoice_reminder`, `check_in`, `proposal_followup`, `thank_you`. Enum type helps Claude and skill pack key off the context.
- **D-18:** Follow-ups track status: `draft` (composed) and `sent` (user confirmed they sent it). `mark_followup_sent` tool to update status.
- **D-19:** Standard CRUD: `create_followup`, `get_followup`, `list_followups`, `mark_followup_sent`. Plus `get_followup_context` (see D-16).

### Claude's Discretion
- Exact Zod schemas for each tool's input validation
- Supabase query patterns (PostgREST builder vs raw SQL for aggregations)
- Tool description wording for optimal Claude invocation
- Pagination defaults on list tools
- Whether to add `archive_` tools for entities that may not need archival (time entries, scope changes)
- Ordering of tool registration files and any shared helpers

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project specs
- `.planning/PROJECT.md` — Core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — PROP-01 through FLLW-03 (15 requirements mapped to this phase)
- `.planning/ROADMAP.md` §Phase 3 — Success criteria, dependency on Phase 2

### Technology stack
- `CLAUDE.md` §Technology Stack — MCP SDK v1.28.0, Supabase JS v2.100.1, Zod v4, Node 20 LTS
- `CLAUDE.md` §Transport Decision — Streamable HTTP

### Prior phase foundations
- `.planning/phases/01-data-foundation/01-CONTEXT.md` — Schema decisions (snake_case, enums, soft delete, RLS auth flow)
- `.planning/phases/02-mcp-server-core/02-CONTEXT.md` — Tool patterns (one-tool-per-op, withUserContext, error responses, server structure)
- `src/tools/clients.ts` — Reference implementation for CRUD tool pattern
- `src/tools/projects.ts` — Reference implementation for CRUD tool pattern
- `src/lib/with-user-context.ts` — DB context wrapper all tools must use
- `src/server.ts` — Tool registration pattern (import + register per entity)

### Database schema
- `src/types/database.ts` — TypeScript types for all 9 domain tables
- `supabase/migrations/20260328000005_create_proposals_invoices.sql` — Proposals and invoices table schema
- `supabase/migrations/20260328000006_create_time_scope.sql` — Time entries, scope definitions, scope changes schema
- `supabase/migrations/20260328000007_create_follow_ups.sql` — Follow-ups table schema

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/tools/clients.ts` — Complete CRUD tool pattern (create, get, list, update, archive) with Zod schemas, withUserContext, error handling. Direct template for all 6 new entity files.
- `src/tools/projects.ts` — Same pattern with FK relationship (client_id). Template for entities with parent references (proposals→project, invoices→project, etc.).
- `src/lib/with-user-context.ts` — `withUserContext(userId, fn)` wrapper handles RLS session variable setup. All new tools use this.
- `src/lib/supabase.ts` — Supabase client factory.

### Established Patterns
- One file per entity in `src/tools/` with `registerXTools(server, userId)` export
- Zod v4 schemas via `import * as z from 'zod/v4'`
- Error responses: `{ content: [{ type: 'text', text: message }], isError: true }`
- Success responses: `{ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }`
- List tools accept optional filter params (search, status, sort_by, sort_dir, limit, offset)
- Soft delete via `archived_at` column, filtered out by default in queries

### Integration Points
- `src/server.ts` — New tool files must be imported and registered here (line 6-7 pattern)
- Database enums already exist for proposal_status, invoice_status, scope_change_classification, followup_type (created in Phase 1 migrations)
- `scope_definitions` has unique constraint on project_id — one scope per project, seeded by accept_proposal

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. All decisions captured above emerged from recommended patterns matching the Phase 2 established architecture.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-full-tool-suite*
*Context gathered: 2026-03-28*
