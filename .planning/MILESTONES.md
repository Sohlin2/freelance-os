# Milestones

## v1.0 MVP (Shipped: 2026-03-28)

**Delivered:** A complete freelance business management system — from Supabase data layer to npm-installable Claude Code plugin — enabling conversational client lifecycle management.

**Stats:** 7 phases, 20 plans, 33 tasks | 130 commits | 7,602 TypeScript LOC | 140 files | 1 day
**Git range:** e977941..bdf1e5a

**Key accomplishments:**

1. Supabase data layer with 9 domain tables, RLS multi-tenant isolation, and pgTAP test suite (19 assertions)
2. Streamable HTTP MCP server with API key auth middleware and 37 CRUD tools across 7 entities (clients, projects, proposals, invoices, time, scope, follow-ups)
3. Full freelance tool suite: proposals with accept→scope seeding and rollback, invoices with JSONB line items, time tracking with aggregation, scope management with creep detection, follow-ups with context aggregation
4. 5-skill coaching pack (proposals, invoices, scope, follow-ups, time) at 12,103/15,000 token budget
5. npm-installable Claude Code plugin with keychain-backed API key, 41 packaging tests, and secret scanning
6. Cross-phase integration verified end-to-end: RLS session scope fix, runtime dependency fix, Nyquist compliance across all 6 functional phases

### Known Gaps (Accepted)

- SUMMARY frontmatter doc gaps for INFRA-04/05 and SCOPE-01-04 (verified in VERIFICATION.md)
- Server build pipeline and deployment infrastructure (pre-launch, by design)
- API key issuance infrastructure (Stripe integration not in scope for v1.0)

**Archive:** [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md) | [milestones/v1.0-REQUIREMENTS.md](milestones/v1.0-REQUIREMENTS.md)

---
