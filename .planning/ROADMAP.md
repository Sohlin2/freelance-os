# Roadmap: FreelanceOS

## Overview

FreelanceOS builds from the ground up along a strict dependency chain: the Supabase data layer must exist before the MCP server can store anything, the server must prove its transport and auth before all CRUD tools are built on top of it, the skill pack can only be authored meaningfully once the tools it references are stable, and packaging is the final step once tool signatures won't break distributed clients. Five phases, each delivering a coherent and independently verifiable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Data Foundation** - Supabase schema, RLS policies, and API key gating (the security baseline everything else depends on) (completed 2026-03-28)
- [ ] **Phase 2: MCP Server Core** - Streamable HTTP MCP server with auth middleware and proven client/project CRUD tools
- [x] **Phase 3: Full Tool Suite** - All remaining domain entities: proposals, invoices, time, scope, and follow-ups (completed 2026-03-28)
- [ ] **Phase 4: Skill Pack** - SKILL.md domain knowledge files that make Claude feel intelligent, not mechanical
- [ ] **Phase 5: Plugin Packaging** - npm-installable Claude Code plugin with manifest, API key config, and publish pipeline

## Phase Details

### Phase 1: Data Foundation
**Goal**: The Supabase backend is live with correct multi-tenant schema, RLS policies enforcing per-user data isolation, and API key validation working — before any user data is stored
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03
**Success Criteria** (what must be TRUE):
  1. All domain tables (clients, projects, proposals, invoices, time_entries, scope_definitions, scope_changes, follow_ups, api_keys) exist in Supabase with correct relationships
  2. RLS policies are enabled on every table such that User A's data is never returned by queries authenticated as User B
  3. A valid API key successfully authenticates against the api_keys table; an invalid or missing key is rejected with a 401
  4. Supabase TypeScript types are generated from the schema and importable in server code
**Plans:** 3/3 plans complete

Plans:
- [x] 01-01-PLAN.md — Project init, Supabase CLI setup, foundational migrations (extensions, enums, helper function)
- [x] 01-02-PLAN.md — All 9 domain table migrations with RLS policies and moddatetime triggers
- [x] 01-03-PLAN.md — Seed data, pgTAP tests (schema, API key, RLS isolation), TypeScript type generation

### Phase 2: MCP Server Core
**Goal**: A running Node.js MCP server using Streamable HTTP transport authenticates via Bearer token and exposes working client and project CRUD tools — proving the full stack before all entities are built
**Depends on**: Phase 1
**Requirements**: CRM-01, CRM-02, CRM-03, CRM-04
**Success Criteria** (what must be TRUE):
  1. User can tell Claude "add a new client" and the client record appears in Supabase, retrievable in a subsequent conversation
  2. User can create a project linked to a client, set its status (active/paused/complete), and update that status conversationally
  3. User can ask Claude to show a client's project history and communication log and receive accurate data
  4. User can search or filter clients and projects by name, status, or date and get correctly filtered results
  5. A request with a missing or invalid API key is rejected by the server before any tool handler runs
**Plans:** 2/3 plans executed

Plans:
- [x] 02-01-PLAN.md — Server foundation: deps, migration, vitest config, Express entry point, auth middleware, Supabase helpers
- [x] 02-02-PLAN.md — Client tools: create, get, list, update, archive with tests (CRM-01, CRM-03, CRM-04)
- [ ] 02-03-PLAN.md — Project tools: create, get, list, update, archive with tests (CRM-02, CRM-04)

### Phase 3: Full Tool Suite
**Goal**: All remaining freelance domain entities — proposals, invoices, time entries, scope definitions, scope changes, and follow-ups — have working MCP tools backed by domain logic
**Depends on**: Phase 2
**Requirements**: PROP-01, PROP-03, PROP-04, INV-01, INV-02, INV-03, INV-04, TIME-01, TIME-02, SCOPE-01, SCOPE-02, SCOPE-03, SCOPE-04, FLLW-01, FLLW-03
**Success Criteria** (what must be TRUE):
  1. User can ask Claude to draft a proposal for a project and the proposal is stored, linked to the client/project, and retrievable later
  2. Accepting a proposal automatically seeds the project scope record with the agreed deliverables
  3. User can generate an invoice that references the original proposal scope and agreed rate, track its status (draft/sent/paid/overdue), and filter invoices by status, client, or date
  4. User can log time entries against a project and ask Claude to aggregate total time for invoicing purposes
  5. User can define project scope, log scope change requests with classification, view scope history, and have the system detect when a new request falls outside agreed scope
  6. User can ask Claude to draft a follow-up email referencing real data (project name, invoice amount, days overdue) and view follow-up history per client
