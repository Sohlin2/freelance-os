# Project Research Summary

**Project:** FreelanceOS — Claude Code Skill Pack + MCP Server
**Domain:** Claude Code plugin (skill pack + remote MCP server + Supabase-backed SaaS)
**Researched:** 2026-03-28
**Confidence:** HIGH

## Executive Summary

FreelanceOS is a commercial Claude Code plugin that bundles AI-powered freelance business management into the developer's existing coding environment. The product consists of two distinct but interdependent pieces: a set of Agent Skills (SKILL.md files) that give Claude domain knowledge about proposals, invoices, scope, and follow-ups, and a remote MCP server backed by a hosted Supabase instance that provides persistent data storage across sessions. The established pattern for this type of product is a TypeScript MCP server distributed as an npm package, using Streamable HTTP transport with API key Bearer token auth, not the simpler stdio approach that most tutorials demonstrate — because data must live server-side, not on the user's machine.

The recommended build approach is to establish the Supabase schema and Row-Level Security policies first, then build the MCP server auth layer and CRUD tools, then layer skills on top once the data layer is proven. This order is non-negotiable: skills are untestable without working tools, and tools are unsafe without correct RLS. The competitive differentiator is the conversational interface itself — no existing tool (HoneyBook, Bonsai, Dubsado) offers in-editor, context-aware freelance management. Scope creep detection, context-aware follow-up drafting, and zero-context-switch workflows are unique to this format and should be treated as primary feature investments, not polish.

The highest risks are all security-related and must be resolved before any user data is stored: the Supabase service role key must never appear in the npm package, API key validation must happen server-side only, and RLS policies must be written in the same migration that creates each table. A secondary risk is MCP tool design — vague tool descriptions and atomic CRUD tools cause LLM decision failures; tools must be designed around freelancer outcomes, not database operations. Both risk categories are well-understood with clear prevention strategies documented in research.

## Key Findings

### Recommended Stack

The stack is narrow and well-justified. TypeScript 5.x is the only viable language choice — the MCP SDK ships full types, Supabase generates typed schema, and type safety prevents the runtime errors that are especially costly when tool schemas are passed to Claude. The MCP SDK (`@modelcontextprotocol/sdk` v1.28.0) is the official Anthropic SDK and the correct choice over third-party wrappers like FastMCP or mcp-framework, which lag behind SDK releases and add coupling risk for a commercial product. Zod v4 is required (not optional) — the SDK uses it internally and mixing versions causes resolution conflicts.

The transport decision is Streamable HTTP, not stdio. This is the critical difference from most MCP tutorials: because user data must persist in a hosted Supabase instance, the MCP server must be remote. stdio is appropriate for single-user local tools; FreelanceOS is a multi-tenant hosted service. This decision has upstream implications for deployment (Node.js hosted server, not an npm-spawned subprocess) and auth (Bearer token in headers, not environment variable injection at spawn time).

**Core technologies:**
- TypeScript 5.x + Node.js 20 LTS: primary language and runtime — MCP SDK requires native fetch; Supabase dropped Node 18 support
- `@modelcontextprotocol/sdk` v1.28.0: MCP server primitives — official SDK, production-stable, 36k+ dependent packages
- `@supabase/supabase-js` v2.100.1: database, auth, RLS — handles PostgREST, realtime, and storage from one import
- `zod` v4.x: tool input schema validation — required peer dep of MCP SDK; 14x faster than v3
- `tsup` v8.5.1: TypeScript bundling — zero-config dual ESM+CJS output for npm distribution
- `vitest`: unit testing — native TypeScript support, no transpile step, async-friendly for MCP tool handlers
- Agent Skills spec (SKILL.md): distributable skill format — open standard adopted by Anthropic December 2025

**What not to use:** SSE transport (deprecated March 2025), Zod v3 (version conflicts with SDK), OAuth 2.1 for API key gating (massive overhead for a subscription model), FastMCP/mcp-framework wrappers (maintenance risk), custom CLAUDE.md commands (not distributable via npm).

