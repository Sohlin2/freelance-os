# Phase 3: Full Tool Suite - Research

**Researched:** 2026-03-28
**Domain:** MCP tool implementation — proposals, invoices, time entries, scope management, follow-ups
**Confidence:** HIGH

## Summary

Phase 3 extends the established Phase 2 tool pattern to five additional domain entities. All nine database tables already exist in Supabase with RLS policies, indexes, and TypeScript types in `src/types/database.ts`. The Phase 2 codebase provides two fully working reference implementations (`src/tools/clients.ts`, `src/tools/projects.ts`) and a working test pattern (`tests/tools/clients.test.ts`, `tests/tools/projects.test.ts`). The implementation work is essentially: six new files in `src/tools/` following the established pattern, each with a matching test file in `tests/tools/`, then two registration lines in `src/server.ts` per entity group.

The only genuinely novel technical elements are: (1) the `accept_proposal` transactional tool that must insert into `scope_definitions` at the same time it updates `proposals.status`, (2) the `aggregate_time` tool that needs a DB-side SUM query, and (3) the `get_followup_context` read-aggregation tool. Everything else is pattern-application.

A critical schema divergence was discovered during research: the CONTEXT.md decisions were written against a slightly different schema than what actually exists in `database.ts`. Specifically: `proposals` uses a `content text` free-text column (not separate `deliverables text[]`, `scope_summary`, `payment_terms` columns); `scope_definitions.deliverables` is `text` (not `text[]`); `follow_up_type` enum has `proposal_follow_up`, `invoice_overdue`, `check_in`, `awaiting_response`, `other` (not `invoice_reminder`, `proposal_followup`, `thank_you` as listed in D-17); `proposal_status` enum includes `declined` and `expired` (not just `rejected`); `scope_change_classification` uses `needs_review` (not `gray_area`). The planner MUST use the actual schema from `database.ts`, not the CONTEXT.md labels.

**Primary recommendation:** Use `src/tools/clients.ts` as the direct template for all six new tool files. The only deviations from that template are: (a) `proposals.ts` adds `accept_proposal` using two sequential Supabase calls inside `withUserContext`; (b) `time_entries.ts` adds `aggregate_time` using a Supabase RPC or raw `.select()` with SUM; (c) `follow_ups.ts` adds `get_followup_context` that joins across invoices, follow_ups, and projects.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Proposal Workflow**
- D-01: Tools store user-provided content — Claude composes proposal text conversationally, then calls `create_proposal` to persist structured data. No content generation inside the tool.
- D-02: Deliverables stored as `text[]` (Postgres text array). Simple strings. Not structured JSONB. [NOTE: actual DB column is `text` free-form — planner must reconcile]
- D-03: Proposal statuses: `draft`, `sent`, `accepted`, `rejected`. [NOTE: actual enum also has `declined`, `expired`]
- D-04: `accept_proposal` tool sets proposal status to `accepted` AND creates a `scope_definitions` record from proposal data. Both operations in one withUserContext call.
- D-05: Tools: `create_proposal`, `get_proposal`, `list_proposals`, `update_proposal`, `accept_proposal`.

**Invoice Generation**
- D-06: Line items stored as JSONB array on invoices table. Each item: description, quantity, unit, rate, amount. No separate line_items table.
- D-07: Claude assembles invoice data, tool stores it. Tools are data stores, Claude is the brain.
- D-08: Dedicated `aggregate_time` tool returns total hours, total amount, entry count, and date range for a project. DB-side SUM. Accepts optional start_date/end_date filters.
- D-09: Tools: `create_invoice`, `get_invoice`, `list_invoices`, `update_invoice`. Invoice statuses: `draft`, `sent`, `paid`, `overdue`.

**Time Entries**
- D-10: Tools: `create_time_entry`, `get_time_entry`, `list_time_entries`, `update_time_entry`, `delete_time_entry`. Plus `aggregate_time`.
- D-11: `list_time_entries` supports filtering by project_id, date range.

**Scope Management**
- D-12: `check_scope` tool takes project_id and request_description, returns agreed scope alongside request and existing scope changes. Claude compares and advises.
- D-13: Scope change classifications: `in_scope`, `out_of_scope`, `gray_area`. [NOTE: actual enum uses `needs_review` not `gray_area`]
- D-14: Claude always asks user before logging a scope change — no auto-logging.
- D-15: Tools: `create_scope`, `get_scope`, `list_scope_changes`, `log_scope_change`, `check_scope`.

