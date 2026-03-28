# Stack Research

**Domain:** Claude Code skill pack + MCP server + Supabase-backed SaaS (freelance business management)
**Researched:** 2026-03-28
**Confidence:** HIGH — all critical findings verified against official documentation and current npm registry

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| TypeScript | 5.x (latest) | Primary language for all source code | MCP SDK ships full TypeScript types; Supabase generates typed schema; type safety prevents runtime errors in tool schemas passed to Claude |
| Node.js | 20 LTS | Runtime for MCP server process | `@supabase/supabase-js` ≥ 2.79.0 dropped Node 18 (EOL April 2025); MCP SDK requires native fetch; 22 LTS is viable but 20 is the safer conservative choice |
| `@modelcontextprotocol/sdk` | 1.28.0 (v1.x latest) | Core MCP server primitives | Official Anthropic SDK; v1.x is the production-stable line — v2 is in pre-alpha targeting Q1 2026; 36,000+ dependent packages; provides `McpServer`, `Tool`, `Resource`, `Prompt` abstractions plus stdio and Streamable HTTP transports |
| `@supabase/supabase-js` | 2.100.1 | Supabase client for database, auth, storage | Official isomorphic Supabase client; handles PostgREST queries, realtime, edge functions, and file storage from a single import; v2 is current stable line |
| `zod` | 4.x (latest stable) | Schema validation for MCP tool inputs | Required peer dep of `@modelcontextprotocol/sdk`; v4 is 14x faster than v3 with smaller bundle; MCP SDK imports from `zod/v4` internally but retains backwards compat with Zod ≥ 3.25 — use v4 directly for the performance gains and JSON Schema export |

### Skill Pack Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Agent Skills spec (SKILL.md) | Current (agentskills.io) | Defines the skill pack format | Open standard published by Anthropic December 2025; adopted by OpenAI for Codex; works across Claude Code, Cursor, and other IDE agents; skills live in `skills/<name>/SKILL.md` with YAML frontmatter |
| Claude Code Plugin format | Current (code.claude.com) | Packages skills + MCP server into one installable unit | Plugin bundles skills, MCP server config, agents, and hooks; distributed via npm source in `marketplace.json`; enables `/plugin install freelance-os@marketplace` one-command install |

### Distribution / Packaging

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `tsup` | 8.5.1 | Bundle TypeScript MCP server for npm distribution | Zero-config TS bundler built on esbuild; outputs both ESM + CJS + `.d.ts` in one command; 1M+ weekly npm downloads; the de facto standard for TypeScript library/server bundling in 2025 |
| npm | — | Primary distribution channel | MCP Registry only hosts metadata; artifact must be on npm. Claude Code plugin marketplace supports `{"source": "npm", "package": "@scope/pkg"}` as a plugin source — this is the correct path for paid distribution |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `vitest` | Unit testing for MCP tools and business logic | Native ESM + TypeScript support; no transpile step; async-friendly for testing MCP tool handlers; standard choice in the MCP ecosystem in 2025 |
| `@supabase/cli` | Manage Supabase schema, migrations, local dev | `supabase db diff`, `supabase gen types typescript` generates typed DB client from schema — eliminates hand-written DB types |
| MCP Inspector | Interactive MCP server testing during development | Official Anthropic tool; lets you call tools and inspect schemas without running Claude Code; run via `npx @modelcontextprotocol/inspector` |
| `eslint` + `prettier` | Code quality and formatting | Standard; keep separate from business logic |

## Installation

```bash
# Core runtime dependencies
npm install @modelcontextprotocol/sdk @supabase/supabase-js zod

# Dev dependencies
npm install -D typescript tsup vitest @supabase/cli @types/node eslint prettier
```

## Plugin Structure (Recommended Layout)

A Claude Code plugin that bundles the MCP server + skills follows this directory structure:

