# Phase 2: MCP Server Core - Research

**Researched:** 2026-03-28
**Domain:** MCP SDK v1.28.0 + Streamable HTTP transport + Express 5 + Supabase service-role auth flow
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Tool Granularity**
- D-01: One tool per operation — create_client, get_client, list_clients, update_client, archive_client (and same pattern for projects). Each tool does one thing with a simple schema.
- D-02: Separate archive tool (archive_client, archive_project) rather than a flag on update. Matches the soft-delete pattern from Phase 1 (D-04) and makes intent explicit.
- D-03: get_client includes related projects list in the response. Satisfies CRM-03 (project history) in one call without chaining.
- D-04: Communication log uses the follow_ups table. get_client includes recent follow-ups as communication history. No new table or schema changes needed.

**Search & Filter Design**
- D-05: Filter params on list tools — list_clients and list_projects accept optional search, status, sort_by, sort_dir, limit, offset params. No separate search tool.
- D-06: Text search via ILIKE pattern matching (WHERE name ILIKE '%query%'). Simple, no extra DB setup, sufficient for typical freelancer dataset sizes.

**Error Responses**
- D-07: Structured error with human-readable message using MCP isError: true. No error codes — Claude reads the natural language message and explains to the user.
- D-08: Auth failures (invalid/missing API key) rejected at HTTP level with 401 before MCP protocol processing. Clean separation — auth middleware runs before any tool handler.

**Server Structure**
- D-09: Modular flat layout: src/server.ts (entry + transport), src/tools/ (one file per entity), src/middleware/ (auth), src/lib/ (supabase client, helpers), src/types/ (generated types).
- D-10: Express as HTTP framework for Streamable HTTP transport. MCP SDK docs use Express examples, mature middleware ecosystem.
- D-11: Auto-register tools from src/tools/ — each file exports tool definitions, server.ts imports and registers them all. Adding a new entity in Phase 3 = add one file.

### Claude's Discretion
- Exact Zod schemas for each tool's input validation
- Supabase query patterns (PostgREST builder vs raw SQL)
- Express middleware chain order (beyond auth-first)
- Tool description wording for optimal Claude invocation
- Pagination defaults (limit, max page size)
- Whether to use connection pooling or single client

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CRM-01 | User can create, read, update, and delete client records (name, contact info, billing rate, notes) | McpServer.registerTool() + Supabase PostgREST client patterns documented; soft-delete via archived_at from Phase 1 |
| CRM-02 | User can create projects linked to a client with status tracking (active/completed/paused) | project_status enum verified in schema; Zod .enum() validation pattern documented |
| CRM-03 | User can view a client's full project history and communication log | get_client returns joined projects + follow_ups; supabase-js chained .select() with relationships documented |
| CRM-04 | User can search and filter clients and projects by name, status, or date | ILIKE pattern on list_clients/list_projects; Supabase .ilike() and .eq() filter chaining documented |
</phase_requirements>

---

## Summary

Phase 2 bootstraps the MCP server that exposes client and project CRUD operations via Streamable HTTP transport. The full stack path is: Claude Code sends JSON-RPC over HTTP POST to the MCP endpoint → Express middleware validates the API key via `validate_api_key()` (Supabase function from Phase 1) → auth middleware attaches the resolved `userId` to the request → the tool handler calls `set_config('app.current_user_id', userId, false)` before issuing Supabase queries → Postgres RLS policies enforce per-user isolation.

The MCP SDK v1.28.0 bundles Express v5.2.1 as a direct dependency (not a peer dep), so the project does not need to install Express separately. The SDK exports `createMcpExpressApp()` which creates a pre-configured app with DNS rebinding protection. Tool registration uses `McpServer.registerTool()` with `inputSchema` supplied as a raw Zod v4 shape object (not `z.object()` — just the raw shape). For this phase the server is stateless (one `StreamableHTTPServerTransport` instance per request, `sessionIdGenerator: undefined`), which avoids in-memory session management and is safe because every tool call is stateless.

The critical unsolved concern from Phase 1 is the `SET LOCAL` transaction scope: `set_config('app.current_user_id', userId, false)` sets the variable at session scope (lasts the full PostgREST connection), not transaction scope. For connection-pooled environments, this leaks user context across requests. The safe pattern is to call `set_config(..., true)` (transaction-scoped) inside an explicit PostgreSQL transaction, but `supabase-js` PostgREST builder does not expose `BEGIN`/`COMMIT`. The recommended approach for this phase is to call `set_config` via a Supabase RPC helper (`set_app_user_id`) before running queries, and to use separate per-request Supabase client instances (created fresh per tool call) so pooled connections are not shared between users.