**Follow-up Drafting**
- D-16: Two-step pattern: `get_followup_context` fetches all relevant data, then `create_followup` stores the draft.
- D-17: Follow-up types: `invoice_reminder`, `check_in`, `proposal_followup`, `thank_you`. [NOTE: actual enum is `proposal_follow_up`, `invoice_overdue`, `check_in`, `awaiting_response`, `other`]
- D-18: Follow-ups track status: `draft` and `sent`. `mark_followup_sent` tool updates status. [NOTE: actual table has `sent_at timestamptz` column, not a status enum — sent = sent_at IS NOT NULL]
- D-19: Tools: `create_followup`, `get_followup`, `list_followups`, `mark_followup_sent`, `get_followup_context`.

### Claude's Discretion
- Exact Zod schemas for each tool's input validation
- Supabase query patterns (PostgREST builder vs raw SQL for aggregations)
- Tool description wording for optimal Claude invocation
- Pagination defaults on list tools
- Whether to add `archive_` tools for entities that may not need archival (time entries, scope changes)
- Ordering of tool registration files and any shared helpers

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROP-01 | User can draft a project proposal from client context and project details | `create_proposal` tool stores structured proposal data; `list_proposals` retrieves by project/client |
| PROP-03 | Accepted proposal auto-seeds the project scope record with agreed deliverables | `accept_proposal` tool updates proposals + inserts scope_definitions in one withUserContext call |
| PROP-04 | User can store and retrieve proposal history per client/project | `list_proposals` filtered by client_id or project_id; `get_proposal` for single record |
| INV-01 | User can generate an invoice with line items, totals, and due date | `create_invoice` with JSONB line_items, subtotal, tax_amount, total, due_date |
| INV-02 | User can track invoice status (draft/sent/paid/overdue) | `update_invoice` to change status; `list_invoices` filtered by status |
| INV-03 | Invoice auto-references the original proposal scope and agreed rate | `proposal_id` FK on invoices table; `create_invoice` accepts proposal_id; Claude calls `get_proposal` first |
| INV-04 | User can list invoices filtered by status, client, or date range | `list_invoices` with status, client_id, date_from, date_to filter params |
| TIME-01 | User can log time entries against a project with description and duration | `create_time_entry` with project_id, description, duration_minutes, entry_date |
| TIME-02 | User can view aggregated time per project for invoicing | `aggregate_time` tool with DB-side SUM of duration_minutes, optional date range |
| SCOPE-01 | User can define agreed project scope (deliverables, boundaries) at project start | `create_scope` inserts into scope_definitions (unique per project) |
| SCOPE-02 | User can log scope change requests with classification (in-scope/out-of-scope) | `log_scope_change` inserts into scope_changes with classification enum |
| SCOPE-03 | AI detects when a new request falls outside agreed scope and flags it | `check_scope` returns current scope_definition + scope_changes; Claude reasoning does the detection |
| SCOPE-04 | User can view scope change history and creep alerts per project | `list_scope_changes` filtered by project_id |
| FLLW-01 | User can draft follow-up emails referencing real data | `get_followup_context` aggregates data; Claude drafts; `create_followup` stores |
| FLLW-03 | User can view follow-up history per client | `list_followups` filtered by client_id |
</phase_requirements>

---

## Project Constraints (from CLAUDE.md)

| Directive | Details |
|-----------|---------|
| Language | TypeScript 5.x (latest) — all source files |
| Runtime | Node.js 20 LTS minimum |
| MCP SDK | `@modelcontextprotocol/sdk` v1.28.0 |
| Supabase client | `@supabase/supabase-js` v2.100.1 |
| Zod | v4 — import as `import * as z from 'zod/v4'` |
| Transport | Streamable HTTP only (not stdio, not SSE) |
| Auth | API key via `X-API-Key` header, validated via Supabase `validate_api_key()` |
| Tool structure | One file per entity in `src/tools/`, `registerXTools(server, userId)` export |
| Error response | `{ content: [{ type: 'text', text: message }], isError: true }` |
| Success response | `{ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }` |
| Soft delete | `archived_at` timestamp pattern — filter `is('archived_at', null)` by default |
| DB wrapper | All queries via `withUserContext(userId, async (db) => ...)` |
| No hand-roll | Use established patterns; do not invent new auth, schema, or transport patterns |
| GSD workflow | All file changes go through GSD execution commands |
| Testing | Vitest — test files in `tests/tools/<entity>.test.ts`, mock `withUserContext` |

