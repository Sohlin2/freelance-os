# Phase 2: MCP Server Core - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

A running Node.js MCP server using Streamable HTTP transport authenticates via Bearer token and exposes working client and project CRUD tools — proving the full stack before all entities are built. Covers CRM-01 (client CRUD), CRM-02 (project CRUD with status), CRM-03 (client project history and communication log), CRM-04 (search/filter by name, status, date).

</domain>

<decisions>
## Implementation Decisions

### Tool Granularity
- **D-01:** One tool per operation — create_client, get_client, list_clients, update_client, archive_client (and same pattern for projects). Each tool does one thing with a simple schema.
- **D-02:** Separate archive tool (archive_client, archive_project) rather than a flag on update. Matches the soft-delete pattern from Phase 1 (D-04) and makes intent explicit.
- **D-03:** get_client includes related projects list in the response. Satisfies CRM-03 (project history) in one call without chaining.
- **D-04:** Communication log uses the follow_ups table. get_client includes recent follow-ups as communication history. No new table or schema changes needed.

### Search & Filter Design
- **D-05:** Filter params on list tools — list_clients and list_projects accept optional search, status, sort_by, sort_dir, limit, offset params. No separate search tool.
- **D-06:** Text search via ILIKE pattern matching (WHERE name ILIKE '%query%'). Simple, no extra DB setup, sufficient for typical freelancer dataset sizes.

### Error Responses
- **D-07:** Structured error with human-readable message using MCP isError: true. No error codes — Claude reads the natural language message and explains to the user.
- **D-08:** Auth failures (invalid/missing API key) rejected at HTTP level with 401 before MCP protocol processing. Clean separation — auth middleware runs before any tool handler.

### Server Structure
- **D-09:** Modular flat layout: src/server.ts (entry + transport), src/tools/ (one file per entity), src/middleware/ (auth), src/lib/ (supabase client, helpers), src/types/ (generated types).
- **D-10:** Express as HTTP framework for Streamable HTTP transport. MCP SDK docs use Express examples, mature middleware ecosystem.
- **D-11:** Auto-register tools from src/tools/ — each file exports tool definitions, server.ts imports and registers them all. Adding a new entity in Phase 3 = add one file.

### Claude's Discretion
- Exact Zod schemas for each tool's input validation
- Supabase query patterns (PostgREST builder vs raw SQL)
- Express middleware chain order (beyond auth-first)
- Tool description wording for optimal Claude invocation
- Pagination defaults (limit, max page size)
- Whether to use connection pooling or single client

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project specs
- `.planning/PROJECT.md` — Core value, constraints, key decisions (hosted Supabase, chat-driven UX, API key gating)
- `.planning/REQUIREMENTS.md` — CRM-01 (client CRUD), CRM-02 (project CRUD), CRM-03 (history/comm log), CRM-04 (search/filter)
- `.planning/ROADMAP.md` §Phase 2 — Success criteria, dependency on Phase 1

### Technology stack
- `CLAUDE.md` §Technology Stack — MCP SDK v1.28.0, Supabase JS v2.100.1, Zod v4, Node 20 LTS, tsup for bundling
- `CLAUDE.md` §Transport Decision — Streamable HTTP (not stdio)
- `CLAUDE.md` §API Key Gating Pattern — API key validation approach

### Phase 1 foundation
- `.planning/phases/01-data-foundation/01-CONTEXT.md` — Schema decisions (D-01 through D-15) that constrain this phase: snake_case naming, enum types, soft delete via archived_at, API key format, RLS auth flow via session variable
- `src/types/database.ts` — Generated TypeScript types from Supabase schema (Row, Insert, Update types for all tables)
- `supabase/migrations/` — All 7 migration files defining the schema this server operates on

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/types/database.ts` — Full Supabase-generated types for all 9 domain tables (Row, Insert, Update). Use these for type-safe Supabase queries.
- `package.json` — Already has `@supabase/supabase-js`, `zod`, `vitest`, `typescript`. Needs `@modelcontextprotocol/sdk`, `express`, `@types/express`, `tsup` added.

### Established Patterns
- ESM module system (`"type": "module"` in package.json)
- TypeScript strict mode with Node16 module resolution
- Target ES2022, output to dist/

### Integration Points
- Supabase migrations define the schema — MCP tools query these tables via `@supabase/supabase-js`
- Auth flow: API key in Bearer header → SHA-256 hash → look up in api_keys table → resolve user_id → set session variable → RLS enforces isolation
- Phase 3 will add tools following the same pattern established here (one file per entity in src/tools/)

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

*Phase: 02-mcp-server-core*
*Context gathered: 2026-03-28*
