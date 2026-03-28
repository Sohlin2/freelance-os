---
name: freelance-proposals
description: >
  Expert coaching for freelance project proposals. Guides pricing, scope
  clarity, revision limits, and payment terms. Use when drafting, reviewing,
  pricing, or sending a proposal for a client project. Triggers on: "draft a
  proposal", "write a proposal", "price this project", "proposal for [client]",
  "what should I include in my proposal", "review my proposal".
---

## When this skill applies

This skill activates when a freelancer is:
- Drafting a new proposal for a client project
- Reviewing or refining an existing proposal
- Discussing project pricing or rates
- Negotiating scope or terms before agreement
- Updating a proposal status (draft to sent to accepted)

## Tool workflow

1. `list_clients` or `get_client` — confirm client context: billing rate, company, past project history
2. `list_proposals` — check prior proposals for this client to avoid duplicate pricing or conflicting terms
3. `get_project` — confirm project details, status, and timeline
4. Draft proposal content applying the coaching principles below
5. `create_proposal` — persist with implicit draft status (do NOT set status to "sent" yet)
6. After user confirms they have sent it: `update_proposal` with status "sent" and sent_at timestamp
7. When client accepts: `accept_proposal` — marks the proposal accepted AND seeds the project scope from deliverables

## Coaching principles

### Pricing
- Always calculate from time_estimate x hourly_rate, not gut feeling
- Ask "how many hours do you estimate?" before quoting a fixed price
- If client has a billing_rate on file (from get_client), use it as the baseline
- For fixed-price projects: add 20% buffer for unknowns — e.g., 10 hours at $100/hr = $1,000 base, quote $1,200
- Never price below $50/hour for professional services
- Itemize pricing when possible — clients respect transparency and it reduces disputes

### Scope clarity
- Every proposal MUST define what IS included AND what is NOT included (exclusions)
- Vague scope = scope creep. "A website" is not scope. "5-page responsive website with contact form" is scope.
- If the user's scope is vague, ask 2-3 clarifying questions before drafting

### Revision rounds
- Always include a specific number of revision rounds (default: 2-3 rounds)
- State explicitly: "Additional revisions billed at $X/hour"
- This is the #1 source of scope creep for freelancers who omit revision limits
- Example: "Includes 2 rounds of revisions. Further revisions billed at my standard rate."

### Payment terms
| Project size | Recommended terms |
|-------------|------------------|
| Under $2,000 | 100% on completion, Net 15 |
| $2,000 - $10,000 | 50% upfront, 50% on delivery |
| Over $10,000 | 50% upfront, 25% at midpoint, 25% on delivery |
| Ongoing/retainer | Net 30, monthly invoicing |

- Always specify a late payment fee: 1.5%/month is the industry standard
- State payment method accepted (bank transfer, check, etc.)

### Proposal validity
- All proposals expire in 30 days — state this explicitly
- Prevents "I want to go ahead with the proposal from 6 months ago" at outdated rates
- Set valid_until when calling create_proposal

### Deliverables language
- List specific deliverables, not vague outcomes
- Good: "5-page marketing website with responsive design, contact form, and Google Analytics integration"
- Bad: "a website"
- Each deliverable should be independently verifiable

## Proposal structure outline

| Section | What to include |
|---------|----------------|
| Project summary | 2-3 sentences: client name, project goal, timeline overview |
| Scope of work | Numbered deliverables list — specific and verifiable |
| Exclusions | What is NOT included (hosting, domain, ongoing maintenance, etc.) |
| Timeline | Milestones with dates or week numbers from project start |
| Pricing | Line items or fixed price with breakdown showing rate x hours |
| Payment terms | Schedule (upfront %, delivery %), method, late payment fee |
| Revisions | Number of rounds included, hourly rate for additional revisions |
| Validity | Expiration date (30 days from creation date) |
| Next steps | How to accept: reply to confirm, sign contract, pay deposit |

## Conditional coaching

**Drafting from scratch:** Apply full coaching. Ask clarifying questions about scope, timeline, and rate before writing. Do not draft without at least: deliverables list, estimated hours, and hourly rate.

**User has written content, wants to store it:** Offer a quick review. Example: "Want me to check pricing and scope clarity before saving? I noticed you have not mentioned revision limits or payment terms." If user says "just save it" — call create_proposal immediately without further coaching.

**User says "just save it" or "save this":** Persist immediately with create_proposal. No coaching unless asked.
