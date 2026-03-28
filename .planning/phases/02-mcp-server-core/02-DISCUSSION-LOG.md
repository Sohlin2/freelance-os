# Phase 2: MCP Server Core - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 02-mcp-server-core
**Areas discussed:** Tool granularity, Search & filter design, Error responses, Server structure

---

## Tool Granularity

### How granular should MCP tools be?

| Option | Description | Selected |
|--------|-------------|----------|
| One tool per operation | create_client, get_client, list_clients, update_client, archive_client — each does one thing. ~5 tools per entity. | ✓ |
| Combined CRUD tools | client_manage(action: 'create'\|'get'\|...) — fewer tools but complex conditional schema. | |
| Domain-grouped tools | crm_query (reads), crm_mutate (writes) — minimal count but most complex schemas. | |

**User's choice:** One tool per operation
**Notes:** Recommended approach. Claude picks the right tool naturally. Descriptions stay short.

### Should archive be a separate tool or a flag on update?

| Option | Description | Selected |
|--------|-------------|----------|
| Separate archive_client tool | Explicit intent — matches Phase 1 soft-delete pattern (D-04). | ✓ |
| Flag on update_client | update_client({ archive: true }) — fewer tools but risk of accidental archiving. | |

**User's choice:** Separate archive_client tool
**Notes:** Matches the soft-delete pattern from Phase 1.

### Should get_client include related projects?

| Option | Description | Selected |
|--------|-------------|----------|
| Include projects in get_client | Returns client + projects list. Satisfies CRM-03 in one call. | ✓ |
| Separate calls only | get_client returns just client. list_projects({ client_id }) for projects. | |
| Both — optional include param | get_client({ include: ['projects'] }) — flexible but more complex schema. | |

**User's choice:** Include projects in get_client
**Notes:** Satisfies CRM-03 (project history) without chaining tools.

### How should communication log work?

| Option | Description | Selected |
|--------|-------------|----------|
| Follow-ups as comms log | follow_ups table tracks outreach per client. get_client includes recent follow-ups. | ✓ |
| Notes field on client | Use clients.notes for freeform communication notes. | |
| Both — follow-ups + notes | Structured history via follow-ups, ad-hoc context via notes. | |

**User's choice:** Follow-ups as comms log
**Notes:** No new table needed. follow_ups table already exists from Phase 1 schema.

---

## Search & Filter Design

### How should search and filtering work?

| Option | Description | Selected |
|--------|-------------|----------|
| Filter params on list tools | list_clients({ status, search, sort_by, limit, offset }). No separate search tool. | ✓ |
| Separate search tool | search_crm({ query, entity }) for text search. list tools for structured filtering. | |
| Unified query tool | query_crm({ entity, filters, search, sort }) — one tool for all reads. | |

**User's choice:** Filter params on list tools
**Notes:** Fewer tools. Claude naturally says "show active clients" and list_clients handles it.

### How should text search work at DB level?

| Option | Description | Selected |
|--------|-------------|----------|
| ILIKE pattern matching | WHERE name ILIKE '%query%'. Simple, no extra setup. | ✓ |
| Postgres full-text search | tsvector/tsquery with GIN index. More powerful but overkill for dataset size. | |

**User's choice:** ILIKE pattern matching
**Notes:** Good enough for typical freelancer dataset sizes (tens to hundreds of clients).

---

## Error Responses

### How should tool errors surface?

| Option | Description | Selected |
|--------|-------------|----------|
| Structured error with message | MCP isError: true with human-readable message. No error codes. | ✓ |
| Error codes + messages | Structured codes (NOT_FOUND, VALIDATION_ERROR) plus human message. | |

**User's choice:** Structured error with human-readable message
**Notes:** Claude handles natural language fine — no need for machine-parseable codes.

### How should auth failures be handled?

| Option | Description | Selected |
|--------|-------------|----------|
| Reject at HTTP level | Return 401 before MCP processing. Auth middleware runs before tool handlers. | ✓ |
| MCP-level error on every tool | Accept HTTP request, return isError on every tool call. | |

**User's choice:** Reject at HTTP level
**Notes:** Clean separation — auth middleware before any tool handler.

---

## Server Structure

### How should the MCP server be structured?

| Option | Description | Selected |
|--------|-------------|----------|
| Modular with flat layout | src/server.ts, src/tools/, src/middleware/, src/lib/, src/types/. | ✓ |
| Single file to start | Everything in src/server.ts. Refactor later. | |
| Feature-based modules | src/features/clients/, src/features/projects/. Each self-contained. | |

**User's choice:** Modular with flat layout
**Notes:** Scales cleanly to Phase 3's ~35 tools.

### Which HTTP framework?

| Option | Description | Selected |
|--------|-------------|----------|
| Express | MCP SDK docs use Express examples. Mature middleware. | ✓ |
| Raw Node http | No framework dependency. More boilerplate. | |
| Hono | Modern, fast. Less MCP SDK community examples. | |

**User's choice:** Express
**Notes:** MCP SDK docs use Express for Streamable HTTP examples.

### How should tool registration work?

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-register from tools/ | Each file exports tool definitions. server.ts imports and registers all. | ✓ |
| Manual registration | server.ts explicitly imports each tool. More visible but more boilerplate. | |

**User's choice:** Auto-register from tools/
**Notes:** Adding a new entity in Phase 3 = add one file.

---

## Claude's Discretion

- Exact Zod schemas for tool input validation
- Supabase query patterns (PostgREST builder vs raw SQL)
- Express middleware chain order (beyond auth-first)
- Tool description wording
- Pagination defaults
- Connection pooling strategy

## Deferred Ideas

None — discussion stayed within phase scope.