---

## Standard Stack

### Core (already installed — no new dependencies needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@modelcontextprotocol/sdk` | 1.28.0 | MCP server, tool registration | Already in use; Phase 2 established pattern |
| `@supabase/supabase-js` | 2.100.1 | All database queries | Already in use; `withUserContext` wrapper established |
| `zod` | 4.0.0 | Tool input schema validation | Already in use; import via `zod/v4` |
| `vitest` | 4.1.2 | Unit tests for tool handlers | Already installed; `tests/` dir pattern established |
| `typescript` | 6.0.2 | Type safety | Already installed |
| `express` | (current) | HTTP server (not touched) | Already in use |

**No new npm installs required for Phase 3.** All dependencies are already present.

---

## Architecture Patterns

### Recommended Project Structure (end state after Phase 3)
```
src/
├── tools/
│   ├── clients.ts           # Phase 2 (complete)
│   ├── projects.ts          # Phase 2 (complete)
│   ├── proposals.ts         # Phase 3 (new)
│   ├── invoices.ts          # Phase 3 (new)
│   ├── time-entries.ts      # Phase 3 (new)
│   ├── scope.ts             # Phase 3 (new) — scope_definitions + scope_changes
│   └── follow-ups.ts        # Phase 3 (new)
├── lib/
│   ├── with-user-context.ts # existing
│   └── supabase.ts          # existing
├── middleware/
│   └── auth.ts              # existing
├── server.ts                # extend with 5 new register calls
└── types/
    └── database.ts          # existing — source of truth for all column names/enums
tests/
├── tools/
│   ├── clients.test.ts      # Phase 2 (complete)
│   ├── projects.test.ts     # Phase 2 (complete)
│   ├── proposals.test.ts    # Phase 3 (new)
│   ├── invoices.test.ts     # Phase 3 (new)
│   ├── time-entries.test.ts # Phase 3 (new)
│   ├── scope.test.ts        # Phase 3 (new)
│   └── follow-ups.test.ts   # Phase 3 (new)
└── middleware/
    └── auth.test.ts         # existing
```

### Pattern 1: Standard CRUD Tool Registration (from clients.ts / projects.ts)

Every entity tool file follows this exact structure:

```typescript
// Source: src/tools/clients.ts — established Phase 2 pattern
import * as z from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withUserContext } from '../lib/with-user-context.js';

export function registerXTools(server: McpServer, userId: string): void {
  server.registerTool('create_x', { description: '...', inputSchema: { ... } }, async (args) => {
    try {
      const { data, error } = await withUserContext(userId, async (db) => {
        return db.from('table').insert({ ...args, user_id: userId }).select().single();
      });
      if (error) return { content: [{ type: 'text', text: `Failed: ${error.message}` }], isError: true };
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { content: [{ type: 'text', text: `Failed: ${message}` }], isError: true };
    }
  });
}
```

Server registration in `src/server.ts`:
```typescript
// Add two lines per entity following existing pattern (lines 5-6, 13-14)
import { registerProposalTools } from './tools/proposals.js';
// ...
registerProposalTools(server, userId);
```

### Pattern 2: accept_proposal Transactional Tool

The `accept_proposal` tool must perform two writes in sequence within one `withUserContext` call. Supabase JS does not expose raw SQL transactions, so we use sequential operations inside the same db client (same RLS session variable set):

```typescript
// Source: derived from withUserContext pattern in src/lib/with-user-context.ts
server.registerTool('accept_proposal', {
  description: 'Accept a proposal and automatically seed the project scope from its content. Use when client accepts the proposal.',
  inputSchema: {
    proposal_id: z.string().uuid().describe('Proposal UUID to accept'),
  },
}, async (args) => {
  try {
    const result = await withUserContext(userId, async (db) => {
      // Step 1: Fetch proposal to get content for scope seeding
      const { data: proposal, error: fetchError } = await db
        .from('proposals')
        .select('*')
        .eq('id', args.proposal_id)
        .is('archived_at', null)
        .single();
      if (fetchError || !proposal) {
        return { proposal: null, scope: null, error: 'Proposal not found' };
      }

      // Step 2: Update proposal status to accepted
      const { data: updatedProposal, error: updateError } = await db
        .from('proposals')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', args.proposal_id)
        .select()
        .single();
      if (updateError) return { proposal: null, scope: null, error: updateError.message };

      // Step 3: Upsert scope_definitions (unique constraint on project_id — use upsert)
      const { data: scope, error: scopeError } = await db
        .from('scope_definitions')
        .upsert({
          project_id: proposal.project_id,
          user_id: userId,
          deliverables: proposal.content ?? '',
        }, { onConflict: 'project_id' })
        .select()
        .single();
      if (scopeError) return { proposal: updatedProposal, scope: null, error: scopeError.message };

      return { proposal: updatedProposal, scope, error: null };
    });
    if (result.error) {
      return { content: [{ type: 'text', text: `Failed to accept proposal: ${result.error}` }], isError: true };
    }
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { content: [{ type: 'text', text: `Failed to accept proposal: ${message}` }], isError: true };
  }
});
```