**Primary recommendation:** Use `createMcpExpressApp()` from the SDK, stateless transport pattern (one transport per POST request), custom auth middleware before the `/mcp` route, and per-request Supabase client creation with `set_config` via RPC before each tool's queries.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@modelcontextprotocol/sdk` | 1.28.0 | MCP server primitives — McpServer, StreamableHTTPServerTransport, createMcpExpressApp | Official Anthropic SDK; v1.x is production-stable; 36,000+ dependents; verified installed |
| `express` | 5.2.1 | HTTP framework for Streamable HTTP transport | Bundled as direct dep of `@modelcontextprotocol/sdk`; `createMcpExpressApp()` returns Express app pre-configured with DNS rebinding protection |
| `@supabase/supabase-js` | 2.100.1 | Database client for PostgREST queries, RPC calls | Already in dependencies; handles `validate_api_key()` call and all CRUD operations |
| `zod` | 4.3.6 | Tool input schema validation | Already in devDependencies; SDK imports from `zod/v4` internally; use `zod/v4` import in tool files |
| `typescript` | 6.0.2 | Primary language | Already installed; strict mode, Node16 module resolution |
| `tsup` | 8.5.1 | Bundle TypeScript for distribution | To be added; zero-config dual ESM+CJS output |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@types/node` | 25.5.0 | TypeScript types for Node.js built-ins (crypto, http) | Add to devDependencies; needed for `randomUUID`, `IncomingMessage` types |
| `@types/express` | 5.0.6 | TypeScript types for Express | Add to devDependencies; needed for `Request`, `Response`, `RequestHandler` types |
| `vitest` | 4.1.2 | Unit/integration testing | Already installed; native TypeScript + ESM support; no transpile step needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Stateless transport (new transport per request) | Stateful transport (session map in memory) | Stateless is simpler, no GC concerns, works fine for tool-call semantics. Stateful needed only for long-running SSE notifications. Tool calls are request/response — stateless wins. |
| `createMcpExpressApp()` helper | Bare `express()` | Helper adds DNS rebinding protection middleware automatically. Same result as manual setup; less code. |
| `supabase-js` PostgREST for queries | `postgres` (pg) direct connection | PostgREST builder is type-safe against generated types from Phase 1. Direct pg gives transaction control but loses type safety. Phase 2 uses PostgREST + RPC wrapper for `set_config`. |
| Per-request `createClient` | Shared singleton client | Per-request ensures no session-variable leakage between users in a connection pool. Singleton is fine for non-user-scoped clients (validation). |

**Installation:**
```bash
# Packages to add (express is already pulled in transitively by MCP SDK, add for direct import types)
npm install --save-dev @types/node @types/express tsup
```

**Version verification (verified 2026-03-28 against npm registry and installed node_modules):**
- `@modelcontextprotocol/sdk`: 1.28.0 — installed via `npm install @modelcontextprotocol/sdk@1.28.0`
- `express`: 5.2.1 — installed as dependency of MCP SDK; available in node_modules
- `@supabase/supabase-js`: 2.100.1 — already in dependencies
- `zod`: 4.3.6 — already in devDependencies
- `typescript`: 6.0.2 — already in devDependencies
- `tsup`: 8.5.1 — current stable on npm registry
- `@types/express`: 5.0.6 — current stable on npm registry
- `@types/node`: 25.5.0 — current stable on npm registry
- `vitest`: 4.1.2 — already in devDependencies

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── server.ts              # Entry point: createMcpExpressApp, route, listen
├── middleware/
│   └── auth.ts            # validateApiKey middleware: 401 before MCP protocol
├── lib/
│   ├── supabase.ts        # createSupabaseClient() factory (per-request)
│   └── with-user-context.ts  # withUserContext() helper wrapping set_config RPC
├── tools/
│   ├── clients.ts         # registerClientTools(server) — 5 tools
│   └── projects.ts        # registerProjectTools(server) — 5 tools
└── types/
    └── database.ts        # Generated Phase 1 types (already exists)
```

The planner should NOT add `tsup.config.ts` in this phase — `tsup` build configuration is Phase 5 (npm packaging). This phase only needs `src/` to run via `npx tsx src/server.ts` for development and testing.

### Pattern 1: Stateless Streamable HTTP Server Setup
**What:** One `McpServer` factory + one `StreamableHTTPServerTransport` per POST request. No in-memory session map.
**When to use:** All tool-call MCP servers that don't send server-initiated notifications.

