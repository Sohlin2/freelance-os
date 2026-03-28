# Phase 1: Data Foundation - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Supabase schema, RLS policies, and API key validation — the security baseline everything else depends on. All domain tables exist with correct relationships, RLS enforces per-user data isolation, and API key authentication works before any user data is stored.

</domain>

<decisions>
## Implementation Decisions

### Schema Design
- **D-01:** snake_case naming everywhere — tables (clients, time_entries) and columns (created_at, billing_rate). Standard Postgres convention matching Supabase defaults.
- **D-02:** Postgres enums for status fields (e.g., CREATE TYPE project_status AS ENUM ('active', 'paused', 'completed')). Type-safe at DB level, picked up by Supabase type generator.
- **D-03:** Every table gets created_at (DEFAULT now()) and updated_at (via trigger) audit columns.
- **D-04:** Soft delete via archived_at TIMESTAMPTZ column. NULL = active, set = archived. No hard deletes on domain tables.

### API Key Strategy
- **D-05:** Prefixed UUID format: fos_live_<uuid>. Prefix identifies product and environment. Store SHA-256 hash in DB, never the raw key. User sees full key once at creation.
- **D-06:** Keys are permanent until explicitly revoked or subscription lapses. No expiry rotation.
- **D-07:** Multiple API keys per user allowed. Each independently revocable.
- **D-08:** api_keys.user_id references auth.users(id). Users sign up via Supabase Auth, then create API keys. RLS uses the resolved user_id.

### RLS & Auth Flow
- **D-09:** MCP server uses service role key. On each request: validate API key, look up user_id, call set_config('app.current_user_id', user_id). RLS policies read current_setting('app.current_user_id') to enforce isolation.
- **D-10:** RLS policies include AND archived_at IS NULL by default. Archived data invisible unless explicitly queried.
- **D-11:** Separate SELECT, INSERT, UPDATE, DELETE policies per table. Per-operation granularity.
- **D-12:** RLS policies written in same migration as table creation (carried forward from roadmap decisions).

### Dev Workflow
- **D-13:** Local Supabase CLI (supabase start) for development. Migrations tested locally before applying to hosted instance.
- **D-14:** One migration per logical unit (e.g., 001_create_enums.sql, 002_create_clients_projects.sql, 003_create_proposals_invoices.sql). Each includes its own RLS policies.
- **D-15:** Realistic seed data — test user with sample clients, projects, invoices, etc. Clearly marked as dev-only.

### Claude's Discretion
- Exact column types and nullable decisions per table (beyond what's specified above)
- Trigger implementation for updated_at
- Specific enum values for each status type (beyond examples given)
- Seed data content and volume
- Migration numbering scheme details

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project specs
- `.planning/PROJECT.md` — Core value, constraints, key decisions (hosted Supabase, chat-driven UX, API key gating)
- `.planning/REQUIREMENTS.md` — INFRA-01 (CRUD), INFRA-02 (API key auth), INFRA-03 (RLS multi-tenant isolation)
- `.planning/ROADMAP.md` §Phase 1 — Success criteria, dependency chain

### Technology stack
- `CLAUDE.md` §Technology Stack — MCP SDK v1.28.0, Supabase JS v2.100.1, Zod v4, Node 20 LTS
- `CLAUDE.md` §API Key Gating Pattern — API key validation approach
- `CLAUDE.md` §Transport Decision — Streamable HTTP (not stdio)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No source code exists yet — greenfield project. All code will be created in this phase.

### Established Patterns
- No patterns established yet. This phase sets the foundation patterns (migration structure, RLS approach, type generation) that all subsequent phases will follow.

### Integration Points
- Supabase CLI project initialization needed
- TypeScript types will be generated from schema (consumed by Phase 2 MCP server)
- API key validation logic will be consumed by Phase 2 auth middleware

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. All decisions captured above emerged from recommended patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-data-foundation*
*Context gathered: 2026-03-28*