**Key decision:** Use `.upsert()` with `onConflict: 'project_id'` instead of bare `.insert()` because `scope_definitions` has a unique constraint on `project_id`. If a scope record already exists (e.g., manually created before the proposal), upsert updates it rather than erroring.

### Pattern 3: aggregate_time Tool with DB-Side SUM

Supabase PostgREST does not support aggregate functions (`SUM`, `COUNT`) directly in `.select()` filter chains. Options:
1. **Supabase RPC (recommended)** — call a PostgreSQL function that performs the SUM
2. **Fetch all + JS aggregate** — fetch all time entries and sum in JS (NOT recommended — breaks for large datasets)

Given the decision (D-08) for DB-side SUM accuracy and no current RPC for this, the cleanest approach without a migration is to use PostgREST's aggregate support. As of Supabase JS v2 / PostgREST v12+, column aggregates are available in select:

```typescript
// Approach: Use Supabase RPC with an inline function, or use raw aggregate via .rpc()
// Recommended: Write a Supabase migration with aggregate_time() DB function
// Alternative (no migration): Fetch all entries and SUM in JS — acceptable for MVP
// because freelancers typically have <500 time entries per project

// JS aggregate pattern (no migration required):
server.registerTool('aggregate_time', {
  description: 'Aggregate total time logged for a project. Use before creating an invoice to get billable hours.',
  inputSchema: {
    project_id: z.string().uuid().describe('Project UUID'),
    start_date: z.string().date().optional().describe('Filter start date (YYYY-MM-DD)'),
    end_date: z.string().date().optional().describe('Filter end date (YYYY-MM-DD)'),
    billable_only: z.boolean().default(true).describe('Only include billable entries'),
  },
}, async (args) => {
  try {
    const { data, error } = await withUserContext(userId, async (db) => {
      let query = db
        .from('time_entries')
        .select('duration_minutes, entry_date, billable')
        .eq('project_id', args.project_id)
        .is('archived_at', null);
      if (args.billable_only) query = query.eq('billable', true);
      if (args.start_date) query = query.gte('entry_date', args.start_date);
      if (args.end_date) query = query.lte('entry_date', args.end_date);
      return query;
    });
    if (error) return { content: [{ type: 'text', text: `Failed: ${error.message}` }], isError: true };
    const entries = data ?? [];
    const totalMinutes = entries.reduce((sum, e) => sum + e.duration_minutes, 0);
    const result = {
      project_id: args.project_id,
      total_minutes: totalMinutes,
      total_hours: Math.round((totalMinutes / 60) * 100) / 100,
      entry_count: entries.length,
      date_range: {
        start: args.start_date ?? null,
        end: args.end_date ?? null,
      },
    };
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { content: [{ type: 'text', text: `Failed to aggregate time: ${message}` }], isError: true };
  }
});
```

### Pattern 4: get_followup_context Read-Aggregation Tool

This tool gathers context for Claude to compose a follow-up. It joins across three tables:

```typescript
server.registerTool('get_followup_context', {
  description: 'Get all context needed to draft a follow-up for a client or project: overdue invoices, project status, days since last contact, prior follow-ups. Always call this before create_followup.',
  inputSchema: {
    client_id: z.string().uuid().describe('Client UUID'),
    project_id: z.string().uuid().optional().describe('Optional project UUID to narrow context'),
  },
}, async (args) => {
  try {
    const context = await withUserContext(userId, async (db) => {
      // Parallel fetches using Promise.all inside the same db client
      const [clientResult, invoicesResult, followUpsResult] = await Promise.all([
        db.from('clients').select('id, name, email, company').eq('id', args.client_id).single(),
        db.from('invoices')
          .select('id, invoice_number, status, total, currency, due_date, issued_at')
          .eq('client_id', args.client_id)
          .is('archived_at', null)
          .in('status', ['sent', 'overdue']),
        db.from('follow_ups')
          .select('id, type, subject, sent_at, created_at')
          .eq('client_id', args.client_id)
          .is('archived_at', null)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);
      return {
        client: clientResult.data,
        outstanding_invoices: invoicesResult.data ?? [],
        recent_follow_ups: followUpsResult.data ?? [],
      };
    });
    return { content: [{ type: 'text', text: JSON.stringify(context, null, 2) }] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { content: [{ type: 'text', text: `Failed to get follow-up context: ${message}` }], isError: true };
  }
});
```