```typescript
// Source: node_modules/@modelcontextprotocol/sdk/dist/esm/examples/server/simpleStatelessStreamableHttp.js
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { registerClientTools } from './tools/clients.js';
import { registerProjectTools } from './tools/projects.js';

function buildServer(): McpServer {
  const server = new McpServer(
    { name: 'freelance-os', version: '1.0.0' },
    { capabilities: { logging: {} } }
  );
  registerClientTools(server);
  registerProjectTools(server);
  return server;
}

const app = createMcpExpressApp();
app.use(express.json());
app.use('/mcp', apiKeyAuthMiddleware);  // Auth runs BEFORE transport

app.post('/mcp', async (req, res) => {
  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,  // Stateless — no session tracking
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    res.on('close', () => {
      transport.close();
      server.close();
    });
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null });
    }
  }
});

app.get('/mcp', (_req, res) => res.status(405).end());
app.delete('/mcp', (_req, res) => res.status(405).end());

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => console.log(`FreelanceOS MCP server on port ${PORT}`));
```

**Important:** `createMcpExpressApp()` returns an Express app that already calls `app.use(express.json())` internally. Do NOT call `app.use(express.json())` again or it double-parses. Verify this by checking the SDK source if double-parsing causes issues.

### Pattern 2: Auth Middleware (API Key → userId)
**What:** Express middleware that extracts the Bearer token, calls `validate_api_key()`, resolves `userId`, attaches to `req`. Returns 401 before MCP protocol if invalid.
**When to use:** Applied to `/mcp` route before transport; satisfies D-08.

```typescript
// Source: Phase 1 migrations + MCP SDK AuthInfo type
// src/middleware/auth.ts
import type { RequestHandler } from 'express';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.js';

// Singleton admin client for key validation (does not carry user context)
const adminClient = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Extend Express request to carry resolved userId
declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
  }
}

export const apiKeyAuthMiddleware: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing API key. Provide Authorization: Bearer <key>' });
    return;
  }
  const apiKey = authHeader.slice(7);
  const { data: userId, error } = await adminClient.rpc('validate_api_key', { p_key: apiKey });
  if (error || !userId) {
    res.status(401).json({ error: 'Invalid or revoked API key.' });
    return;
  }
  req.userId = userId as string;
  next();
};
```

### Pattern 3: Per-Request Supabase Client with User Context
**What:** Create a fresh Supabase client for each tool call. Call `set_config('app.current_user_id', userId, false)` via RPC before running queries so RLS policies see the correct user.
**When to use:** Every tool handler that reads or writes user data; satisfies D-09 from Phase 1.

```typescript
// Source: Phase 1 RLS pattern (D-09) + supabase-js docs
// src/lib/with-user-context.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.js';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createUserClient(): SupabaseClient<Database> {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function withUserContext<T>(
  userId: string,
  fn: (db: SupabaseClient<Database>) => Promise<T>
): Promise<T> {
  const db = createUserClient();
  // Set session-scoped user context (false = session scope, not transaction scope)
  // This is safe with per-request clients because each client has its own connection lifecycle
  await db.rpc('set_app_user_id', { p_user_id: userId });
  return fn(db);
}
```

**NOTE:** `set_app_user_id` is a Postgres helper function that must be created in a new migration during this phase:
```sql
-- src/supabase/migrations/[timestamp]_create_set_app_user_id.sql
create or replace function public.set_app_user_id(p_user_id uuid)
returns void
language plpgsql security definer
as $$
begin
  perform set_config('app.current_user_id', p_user_id::text, false);
end;
$$;
```

**Why a new migration and not inline `set_config`:** `supabase-js` PostgREST builder does not expose raw SQL execution. RPC calls are the only way to run arbitrary Postgres code. The `validate_api_key` function (Phase 1) already proves this pattern works.

### Pattern 4: Tool Registration (One File Per Entity)
**What:** Each entity file exports a registration function that takes an `McpServer` and registers all tools for that entity.
**When to use:** Every tool file; satisfies D-11 (auto-registration).

```typescript
// Source: McpServer.registerTool() signature from mcp.d.ts
// src/tools/clients.ts
import * as z from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withUserContext } from '../lib/with-user-context.js';

export function registerClientTools(server: McpServer, getUserId: () => string): void {
  server.registerTool(
    'create_client',
    {
      description: 'Create a new client record. Use when a freelancer tells you about a new client.',
      inputSchema: {
        name: z.string().min(1).describe('Client full name or company name'),
        email: z.string().email().optional().describe('Client email address'),
        phone: z.string().optional().describe('Client phone number'),
        company: z.string().optional().describe('Company name if different from contact name'),
        billing_rate: z.number().positive().optional().describe('Hourly rate in the client\'s currency'),
        currency: z.string().length(3).default('USD').describe('ISO 4217 currency code'),
        notes: z.string().optional().describe('Free-form notes about this client'),
      },
    },
    async (args, extra) => {
      const userId = extra.sessionId ?? '';  // userId passed via transport extra or captured from closure
      try {
        const result = await withUserContext(userId, async (db) => {
          const { data, error } = await db
            .from('clients')
            .insert({ ...args, user_id: userId })
            .select()
            .single();
          if (error) throw error;
          return data;
        });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: 'text', text: `Failed to create client: ${msg}` }], isError: true };
      }
    }
  );
  // ... more tools
}
```

