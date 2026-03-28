# Feature Research

**Domain:** Freelance business management — Claude Code extension (skill pack + MCP server)
**Researched:** 2026-03-28
**Confidence:** HIGH (multiple verified sources across competitor products and market analysis)

## Feature Landscape

This analysis covers the full freelance business management domain, then identifies which features
translate well to a conversational Claude Code interface versus which ones belong in standalone GUI apps.

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or unprofessional.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Client records (CRM) | Every tool has it; freelancers need contact + project history in one place | LOW | Name, contact, billing rate, project history, notes |
| Proposal drafting | The #1 friction point for freelancers — most still use Google Docs | MEDIUM | Must produce a professional-looking output document, not just text |
| Invoice generation | Core financial operation; clients expect a real invoice artifact | MEDIUM | Line items, totals, due dates, payment status; must exportable to PDF |
| Invoice status tracking | Freelancers need to know what's paid, pending, overdue | LOW | Paid / Sent / Overdue states minimum |
| Project tracking | Users need to know what's active, in what state | LOW | Active / Completed / Paused; link to client |
| Time logging | Required for hourly billing and client accountability | MEDIUM | Log hours against a project; aggregate for invoicing |
| Follow-up drafting | Awkward to write; freelancers skip it, lose money | MEDIUM | Context-aware: late invoice, awaiting proposal response, check-in |
| Scope definition | Needed to detect and defend against scope creep | MEDIUM | Record agreed deliverables at project start |
| Scope change tracking | 72% of freelance projects suffer scope creep (industry stat) | MEDIUM | Log new requests; distinguish in-scope vs out-of-scope |
| Data persistence across sessions | Without this, the tool is a toy — every session starts blank | HIGH | Requires Supabase backend; core infrastructure, not optional |

### Differentiators (Competitive Advantage)

Features that set FreelanceOS apart from HoneyBook, Bonsai, Dubsado, and Plutio. These are where the
Claude Code extension format wins by default — no GUI app competes on conversational intelligence.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Conversational interface for all ops | No switching apps — stay in Claude Code where you already work | LOW (once MCP is wired) | The format is the differentiator; existing tools require GUI clicks |
| Smart prompt domain knowledge | Claude already knows freelance work; skill pack makes it authoritative on proposals, scope, follow-ups | MEDIUM | Not just templates — domain judgment ("this proposal is too vague", "this is scope creep") |
| Scope creep detection | Automatically flags when a client request falls outside agreed scope; surfaces the history | HIGH | Requires comparing new requests against stored scope definition; genuine AI value |
| Context-aware follow-up drafting | Draft follow-ups that reference real history: project name, invoice amount, days overdue | MEDIUM | Pulls from Supabase records; no existing tool does this in-context conversationally |
| Proposal quality coaching | Beyond just generating text — advise on pricing, scope clarity, payment terms | MEDIUM | Embedded in skill pack prompts; "your proposal doesn't define revision limits" |
| Overrun surfacing | Proactively flag when logged hours approach or exceed project budget | MEDIUM | Requires time vs scope math; surface as a conversation trigger |
| Invoice-to-proposal linkage | Draft invoice that auto-references the original proposal scope and agreed rate | LOW | Data linkage in Supabase; surfaced by MCP query |
| Zero-context-switch workflow | Never leave the coding environment to manage business ops | LOW (the format) | This is a structural advantage vs every standalone tool in the market |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem useful but would hurt the product's focus, introduce complexity, or misalign with the platform.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Payment processing (Stripe/PayPal) | "One-stop shop" appeal; get paid from the tool | Regulatory complexity (PCI, money transmission), massive scope, liability; every major competitor already does it | Track payment status manually or via webhook; recommend existing tools for payment collection |
| Contract / legal document generation | Freelancers need contracts, and they know it | Liability exposure; legal documents need jurisdiction-specific review; not Claude's domain | Provide scope-of-work templates (not contracts); recommend dedicated contract tools (Bonsai, DocuSign) |
| Client portal (login-required) | Clients want to view status | Requires building a separate web app and auth system; shifts the product from B2C tool to B2B2C platform | Shareable read-only status links (future v2); for now, email the invoice PDF |
| Calendar / scheduling integration | "Complete business management" | Not in the financial lifecycle; scheduling is a solved problem (Calendly); adds auth/API surface | Out of scope by design; recommend Calendly |
| Mobile app | Freelancers work on mobile | Claude Code is desktop-first; building a separate mobile app doubles the surface area | Claude mobile app partially covers this; not a priority for v1 |
| Multi-user / team features | Agency owners want team visibility | Solo freelancers first; multi-user adds auth complexity, RLS policy complexity, billing complexity | Design data model to support teams later without requiring it now |
| Expense tracking | Accounting completeness | Accounting is a separate domain; integrating it properly requires tax logic, receipt OCR | Recommend QuickBooks or FreshBooks; FreelanceOS focuses on the client lifecycle, not bookkeeping |
| Real-time collaboration | "Work with your clients" | Polling or websockets in an MCP context is architecturally odd; clients don't use Claude Code | Async is fine for freelance workflows; nothing here is real-time by nature |
| Feature tiers / free plan | Growth via freemium | Complicates billing, creates support burden for non-paying users, dilutes API key simplicity | Flat pricing ($15-30/month or $40 one-time); keep gating at API key level only |

