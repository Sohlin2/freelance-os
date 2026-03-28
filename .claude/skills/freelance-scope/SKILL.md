---
name: freelance-scope
description: >
  Expert coaching for freelance project scope management. Guides scope
  definition, change request handling, and scope creep detection. Use when
  defining project scope, logging change requests, or reviewing scope
  boundaries. Triggers on: "define scope", "scope for this project", "client
  wants changes", "is this in scope", "scope creep", "change request",
  "out of scope".
---

## When this skill applies

This skill activates when a freelancer is:
- Defining initial project scope after a proposal is accepted
- Evaluating whether a client request falls within the agreed scope
- Detecting and documenting scope creep
- Logging change requests with classification
- Reviewing scope change history to identify patterns
- Managing client expectations around deliverables

## Tool workflows

### Defining scope (new project)

1. `get_project` — confirm project exists and is active
2. `list_proposals` — check if an accepted proposal exists (scope may already be seeded by accept_proposal)
3. `get_scope` — check if scope definition already exists for this project
4. If no scope exists: `create_scope` with deliverables, boundaries, and exclusions
5. If scope was already seeded from accept_proposal: `update_scope` to refine boundaries and exclusions with more detail

Note: `accept_proposal` automatically upserts a scope_definitions record from the proposal content. Always check get_scope before calling create_scope to avoid conflicts.

### Handling change requests

1. `get_scope` — load the current agreed scope definition
2. `check_scope` — pass the new request as request_description. This tool returns the scope definition AND recent scope changes so Claude can assess whether the request is inside or outside the agreed work.
3. If in-scope: `log_scope_change` with classification "in_scope" — document it even if no charge applies
4. If out-of-scope: coach the user on how to communicate the change (see response template below), then `log_scope_change` with classification "out_of_scope"
5. If ambiguous: `log_scope_change` with classification "needs_review" and recommend a scoping conversation with the client
6. `list_scope_changes` — show the full change history to identify patterns (3+ out-of-scope items = scope creep problem)

## Scope coaching principles

### Define boundaries early
Every scope definition must include an Exclusions section. What you do NOT include is more important than what you do. Clients remember "you said you would handle the website" but forget "hosting and domain registration were explicitly excluded."

When creating scope with create_scope:
- `deliverables`: specific list of what will be delivered
- `boundaries`: constraints on the work (e.g., "up to 5 pages, desktop and mobile only")
- `exclusions`: explicitly excluded items (e.g., "hosting, domain registration, ongoing maintenance, stock photos")

### The 3-strike rule for creep
If list_scope_changes shows 3 or more out_of_scope items, it is time for a scope conversation. Call out the pattern:
"I have logged 3 change requests that fall outside our agreed scope. Before we continue, let us review the project boundaries and either update the scope with an addendum or clarify the original agreement."

### Change request response template
When a request is out of scope, use this framing with the client:
"Happy to take that on! Since [request] falls outside our agreed scope, I will send over a quick addendum with the additional cost and timeline. Does that work for you?"
Always frame as collaborative, not adversarial. The goal is a fair outcome, not a confrontation.

### Scope vs. revision
- **Revision:** A change to an agreed deliverable (e.g., change the color scheme on the homepage). Covered by the revision rounds in the proposal.
- **Scope change:** A new deliverable not in the original agreement (e.g., add a blog section that was not in the proposal). Requires a change order and additional billing.
Teach clients this distinction early to prevent confusion.

### Budget impact
Every out-of-scope item should have an estimated cost attached. Never say "this is out of scope" without immediately offering a path forward with pricing. Use log_scope_change impact field to document the estimate.

## Scope definition checklist

| Element | Required | Example |
|---------|----------|---------|
| Deliverables | Yes | "5-page responsive website, logo design, copy editing" |
| Boundaries | Yes | "Up to 5 pages, 2 revision rounds, desktop and mobile" |
| Exclusions | Yes | "Hosting, domain, ongoing maintenance, stock photos" |
| Timeline | Yes | "4 weeks from project start" |
| Change process | Recommended | "Changes assessed within 48 hours, priced if out-of-scope" |

## Conditional coaching

**Defining scope from scratch:** Apply full coaching. Ensure deliverables are specific, boundaries are clear, and exclusions section is populated before calling create_scope.

**Evaluating a change request:** Focus on in-scope vs out-of-scope classification. Use check_scope to compare the request against the agreed scope. Provide the response template if out-of-scope.

**User just wants to log a change:** Persist immediately with log_scope_change. Ask for classification if the user has not specified it.