**Key note about `userId` in tool handlers:** The `extra` parameter passed to tool callbacks does NOT automatically carry the authenticated userId from the HTTP middleware layer. You must thread the `userId` from the request context into the tool. Two clean approaches:
1. **Closure approach:** Pass `getUserId` factory to the registration function, called from server.ts where `req.userId` is in scope.
2. **Context map approach:** Use the `extra.sessionId` (undefined in stateless mode) as a key — not applicable here.

The recommended approach for stateless servers is to pass `userId` as a closure parameter to the tool registration function from within the POST route handler (where `req.userId` is available):

```typescript
// server.ts — inside POST /mcp handler
app.post('/mcp', async (req, res) => {
  const userId = req.userId!;  // Set by auth middleware
  const server = buildServer(userId);  // Pass userId to tool registration
  // ...
});

// server.ts — buildServer factory
function buildServer(userId: string): McpServer {
  const server = new McpServer({ name: 'freelance-os', version: '1.0.0' });
  registerClientTools(server, userId);
  registerProjectTools(server, userId);
  return server;
}
```

### Pattern 5: ILIKE Search + Filter on List Tools
**What:** `list_clients` and `list_projects` accept optional filter parameters and build a conditional Supabase query.
**When to use:** Satisfies D-05, D-06, CRM-04.

```typescript
// Source: supabase-js PostgREST builder chaining
async (args) => {
  const { search, status, sort_by, sort_dir, limit = 20, offset = 0 } = args;
  let query = db.from('clients').select('*').is('archived_at', null);
  if (search) query = query.ilike('name', `%${search}%`);
  if (status) query = query.eq('status', status);
  query = query.order(sort_by ?? 'created_at', { ascending: sort_dir !== 'desc' });
  query = query.range(offset, offset + limit - 1);
  const { data, error } = await query;
  // ...
}
```

### Pattern 6: get_client with Related Data (CRM-03)
**What:** `get_client` fetches the client row AND related projects AND recent follow-ups in a single Supabase query using PostgREST relationship syntax.
**When to use:** Satisfies D-03, D-04, CRM-03.

```typescript
// Source: supabase-js docs — foreign table joins via .select()
const { data, error } = await db
  .from('clients')
  .select(`
    *,
    projects (id, name, status, start_date, end_date, budget, currency, archived_at),
    follow_ups (id, subject, type, sent_at, created_at)
  `)
  .eq('id', clientId)
  .is('archived_at', null)
  .single();
```

This returns the client row with `projects` and `follow_ups` arrays embedded. The `archived_at IS NULL` filter applies only to the clients table — projects and follow_ups are returned regardless of their own archived_at (so archived projects still appear in history). Add explicit filters on the relationship if needed: `projects!inner(...)`.

### Anti-Patterns to Avoid
- **Using `req.body` pre-parse without json middleware:** `createMcpExpressApp()` may or may not include `express.json()` internally. Verify: if `req.body` is undefined on POST, add `app.use(express.json())` before routes. Do NOT double-add.
- **Singleton Supabase client with shared user context:** If the same client instance is reused across requests and `set_config` sets session-scoped variables, user A's context may persist for user B's request in a pooled connection. Always create a fresh client per tool call.
- **Using `server.tool()` instead of `server.registerTool()`:** The `tool()` method is deprecated as of SDK v1.x. Use `registerTool()` with the config object.
- **Passing raw `z.object()` to inputSchema:** The SDK expects a raw Zod shape object (the argument to `z.object()`), NOT a `z.object()` instance itself. Pass `{ name: z.string(), email: z.string().optional() }` not `z.object({ name: z.string() })`.
- **Registering tools after `server.connect(transport)`:** All `registerTool()` calls must happen before `server.connect()`. The SDK locks the tool manifest at connect time.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP transport protocol | Custom HTTP layer with SSE | `StreamableHTTPServerTransport` | MCP spec requires specific SSE/JSON negotiation, session headers, and error format; SDK handles all of this |
| DNS rebinding protection | Custom Host header validation | `createMcpExpressApp()` | SDK already includes this middleware for localhost hosts; safe default |
| MCP initialization handshake | Custom `initialize` handler | `McpServer.connect()` | SDK handles capability negotiation, version exchange, and `initialized` notification automatically |
| JSON-RPC framing | Custom JSON-RPC parse/serialize | `McpServer.registerTool()` + SDK | SDK wraps callbacks in correct JSON-RPC response format including `isError` semantics |
| Zod schema to JSON Schema conversion | Custom converter | SDK does this automatically | `registerTool()` converts Zod shape to JSON Schema for the `tools/list` response |

**Key insight:** The MCP protocol has significant wire-format complexity (SSE negotiation, session IDs, capability exchange). Building any of this manually introduces spec-compliance bugs that break Claude Code's client.