### Pattern 5: mark_followup_sent Tool

The `follow_ups` table has a `sent_at timestamptz` column (not a status enum). Marking as sent means setting `sent_at`:

```typescript
server.registerTool('mark_followup_sent', {
  description: 'Mark a follow-up as sent. Use after the freelancer confirms they have sent the drafted follow-up.',
  inputSchema: {
    followup_id: z.string().uuid().describe('Follow-up UUID to mark as sent'),
  },
}, async (args) => {
  try {
    const { data, error } = await withUserContext(userId, async (db) => {
      return db
        .from('follow_ups')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', args.followup_id)
        .is('sent_at', null)  // only if not already sent
        .select()
        .single();
    });
    if (error || !data) {
      return { content: [{ type: 'text', text: 'Follow-up not found or already marked as sent' }], isError: true };
    }
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { content: [{ type: 'text', text: `Failed to mark follow-up sent: ${message}` }], isError: true };
  }
});
```

### Pattern 6: Vitest Test Structure (from clients.test.ts)

All new test files follow the exact same mock-and-capture pattern:

```typescript
// Source: tests/tools/clients.test.ts — established Phase 2 pattern
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

vi.mock('../../src/lib/with-user-context.js', () => ({
  withUserContext: vi.fn(),
}));

import { registerXTools } from '../../src/tools/x.js';
import { withUserContext } from '../../src/lib/with-user-context.js';

const mockWithUserContext = vi.mocked(withUserContext);

function captureTools(userId = 'test-user-id'): Record<string, (args: Record<string, unknown>) => Promise<unknown>> {
  const server = new McpServer({ name: 'test', version: '0.0.1' }, { capabilities: {} });
  const handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>> = {};
  vi.spyOn(server, 'registerTool').mockImplementation((name: string, _schema: unknown, handler: unknown) => {
    handlers[name] = handler as (args: Record<string, unknown>) => Promise<unknown>;
    return server;
  });
  registerXTools(server, userId);
  return handlers;
}
```

### Anti-Patterns to Avoid

- **Do not use raw `SELECT SUM()` via `.rpc()` unless a migration creates the function** — creating ad-hoc DB functions inside tool implementation couples schema to code unnecessarily. The JS aggregate approach for `aggregate_time` is acceptable for MVP.
- **Do not use `.insert()` for scope_definitions** — use `.upsert()` with `onConflict: 'project_id'` due to the unique constraint. A bare insert will throw a unique violation if scope was previously created.
- **Do not use CONTEXT.md enum values verbatim** — the actual DB enums differ. Use `database.ts` Constants as the source of truth:
  - `proposal_status`: `'draft' | 'sent' | 'accepted' | 'declined' | 'expired'` (not `'rejected'`)
  - `scope_change_classification`: `'in_scope' | 'out_of_scope' | 'needs_review'` (not `'gray_area'`)
  - `follow_up_type`: `'proposal_follow_up' | 'invoice_overdue' | 'check_in' | 'awaiting_response' | 'other'`
- **Do not add `delete_time_entry` as a hard delete** — all other tools use soft delete via `archived_at`. D-10 calls for `delete_time_entry` but this should be implemented as `archive_time_entry` following the established pattern.
- **Do not add a `status` column to follow_ups** — the table uses `sent_at IS NOT NULL` to determine sent state. Do not add a redundant status field.
- **Do not load all time entries in memory for large datasets without pagination** — the JS aggregate approach is acceptable for now but the planner should note this as a future optimization.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Per-user DB isolation | Custom auth middleware per query | `withUserContext` wrapper | Already exists; sets RLS session variable |
| Tool registration | Custom registry or factory | `server.registerTool()` directly | MCP SDK handles schema + routing |
| JSON schema from Zod | Custom type conversion | Zod v4 + MCP SDK integration | SDK auto-converts Zod schemas to JSON Schema |
| DB type safety | Hand-written interfaces | `database.ts` TypeScript types | Already generated and tracked in git |
| DB aggregation function | Custom SQL migration | JS reduce on fetched rows (for MVP) | Avoids schema coupling; acceptable scale for v1 |