**Plans:** 5/5 plans complete

Plans:
- [x] 03-01-PLAN.md — Proposal tools: create, get, list, update, accept_proposal with scope seeding (PROP-01, PROP-03, PROP-04)
- [x] 03-02-PLAN.md — Invoice tools: create, get, list, update with JSONB line items and status tracking (INV-01, INV-02, INV-03, INV-04)
- [x] 03-03-PLAN.md — Time entry tools: create, get, list, update, archive, aggregate_time (TIME-01, TIME-02)
- [x] 03-04-PLAN.md — Scope tools: create, get, update, log_scope_change, list_scope_changes, check_scope (SCOPE-01, SCOPE-02, SCOPE-03, SCOPE-04)
- [x] 03-05-PLAN.md — Follow-up tools: create, get, list, update, mark_sent, get_context + server wiring (FLLW-01, FLLW-03)

### Phase 4: Skill Pack
**Goal**: SKILL.md domain knowledge files are authored and activated so Claude gives expert-quality guidance on proposals, invoices, scope, and follow-ups — not just mechanical data operations
**Depends on**: Phase 3
**Requirements**: PROP-02, FLLW-02, SKLL-01, SKLL-02, SKLL-03
**Success Criteria** (what must be TRUE):
  1. When drafting a proposal, Claude proactively coaches on pricing, scope clarity, revision limits, and payment terms without being asked
  2. When drafting a follow-up, Claude advises on timing and tone appropriate to the context (late invoice vs. check-in vs. awaiting proposal response) without being asked
  3. Skills are invoked automatically by describing a need — user does not type skill names or commands
  4. Total tool manifest stays under 15,000 tokens, verified by inspection
**Plans:** 1/3 plans executed

Plans:
- [x] 04-01-PLAN.md — Token counting enforcement script and vitest budget test (SKLL-03)
- [ ] 04-02-PLAN.md — High-priority skills: proposals, follow-ups, scope (PROP-02, FLLW-02, SKLL-01, SKLL-02)
- [ ] 04-03-PLAN.md — Lower-priority skills: invoices, time-tracking (SKLL-01, SKLL-02, SKLL-03)

### Phase 5: Plugin Packaging
**Goal**: FreelanceOS is installable as a Claude Code plugin via npm, the API key is collected at install time and stored securely, and the package is ready to publish
**Depends on**: Phase 4
**Requirements**: INFRA-04, INFRA-05
**Success Criteria** (what must be TRUE):
  1. Running `/plugin install freelanceos` (or equivalent npm install flow) successfully installs the plugin and prompts the user for their API key
  2. The API key is stored in the system keychain (not in plaintext config) and passed as a Bearer token to the MCP server on every request
  3. `npm pack` produces a tarball with no service role keys, no hardcoded secrets, and all required plugin manifest fields
  4. An installed plugin connects to the FreelanceOS MCP server and can execute a full end-to-end action (e.g., create a client) from a fresh Claude Code session
**Plans:** 2 plans

Plans:
- [ ] 05-01-PLAN.md — Plugin manifest, MCP config, build script, package.json publishing setup (INFRA-04, INFRA-05)
- [ ] 05-02-PLAN.md — Plugin packaging tests and npm-focused README (INFRA-04, INFRA-05)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Data Foundation | 3/3 | Complete   | 2026-03-28 |
| 2. MCP Server Core | 2/3 | In Progress|  |
| 3. Full Tool Suite | 5/5 | Complete   | 2026-03-28 |
| 4. Skill Pack | 1/3 | In Progress|  |
| 5. Plugin Packaging | 0/2 | Not started | - |