---

## Runtime State Inventory

Step 2.5 SKIPPED — this is a greenfield phase, not a rename/refactor/migration. No existing runtime state to audit.

---

## Environment Availability Audit

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | MCP server runtime | Yes | v24.14.0 | — |
| npm | Package management | Yes | 11.9.0 | — |
| `@modelcontextprotocol/sdk` | MCP server primitives | Yes (installed) | 1.28.0 | — |
| `@supabase/supabase-js` | DB client | Yes (installed) | 2.100.1 | — |
| `express` | HTTP framework | Yes (transitive dep of SDK) | 5.2.1 | — |
| `zod` | Input validation | Yes (installed) | 4.3.6 | — |
| `typescript` | Type checking | Yes (installed) | 6.0.2 | — |
| `vitest` | Unit testing | Yes (installed) | 4.1.2 | — |
| `tsup` | Build tool | Not yet installed | — | Install: `npm install --save-dev tsup` |
| `@types/node` | Node.js types | Not yet installed | — | Install: `npm install --save-dev @types/node` |
| `@types/express` | Express types | Not yet installed | — | Install: `npm install --save-dev @types/express` |
| Docker Desktop | Local Supabase stack | Unavailable | — | Use hosted Supabase directly (established in Phase 1) |
| Hosted Supabase | DB backend | Yes (Phase 1 verified) | — | — |

**Missing dependencies with no fallback:**
- None that block execution. The hosted Supabase instance from Phase 1 is available.

**Missing dependencies with fallback:**
- `tsup`, `@types/node`, `@types/express` — install as first step of Phase 2 Wave 0.

---

## Common Pitfalls

### Pitfall 1: `createMcpExpressApp()` Already Calls `express.json()`
**What goes wrong:** Calling `app.use(express.json())` after `createMcpExpressApp()` parses the body twice, resulting in an empty `req.body` when the SDK tries to read it.
**Why it happens:** The SDK's Express helper includes its own JSON body parser middleware.
**How to avoid:** Do not call `app.use(express.json())` yourself. The MCP SDK handles body parsing. If `req.body` is empty, check whether the auth middleware is consuming the stream before the transport sees it.
**Warning signs:** `req.body` is `{}` or `undefined` in the POST route handler despite correct `Content-Type: application/json`.

### Pitfall 2: Auth Middleware Must NOT Read `req.body`
**What goes wrong:** Auth middleware that reads `req.body` to extract tokens prevents the Express body parser from buffering for later consumers.
**Why it happens:** Express body parsers are streaming — once read, the stream is consumed.
**How to avoid:** Auth middleware reads ONLY `req.headers.authorization` (a header, not body). Never extract tokens from the request body.
**Warning signs:** Transport sees `{}` body after auth middleware runs.

### Pitfall 3: Supabase User Context Leakage Between Requests
**What goes wrong:** If a single Supabase client instance is reused across multiple requests, `set_config('app.current_user_id', ...)` set for user A may persist in a pooled connection that is reused for user B's request.
**Why it happens:** PostgREST connection pools share underlying DB connections. Session-scoped variables persist until explicitly cleared or the connection is released.
**How to avoid:** Create a fresh `createClient()` instance for each tool call. Stateless servers create a new McpServer + transport per request anyway — piggyback on that lifecycle.
**Warning signs:** User A can see User B's data in production (RLS bypass via stale session variable).

### Pitfall 4: `sessionIdGenerator: undefined` Required for Stateless Mode
**What goes wrong:** Omitting `sessionIdGenerator` entirely (rather than setting it to `undefined`) leaves the transport in an undefined state. The SDK distinguishes `{ sessionIdGenerator: undefined }` (stateless — explicit opt-in) from `{}` (missing option — may default to stateful).
**Why it happens:** TypeScript option bag — missing key vs. explicitly undefined key behave differently in SDK logic.
**How to avoid:** Always pass `sessionIdGenerator: undefined` explicitly when you want stateless mode.
**Warning signs:** Server generates unexpected session IDs or returns 400 on second requests from the same client.

### Pitfall 5: `server.connect()` Must Come Before `transport.handleRequest()`
**What goes wrong:** Calling `transport.handleRequest()` before `server.connect(transport)` results in a transport with no message handler attached — requests silently drop or return protocol errors.
**Why it happens:** `connect()` wires the server's message router to the transport. Without it, the transport doesn't know where to dispatch incoming JSON-RPC messages.
**How to avoid:** The order is always: `await server.connect(transport)` → `await transport.handleRequest(req, res, req.body)`.
**Warning signs:** MCP `initialize` request never returns a valid `InitializeResult`; Claude Code reports "server did not respond to initialize".