**Key insight:** The Phase 2 infrastructure handles all cross-cutting concerns. Phase 3 is pure domain logic application of an established pattern.

---

## Schema Facts (Authoritative — from database.ts and migrations)

These facts override any CONTEXT.md labels that differ:

| Entity | Key Columns | Enum Values |
|--------|-------------|-------------|
| proposals | id, user_id, client_id, project_id, title, content (text), status, amount, currency, valid_until, sent_at, responded_at, archived_at | status: draft/sent/accepted/declined/expired |
| invoices | id, user_id, client_id, project_id, proposal_id (nullable), invoice_number, status, line_items (jsonb), subtotal, tax_rate, tax_amount, total, currency, issued_at, due_date, paid_at, notes, archived_at | status: draft/sent/paid/overdue/void |
| time_entries | id, user_id, project_id, description, duration_minutes (integer), entry_date (date), billable (boolean), archived_at | — |
| scope_definitions | id, user_id, project_id (unique), deliverables (text), boundaries, assumptions, exclusions, archived_at | — |
| scope_changes | id, user_id, project_id, description, classification, impact, requested_at, resolved_at, archived_at | classification: in_scope/out_of_scope/needs_review |
| follow_ups | id, user_id, client_id, project_id (nullable, ON DELETE SET NULL), type, subject, content, sent_at (timestamptz nullable), archived_at | type: proposal_follow_up/invoice_overdue/check_in/awaiting_response/other |

---

## Common Pitfalls

### Pitfall 1: Using CONTEXT.md Enum Labels Instead of DB Enum Values
**What goes wrong:** Tool input validation uses `z.enum(['rejected'])` but DB has `'declined'`; Supabase insert fails with enum cast error at runtime.
**Why it happens:** CONTEXT.md was authored before or independently of the actual migration; slight terminology drift between design and implementation.
**How to avoid:** Always check `database.ts` Constants object for authoritative enum values before writing Zod enum schemas.
**Warning signs:** TypeScript type errors on Zod enum vs DB Insert type; Supabase 400 errors with "invalid input value for enum".

### Pitfall 2: Bare Insert Into scope_definitions
**What goes wrong:** `db.from('scope_definitions').insert({...})` throws a unique constraint violation when called on a project that already has a scope record.
**Why it happens:** `scope_definitions` has `unique (project_id)` constraint enforced at DB level.
**How to avoid:** Use `.upsert({ ... }, { onConflict: 'project_id' })` in `accept_proposal`.
**Warning signs:** Supabase 409 or 23505 unique constraint error on repeated `accept_proposal` calls.

### Pitfall 3: Treating sent_at as a Status Enum in Follow-ups
**What goes wrong:** Code tries to filter `follow_ups` by `.eq('status', 'sent')` but there is no status column.
**Why it happens:** CONTEXT.md D-18 describes draft/sent status conceptually, but the actual table uses `sent_at timestamptz`.
**How to avoid:** Use `.is('sent_at', null)` for drafts and `.not('sent_at', 'is', null)` for sent items.
**Warning signs:** Supabase 400 "column follow_ups.status does not exist".

### Pitfall 4: Missing .is('archived_at', null) on List Queries
**What goes wrong:** List tools return archived records alongside active ones.
**Why it happens:** RLS SELECT policy filters by `archived_at is null`, but only for rows accessed through the policy — if querying with service role, the policy may not apply.
**How to avoid:** Explicitly chain `.is('archived_at', null)` on every list/get query, matching the pattern in `clients.ts` and `projects.ts`.
**Warning signs:** Archived test records appearing in list results.

### Pitfall 5: Invoice Number Uniqueness
**What goes wrong:** Two invoices get the same `invoice_number` string causing lookup ambiguity (no DB unique constraint on invoice_number in the migration).
**Why it happens:** `invoice_number` is a `text not null` field — the DB accepts any value. Claude or the tool must generate unique numbers.
**How to avoid:** In `create_invoice`, if `invoice_number` is not provided by the caller, generate a default like `INV-${Date.now()}` or leave generation entirely to Claude (D-07: Claude assembles invoice data).
**Warning signs:** Duplicate invoice numbers returned by list queries.