### Expected Features

The feature research confirms a clear MVP boundary. All table-stakes features cluster around a single data dependency chain: Supabase backend → clients → projects → proposals/invoices/time/scope. Every feature in the product depends on this chain; none can exist without it. The differentiating features (scope creep detection, context-aware follow-ups, proposal quality coaching) are additive layers on top of the core data model and belong in v1.x, not v1.0.

**Must have (table stakes):**
- MCP server with API key gating — without gating, there is no revenue model; without the server, there is no persistence
- Client records (CRM) — every other entity belongs to a client; this is the root of the data model
- Project tracking — links clients to work; status states (active/paused/complete) minimum
- Proposal drafting — the #1 freelance friction point; 1.57B freelancers still use Google Docs
- Invoice generation + status tracking — core financial operation; paid/sent/overdue states minimum
- Time logging — required for hourly billing; line items feed invoice generation
- Scope definition + scope change tracking — foundation for scope creep detection; must exist before creep can be detected
- Follow-up drafting — context-aware emails for late invoices and awaiting proposals
- Smart prompt skill pack — domain knowledge that makes the tool feel intelligent, not mechanical

**Should have (competitive):**
- Scope creep detection (AI-powered) — genuine differentiator; no competitor has this
- Overrun surfacing — proactive hour-vs-budget alerts; adds value once time tracking adoption is confirmed
- Invoice PDF export — client-facing polish; v1 can produce formatted text
- Proposal quality coaching — embedded feedback on proposal completeness
- Project dashboard / summary — "show me what's active and overdue"

**Defer (v2+):**
- Shareable client status links (requires web frontend)
- Payment webhook tracking (Stripe/PayPal integration)
- Team / agency support (multi-user data model)
- Reporting / analytics (requires data history)
- Payment processing (regulatory complexity, PCI scope)
- Contract / legal document generation (liability exposure)

### Architecture Approach