### Pitfall 6: `registerTool()` Called After `connect()`
**What goes wrong:** Tools registered after `server.connect(transport)` do not appear in `tools/list` responses.
**Why it happens:** The SDK captures tool registration at connect time to build the capability manifest.
**How to avoid:** All `registerTool()` calls must complete before the `await server.connect(transport)` line. Use the factory pattern — `buildServer(userId)` creates and fully registers tools, then the caller calls `connect()`.
**Warning signs:** Claude Code's tool list shows fewer tools than expected; some tools are silently absent.

### Pitfall 7: Node16 Module Resolution Requires `.js` Extensions on Imports
**What goes wrong:** TypeScript with `"module": "Node16"` requires explicit `.js` file extensions on local imports, even when the source files are `.ts`.
**Why it happens:** Node16 module resolution emulates native ESM which requires extensions; TypeScript does not rewrite extensions, so you must write `.js` in source to match the compiled output.
**How to avoid:** All local imports must end in `.js`: `import { foo } from './lib/supabase.js'` (not `.ts`).
**Warning signs:** `Error [ERR_MODULE_NOT_FOUND]: Cannot find module './lib/supabase'` at runtime.

### Pitfall 8: `zod/v4` Import vs. `zod` Import
**What goes wrong:** The MCP SDK imports Zod internally from `zod/v4`. If tool files import from `zod` (v3 compat layer), Zod processes inputs twice through different parsers, causing unexpected validation behavior or type errors.
**Why it happens:** Zod v4 ships a `zod/v4` subpath that exposes the pure v4 API. The top-level `zod` export is a compatibility shim.
**How to avoid:** Use `import * as z from 'zod/v4'` in all tool files (as the SDK examples show).
**Warning signs:** Type errors like "ZodString is not assignable to ZodStringDef" between tool schema types and SDK expectations.

---

## Code Examples

### Complete Auth Middleware
```typescript
// Source: Phase 1 validate_api_key() function + MCP SDK AuthInfo pattern
// src/middleware/auth.ts
import type { RequestHandler } from 'express';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.js';

const adminClient = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

declare module 'express-serve-static-core' {
  interface Request { userId?: string; }
}

export const apiKeyAuthMiddleware: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing API key. Pass Authorization: Bearer <fos_live_...>' });
    return;
  }
  const apiKey = authHeader.slice(7);
  const { data: userId, error } = await adminClient.rpc('validate_api_key', { p_key: apiKey });
  if (error || !userId) {
    res.status(401).json({ error: 'Invalid or revoked API key.' });
    return;
  }
  req.userId = userId;
  next();
};
```

### Tool Error Return Pattern
```typescript
// Source: MCP SDK CallToolResult type
// isError: true signals to Claude that the tool failed; Claude explains to user in natural language
return {
  content: [{ type: 'text', text: `Failed to create client: ${error.message}` }],
  isError: true,
};
```

### Supabase Filter Chain Pattern (list_clients)
```typescript
// Source: supabase-js PostgREST builder docs
const { search, status, sort_by = 'created_at', sort_dir = 'desc', limit = 20, offset = 0 } = args;
let query = db.from('clients').select('*').is('archived_at', null);
if (search) query = query.ilike('name', `%${search}%`);
const { data, error } = await query
  .order(sort_by, { ascending: sort_dir === 'asc' })
  .range(offset, offset + limit - 1);
```

### New Migration: set_app_user_id Helper
```sql
-- supabase/migrations/[timestamp]_create_set_app_user_id.sql
-- Exposes set_config to supabase-js via RPC (supabase-js has no raw SQL API)
create or replace function public.set_app_user_id(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  perform set_config('app.current_user_id', p_user_id::text, false);
end;
$$;
comment on function public.set_app_user_id(uuid) is
  'Sets app.current_user_id session variable for RLS policy evaluation. Called by MCP server before every user query.';
```

