---
name: freelance-invoices
description: >
  Coaching for freelance invoice generation and payment tracking. Guides
  line item structure, payment terms, and overdue management. Use when
  creating, reviewing, or tracking invoices. Triggers on: "create an
  invoice", "generate invoice", "bill the client", "invoice for [project]",
  "track payment", "overdue invoices", "what do they owe".
---

## When this skill applies

This skill activates when a freelancer is:
- Creating a new invoice for a completed project or milestone
- Checking payment status on outstanding invoices
- Managing overdue invoices and preparing to follow up
- Generating invoices from time entries or accepted proposals
- Reviewing line items before sending to a client

## Tool workflow

1. `get_project` — confirm project and client context before creating
2. `list_proposals` — find the accepted proposal for pricing reference; invoice amounts should trace back to agreed scope and rate
3. `aggregate_time` — if billing hourly, call this for the billing period to get accurate total hours before writing line items
4. `create_invoice` — generate with itemized line_items, due_date, and calculated total
5. `get_invoice` — retrieve invoice details for review, sharing, or status checking
6. `list_invoices` — review outstanding or overdue invoices; use status filter (`draft`, `sent`, `paid`, `overdue`)
7. `update_invoice` — advance invoice status: draft → sent (day of delivery) → paid (day payment clears); set paid_at when marking paid
8. If overdue: hand off to the freelance-followups skill for follow-up coaching

## Invoice coaching principles

### Line items over lump sums
Always itemize work. "Website design - $3,000" is worse than individual line items:
- "Homepage design - $1,200"
- "About page - $600"
- "Contact form - $400"
- "Responsive QA and testing - $800"

Itemization justifies the total and makes partial disputes easier to resolve.

### Reference the proposal
Every invoice should trace back to the accepted proposal amount. If the invoice differs (scope change, additional work), note why in the line item description or notes field. Use `list_proposals` to pull the original agreed rate before writing amounts.

### Due dates
- Default Net 30 for established clients, Net 15 for new clients
- Always set an explicit `due_date` — never "upon receipt" (too vague, no legal leverage)
- Calculate the due date from `issued_at`, not from when the client reads it

### Status discipline
Move invoices through statuses promptly:
- **draft** → **sent**: same day the invoice is delivered to the client
- **sent** → **paid**: the day payment clears (set `paid_at`)
- **sent** → **overdue**: the day after `due_date` passes without payment

Don't let overdue invoices sit in "sent" status. Mark them overdue the next business day — it creates urgency and accurate reporting.

### Invoice numbering
Use sequential numbering (INV-001, INV-002, INV-003). Never reuse numbers. This is both professionally expected and legally required in many jurisdictions for audit trails.

## Standard line item structures

| Project type | Line items |
|-------------|------------|
| Fixed-price project | Milestone deliverables from proposal (matches deliverables list) |
| Hourly project | "Development work — [billing period]" with hours from `aggregate_time` x rate |
| Retainer | "Monthly retainer — [Month Year]" + "Overage: [N] hours at $X/hr" if applicable |
| Scope change add-on | Original scope line items + "Additional work: [change description]" |

## Conditional coaching

**Creating from scratch:** Walk through line items step by step. Pull the proposal rate with `list_proposals`, pull hours with `aggregate_time` if hourly, then draft items together. Set `due_date` before saving.

**User has details ready:** Create efficiently with `create_invoice`. Offer a quick review of line items before confirming — "Want me to check itemization before saving?" If user says "just save it" — call `create_invoice` immediately.

**Checking status:** Use `list_invoices` with a status filter. Flag any invoices in "sent" status past their `due_date` — those need to be marked overdue and followed up.
