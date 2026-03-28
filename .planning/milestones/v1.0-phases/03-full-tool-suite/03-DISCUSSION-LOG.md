# Phase 3: Full Tool Suite - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 03-full-tool-suite
**Areas discussed:** Proposal workflow, Invoice generation, Scope creep detection, Follow-up drafting

---

## Proposal Workflow

### What should the 'draft proposal' tool actually do?

| Option | Description | Selected |
|--------|-------------|----------|
| Store user-provided content | Tool accepts structured fields, Claude composes text conversationally | ✓ |
| Generate content in tool | Tool fetches context and returns generated text | |
| Hybrid — fetch context + store | Separate context-fetching and storage tools | |

**User's choice:** Store user-provided content
**Notes:** Keeps tools simple, leverages Claude's natural writing ability. Same philosophy as Phase 2.

### When a proposal is accepted, how should scope auto-seeding work?

| Option | Description | Selected |
|--------|-------------|----------|
| accept_proposal tool does it | One tool sets status + creates scope atomically | ✓ |
| Two separate calls | User calls update_proposal then create_scope | |
| DB trigger | Postgres trigger on status change | |

**User's choice:** accept_proposal tool does it
**Notes:** Atomic operation in one transaction.

### Should deliverables be text array or structured JSONB?

| Option | Description | Selected |
|--------|-------------|----------|
| Text array | Simple string[] — easy for Claude to compose | ✓ |
| Structured JSONB | Each deliverable has name, description, estimated_hours, amount | |

**User's choice:** Text array
**Notes:** None

### What proposal statuses should exist?

| Option | Description | Selected |
|--------|-------------|----------|
| draft/sent/accepted/rejected | Four clean states matching DB enum | ✓ |
| draft/sent/accepted/rejected/expired | Adds expired for past-valid_until proposals | |
| You decide | Claude picks | |

**User's choice:** draft/sent/accepted/rejected
**Notes:** None

---

## Invoice Generation

### How should invoice line items be stored?

| Option | Description | Selected |
|--------|-------------|----------|
| JSONB array on invoice row | Line items as JSONB column, no extra table | ✓ |
| Separate line_items table | Normalized FK table | |
| You decide | Claude picks | |

**User's choice:** JSONB array on invoice row
**Notes:** Sufficient for freelancer invoices — no complex line item queries needed.

### Should create_invoice auto-pull data or require Claude to pass everything?

| Option | Description | Selected |
|--------|-------------|----------|
| Claude assembles, tool stores | Claude gathers data from other tools, composes payload | ✓ |
| Tool auto-aggregates | Tool fetches time entries internally | |
| Both modes | Accepts full payload OR project_id for auto-generate | |

**User's choice:** Claude assembles, tool stores
**Notes:** Same pattern as proposals — tools are data stores, Claude is the brain.

### Should there be a dedicated aggregate_time tool?

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated aggregate_time tool | DB-side SUM, returns totals and breakdown | ✓ |
| Claude sums from list | No new tool, Claude adds up rows | |
| You decide | Claude picks | |

**User's choice:** Dedicated aggregate_time tool
**Notes:** DB-side SUM is accurate and handles large entry sets.

---

## Scope Creep Detection

### How should scope creep detection work as an MCP tool?

| Option | Description | Selected |
|--------|-------------|----------|
| check_scope returns context | Tool returns scope + request side-by-side, Claude reasons | ✓ |
| Tool classifies automatically | Keyword matching returns in/out/unclear | |
| No special tool | Claude reads scope manually | |

**User's choice:** check_scope returns context
**Notes:** All AI reasoning stays in Claude, not in the tool.

### What scope change classifications should exist?

| Option | Description | Selected |
|--------|-------------|----------|
| in_scope/out_of_scope/gray_area | Three-way with ambiguous middle ground | ✓ |
| in_scope/out_of_scope only | Binary classification | |
| You decide | Claude picks | |

**User's choice:** in_scope/out_of_scope/gray_area
**Notes:** gray_area gives freelancers a middle ground for ambiguous requests.

### Should Claude auto-log scope changes or ask first?

| Option | Description | Selected |
|--------|-------------|----------|
| Always ask first | Claude presents analysis, user confirms before logging | ✓ |
| Auto-log with notification | Log automatically, tell user | |
| You decide | Claude picks | |

**User's choice:** Always ask first
**Notes:** Freelancers need control — they may choose to absorb small changes.

---

## Follow-up Drafting

### How should follow-up drafting work?

| Option | Description | Selected |
|--------|-------------|----------|
| get_followup_context + create_followup | Context tool fetches all data, Claude drafts, storage tool saves | ✓ |
| Claude fetches data manually | No context tool, Claude calls multiple tools | |
| Tool generates email text | Template-based generation in tool | |

**User's choice:** get_followup_context + create_followup
**Notes:** Context tool aggregates overdue invoices, project status, days since last contact, past follow-ups.

### What follow-up types should exist?

| Option | Description | Selected |
|--------|-------------|----------|
| invoice_reminder/check_in/proposal_followup/thank_you | Four types covering main scenarios | ✓ |
| Free-text type | String field, no enum | |
| You decide | Claude picks | |

**User's choice:** invoice_reminder/check_in/proposal_followup/thank_you
**Notes:** Type helps Claude and skill pack key off context.

### Should follow-ups track status?

| Option | Description | Selected |
|--------|-------------|----------|
| Track draft/sent status | Two states, mark_followup_sent to update | ✓ |
| Just a log | No status tracking | |
| You decide | Claude picks | |

**User's choice:** Track draft/sent status
**Notes:** Distinguishes composed vs actually sent.

---

## Claude's Discretion

- Exact Zod schemas for each tool's input validation
- Supabase query patterns
- Tool description wording
- Pagination defaults
- Whether to add archive tools for time entries, scope changes
- Ordering of tool registration

## Deferred Ideas

None — discussion stayed within phase scope.
