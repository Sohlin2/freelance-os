# Architecture Research

**Domain:** Claude Code Plugin (Skill Pack + Remote MCP Server + Supabase backend)
**Researched:** 2026-03-28
**Confidence:** HIGH — based on official Claude Code docs, MCP spec, and MCP SDK documentation

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER'S MACHINE                               │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   Claude Code (MCP Host)                    │   │
│  │                                                             │   │
│  │  ┌───────────────────┐    ┌──────────────────────────────┐  │   │
│  │  │   Plugin Layer    │    │       MCP Client             │  │   │
│  │  │                   │    │  (maintained by Claude Code) │  │   │
│  │  │  ┌─────────────┐  │    └──────────────┬───────────────┘  │   │
│  │  │  │ SKILL.md    │  │                   │ Streamable HTTP  │   │
│  │  │  │ (freelance  │  │                   │ + Bearer Token   │   │
│  │  │  │  domain     │  │                   │                  │   │
│  │  │  │  knowledge) │  │                   │                  │   │
│  │  │  └─────────────┘  │                   │                  │   │
│  │  │  ┌─────────────┐  │                   │                  │   │
│  │  │  │ .mcp.json   │──┼───────────────────┘                  │   │
│  │  │  │ (server URL │  │                                      │   │
│  │  │  │  + API key) │  │                                      │   │
│  │  │  └─────────────┘  │                                      │   │
│  │  └───────────────────┘                                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                         HTTPS (JSON-RPC 2.0)
                         Bearer Token in header
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   FREELANCEOS HOSTED INFRASTRUCTURE                 │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     MCP Server (Node.js)                      │  │
│  │                                                               │  │
│  │   ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │  │
│  │   │  Auth Layer  │  │ Tool Router  │  │  Business Logic │   │  │
│  │   │  (API key    │  │  (clients,   │  │  (proposal gen, │   │  │
│  │   │  validation) │  │   projects,  │  │   invoice calc, │   │  │
│  │   └──────────────┘  │   invoices,  │  │   scope detect) │   │  │
│  │                     │   time, etc) │  └─────────────────┘   │  │
│  │                     └──────────────┘                         │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                    │                                │
│                         Supabase JS SDK                             │
│                                    │                                │
│  ┌─────────────────────────────────▼─────────────────────────────┐  │
│  │                      Supabase (Hosted)                        │  │
│  │                                                               │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐  │  │
│  │  │  Postgres  │  │ Row-Level  │  │  Auth (API key table + │  │  │
│  │  │  (clients, │  │  Security  │  │   subscription status) │  │  │
│  │  │  projects, │  │  Policies  │  └────────────────────────┘  │  │
│  │  │  invoices, │  └────────────┘                              │  │
│  │  │  etc.)     │                                              │  │
│  │  └────────────┘                                              │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Plugin (.claude-plugin/) | Bundles skills + MCP server config into a distributable unit | Directory with plugin.json manifest, npm-installable |
| Skill files (SKILL.md) | Teach Claude freelance domain knowledge — what makes a good proposal, when to follow up, how to read scope creep | Markdown with YAML frontmatter; auto-loaded by Claude Code |
| .mcp.json | Declares the remote MCP server URL and user's API key as env var | JSON; references `${CLAUDE_PLUGIN_ROOT}` for path safety |
| MCP Server | Exposes Tools for CRUD operations on freelance data; validates API keys; enforces per-user data isolation | Node.js with @modelcontextprotocol/sdk; Streamable HTTP transport |
| Auth Layer | Validates Bearer token (API key) on every request; maps key to user account | Middleware in MCP server; looks up key in Supabase `api_keys` table |
| Business Logic | Domain-specific operations (invoice totals, scope delta detection, follow-up timing heuristics) | Pure functions called by tool handlers |
| Supabase | Postgres data persistence; Row-Level Security scopes all queries to the authenticated user | Hosted FreelanceOS instance; Supabase JS SDK from MCP server |

## Recommended Project Structure

