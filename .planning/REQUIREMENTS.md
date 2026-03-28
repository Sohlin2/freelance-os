# Requirements: FreelanceOS

**Defined:** 2026-03-28
**Core Value:** A freelancer can manage their entire client lifecycle — from proposal to invoice — without leaving Claude Code.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Infrastructure

- [x] **INFRA-01**: MCP server connects to hosted Supabase with full CRUD for all domain entities
- [x] **INFRA-02**: API key authentication gates all MCP server access
- [x] **INFRA-03**: Supabase schema supports multi-tenant data isolation via RLS policies
- [ ] **INFRA-04**: Package is npm installable with Claude Code plugin manifest (plugin.json)
- [ ] **INFRA-05**: Plugin userConfig collects API key at install time (sensitive, stored in keychain)

### Client CRM

- [x] **CRM-01**: User can create, read, update, and delete client records (name, contact info, billing rate, notes)
- [ ] **CRM-02**: User can create projects linked to a client with status tracking (active/completed/paused)
- [ ] **CRM-03**: User can view a client's full project history and communication log
- [ ] **CRM-04**: User can search and filter clients and projects by name, status, or date

### Proposals

- [ ] **PROP-01**: User can draft a project proposal from client context and project details
- [ ] **PROP-02**: Smart prompts coach on proposal quality (pricing, scope clarity, revision limits, payment terms)
- [ ] **PROP-03**: Accepted proposal auto-seeds the project scope record with agreed deliverables
- [ ] **PROP-04**: User can store and retrieve proposal history per client/project

### Invoices

- [ ] **INV-01**: User can generate an invoice with line items, totals, and due date
- [ ] **INV-02**: User can track invoice status (draft/sent/paid/overdue)
- [ ] **INV-03**: Invoice auto-references the original proposal scope and agreed rate
- [ ] **INV-04**: User can list invoices filtered by status, client, or date range

### Time & Scope

- [ ] **TIME-01**: User can log time entries against a project with description and duration
- [ ] **TIME-02**: User can view aggregated time per project for invoicing
- [ ] **SCOPE-01**: User can define agreed project scope (deliverables, boundaries) at project start
- [ ] **SCOPE-02**: User can log scope change requests with classification (in-scope/out-of-scope)
- [ ] **SCOPE-03**: AI detects when a new request falls outside agreed scope and flags it as potential scope creep
- [ ] **SCOPE-04**: User can view scope change history and creep alerts per project

### Follow-ups

- [ ] **FLLW-01**: User can draft follow-up emails referencing real data (project name, invoice amount, days overdue)
- [ ] **FLLW-02**: Smart prompts advise on follow-up timing and tone based on context (late invoice vs check-in vs awaiting response)
- [ ] **FLLW-03**: User can view follow-up history per client

### Skill Pack

- [ ] **SKLL-01**: Skill pack provides freelance domain knowledge via SKILL.md files for proposals, invoices, scope, and follow-ups
- [ ] **SKLL-02**: Skills are chat-invocable — user describes what they need, Claude applies domain knowledge automatically
- [ ] **SKLL-03**: Total tool manifest stays under 15,000 tokens to preserve reasoning quality

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Intelligence Layer

- **INTL-01**: Overrun surfacing — proactively flag when logged hours approach or exceed project budget
- **INTL-02**: Revenue dashboard — summarize earnings, outstanding invoices, pipeline value
- **INTL-03**: Client health scoring — surface at-risk relationships based on communication patterns

### Export & Artifacts

- **EXPRT-01**: Export invoices and proposals as PDF artifacts
- **EXPRT-02**: Export client/project data as CSV

### Distribution

- **DIST-01**: Listed on Claude/MCP marketplace with one-click install
- **DIST-02**: Usage-based billing tier (pay per operation)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Payment processing (Stripe/PayPal) | Regulatory complexity (PCI, money transmission), massive scope increase |
| Contract / legal document generation | Liability exposure; legal docs need jurisdiction-specific review |
| Client portal (login-required web UI) | Requires building a separate web app; shifts product from B2C tool to platform |
| Calendar / scheduling integration | Not in the financial lifecycle; Calendly solves this already |
| Mobile app | Claude Code is desktop-first; mobile doubles the surface area |
| Multi-user / team features | Solo freelancers first; adds auth, RLS, and billing complexity |
| Expense tracking / bookkeeping | Separate domain requiring tax logic; recommend QuickBooks/FreshBooks |
| Real-time collaboration | Architecturally odd in MCP context; freelance workflows are async |
| Feature tiers / free plan | Complicates billing; keep API key gating flat and simple |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |
| INFRA-03 | Phase 1 | Complete |
| INFRA-04 | Phase 5 | Pending |
| INFRA-05 | Phase 5 | Pending |
| CRM-01 | Phase 2 | Complete |
| CRM-02 | Phase 2 | Pending |
| CRM-03 | Phase 2 | Pending |
| CRM-04 | Phase 2 | Pending |
| PROP-01 | Phase 3 | Pending |
| PROP-02 | Phase 4 | Pending |
| PROP-03 | Phase 3 | Pending |
| PROP-04 | Phase 3 | Pending |
| INV-01 | Phase 3 | Pending |
| INV-02 | Phase 3 | Pending |
| INV-03 | Phase 3 | Pending |
| INV-04 | Phase 3 | Pending |
| TIME-01 | Phase 3 | Pending |
| TIME-02 | Phase 3 | Pending |
| SCOPE-01 | Phase 3 | Pending |
| SCOPE-02 | Phase 3 | Pending |
| SCOPE-03 | Phase 3 | Pending |
| SCOPE-04 | Phase 3 | Pending |
| FLLW-01 | Phase 3 | Pending |
| FLLW-02 | Phase 4 | Pending |
| FLLW-03 | Phase 3 | Pending |
| SKLL-01 | Phase 4 | Pending |
| SKLL-02 | Phase 4 | Pending |
| SKLL-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0

---
*Requirements defined: 2026-03-28*
*Last updated: 2026-03-28 after roadmap creation*