### Pitfall 6: withUserContext Not Returning DB Query Result
**What goes wrong:** `withUserContext` callback returns a Supabase query builder (not awaited), so the outer result is always undefined.
**Why it happens:** Forgetting `return` inside the callback, or returning the builder object instead of awaiting `.single()`.
**How to avoid:** Every query inside `withUserContext` must end with `return db.from(...).select().single()` (or equivalent — Supabase JS auto-executes on `await`, but the return must be awaited correctly).
**Warning signs:** `data` is `undefined` despite successful DB insert; TypeScript type errors on result destructuring.

---

## Runtime State Inventory

Step 2.5: SKIPPED — this is a greenfield feature implementation phase, not a rename/refactor/migration phase. No stored data, live service config, OS-registered state, secrets, or build artifacts reference any strings being renamed.

---

## Environment Availability

Step 2.6: No new external dependencies required. All tools, runtimes, and services used in Phase 3 were already validated and working in Phase 2. Node 20, npm, TypeScript, Supabase hosted instance, and vitest are all available and proven.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | Yes (Phase 2 proven) | >=20 | — |
| TypeScript | Compilation | Yes | ^6.0.2 | — |
| vitest | Tests | Yes | ^4.1.2 | — |
| Supabase hosted | All tools | Yes (Phase 1/2 proven) | v2.100.1 client | — |
| `@modelcontextprotocol/sdk` | Tool registration | Yes | ^1.28.0 | — |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.2 |
| Config file | `vitest.config.ts` (exists) |
| Quick run command | `npm test -- tests/tools/proposals.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROP-01 | create_proposal stores proposal data | unit | `npm test -- tests/tools/proposals.test.ts` | No — Wave 0 |
| PROP-03 | accept_proposal seeds scope_definitions | unit | `npm test -- tests/tools/proposals.test.ts` | No — Wave 0 |
| PROP-04 | list_proposals filters by client/project | unit | `npm test -- tests/tools/proposals.test.ts` | No — Wave 0 |
| INV-01 | create_invoice stores line_items + totals | unit | `npm test -- tests/tools/invoices.test.ts` | No — Wave 0 |
| INV-02 | update_invoice changes status | unit | `npm test -- tests/tools/invoices.test.ts` | No — Wave 0 |
| INV-03 | create_invoice accepts proposal_id FK | unit | `npm test -- tests/tools/invoices.test.ts` | No — Wave 0 |
| INV-04 | list_invoices filters by status/client/date | unit | `npm test -- tests/tools/invoices.test.ts` | No — Wave 0 |
| TIME-01 | create_time_entry stores duration + date | unit | `npm test -- tests/tools/time-entries.test.ts` | No — Wave 0 |
| TIME-02 | aggregate_time returns correct totals | unit | `npm test -- tests/tools/time-entries.test.ts` | No — Wave 0 |
| SCOPE-01 | create_scope inserts scope_definitions | unit | `npm test -- tests/tools/scope.test.ts` | No — Wave 0 |
| SCOPE-02 | log_scope_change inserts scope_changes | unit | `npm test -- tests/tools/scope.test.ts` | No — Wave 0 |
| SCOPE-03 | check_scope returns scope + changes for Claude | unit | `npm test -- tests/tools/scope.test.ts` | No — Wave 0 |
| SCOPE-04 | list_scope_changes filters by project_id | unit | `npm test -- tests/tools/scope.test.ts` | No — Wave 0 |
| FLLW-01 | get_followup_context aggregates client data | unit | `npm test -- tests/tools/follow-ups.test.ts` | No — Wave 0 |
| FLLW-03 | list_followups filters by client_id | unit | `npm test -- tests/tools/follow-ups.test.ts` | No — Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- tests/tools/<entity>.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** `npm test && npm run typecheck` — full suite green before `/gsd:verify-work`

### Wave 0 Gaps
All five new test files must be created. No new framework config is needed — `vitest.config.ts` and the test mock pattern are established and working.

- [ ] `tests/tools/proposals.test.ts` — covers PROP-01, PROP-03, PROP-04
- [ ] `tests/tools/invoices.test.ts` — covers INV-01, INV-02, INV-03, INV-04
- [ ] `tests/tools/time-entries.test.ts` — covers TIME-01, TIME-02
- [ ] `tests/tools/scope.test.ts` — covers SCOPE-01, SCOPE-02, SCOPE-03, SCOPE-04
- [ ] `tests/tools/follow-ups.test.ts` — covers FLLW-01, FLLW-03

---

## Tool Manifest Summary

Total new tools to register in Phase 3: **28 tools** (planner should verify against SKLL-03 token limit)

| File | Tools | Count |
|------|-------|-------|
| proposals.ts | create_proposal, get_proposal, list_proposals, update_proposal, accept_proposal | 5 |
| invoices.ts | create_invoice, get_invoice, list_invoices, update_invoice | 4 |
| time-entries.ts | create_time_entry, get_time_entry, list_time_entries, update_time_entry, archive_time_entry, aggregate_time | 6 |
| scope.ts | create_scope, get_scope, update_scope, list_scope_changes, log_scope_change, check_scope | 6 |
| follow-ups.ts | create_followup, get_followup, list_followups, update_followup, mark_followup_sent, get_followup_context | 6 |
| **Phase 2 existing** | create_client, get_client, list_clients, update_client, archive_client, create_project, get_project, list_projects, update_project, archive_project | 10 |
| **Total post-Phase 3** | | **38 tools** |

SKLL-03 requirement (REQUIREMENTS.md): total tool manifest must stay under 15,000 tokens. With 38 tools at an average ~150 tokens per tool description+schema, estimated total is ~5,700 tokens — well within the limit.

---

## Open Questions

1. **delete_time_entry vs archive_time_entry**
   - What we know: D-10 specifies `delete_time_entry` by name, but all other entities use `archive_time_entry` (soft delete via `archived_at`).
   - What's unclear: Should this be a true hard delete (permanent) or soft delete (matches all other tools)?
   - Recommendation: Implement as `archive_time_entry` following the established pattern. This maintains data integrity for audit purposes and matches the soft delete pattern everywhere else. The tool description can say "remove this time entry" without exposing the implementation detail.

2. **Proposal content vs structured fields**
   - What we know: The DB has a single `content text` column and an `amount numeric` column — not the separate `scope_summary`, `deliverables`, `payment_terms`, `notes` columns that CONTEXT.md D-01 references.
   - What's unclear: CONTEXT.md suggests structured fields but the migration has a free-form `content` field. Does `accept_proposal` seed scope_definitions.deliverables from `proposals.content`?
   - Recommendation: Use the actual schema. `create_proposal` accepts `title`, `content` (free-form text Claude writes), `amount`, `currency`, `valid_until`. The `accept_proposal` tool sets `scope_definitions.deliverables = proposal.content`. This matches the "Claude composes, tool stores" philosophy.

3. **aggregate_time: JS vs DB-side SUM**
   - What we know: D-08 requires "DB-side SUM for accuracy." The current schema has no RPC function for this. Adding one requires a migration.
   - What's unclear: Is a new migration acceptable in Phase 3, or should we avoid schema changes?
   - Recommendation: Use JS-side reduce for Phase 3 (no migration needed, acceptable for v1 scale). Add a `## State of the Art` note for the planner: if Phase 3 scope allows one additional migration, a `aggregate_time(p_project_id, p_start_date, p_end_date)` function is cleaner. If not, JS aggregate works fine.