### vitest Test Pattern for Tool Handlers
```typescript
// Source: vitest docs — native ESM + TypeScript
// tests/tools/clients.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerClientTools } from '../../src/tools/clients.js';

describe('create_client', () => {
  it('returns isError: true when DB insert fails', async () => {
    // Inject a mock withUserContext to simulate DB error
    // ...
  });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SSE transport (`/sse` endpoint) | Streamable HTTP (`/mcp` POST + GET) | MCP spec 2025-03-26 | SSE transport deprecated; Claude Code client now defaults to Streamable HTTP; use POST /mcp |
| `Server` class (low-level) | `McpServer` class (high-level) | SDK v1.x | `McpServer.registerTool()` replaces manual `setRequestHandler()` for tools; simpler API |
| `server.tool()` method | `server.registerTool()` with config object | SDK v1.x | `tool()` is deprecated; `registerTool()` with `{ description, inputSchema }` config is current API |
| Raw Zod v3 schemas | Zod v4 + `zod/v4` import | Zod v4 stable 2025 | SDK uses Zod v4 internally; import from `zod/v4` to avoid dual-version issues |
| Express v4 | Express v5.2.1 | Bundled with SDK v1.28.0 | Express v5 is in the SDK's `dependencies` (not peer dep); available automatically |

**Deprecated/outdated:**
- `SSEServerTransport`: Deprecated in MCP spec 2025-03-26. SDK still ships it for backwards compat but do not use for new servers.
- `server.tool()`: Deprecated in favor of `server.registerTool()`. Shows deprecation notice in TypeScript tooling.
- OAuth 2.1 Bearer auth via `requireBearerAuth()`: SDK ships this for OAuth flows. For simple API key gating, write a custom Express middleware instead.

---

## Open Questions

1. **Does `createMcpExpressApp()` include `express.json()` body parser?**
   - What we know: SDK source is not directly readable here, but the stateless example passes `req.body` (pre-parsed) to `transport.handleRequest(req, res, req.body)`.
   - What's unclear: Whether `createMcpExpressApp()` applies `express.json()` or expects it to be added manually.
   - Recommendation: Wave 0 task should verify by running `console.log(req.body)` in the POST handler with and without manual `app.use(express.json())`. Add it if missing; skip if already applied.

2. **Connection pool behavior with per-request `createClient`**
   - What we know: `supabase-js` uses the PostgREST HTTP API — it is stateless HTTP, not persistent TCP connections. Each PostgREST request is an independent HTTP call, so there is no TCP connection pool to worry about.
   - What's unclear: Whether PostgREST itself holds any server-side session between requests.
   - Recommendation: Per-request `createClient` is LOW risk. The `set_config` call is safe because PostgREST creates a fresh Postgres connection (or checks one out from its internal pool) for each HTTP request.

3. **`set_config(key, value, false)` vs `set_config(key, value, true)` — which scope is correct?**
   - What we know: `false` = session-scoped (persists until connection closed); `true` = transaction-scoped (reset after COMMIT/ROLLBACK). PostgREST wraps each request in a transaction.
   - What's unclear: Does PostgREST actually wrap in a transaction, making `true` the safer choice?
   - Recommendation: Use `true` (transaction-scoped) in the `set_app_user_id` function. If PostgREST wraps in a transaction, it auto-clears after the request. If not, session scope is still fine with per-request clients. Either way, the per-request client pattern prevents cross-request leakage.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.2 |
| Config file | none — see Wave 0 (add `vitest.config.ts`) |
| Quick run command | `npx vitest run tests/` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CRM-01 | create_client inserts row and returns data | unit (mocked DB) | `npx vitest run tests/tools/clients.test.ts` | No — Wave 0 |
| CRM-01 | get_client returns correct row for userId | unit (mocked DB) | `npx vitest run tests/tools/clients.test.ts` | No — Wave 0 |
| CRM-01 | update_client mutates correct fields | unit (mocked DB) | `npx vitest run tests/tools/clients.test.ts` | No — Wave 0 |
| CRM-01 | archive_client sets archived_at, not hard delete | unit (mocked DB) | `npx vitest run tests/tools/clients.test.ts` | No — Wave 0 |
| CRM-01 | Auth middleware rejects missing Authorization header with 401 | unit | `npx vitest run tests/middleware/auth.test.ts` | No — Wave 0 |
| CRM-01 | Auth middleware rejects invalid API key with 401 | unit (mocked validate_api_key) | `npx vitest run tests/middleware/auth.test.ts` | No — Wave 0 |
| CRM-02 | create_project links to client_id and defaults to status "active" | unit (mocked DB) | `npx vitest run tests/tools/projects.test.ts` | No — Wave 0 |
| CRM-02 | update_project changes status field | unit (mocked DB) | `npx vitest run tests/tools/projects.test.ts` | No — Wave 0 |
| CRM-03 | get_client response includes projects array | unit (mocked DB) | `npx vitest run tests/tools/clients.test.ts` | No — Wave 0 |
| CRM-03 | get_client response includes follow_ups array | unit (mocked DB) | `npx vitest run tests/tools/clients.test.ts` | No — Wave 0 |
| CRM-04 | list_clients with search param filters by name ILIKE | unit (mocked DB) | `npx vitest run tests/tools/clients.test.ts` | No — Wave 0 |
| CRM-04 | list_projects with status param filters correctly | unit (mocked DB) | `npx vitest run tests/tools/projects.test.ts` | No — Wave 0 |
| All | MCP server starts and responds to initialize request | smoke | manual — `npx tsx src/server.ts` + curl | No — manual only |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/middleware/auth.test.ts` — covers auth middleware (CRM-01 auth gate)
- [ ] `tests/tools/clients.test.ts` — covers all client tool handlers (CRM-01, CRM-03, CRM-04)
- [ ] `tests/tools/projects.test.ts` — covers all project tool handlers (CRM-02, CRM-04)
- [ ] `vitest.config.ts` — minimal config for ESM + Node16 resolution
- [ ] Package installs: `npm install --save-dev tsup @types/node @types/express`
- [ ] New migration: `supabase/migrations/[timestamp]_create_set_app_user_id.sql`

