---
phase: 03-full-tool-suite
plan: 02
subsystem: api
tags: [mcp, supabase, typescript, invoices, line-items, jsonb]

# Dependency graph
requires:
  - phase: 03-full-tool-suite
    provides: registerClientTools and registerProjectTools patterns used as reference for invoice tools
provides:
  - registerInvoiceTools export in src/tools/invoices.ts
  - 4 MCP tools: create_invoice, get_invoice, list_invoices, update_invoice
  - JSONB line_items support with subtotal/tax/total fields
  - proposal_id FK linking invoices to proposals (INV-03)
  - Status filtering (draft/sent/paid/overdue/void) and date range filtering (INV-04)
affects: [03-full-tool-suite, server-index, proposal-tools]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Invoice tool registration follows same registerTool/withUserContext/error-handling pattern as client and project tools"
    - "JSONB line_items passed as-is to Supabase insert (no extra serialization needed)"
    - "Date range filtering uses .gte('issued_at', date_from) and .lte('issued_at', date_to)"

key-files:
  created:
    - src/tools/invoices.ts
    - tests/tools/invoices.test.ts
  modified: []

key-decisions:
  - "line_items uses z.array(z.object(...)) schema matching Supabase Json type — Zod validates structure, Supabase stores as JSONB"
  - "list_invoices conditional filter chain applies status/client_id/project_id/date_from/date_to only when provided"
  - "update_invoice filters undefined values from update payload before checking for empty update (same pattern as update_client)"

patterns-established:
  - "Invoice tools: same 4-tool pattern (create/get/list/update) as clients and projects"

requirements-completed: [INV-01, INV-02, INV-03, INV-04]

# Metrics
duration: 4min
completed: 2026-03-28
---

# Phase 03 Plan 02: Invoice Tools Summary

**4 invoice MCP tools with JSONB line_items, status lifecycle (draft/sent/paid/overdue/void), proposal_id FK, and status/client/date-range filtering**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-28T15:12:56Z
- **Completed:** 2026-03-28T15:16:15Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Implemented `registerInvoiceTools` with 4 MCP tools: create_invoice, get_invoice, list_invoices, update_invoice
- JSONB line_items array with per-item description/quantity/unit/rate/amount fields (INV-01)
- create_invoice accepts optional proposal_id FK to link invoice to source proposal (INV-03)
- list_invoices supports status, client_id, project_id, date_from, date_to filters (INV-04)
- update_invoice handles status transitions across all 5 enum values (INV-02)
- 13 unit tests passing covering success paths, error paths, filter behavior, and edge cases

## Task Commits

1. **Task 1: Create invoice tool tests** - `28a8735` (test)
2. **Task 2: Implement invoice tools** - `89913b4` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `src/tools/invoices.ts` - registerInvoiceTools export with 4 MCP tools
- `tests/tools/invoices.test.ts` - 13 test cases covering all 4 tools and filter variants

## Decisions Made

- `line_items` uses `z.array(z.object(...))` schema that matches the Supabase `Json` type — no extra serialization needed, Supabase stores the parsed array directly as JSONB
- Conditional query chain for list_invoices appends each filter only when the argument is provided, identical to the pattern used in list_projects
- `update_invoice` strips `undefined` values from the update payload before checking if the payload is empty — same guard used in `update_client`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Invoice tools ready for registration in the main MCP server index (src/index.ts)
- Proposal tools (plan 03) can reference `proposal_id` as the FK that links proposals to invoices
- Time entry tools (plan 04) can follow the same 4-tool pattern established here

---
*Phase: 03-full-tool-suite*
*Completed: 2026-03-28*