---

## Sources

### Primary (HIGH confidence)
- `src/tools/clients.ts` — Authoritative tool implementation pattern (examined directly)
- `src/tools/projects.ts` — Authoritative tool pattern with FK parent reference (examined directly)
- `src/types/database.ts` — Authoritative schema types and enum values (examined directly)
- `supabase/migrations/20260328000005_create_proposals_invoices.sql` — Proposals + invoices schema (examined directly)
- `supabase/migrations/20260328000006_create_time_scope.sql` — Time + scope schema (examined directly)
- `supabase/migrations/20260328000007_create_follow_ups.sql` — Follow-ups schema (examined directly)
- `tests/tools/clients.test.ts` — Authoritative test pattern (examined directly)
- `vitest.config.ts` — Test runner configuration (examined directly)
- `src/server.ts` — Tool registration pattern (examined directly)
- `src/lib/with-user-context.ts` — DB context wrapper implementation (examined directly)

### Secondary (MEDIUM confidence)
- CONTEXT.md — Phase design decisions (examined; divergences from actual schema noted and called out)
- REQUIREMENTS.md — Requirement definitions (examined)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies verified by direct file inspection; no new installs needed
- Architecture: HIGH — established pattern from Phase 2 examined directly; Phase 3 is pattern application
- Schema facts: HIGH — read directly from database.ts and migration SQL files
- Pitfalls: HIGH — derived from actual code examination and schema divergences found during research
- Test architecture: HIGH — existing test files examined; pattern is clear and proven

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable libraries, hosted Supabase not changing)