```
freelanceos-plugin/                   # npm package root (the distributable)
├── .claude-plugin/
│   └── plugin.json                   # plugin manifest (name, version, mcpServers ref)
├── skills/
│   ├── proposal/
│   │   ├── SKILL.md                  # proposal drafting knowledge
│   │   └── examples.md               # proposal format examples
│   ├── invoice/
│   │   └── SKILL.md                  # invoice generation knowledge
│   ├── follow-up/
│   │   └── SKILL.md                  # follow-up timing and tone guidance
│   ├── scope/
│   │   └── SKILL.md                  # scope creep detection heuristics
│   └── freelance-context/
│       └── SKILL.md                  # always-loaded domain baseline
│           (user-invocable: false)
├── .mcp.json                         # MCP server config referencing FREELANCEOS_API_KEY env
├── package.json                      # npm package metadata (name, version, bin)
├── server/                           # MCP server source (compiled to dist/)
│   ├── index.ts                      # entrypoint, transport setup
│   ├── auth.ts                       # API key validation middleware
│   ├── tools/
│   │   ├── clients.ts                # create/read/update/delete clients
│   │   ├── projects.ts               # project management tools
│   │   ├── proposals.ts              # proposal generation tools
│   │   ├── invoices.ts               # invoice creation + status tools
│   │   ├── time.ts                   # time entry tools
│   │   └── followups.ts              # follow-up drafting tools
│   ├── db/
│   │   ├── client.ts                 # Supabase client singleton
│   │   └── schema.ts                 # TypeScript types for DB rows
│   └── domain/
│       ├── scope.ts                  # scope creep detection logic
│       ├── invoice.ts                # invoice calculation logic
│       └── followup.ts               # follow-up timing heuristics
└── dist/                             # compiled output (gitignored, included in npm)
```

### Structure Rationale

- **skills/:** Each skill is its own directory so SKILL.md stays focused and supporting files (examples, templates) can be loaded on demand — not on every invocation. The `freelance-context` skill uses `user-invocable: false` so Claude auto-loads it as background knowledge without exposing it as a user command.
- **server/tools/:** One file per domain entity. Each file exports a list of tool definitions (name, description, inputSchema) and handlers. The tool router in index.ts registers them all. This keeps individual files small and makes adding new tools non-disruptive.
- **server/domain/:** Business logic separated from tool handlers. Handlers do data access; domain functions compute results. This keeps domain logic testable without MCP infrastructure.
- **server/db/:** Single Supabase client instantiated once per server process, not per request. Row-Level Security on Supabase does the per-user scoping so the MCP server only needs to pass the user's account ID as a claim.
- **.mcp.json at plugin root:** Claude Code auto-discovers `.mcp.json` when plugin is loaded. Specifies the remote server URL and reads API key from `FREELANCEOS_API_KEY` env var, which the plugin's `userConfig` prompts for at install time.

## Architectural Patterns

### Pattern 1: Skills as Domain Knowledge, Not Orchestration

**What:** Skills teach Claude *how to think* about freelance work. They contain heuristics, best practices, and formatting guidance — not step-by-step workflows. The MCP server handles all data operations. Claude synthesizes both.

**When to use:** This is the primary pattern throughout FreelanceOS. Skill content is roughly: "When drafting a proposal, always include timeline, deliverables, and payment terms. Lead with the client's problem, not your credentials."

**Trade-offs:** Claude's synthesis of skill knowledge + live data is powerful and flexible, but less predictable than scripted workflows. The quality of output depends heavily on skill content quality. This is acceptable — the skill content is the primary value-add.

**Example:**
```yaml
---
name: proposal
description: Draft project proposals. Use when a user asks to write, create, or draft a proposal for a client or project.
---

## Proposal Structure

Always retrieve client context first using get_client and list_projects before drafting.

A strong proposal:
1. Opens with the client's problem statement (not your credentials)
2. States deliverables as outcomes, not activities
3. Includes a timeline with milestones
4. Specifies payment schedule tied to milestones
5. Has a clear scope boundary ("This engagement does not include...")

## Tone
Match the client's communication style from their interaction history.
```

### Pattern 2: API Key as User Identity

**What:** Each API key maps to exactly one FreelanceOS user account. The MCP server validates the key on every request, extracts the user_id, and passes it to every Supabase query. RLS policies enforce that users only see their own data.

**When to use:** Every MCP tool call goes through this pattern. There is no session state — each JSON-RPC request is independently authenticated.

**Trade-offs:** Stateless authentication is simple and robust. The downside is database overhead on every request for key lookup. Mitigate by caching validated keys in memory with a short TTL (e.g., 5 minutes).

**Example:**
```typescript
// auth.ts
export async function validateApiKey(key: string): Promise<string | null> {
  // Check in-memory cache first
  const cached = keyCache.get(key);
  if (cached) return cached.userId;

  const { data } = await supabase
    .from('api_keys')
    .select('user_id, active')
    .eq('key_hash', hashKey(key))
    .single();

  if (!data?.active) return null;
  keyCache.set(key, { userId: data.user_id, expiresAt: Date.now() + 300_000 });
  return data.user_id;
}
```

### Pattern 3: Remote MCP Server with Streamable HTTP Transport