```
freelance-os/                        # npm package root
├── package.json                     # name: "@freelance-os/claude-plugin"
├── .claude-plugin/
│   └── plugin.json                  # plugin manifest (name, version, mcpServers, skills paths)
├── skills/
│   ├── freelance-proposal/
│   │   └── SKILL.md                 # /freelance-proposal slash command
│   ├── freelance-invoice/
│   │   └── SKILL.md                 # /freelance-invoice slash command
│   ├── freelance-followup/
│   │   └── SKILL.md                 # /freelance-followup slash command
│   └── freelance-scope/
│       └── SKILL.md                 # /freelance-scope slash command
├── src/
│   ├── server.ts                    # McpServer entrypoint
│   ├── tools/                       # One file per MCP tool domain
│   │   ├── clients.ts
│   │   ├── projects.ts
│   │   ├── proposals.ts
│   │   ├── invoices.ts
│   │   ├── time.ts
│   │   └── scope.ts
│   ├── db/                          # Supabase client + typed queries
│   │   ├── client.ts
│   │   └── types.ts                 # generated via supabase gen types typescript
│   └── auth/
│       └── apikey.ts                # API key validation middleware
└── dist/                            # tsup output — what npm ships
    └── server.js
```

The `plugin.json` `mcpServers` entry uses `${CLAUDE_PLUGIN_ROOT}` to reference the bundled server:

```json
{
  "name": "freelance-os",
  "version": "1.0.0",
  "mcpServers": {
    "freelance-os": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/dist/server.js"],
      "env": {
        "FREELANCE_OS_API_KEY": "${FREELANCE_OS_API_KEY}"
      }
    }
  }
}
```

## Transport Decision

**Use stdio (not Streamable HTTP) for the MCP server.**

Rationale: The MCP server runs locally as a subprocess spawned by Claude Code. There is no multi-tenant requirement at the transport layer — API key gating is enforced at the application level (each request validates the key against Supabase before executing). stdio gives zero network overhead, no TLS/CORS surface, and no hosting dependency. The Supabase calls go out to the hosted backend over HTTPS. This is the standard pattern for distributed MCP tools.

Switch to Streamable HTTP only if you later need: web-based clients, OAuth 2.1 flows, or horizontal scaling of the MCP server itself. None of those apply to the current scope.

## API Key Gating Pattern

Implement in `src/auth/apikey.ts` — validate the key passed via environment variable against a `api_keys` table in Supabase (or a simple lookup) before executing any tool. This is simpler than OAuth 2.1 and appropriate for a $15-30/month subscription product.

The key is injected at install time via the user's environment (`FREELANCE_OS_API_KEY`), referenced in `plugin.json` `env` block, and available to the server process without any extra configuration from the user.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `@modelcontextprotocol/sdk` v1.x | `fastmcp` | If you need batteries-included auth scaffolding, but fastmcp is a third-party wrapper — adds coupling risk against SDK changes |
| `@modelcontextprotocol/sdk` v1.x | `mcp-framework` | Same — third-party wrapper; prefer the official SDK for a product you intend to sell |
| `tsup` | `tsc` + `esbuild` directly | If you need custom esbuild plugins, but tsup handles dual-format (ESM + CJS) output with zero config |
| `vitest` | `jest` | Jest is fine but requires `ts-jest` or Babel transform; vitest has native TypeScript support — no extra config |
| Supabase-hosted (managed by FreelanceOS) | BYO Supabase | BYO is viable for enterprise tier later; for v1, hosted means you control schema, migrations, and RLS policy |
| Agent Skills `SKILL.md` + Plugin | Standalone CLAUDE.md | CLAUDE.md is a single global config, not a distributable unit. Skills are the correct distributable unit for a paid product |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| SSE transport | Deprecated as of MCP spec 2025-03-26; retained only for backwards compat | stdio (local) or Streamable HTTP (remote) |
| `@supabase/supabase-js` < 2.79.0 | No Node 20+ support; native fetch not available | Latest 2.x (currently 2.100.1) |
| Zod v3 | Slower, larger bundle; MCP SDK v1.x uses Zod v4 internally — mixing creates version conflicts | Zod v4 |
| OAuth 2.1 for API key gating | Massive overhead for a simple subscription gate; requires authorization server, PKCE, dynamic client registration | Simple API key in `X-API-Key` header or env var, validated against Supabase on each tool call |
| `.claude/commands/` (legacy) | Superseded by the Agent Skills `SKILL.md` format; commands are still supported but skills have more features (supporting files, frontmatter controls, subagent execution) | `.claude/skills/<name>/SKILL.md` |
| Custom slash commands in CLAUDE.md | CLAUDE.md is per-project, not distributable; can't ship in an npm package | Agent Skills in a Claude Code plugin |
| FastMCP / mcp-framework wrappers | Third-party abstractions that lag behind official SDK releases; adds maintenance risk for a commercial product | `@modelcontextprotocol/sdk` directly |

