# FreelanceOS

## What This Is

A Claude Code skill pack and MCP server that turns Claude into a freelance business manager. Freelancers interact conversationally — telling Claude to draft proposals, track clients, generate invoices, write follow-ups, and manage project scope — while a hosted Supabase backend persists all data. Ships as an npm-installable Claude Code plugin with 37 MCP tools, 5 coaching skills, and keychain-backed API key authentication. Monetized via API key gating at $15-30/month or $40 one-time.

## Core Value

A freelancer can manage their entire client lifecycle — from proposal to invoice — without leaving Claude Code.

## Requirements

### Validated

- ✓ Supabase schema with all 9 domain tables, RLS policies, enum types, helper functions — v1.0
- ✓ MCP server connects to hosted Supabase with full CRUD for all domain entities — v1.0
- ✓ API key authentication gates MCP server access — v1.0
- ✓ Client CRM: create, read, update, archive clients with project history and communication log — v1.0
- ✓ Proposal drafting: generate proposals, accept with auto scope seeding, rollback on failure — v1.0
- ✓ Invoice generation: JSONB line items, tax fields, status tracking (draft/sent/paid/overdue) — v1.0
- ✓ Follow-up drafting: context aggregation from client + invoices + follow-ups, mark-sent tracking — v1.0
- ✓ Scope management: define scope, log changes with classification, detect scope creep — v1.0
- ✓ Time tracking: log entries, aggregate per project, 15-minute rounding convention — v1.0
- ✓ Smart prompt skill pack with 5 SKILL.md files at 12,103/15,000 token budget — v1.0
- ✓ npm installable plugin with keychain-backed API key and secret scanning — v1.0
- ✓ RLS multi-tenant isolation with session-scoped user context (fixed in Phase 6) — v1.0

### Active

- [ ] npm publish with correct package structure for plugin installation
- [ ] MCP server registry listings (mcp.so, glama.ai, smithery.ai)
- [ ] SEO-optimized landing page with conversion-focused copy
- [ ] Social media launch content (X thread, Reddit, HN Show HN)
- [ ] Free trial support (7-day trial for monthly plan)
- [ ] README with install instructions, feature showcase, and buy links
- [ ] Analytics/monitoring for conversion tracking

## Current Milestone: v1.1 Marketing & Monetization Launch

**Goal:** Take FreelanceOS from deployed to revenue-generating — npm published, marketplace-listed, discoverable, and converting visitors to paying subscribers.

**Target features:**
- npm publish with correct package structure
- MCP server registry listings
- SEO-optimized landing page
- Social media launch content
- Free trial support
- README with install docs and buy links
- Conversion analytics

### Out of Scope

- ~~Payment processing~~ — DONE: Stripe billing live with monthly ($19) and lifetime ($40) plans
- Mobile app — Claude Code is desktop-first
- Multi-user collaboration / team features — solo freelancers first
- Calendar/scheduling integration — not core to the financial lifecycle
- Contract/legal document generation — liability concerns
- Offline mode — MCP server requires network connectivity by design

## Context

Shipped v1.0 with 7,602 TypeScript LOC across 140 files.
Tech stack: Node.js 20, Express, MCP SDK 1.x (Streamable HTTP), Supabase (PostgRES + RLS), Zod v4, Vitest.

- 37 MCP tools across 7 entities (clients, projects, proposals, invoices, time, scope, follow-ups)
- 5 SKILL.md coaching files (proposals, invoices, scope, follow-ups, time) at 12,103 tokens
- npm-installable Claude Code plugin with keychain-backed API key
- Chat-driven UX: users talk to Claude naturally, skills provide domain context, MCP handles data
- Target market: solo freelancers and small agencies who already use Claude Code for development
- Monetization via API key gating — MCP server requires valid key, key issued on subscription or one-time purchase
- **DEPLOYED:** MCP server live at freelance-os-production.up.railway.app (Railway, Docker)
- **BILLING LIVE:** Stripe products/prices created, webhook registered, customer portal configured, payment links active
- **API KEY DELIVERY:** Edge function serves one-time key retrieval page after checkout
- Monthly: $19/mo (price_1TG44XLtZyfmfxUd77Aypt2r) | Lifetime: $40 (price_1TG44YLtZyfmfxUd3O8gEJnT)
- Payment links: buy.stripe.com/bJefZi83Zg75dmu2A22Ji00 (monthly) | buy.stripe.com/00w4gAac7bQP2HQ1vY2Ji01 (lifetime)

## Constraints

- **Platform**: Must work as a Claude Code skill pack + MCP server (not a standalone app)
- **Backend**: Supabase (hosted instance managed by FreelanceOS)
- **Auth**: API key-based gating for MCP server access
- **Distribution**: npm package first, Claude/MCP marketplace when available
- **Data model**: Must support the full freelance lifecycle (clients → projects → proposals → time → invoices → follow-ups)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Hosted Supabase (not BYO) | Simpler onboarding, control over schema, consistent experience | ✓ Good — schema control enabled rapid iteration |
| Chat-driven (not command-driven) | Feels natural for freelancers, leverages Claude's conversational strength | ✓ Good — skills auto-invoke from natural descriptions |
| API key gating (not feature tiers) | Simpler billing, no free tier complexity | ✓ Good — clean auth flow |
| Smart prompts over workflows | Domain knowledge is the differentiator, not multi-step orchestration | ✓ Good — 5 skills provide expert coaching without orchestration overhead |
| Streamable HTTP transport (not stdio) | MCP server must be remote because user data lives in hosted Supabase | ✓ Good — enables hosted deployment model |
| Session-scoped RLS context (not transaction) | PostgREST runs each .from() as separate transaction; transaction scope clears before data queries | ✓ Good — fixed critical integration bug in Phase 6 |
| Time→invoice bridge via AI coaching | aggregate_time outputs data, Claude bridges to create_invoice via skill coaching | ✓ Good — avoids brittle automation, leverages Claude's reasoning |
| accept_proposal rollback on scope failure | Captures original status, rolls back if scope upsert fails | ✓ Good — data integrity without full transaction support |
| Token budget enforcement via char/4 approximation | Conservative estimate, vitest enforces SKLL-03 constraint | ✓ Good — 12,103/15,000 with room for growth |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-28 after v1.1 milestone start*
