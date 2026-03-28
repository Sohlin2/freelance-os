<!-- GSD:project-start source:PROJECT.md -->
## Project

**FreelanceOS**

A Claude Code skill pack and MCP server that turns Claude into a freelance business manager. Freelancers interact conversationally — telling Claude to draft proposals, track clients, generate invoices, write follow-ups, and manage project scope — while a hosted Supabase backend persists all data. Distributed as an npm package (marketplace later), monetized via API key gating at $15-30/month or $40 one-time.

**Core Value:** A freelancer can manage their entire client lifecycle — from proposal to invoice — without leaving Claude Code.

### Constraints

- **Platform**: Must work as a Claude Code skill pack + MCP server (not a standalone app)
- **Backend**: Supabase (hosted instance managed by FreelanceOS)
- **Auth**: API key-based gating for MCP server access
- **Distribution**: npm package first, Claude/MCP marketplace when available
- **Data model**: Must support the full freelance lifecycle (clients → projects → proposals → time → invoices → follow-ups)
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

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
# Core runtime dependencies
# Dev dependencies
## Plugin Structure (Recommended Layout)
## Transport Decision
## API Key Gating Pattern
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
- Use stdio transport only
- Store API key in `.env` file loaded at startup
- No auth middleware needed at the MCP layer
- Add a separate Next.js app connecting to the same Supabase instance
- MCP server and web app share the same Supabase schema — no duplication
- Do NOT add Streamable HTTP to the existing MCP server; keep transport concerns separate
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
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