## Stack Patterns by Variant

**If building for local-only (no remote gating needed):**
- Use stdio transport only
- Store API key in `.env` file loaded at startup
- No auth middleware needed at the MCP layer

**If adding a web dashboard later (Phase 2+):**
- Add a separate Next.js app connecting to the same Supabase instance
- MCP server and web app share the same Supabase schema — no duplication
- Do NOT add Streamable HTTP to the existing MCP server; keep transport concerns separate

**If open-sourcing the skill pack but keeping the MCP server paid:**
- Skills directory is MIT-licensed and published separately as a standalone npm package
- MCP server binary requires a valid API key — no key, no data persistence
- This "freemium skill pack" model gives marketing value without giving away the backend

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@modelcontextprotocol/sdk@1.28.0` | `zod@^4.x` | SDK requires zod ≥ 3.25 but imports internally from `zod/v4`; install zod v4 to avoid dual-version resolution |
| `@supabase/supabase-js@^2.79.0` | `node@>=20` | Node 18 support dropped in 2.79.0; use Node 20 LTS |
| `tsup@8.x` | `node@>=18`, `typescript@>=5.0` | Works on Node 20; outputs both ESM and CJS correctly |
| `vitest@^2.x` | `node@>=18`, `typescript@>=5.0` | v2 is current stable; v3 is in beta as of early 2026 — stay on v2 |

## Sources

- [modelcontextprotocol/typescript-sdk GitHub](https://github.com/modelcontextprotocol/typescript-sdk) — v1.28.0 confirmed current production version; v2 pre-alpha with Q1 2026 stable target; Zod v4 peer dep confirmed
- [MCP build server docs](https://modelcontextprotocol.io/docs/develop/build-server) — Official TypeScript patterns for tools, resources, prompts
- [MCP transport spec 2025-03-26](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports) — stdio and Streamable HTTP as the two standard transports; SSE deprecated
- [agentskills.io specification](https://agentskills.io/specification) — SKILL.md format, frontmatter fields, directory structure (HIGH confidence — official spec site)
- [Claude Code skills docs](https://code.claude.com/docs/en/skills) — Frontmatter fields, invocation control, skill pack distribution, plugin integration (HIGH confidence — official Anthropic docs)
- [Claude Code plugin marketplace docs](https://code.claude.com/docs/en/plugin-marketplaces) — npm as plugin source, `plugin.json` schema, `mcpServers` in plugin manifest, `${CLAUDE_PLUGIN_ROOT}` variable (HIGH confidence — official Anthropic docs)
- [@supabase/supabase-js npm](https://www.npmjs.com/package/@supabase/supabase-js) — v2.100.1 confirmed latest; Node 20+ required
- [Zod v4 release](https://zod.dev/) — Stable release confirmed; 14x faster parsing; JSON Schema export
- [tsup npm](https://www.npmjs.com/package/tsup) — v8.5.1 confirmed; 1M+ weekly downloads; esbuild-based dual format output
- [paymcp npm](https://www.npmjs.com/package/paymcp) — Noted as alternative monetization SDK; evaluated and deferred in favour of custom API key validation (simpler for subscription model)

---
*Stack research for: Claude Code skill pack + MCP server (FreelanceOS)*
*Researched: 2026-03-28*
