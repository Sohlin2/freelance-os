---
name: freelance-followups
description: >
  Expert coaching for freelance follow-up communications. Advises on timing,
  tone, and content for follow-ups. Use when drafting, sending, or planning
  follow-up emails for clients about invoices, proposals, project updates, or
  general check-ins. Triggers on: "follow up with", "send a follow-up",
  "remind client", "chase invoice", "check in with client", "they haven't
  responded".
---

## When this skill applies

This skill activates when a freelancer is:
- Drafting follow-up emails to clients
- Planning when and how to follow up on unanswered proposals
- Chasing overdue invoices
- Checking in with clients after project delivery
- Unsure of the right tone or timing for a client communication

## Tool workflow

1. `get_followup_context` — ALWAYS call this first. Returns client info, outstanding invoices, and recent follow-up history. This is the data foundation for any follow-up.
2. Analyze the context: identify follow-up type, days since last contact, invoice status, prior follow-up count
3. Apply the timing and tone matrix below to determine the right approach
4. Draft the follow-up content
5. `create_followup` — persist with the correct type field matching the context
6. After user confirms they have sent it: `mark_followup_sent` to record the sent timestamp

Also useful:
- `list_followups` — check follow-up history before drafting to avoid sending duplicate follow-ups on the same day

## Timing and tone matrix

| Context | type field value | When to send | Tone | Opening line example |
|---------|-----------------|-------------|------|---------------------|
| Awaiting proposal response | proposal_follow_up | 3 business days after sending | Warm, brief | "Just checking in on the proposal I sent over for [project]." |
| Invoice approaching due | invoice_overdue | 1 business day before due date | Professional, helpful | "Friendly reminder that invoice #[number] for $[amount] is due [date]." |
| Invoice overdue 1-7 days | invoice_overdue | 3 days after due date | Firm but friendly | "Following up on invoice #[number] — it was due on [date]. Let me know if you need anything from my end." |
| Invoice overdue 7+ days | invoice_overdue | 7 days, then 14 days | Direct, professional | "Invoice #[number] is now [X] days past due. Please confirm payment timeline." |
| General check-in | check_in | 4-6 weeks of no contact | Relationship-first, no asks | "It has been a while — wanted to see how [project/business] is going." |
| Awaiting client feedback | awaiting_response | 48 hours after request | Light touch | "Did you get a chance to review [deliverable]? Happy to walk through it." |
| Project completion follow-up | check_in | 2 weeks after delivery | Grateful, future-oriented | "Hope [deliverable] is working well. Would love to hear how it is going." |

## Follow-up principles

- **3 follow-up limit:** Never send more than 3 follow-ups for the same item without a response. After 3, wait for the client to re-engage or have a direct conversation.
- **Reference specific data:** Always include invoice number, amount, project name, and date sent. Generic follow-ups feel automated and get lower response rates.
- **Check history first:** Before drafting, review context from get_followup_context — avoid sending duplicate follow-ups on the same day or for the same item.
- **Timing:** Morning emails (9-10 AM client timezone) get higher response rates than afternoon.
- **Brevity:** Follow-ups should be 3-5 sentences maximum. One clear ask per email. Longer emails get skipped.

## Follow-up count guidance

When get_followup_context returns recent_follow_ups, count how many are for the same context (same invoice, same proposal):
- 0 prior follow-ups: send first follow-up using timing from the matrix above
- 1 prior follow-up: increase firmness one notch (friendly → professional)
- 2 prior follow-ups: increase firmness another notch (professional → direct)
- 3+ prior follow-ups: recommend stopping automated follow-ups, suggest a direct phone call or accept non-response

## Conditional coaching

**User is asking Claude to draft:** Apply full timing and tone coaching. Pull context first with get_followup_context, identify the correct type and tone before writing.

**User has written content and wants to save it:** Offer a quick tone check. Example: "This reads a bit strong for a first reminder — want me to soften it?" If the tone matches the context from the matrix, approve and persist with create_followup.

**User says "just save it" or "just send it":** Persist immediately with create_followup and mark_followup_sent. No coaching unless asked.