The architecture is a three-layer system: skills (in Claude's context) + MCP server (hosted Node.js) + Supabase (hosted Postgres). Claude mediates between the skill layer and the tool layer — skills cannot call tools directly, they guide Claude's behavior, and Claude decides which tools to invoke. This separation is intentional and must be preserved: putting business logic or tool-call sequences in skills makes them brittle. The skill layer contains domain knowledge (what makes a good proposal, when to flag scope creep); the server layer contains data operations; the domain layer inside the server contains business logic (invoice calculations, scope delta detection, follow-up timing heuristics).

**Major components:**
1. Plugin (`.claude-plugin/` + `package.json`) — bundles skills and MCP server config into an npm-installable distributable unit
2. Skill files (`skills/*/SKILL.md`) — teach Claude freelance domain knowledge; one file per domain area (proposal, invoice, follow-up, scope, freelance-context baseline)
3. MCP Server (`server/index.ts` + tools/) — exposes CRUD tools for all freelance entities; validates API keys; uses Streamable HTTP transport
4. Auth Layer (`server/auth.ts`) — validates Bearer token on every request; maps key to user_id; caches validated keys with 5-minute TTL
5. Domain Layer (`server/domain/`) — pure functions for scope creep detection, invoice calculation, follow-up heuristics; testable without MCP infrastructure
6. Supabase — hosted Postgres with RLS policies enforcing per-user data isolation; the authoritative data store

**Key structural decisions:**
- One tool file per domain entity (clients.ts, projects.ts, invoices.ts, time.ts, scope.ts, followups.ts)
- RLS as the authoritative access control layer — not application-level WHERE clauses
- Single Supabase client instance per server process — not per request
- `user-invocable: false` on the `freelance-context` baseline skill — loaded automatically, not surfaced as a command

### Critical Pitfalls

1. **Vague tool descriptions causing LLM misfires** — tools named after DB operations (create_invoice, get_client) rather than outcomes cause wrong tool selection. Name tools with the pattern `{action}_{specific_resource}` (e.g., `draft_client_proposal`, `log_time_against_project`), write usage context in descriptions ("Use when freelancer mentions a new client conversation. Do NOT use for updating existing records"), and cap total tools at 10-20.

2. **Supabase service role key in the npm package** — if the service role key appears in package source, every npm install gives users admin DB access. The service role key lives only on the hosted MCP server backend; the npm package authenticates with a FreelanceOS-issued API key. Verify with `npm pack` — no key-shaped strings should appear.

3. **RLS missing on tables after data exists** — retrofitting RLS after user data is present is a HIGH-cost recovery. Enable RLS and write the base user policy in the same migration that creates each table. Test with two Supabase clients (two user sessions) — User A must not retrieve User B's data.

4. **API key validation in the npm package instead of the server** — client-side key checks are not security checks; anyone reading npm source can remove them. Key validation must happen on the FreelanceOS backend server, not in the distributed package.

5. **Tool schema token bloat consuming context window** — 15 tools with verbose schemas can consume 10,000-20,000 tokens per request before Claude processes any conversation. Keep each tool description under 200 tokens; target under 15,000 tokens for the entire tool manifest combined. Prefer composite outcome-oriented tools over atomic CRUD tools.

## Implications for Roadmap

Based on the combined research, the dependency graph is unambiguous: data layer before server before skills before packaging. The architecture's build order implication is explicit: "Skills are meaningless to test until the MCP server tools exist."

### Phase 1: Data Foundation (Supabase Schema + Auth)
**Rationale:** Every feature in the product depends on this layer. RLS policies cannot be retrofitted safely; they must be written with the schema. The API key gating is the entire revenue model and must work before any user data is stored. This phase has no feature prerequisites — it is the prerequisite for everything else.
**Delivers:** Supabase schema with RLS on all tables, API key validation endpoint, `api_keys` table with bcrypt-hashed key storage, Supabase type generation via `supabase gen types typescript`
**Addresses:** Data persistence (table stakes), API key gating (P1 feature), security baseline
**Avoids:** RLS retrofit cost (critical pitfall), service role key exposure (critical pitfall), API key bypass (critical pitfall)

### Phase 2: MCP Server Core (Auth + CRUD Tools)
**Rationale:** The MCP server is the interface between Claude and the data layer. It must exist and be proven before skills can be tested end-to-end. Starting with auth + a minimal "ping" tool validates the Streamable HTTP transport before investing in tool development. This is explicitly recommended in architecture research to avoid discovering transport issues late.
**Delivers:** Node.js MCP server with Streamable HTTP transport, auth middleware with in-process key cache, tool files for clients and projects (core dependency chain), MCP Inspector validation, error handling with human-readable responses
**Uses:** `@modelcontextprotocol/sdk` v1.28.0, `@supabase/supabase-js`, `zod` v4, `tsup`
**Avoids:** Transport mismatch (pitfall 8), vague tool names (pitfall 1), raw JSON responses (pitfall 6)

### Phase 3: Full CRUD Tools (All Entities)
**Rationale:** Once the transport and auth pattern are proven with clients/projects, remaining tools follow the same pattern. Grouping remaining entities (proposals, invoices, time entries, scope, follow-ups) into one phase lets the domain layer be built cohesively. Scope and invoice domain logic (scope delta detection, invoice calculation) is testable as pure functions before tool wiring.
**Delivers:** Complete tool suite: proposals, invoices (with line items), time entries, scope definitions, scope changes, follow-up drafting; domain layer (scope.ts, invoice.ts, followup.ts); tool response format standardized as human-readable summaries
**Implements:** Full tool registry in server/index.ts, domain layer separation, composite outcome-oriented tools
**Avoids:** N+1 queries and missing indexes (performance trap), tool count exceeding 20 (context window pitfall)

### Phase 4: Skill Pack (Domain Knowledge Layer)
**Rationale:** Skills can only be meaningfully authored and tested once the tools they rely on exist. Writing skills before tools means writing against hypothetical tool names and schemas that will change. Skill quality is the primary product differentiator — this phase deserves full focus, not concurrent tool development.
**Delivers:** All SKILL.md files (proposal, invoice, follow-up, scope, freelance-context baseline), skill activation criteria tuned to avoid over-triggering, proposal quality coaching embedded in skill content, CLAUDE.md onboarding section
**Avoids:** Monolithic skill file (architecture anti-pattern 2), CLAUDE.md instruction conflicts (pitfall 7), skill activation on every message (UX pitfall), business logic in skills (architecture anti-pattern 1)

### Phase 5: Plugin Packaging + npm Distribution
**Rationale:** Packaging and distribution are the final step — they require the MCP server to be stable enough that tool signatures won't change (breaking distributed clients). The plugin manifest, version compatibility check, and npm release infrastructure belong together in one phase.
**Delivers:** `plugin.json` manifest, `.mcp.json` with `FREELANCEOS_API_KEY` env var reference, npm package structure, `tsup` build pipeline, schema version compatibility check in server startup, `check_server_compatibility` tool, npm publish workflow
**Addresses:** npm version fragmentation pitfall (pitfall 9), plugin install UX, marketplace listing metadata
**Avoids:** Version compatibility silent failures, API key hardcoded in `.mcp.json` (architecture anti-pattern 3)

### Phase 6: v1.x Intelligence Layer (Post-Validation)
**Rationale:** These features require adoption data to be useful. Scope creep detection needs real scope records to compare against. Overrun surfacing needs time tracking adoption. Proposal coaching is most effective once users have logged real proposals. These are not v1.0 features — they are v1.x features added after validating the core workflow with real users.
**Delivers:** AI-powered scope creep detection, overrun surfacing (hours vs. project budget alerts), invoice PDF export, proposal quality coaching, project dashboard / summary tool
**Addresses:** Differentiator features from FEATURES.md (P2 priority), competitive gap vs. HoneyBook/Bonsai/Dubsado

### Phase Ordering Rationale

- **Data before server before skills** is driven by the component dependency graph from architecture research; this order is not a preference, it is a technical requirement
- **Auth in Phase 1 (not Phase 2)** because the revenue model depends on it; delayed auth creates a risk of shipping data storage without gating
- **Transport validation early in Phase 2** because Streamable HTTP with Bearer token auth is the least-documented pattern; validate it before building 10+ tools against it
- **Skills in Phase 4 (not Phase 2)** because skills reference tool names and schemas — write them once those are stable, not before
- **Packaging last** because tool signature stability is a prerequisite; any post-packaging tool rename is a breaking change requiring a major version bump
- **v1.x features deferred** because scope creep detection and overrun surfacing require real user data to be meaningful; shipping them in v1.0 before users have data produces no value and wastes development time

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (MCP Server Core):** The Streamable HTTP + Bearer token auth pattern with Claude Code's `.mcp.json` discovery needs hands-on validation; official docs are clear but the exact header injection behavior during plugin install has limited real-world examples
- **Phase 5 (Plugin Packaging):** The Claude Code plugin marketplace distribution flow (plugin.json manifest, `${CLAUDE_PLUGIN_ROOT}` variable, `userConfig` prompting for API key at install time) is new (December 2025); detailed packaging research may be warranted before implementation

Phases with standard patterns (skip research-phase):
- **Phase 1 (Supabase Schema):** Supabase schema design and RLS policy patterns are extremely well-documented; standard multi-tenant patterns apply directly
- **Phase 3 (Full CRUD Tools):** Follows same pattern as Phase 2; no new technology introduced
- **Phase 4 (Skill Pack):** Agent Skills spec is well-documented at agentskills.io and code.claude.com; patterns established in Phase 2-3 validation

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All critical findings verified against official docs and npm registry; version numbers confirmed current |
| Features | HIGH | Multiple competitor analyses; dependency graph has solid logical foundation; MVP boundary is clear |
| Architecture | HIGH | Based on official Claude Code docs, MCP spec, and MCP SDK; component boundaries and data flow are authoritative |
| Pitfalls | HIGH | Multiple verified sources per finding; security pitfalls backed by CVEs and breach postmortems |

**Overall confidence:** HIGH

### Gaps to Address

- **Streamable HTTP transport in Claude Code plugin context:** Official docs are clear on transport spec; real-world examples of the exact `.mcp.json` header injection pattern at plugin install time are sparse. Validate with a minimal proof-of-concept (single "ping" tool) before building all CRUD tools.
- **Plugin marketplace distribution timing:** The Claude Code plugin marketplace was published December 2025. The `plugin.json` + npm source distribution path is documented but may have undocumented edge cases. Validate the full install flow (`/plugin install`) with the packaging phase prototype before launching.
- **API key issuance infrastructure:** Research covers what the api_keys table needs and how the MCP server validates keys, but the out-of-band signup + payment flow (Stripe webhook → API key generation → key delivery to user) is outside the plugin scope and needs its own planning. This is a required dependency before any paid users can use the product.
- **Pricing and billing mechanism:** Research confirms $15-30/month or $40 one-time is appropriate positioning, but the billing infrastructure (Stripe integration, subscription management, key provisioning on payment) was explicitly deferred as out-of-band. This must be planned before launch.

## Sources

### Primary (HIGH confidence)
- [modelcontextprotocol/typescript-sdk GitHub](https://github.com/modelcontextprotocol/typescript-sdk) — SDK version, Zod peer dep, transport options
- [modelcontextprotocol.io/docs](https://modelcontextprotocol.io/docs) — MCP architecture, transports spec, authorization patterns, registry versioning
- [code.claude.com/docs](https://code.claude.com/docs/en/skills) — Agent Skills format, plugin structure, plugin marketplace distribution
- [agentskills.io/specification](https://agentskills.io/specification) — SKILL.md frontmatter spec, skill directory structure
- [supabase.com docs + npm](https://www.npmjs.com/package/@supabase/supabase-js) — SDK version, Node version requirements, RLS patterns
- [zod.dev](https://zod.dev/) — v4 release, performance characteristics, JSON Schema export

### Secondary (MEDIUM confidence)
- [Phil Schmid — MCP best practices](https://www.philschmid.de/mcp-best-practices) — Tool design anti-patterns, outcome-oriented tool design
- [Apideck — MCP context window costs](https://www.apideck.com/blog/mcp-server-eating-context-window-cli-alternative) — Token cost of tool definitions, 55k token overhead example
- [Makerkit — Supabase API key management](https://makerkit.dev/blog/tutorials/supabase-api-key-management) — Bcrypt hashing, private schema storage, rate limiting patterns
- [Makerkit — Supabase RLS best practices](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices) — Multi-tenant RLS, JWT claim pitfalls
- [MindStudio — Claude Code Skills common mistakes](https://www.mindstudio.ai/blog/claude-code-skills-common-mistakes-guide) — Monolithic CLAUDE.md, over-tool-loading
- [Nordic APIs — MCP versioning](https://nordicapis.com/the-weak-point-in-mcp-nobodys-talking-about-api-versioning/) — Breaking changes in MCP tool signatures

### Tertiary (LOW confidence, needs validation)
- [Competitor pricing and feature data](https://spp.co/compare/spp-vs-dubsado-vs-honeybook-vs-bonsai) — Pricing figures for HoneyBook, Bonsai, Dubsado — may shift; validate before launch positioning
- [Scope creep statistics](https://www.cleartimeline.com/problems/scope-creep) — "72% of freelance projects suffer scope creep" — industry stat, needs primary source verification

---
*Research completed: 2026-03-28*
*Ready for roadmap: yes*
