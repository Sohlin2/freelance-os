---
name: freelance-time
description: >
  Coaching for freelance time tracking and hour aggregation. Guides
  logging practices and time-to-invoice workflows. Use when logging
  time, reviewing hours, or preparing time reports for invoicing.
  Triggers on: "log time", "track hours", "how many hours", "time for
  [project]", "billable hours", "time report", "aggregate time".
---

## When this skill applies

This skill activates when a freelancer is:
- Logging time entries against a project
- Reviewing hours worked over a period
- Aggregating billable hours before creating an invoice
- Checking for time overruns against estimated scope
- Preparing a time report for a client

## Tool workflow

1. `projects.get` — confirm which project to log time against; verify the project is active
2. `time.create` — log the entry with a descriptive `description`, `duration_minutes`, `entry_date`, and `billable` flag
3. `time.list` — review entries for a project or date range; check for missing entries or duplicates before aggregating
4. `time.aggregate` — sum total billable hours for the billing period; always run `time.list` first to spot gaps
5. `time.update` — correct a logged entry's duration, date, or description if needed
6. `time.archive` — remove an incorrectly logged entry (soft delete; use instead of update when the entry should not exist at all)
7. For invoicing: hand off to the freelance-invoices skill — pass the `total_hours` from `time.aggregate` as the quantity line item

## Time tracking principles

### Log daily, not weekly
Reconstruct time from memory and you will undercount by 15-25%. Log at the end of each work session while it is fresh. If you worked on a project, log it today.

### Descriptive entries
"Website work - 3 hours" tells the client nothing. "Homepage hero section design and responsive testing - 3 hours" justifies the bill. Clients dispute vague entries. Be specific enough that you could defend the entry in a dispute.

### Round to nearest 15 minutes
Industry standard: 0.25-hour increments. Do not bill for 2 minutes of email; batch small tasks into a single entry. `duration_minutes` should always be a multiple of 15 (15, 30, 45, 60...).

### Separate billable and non-billable
Set `billable: false` for:
- Administrative tasks (project setup, internal meetings)
- Rework caused by your own errors
- Learning new tools or techniques for the project (unless agreed otherwise)

Only bill for client-facing value. Use `time.aggregate` with `billable_only: true` (the default) for invoice amounts.

### Track before aggregating
Always run `time.list` before `time.aggregate` to spot missing entries or duplicates. The aggregate is only as accurate as its inputs. A quick scan takes seconds and prevents under-billing or double-billing.

## Conditional coaching

**Logging time:** Remind about descriptive entries if the description is vague (e.g., "worked on project"). Suggest rounding to the nearest 15 minutes if `duration_minutes` is not a multiple of 15.

**Aggregating for invoice:** Prompt to review entries first with `time.list`, then call `time.aggregate`. Hand off the result to the freelance-invoices skill with the total hours as the line item quantity.

**User just wants to log quickly:** Call `time.create` immediately. No coaching unless the entry looks problematic (missing description, zero duration, non-billable flag).