**What:** The MCP server runs hosted (not on the user's machine). Claude Code connects via Streamable HTTP transport with the API key in the `Authorization: Bearer` header. This is set up in `.mcp.json` and configured at plugin install time via `userConfig`.

**When to use:** Required because data must persist in a hosted Supabase instance. A local stdio MCP server would require users to run a server process and manage their own database — counter to the "zero setup" goal.

**Trade-offs:** Remote transport adds latency versus stdio (50-200ms per tool call vs. sub-millisecond). Tool calls that require multiple round trips should batch where possible. The spec recommends OAuth 2.1 for public remote servers; API key Bearer token is acceptable for this use case and significantly simpler to implement and explain to users.

**Example .mcp.json:**
```json
{
  "mcpServers": {
    "freelanceos": {
      "type": "http",
      "url": "https://mcp.freelanceos.io/mcp",
      "headers": {
        "Authorization": "Bearer ${FREELANCEOS_API_KEY}"
      }
    }
  }
}
```

## Data Flow

### Tool Call Flow (e.g., "draft a proposal for Acme Corp")

```
User message: "Draft a proposal for Acme Corp"
    |
    v
Claude Code evaluates loaded skill descriptions
    |
    v
proposal/SKILL.md loads into context (description matched)
    |
    v
Claude decides: need client data first
    |
    v
tools/call: get_client { name: "Acme Corp" }
    |
    v
MCP Client (Claude Code) sends JSON-RPC POST to mcp.freelanceos.io
    + Authorization: Bearer <user_api_key>
    |
    v
MCP Server auth.ts validates key → extracts user_id
    |
    v
tools/clients.ts handler queries Supabase:
    SELECT * FROM clients WHERE user_id = $1 AND name ILIKE $2
    |
    v
Result returned to Claude as tool response content
    |
    v
Claude synthesizes: client context + skill guidance + project history
    |
    v
Claude drafts proposal text in conversation
```

### Skill Context Loading Flow

```
Session start / new message
    |
    v
Claude Code scans enabled plugins for skill descriptions
    |
    v
Skill descriptions loaded into context (2% of context window budget)
    ~ 8 skills * ~100 tokens = ~800 tokens overhead
    |
    v
User message triggers description match
    |
    v
Full SKILL.md content injected into context (on invocation)
    |
    v
Supporting files (examples.md, etc.) loaded only when SKILL.md references them
```

### API Key Issuance Flow (out of band — not in the plugin)

```
User signs up at freelanceos.io
    |
    v
Payment processed (Stripe webhook or one-time)
    |
    v
api_keys table: INSERT { user_id, key_hash, active: true }
    |
    v
Raw key shown to user once
    |
    v
User sets FREELANCEOS_API_KEY in environment
    OR
Plugin userConfig prompts for key at install time → stored in keychain
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Single MCP server process (Node.js); single Supabase project; no caching beyond in-process key cache. This is fine. |
| 1k-10k users | API key validation cache becomes important. Consider Redis for shared cache if running multiple MCP server instances behind a load balancer. Monitor Supabase connection pool limits. |
| 10k+ users | Supabase Pro or dedicated Postgres. MCP server horizontally scaled behind load balancer. Consider read replicas for list operations. At this scale, revisit OAuth 2.1 — it provides better token rotation and revocation patterns. |

### Scaling Priorities

1. **First bottleneck:** Supabase connection pool exhaustion. Node.js MCP server holds connections open. Supabase Free tier has a 60 connection limit. Mitigate early: use connection pooling (Supabase's built-in PgBouncer), keep MCP server stateless, deploy with low instance count initially.
2. **Second bottleneck:** API key lookup on every tool call. At high request rates this adds Supabase query load. Mitigate with in-process TTL cache (already described in Pattern 2). At 1k+ users, move to Redis if multiple MCP server instances are needed.

## Anti-Patterns

### Anti-Pattern 1: Putting Business Logic in Skills

**What people do:** Write SKILL.md files with detailed step-by-step instructions that reference specific tool call sequences — "First call get_client, then call list_projects, then call get_time_entries, then calculate..."

**Why it's wrong:** Skills are loaded into Claude's context as guidance, not scripts. Overly prescriptive tool-call sequences make skills brittle (tool names change, schema changes), consume excess context, and prevent Claude from adapting to the actual conversation state.

**Do this instead:** Skills should contain domain knowledge and output quality guidance. Let Claude decide which tools to call based on the task. Reserve explicit tool sequences for agents with `context: fork` when true automation is needed.

### Anti-Pattern 2: One Giant Skill File

**What people do:** Create a single `freelance.md` skill that covers proposals, invoices, follow-ups, scope, and time tracking in one file.

**Why it's wrong:** Claude Code has a context budget for skill descriptions (2% of context window, ~16k chars fallback). One giant skill either consumes the full budget or gets excluded entirely. It also always loads regardless of the current task.

**Do this instead:** One skill per domain area (proposal, invoice, follow-up, scope, time). Each has a focused `description` field so Claude loads only the relevant skill for the current task. Background knowledge that should always be present goes in a `user-invocable: false` skill.

### Anti-Pattern 3: Storing the Raw API Key in .mcp.json

**What people do:** Hardcode the API key directly in `.mcp.json` and commit it to the repository.

**Why it's wrong:** `.mcp.json` is committed with the plugin. A hardcoded key leaks user credentials to anyone who installs from source. Even if gitignored, it persists in shell history or filesystem.

**Do this instead:** Use `${FREELANCEOS_API_KEY}` as the header value (env var substitution). Use the plugin's `userConfig` with `sensitive: true` to prompt for the key at install time — Claude Code stores it in the system keychain. Export it as an env var in the hook or MCP server startup.

### Anti-Pattern 4: Performing Authorization in the MCP Server's Tool Logic

**What people do:** Add `WHERE user_id = :userId` filters manually in each tool handler after extracting user_id from the validated key.

**Why it's wrong:** One missed filter exposes all users' data. As tools grow in number, the chance of a missed WHERE clause grows.

**Do this instead:** Use Supabase Row-Level Security policies as the authoritative access control layer. The MCP server passes the user's JWT or claims when creating the Supabase client for each request. RLS policies enforce data isolation automatically for every query, regardless of whether the application code includes a WHERE clause.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase | Supabase JS SDK from MCP server; RLS for per-user data isolation | MCP server is the only writer; no direct Supabase access from skill layer |
| Claude Code (MCP Host) | Streamable HTTP transport; JSON-RPC 2.0; Bearer token auth | Claude Code creates one MCP Client per configured MCP server per session |
| npm Registry | Plugin distributed as npm package; `mcp-publisher` CLI for MCP Registry listing | MCP Registry (in preview as of 2026) lists server metadata; actual artifacts on npm |
| Payment / Auth (future) | Out of band from the plugin; API key issued after payment webhook | Stripe or equivalent posts to a FreelanceOS endpoint that creates the key in Supabase |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Skill layer <-> MCP Server | No direct communication. Skills run in Claude's context; MCP server responds to Claude's tool calls. Claude is the mediator. | Skills cannot call MCP tools directly — they guide Claude's behavior |
| MCP Server <-> Supabase | Supabase JS SDK over HTTPS | MCP server instantiates Supabase client with service role key (full access); RLS policies enforce user-level isolation |
| Plugin (.mcp.json) <-> MCP Server | HTTPS + Authorization: Bearer header; JSON-RPC 2.0 POST requests | API key passed per-request; no persistent session state on server |
| Auth layer <-> Supabase api_keys table | Supabase query on every cache miss | Cache validated keys in-process with ~5 min TTL to reduce DB load |

## Build Order Implications

The component dependency graph determines what to build first:

```
Supabase schema + RLS policies
    ↓ (data layer must exist before server can query)
MCP Server: auth layer + basic CRUD tools (clients, projects)
    ↓ (server must work before skills can be tested end-to-end)
Skills: freelance-context baseline + proposal skill
    ↓ (validate skill+server interaction before adding more)
Plugin manifest + .mcp.json
    ↓ (packaging after core functionality proven)
Remaining tools (invoices, time, follow-ups)
    ↓
Remaining skills (invoice, follow-up, scope)
    ↓
npm package + distribution
```

**Key dependency:** Skills are meaningless to test until the MCP server tools exist — Claude will try to call tools that don't exist yet. Build the data layer and at least one domain's worth of tools before writing skills.

**Key risk:** The Streamable HTTP transport with API key auth needs to be proven working in Claude Code before building out all tools. Validate the transport and auth flow with a single "ping" tool early in development.

## Sources

- [MCP Architecture Overview](https://modelcontextprotocol.io/docs/learn/architecture) — official MCP spec, transport layers, primitives (HIGH confidence)
- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills) — SKILL.md format, frontmatter fields, invocation control (HIGH confidence)
- [Claude Code Plugins Documentation](https://code.claude.com/docs/en/plugins) — plugin structure, .mcp.json, userConfig, distribution (HIGH confidence)
- [Claude Code Plugins Reference](https://code.claude.com/docs/en/plugins-reference) — complete schema, MCP server config in plugins, CLAUDE_PLUGIN_ROOT (HIGH confidence)
- [MCP Registry Quickstart](https://modelcontextprotocol.io/registry/quickstart) — npm distribution, server.json, mcp-publisher CLI (HIGH confidence)
- [MCP Authorization Tutorial](https://modelcontextprotocol.io/docs/tutorials/security/authorization) — OAuth 2.1 vs Bearer token patterns (HIGH confidence)
- [Stack Overflow: MCP Authentication](https://stackoverflow.blog/2026/01/21/is-that-allowed-authentication-and-authorization-in-model-context-protocol/) — API key vs OAuth tradeoffs (MEDIUM confidence)

---
*Architecture research for: Claude Code Plugin + Remote MCP Server + Supabase backend*
*Researched: 2026-03-28*
