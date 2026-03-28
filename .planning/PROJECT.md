# FreelanceOS

## What This Is

A Claude Code skill pack and MCP server that turns Claude into a freelance business manager. Freelancers interact conversationally — telling Claude to draft proposals, track clients, generate invoices, write follow-ups, and manage project scope — while a hosted Supabase backend persists all data. Distributed as an npm package (marketplace later), monetized via API key gating at $15-30/month or $40 one-time.

## Core Value

A freelancer can manage their entire client lifecycle — from proposal to invoice — without leaving Claude Code.

## Requirements

### Validated

- [x] Supabase schema with all 9 domain tables, RLS policies, enum types, helper functions — Validated in Phase 01: Data Foundation
- [x] Smart prompt skill pack gives Claude freelance domain knowledge (proposal best practices, invoice formatting, follow-up timing) — Validated in Phase 04: Skill Pack
- [x] npm installable package with plugin manifest, MCP server config, build script, and keychain-backed API key — Validated in Phase 05: Plugin Packaging

### Active

- [ ] MCP server connects to hosted Supabase with full CRUD for clients, projects, proposals, invoices, time entries, and scope changes
- [ ] API key authentication gates MCP server access (subscription/one-time purchase)
- [ ] Client CRM: store client info, project history, communication log
- [ ] Proposal drafting: generate project proposals from client context and project details
- [ ] Invoice generation: create invoices with line items, due dates, payment status tracking
- [ ] Follow-up drafting: write follow-up emails based on project status and client context
- [ ] Scope management: track agreed scope vs requested changes, flag scope creep
- [ ] Time tracking: log hours against project scope, surface overruns

### Out of Scope

- Payment processing (Stripe, PayPal integration) — adds regulatory complexity, defer to v2
- Mobile app — Claude Code is desktop-first
- Multi-user collaboration / team features — solo freelancers first
- Calendar/scheduling integration — not core to the financial lifecycle
- Contract/legal document generation — liability concerns

## Context

- Built as a Claude Code extension (skill pack + MCP server), not a standalone app
- Supabase hosted by FreelanceOS — users sign up and get an account, no BYO database
- Chat-driven UX: users talk to Claude naturally, skills provide domain context, MCP handles data
- Smart prompts are the skill pack's value add — they teach Claude how to think about freelance workflows (what makes a good proposal, when to follow up, how to spot scope creep)
- Target market: solo freelancers and small agencies who already use Claude Code for development
- Monetization via API key gating — MCP server requires valid key, key issued on subscription or one-time purchase

## Constraints

- **Platform**: Must work as a Claude Code skill pack + MCP server (not a standalone app)
- **Backend**: Supabase (hosted instance managed by FreelanceOS)
- **Auth**: API key-based gating for MCP server access
- **Distribution**: npm package first, Claude/MCP marketplace when available
- **Data model**: Must support the full freelance lifecycle (clients → projects → proposals → time → invoices → follow-ups)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Hosted Supabase (not BYO) | Simpler onboarding, control over schema, consistent experience | — Pending |
| Chat-driven (not command-driven) | Feels natural for freelancers, leverages Claude's conversational strength | — Pending |
| API key gating (not feature tiers) | Simpler billing, no free tier complexity | — Pending |
| Smart prompts over workflows | Domain knowledge is the differentiator, not multi-step orchestration | — Pending |

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
*Last updated: 2026-03-28 after Phase 07 completion — tech debt cleanup complete, all 7 phases complete, v1.0 milestone ready for audit*