---

## Sources

### Primary (HIGH confidence)
- `node_modules/@modelcontextprotocol/sdk/dist/esm/server/streamableHttp.d.ts` — `StreamableHTTPServerTransport` constructor options, `handleRequest` signature, stateless vs stateful documentation
- `node_modules/@modelcontextprotocol/sdk/dist/esm/server/mcp.d.ts` — `McpServer.registerTool()` signature, `ToolCallback` type, `RegisteredTool` type
- `node_modules/@modelcontextprotocol/sdk/dist/esm/server/express.d.ts` — `createMcpExpressApp()` signature and DNS rebinding behavior
- `node_modules/@modelcontextprotocol/sdk/dist/esm/server/middleware/hostHeaderValidation.d.ts` — `hostHeaderValidation` and `localhostHostValidation` exported middleware
- `node_modules/@modelcontextprotocol/sdk/dist/esm/examples/server/simpleStatelessStreamableHttp.js` — Complete runnable stateless server example (canonical reference)
- `node_modules/@modelcontextprotocol/sdk/dist/esm/examples/server/jsonResponseStreamableHttp.js` — Stateful session management example
- `node_modules/@modelcontextprotocol/sdk/package.json` — Express 5.2.1 as direct dep (not peer dep), `@hono/node-server` dep, Zod `^3.25 || ^4.0` peer dep
- `src/types/database.ts` — Phase 1 generated types: all tables, enums, `validate_api_key` function signature
- `supabase/migrations/20260328000002_create_enums_and_helpers.sql` — `current_app_user_id()` implementation
- `supabase/migrations/20260328000003_create_api_keys.sql` — `validate_api_key(p_key text) returns uuid` function
- `supabase/migrations/20260328000004_create_clients_projects.sql` — RLS policy patterns for clients and projects
- `https://modelcontextprotocol.io/docs/concepts/transports` — Streamable HTTP spec: POST + GET /mcp endpoints, session headers, DELETE for session termination

### Secondary (MEDIUM confidence)
- `.planning/phases/01-data-foundation/01-RESEARCH.md` — Phase 1 SET LOCAL pattern documentation and `set_config` warning (session scope vs transaction scope concern)
- `.planning/phases/01-data-foundation/01-VERIFICATION.md` — Confirms Phase 1 deliverables: all 9 tables, validate_api_key function, TypeScript types compile

### Tertiary (LOW confidence)
- WebSearch: `@modelcontextprotocol/sdk StreamableHTTPServerTransport Express setup` — supplementary confirmation; superseded by direct node_modules inspection

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in node_modules or npm registry; exact versions confirmed
- Architecture patterns: HIGH — all patterns derived from SDK source files and runnable examples in node_modules
- Auth flow: HIGH — validate_api_key function confirmed in migration and database.ts; set_config approach confirmed in Phase 1 research
- Supabase query patterns: HIGH — PostgREST builder patterns are stable v2 API documented in supabase-js
- Pitfalls: MEDIUM — most derived from SDK source inspection and Phase 1 learnings; some from pattern reasoning

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (MCP SDK v2 is in pre-alpha with Q1 2026 stable target — check SDK version before using after April 2026)

## Project Constraints (from CLAUDE.md)

The following directives from CLAUDE.md are binding on all plans generated from this research:

| Directive | Applies To |
|-----------|------------|
| Platform: Claude Code skill pack + MCP server only (not standalone app) | Architecture — no standalone web server beyond MCP endpoint |
| Backend: Supabase hosted instance (managed by FreelanceOS) | All DB access via `@supabase/supabase-js`; no direct pg connection strings to external DBs |
| Auth: API key-based gating | `X-API-Key` or `Authorization: Bearer` header; no OAuth 2.1 machinery |
| Distribution: npm package first | src/ must be tsup-bundleable for Phase 5; no runtime deps that can't be packaged |
| Transport: Streamable HTTP (not stdio) | The `/mcp` endpoint is mandatory; stdio transport is NOT used |
| MCP SDK: `@modelcontextprotocol/sdk` v1.x directly — no `fastmcp` or `mcp-framework` wrappers | All MCP primitives come from the official SDK |
| Zod: v4 only — do not mix v3 | `import * as z from 'zod/v4'` in all tool files |
| Not to use: SSE transport, OAuth 2.1 for gating, `.claude/commands/` legacy format | Flagged as explicit avoidance items |
| GSD workflow: Start work through GSD command before file changes | Enforced by process; planner creates plans, executor follows them |