## Feature Dependencies

```
[Data Persistence / Supabase Backend]
    └──required by──> [Client Records]
    └──required by──> [Project Tracking]
    └──required by──> [Time Logging]
    └──required by──> [Invoice Generation]
    └──required by──> [Scope Definition]
    └──required by──> [Follow-up Drafting] (needs client + project context)

[Client Records]
    └──required by──> [Project Tracking] (project belongs to client)
    └──required by──> [Proposal Drafting] (proposal targets a client)
    └──required by──> [Invoice Generation] (invoice sent to client)
    └──required by──> [Follow-up Drafting] (follow-up references client)

[Project Tracking]
    └──required by──> [Time Logging] (time logged against project)
    └──required by──> [Scope Definition] (scope belongs to project)
    └──required by──> [Invoice Generation] (invoice references project)

[Scope Definition]
    └──required by──> [Scope Change Tracking]
    └──required by──> [Scope Creep Detection] (diff incoming requests vs stored scope)

[Time Logging]
    └──enhances──> [Invoice Generation] (time entries become line items)
    └──enhances──> [Overrun Surfacing] (hours vs project budget comparison)

[Proposal Drafting]
    └──enhances──> [Scope Definition] (proposal scope can seed project scope record)
    └──enhances──> [Invoice Generation] (agreed rate / deliverables pre-fill invoice)

[Smart Prompt Skill Pack]
    └──enhances──> [Proposal Drafting] (domain knowledge on what makes a good proposal)
    └──enhances──> [Scope Creep Detection] (judgment layer, not just data lookup)
    └──enhances──> [Follow-up Drafting] (tone, timing, context-awareness)
    └──enhances──> [Invoice Generation] (knows standard payment terms and formats)

[MCP Server]
    └──required by──> all data operations (CRUD interface to Supabase)
    └──required by──> [Context-Aware Follow-up Drafting] (pulls live data into prompts)
    └──required by──> [Invoice-to-Proposal Linkage] (queries related records)
```

### Dependency Notes

- **Supabase backend must exist before any feature**: Every other feature reads or writes data. The infrastructure phase is not optional — it is phase one.
- **Client records before projects**: A project is owned by a client. Creating a project without a client is a data integrity failure.
- **Scope definition before scope tracking**: You cannot detect creep if you never recorded what was agreed. Scope definition is the foundation of the scope-change workflow.
- **Time logging enhances invoicing but doesn't block it**: Flat-rate projects can invoice without time entries. Time logging adds accuracy for hourly work.
- **Smart prompts are additive**: Every MCP feature works without skill pack prompts, but the prompts are what make the tool feel intelligent rather than mechanical.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate that the concept works and deliver real value.

- [ ] MCP server with authenticated CRUD for clients, projects, proposals, invoices, time entries — this is the entire data foundation
- [ ] API key gating — required to monetize from day one
- [ ] Client records — store name, contact, billing rate, notes
- [ ] Project tracking — link to client, track status (active / paused / complete)
- [ ] Proposal drafting — generate from client + project context using skill pack domain knowledge
- [ ] Invoice generation — line items, due date, status tracking; exportable text at minimum
- [ ] Time logging — log hours against project; aggregate for invoice
- [ ] Scope definition and scope change tracking — record agreed deliverables; log change requests; surface diff
- [ ] Follow-up drafting — context-aware emails for late invoices, awaiting proposal response
- [ ] npm-installable skill pack with CLAUDE.md and MCP config

### Add After Validation (v1.x)

Features to add once core workflow is confirmed working by real users.

- [ ] Scope creep detection (AI-powered) — requires using skill pack judgment to classify incoming requests against stored scope; add after scope tracking proves useful
- [ ] Overrun surfacing — proactively alert when hours approach project budget; add when time tracking adoption is confirmed
- [ ] Invoice PDF export — polish for sending to clients; v1 can produce formatted text
- [ ] Proposal quality coaching — embedded feedback ("your proposal has no revision limit defined"); add after basic proposal generation is validated
- [ ] Project dashboard / summary — "show me what's active and overdue"; useful after enough data exists to summarize

### Future Consideration (v2+)

Features to defer until product-market fit is established and the data model is stable.

- [ ] Shareable client status links — read-only URL for clients to view project/invoice status; requires a web frontend, significant scope expansion
- [ ] Payment webhook tracking — receive Stripe/PayPal webhooks to auto-update invoice status; defer until payment integrations are requested by paying users
- [ ] Team / agency support — multi-user data model, RLS by organization; defer until solo market is validated
- [ ] Reporting / analytics — revenue by client, project profitability; defer until there's enough data history
- [ ] MCP marketplace listing — distribute via Claude/Anthropic marketplace when available

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| MCP server + Supabase backend | HIGH | HIGH | P1 |
| API key gating | HIGH | MEDIUM | P1 |
| Client records | HIGH | LOW | P1 |
| Project tracking | HIGH | LOW | P1 |
| Proposal drafting (AI-assisted) | HIGH | MEDIUM | P1 |
| Invoice generation | HIGH | MEDIUM | P1 |
| Time logging | HIGH | LOW | P1 |
| Scope definition + change tracking | HIGH | MEDIUM | P1 |
| Follow-up drafting | HIGH | MEDIUM | P1 |
| Smart prompt skill pack | HIGH | MEDIUM | P1 |
| Scope creep detection (AI judgment) | HIGH | HIGH | P2 |
| Overrun surfacing | MEDIUM | MEDIUM | P2 |
| Invoice PDF export | MEDIUM | LOW | P2 |
| Proposal quality coaching | MEDIUM | MEDIUM | P2 |
| Project dashboard / summary | MEDIUM | LOW | P2 |
| Shareable client links | MEDIUM | HIGH | P3 |
| Payment webhook tracking | LOW | HIGH | P3 |
| Team / agency support | MEDIUM | HIGH | P3 |
| Reporting / analytics | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch — the product isn't the product without these
- P2: Should have — add in first iteration after validation
- P3: Nice to have — future consideration after PMF

## Competitor Feature Analysis

Comparing what major players offer versus the FreelanceOS approach.

| Feature | HoneyBook | Bonsai | Dubsado | FreelanceOS Approach |
|---------|-----------|--------|---------|----------------------|
| Client CRM | Yes — pipeline + contacts | Yes — lightweight | Yes — full pipeline | Yes — conversation-first; no GUI required |
| Proposal drafting | Templates, bundled with contract | Templates, separate from contract | Templates + conditional logic | AI-generated from context, not template-filling |
| Invoice generation | Yes + payment processing | Yes + payment processing | Yes + payment processing | Yes — text/PDF output, no payment processing (v1) |
| Contract / e-sign | Yes | Yes | Yes (CSS-customizable) | Deliberately out of scope — liability risk |
| Time tracking | Mobile only | Desktop + mobile | Yes | Yes — conversational logging ("log 2h on Project X") |
| Scope tracking | No | Audit trail only | No | Yes — core differentiator |
| Scope creep detection | No | No | No | Yes — AI-powered, unique to this product |
| Follow-up automation | Trigger-based automation | Limited | Full workflow automation | AI-drafted, context-aware, not rule-based |
| Payment processing | Yes (Stripe) | Yes (Stripe/PayPal) | Yes | Out of scope v1 — regulatory complexity |
| Client portal | Yes | White-label (premium) | Yes | Out of scope v1 — requires web frontend |
| Interface | GUI web app | GUI web app | GUI web app | Conversational (Claude Code) — no GUI needed |
| Pricing | $36-129/mo | $17-32/mo | $20/mo | $15-30/mo or $40 one-time |
| Target user | Creative freelancers | Solo freelancers | Service businesses | Claude Code-using developers/technical freelancers |

## Sources

- [Bonsai vs HoneyBook comparison (ManyRequests, 2026)](https://www.manyrequests.com/blog/bonsai-vs-honeybook)
- [Proposal software gap analysis — 1.57B freelancers using Google Docs (MicroGaps, 2026-03)](https://www.microgaps.com/gaps/2026-03-01-proposal-software-freelancers)
- [HoneyBook vs Dubsado full comparison (Plutio, 2026)](https://www.plutio.com/compare/honeybook-vs-dubsado)
- [Bonsai review and features (WebsitePlanet, 2026)](https://www.websiteplanet.com/project-management-software/bonsai/)
- [Scope creep statistics and management tools (IdeaBrowser, ClearTimeline)](https://www.cleartimeline.com/problems/scope-creep)
- [Freelance invoicing software pain points (Bloom, 2025)](https://blog.bloom.io/invoicing-for-freelancers/)
- [Best CRM for freelancers overview (Plutio, 2026)](https://www.plutio.com/freelancer-magazine/best-crm-for-freelancers)
- [SPP vs Dubsado vs HoneyBook vs Bonsai complete comparison (spp.co, 2025)](https://spp.co/compare/spp-vs-dubsado-vs-honeybook-vs-bonsai)
- [MCP servers for Claude Code — top tools (Builder.io, 2026)](https://www.builder.io/blog/best-mcp-servers-2026)

---
*Feature research for: FreelanceOS — Claude Code skill pack + MCP server for freelance business management*
*Researched: 2026-03-28*
