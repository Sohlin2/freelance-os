# Phase 5: Plugin Packaging - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

FreelanceOS is installable as a Claude Code plugin via npm, the API key is collected at install time and stored securely, and the package is ready to publish. Covers INFRA-04 (npm installable with plugin manifest) and INFRA-05 (userConfig collects API key, stored in keychain).

</domain>

<decisions>
## Implementation Decisions

### Plugin Manifest & Structure
- **D-01:** Remote server URL in plugin.json — `mcpServers` section points to hosted Streamable HTTP endpoint (e.g., `https://mcp.freelanceos.dev/mcp`), not a bundled local server. Matches the hosted Supabase design: server runs where the data lives.
- **D-02:** Skills live in top-level `skills/` directory in the published package — `skills/freelance-proposals/SKILL.md`, etc. Plugin manifest uses `"skills": ["skills/*"]`. Matches agentskills.io convention.
- **D-03:** No hooks for v1 — skills + MCP server reference is sufficient. Hooks add complexity and permission friction.

### API Key Collection Flow
- **D-04:** API key collected via `userConfig` in plugin.json — `FREELANCEOS_API_KEY` declared with `userConfig: true, sensitive: true`. Claude Code prompts at install time and stores in system keychain automatically. Never in plaintext config.
- **D-05:** API key passed as Bearer token in Authorization header — plugin.json `headers` section maps `Authorization: "Bearer ${FREELANCEOS_API_KEY}"`.
- **D-06:** Missing/invalid key returns MCP error with setup instructions — actionable message like "FreelanceOS API key not configured. Run /plugin configure freelance-os to set your key." Not silent failure.

### Build & Publish Pipeline
- **D-07:** npm package contains skills + plugin.json only — no server code shipped. Server runs on FreelanceOS infrastructure. Package contents: `package.json`, `plugin.json`, `skills/`, `README.md`.
- **D-08:** npm scripts only (no tsup needed) — `build` script runs `scripts/build-plugin.js` which copies `.claude/skills/*` to `skills/`, generates/validates `plugin.json`, and verifies no secrets. `prepublishOnly` calls build.
- **D-09:** Build script includes secret scanning — scans all files going into the package for patterns like `service_role`, Supabase keys, `.env` content. Fails the build if found. Active verification, not just `.npmignore` exclusion.

### Package Identity
- **D-10:** Package name: `freelance-os` (unscoped) — simple, matches project name, easy to remember.
- **D-11:** License: MIT — skills are the free marketing layer, MCP server is gated by API key. MIT encourages adoption.
- **D-12:** npm-specific README — focused on: what FreelanceOS does, install command, API key setup, what skills are included. Marketing + onboarding for npm listing audience.

### Claude's Discretion
- Exact plugin.json metadata fields (description, version, author, repository)
- README content structure and copywriting
- Secret scanning patterns (beyond the obvious service_role/supabase key patterns)
- .npmignore contents (dev files, tests, supabase/, src/)
- build-plugin.js implementation details
- Version strategy (semver, pre-release tags)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project specs
- `.planning/PROJECT.md` -- Core value, constraints, monetization model (API key gating at $15-30/month or $40 one-time)
- `.planning/REQUIREMENTS.md` -- INFRA-04 (npm installable with plugin manifest), INFRA-05 (userConfig collects API key, keychain storage)
- `.planning/ROADMAP.md` SS Phase 5 -- Success criteria, dependency on Phase 4

### Technology & format specs
- `CLAUDE.md` SS Technology Stack > Skill Pack Technologies -- Agent Skills spec (agentskills.io), SKILL.md format with YAML frontmatter
- `CLAUDE.md` SS Plugin Structure -- Plugin manifest schema, `${CLAUDE_PLUGIN_ROOT}` variable, mcpServers in manifest
- `CLAUDE.md` SS Distribution / Packaging -- npm as plugin source, `tsup` for bundling (deferred since no server shipped)
- `CLAUDE.md` SS API Key Gating Pattern -- API key validation approach

### Prior phase foundations
- `.planning/phases/01-data-foundation/01-CONTEXT.md` -- API key format (D-05: `fos_live_<uuid>`, SHA-256 hashed), auth flow (D-09: service role key + session variable)
- `.planning/phases/02-mcp-server-core/02-CONTEXT.md` -- Server structure (D-09, D-10), Streamable HTTP transport, Express framework
- `.planning/phases/04-skill-pack/04-CONTEXT.md` -- Skill domains (D-01: 5 skill files), token budget enforcement (D-10, D-11)

### Existing implementations
- `.claude/skills/freelance-proposals/SKILL.md` -- Authored proposal skill
- `.claude/skills/freelance-followups/SKILL.md` -- Authored follow-up skill
- `.claude/skills/freelance-scope/SKILL.md` -- Authored scope skill
- `.claude/skills/freelance-invoices/SKILL.md` -- Authored invoice skill
- `.claude/skills/freelance-time/SKILL.md` -- Authored time-tracking skill
- `src/server.ts` -- MCP server entry point (for reference, not shipped in package)
- `package.json` -- Current package config (needs modification for publishing)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.claude/skills/` -- 5 authored SKILL.md files ready to copy into top-level `skills/` for publishing
- `package.json` -- Existing npm config with dependencies, engines, scripts (needs `private: false`, name, license, main changes)
- `scripts/` -- Existing scripts directory for build-plugin.js

### Established Patterns
- ESM module system (`"type": "module"` in package.json)
- TypeScript strict mode, Node 20 LTS engine requirement
- Skills follow agentskills.io spec with YAML frontmatter
- API key format: `fos_live_<uuid>` prefix (Phase 1 D-05)

### Integration Points
- Plugin installs into Claude Code via `/plugin install freelance-os` or npm
- Plugin manifest connects to remote MCP server at hosted URL
- API key flows: userConfig prompt -> keychain -> Authorization header -> remote server validates
- Skills load into Claude Code context alongside MCP tool definitions

</code_context>

<specifics>
## Specific Ideas

No specific requirements -- open to standard approaches. All decisions captured above emerged from the discussion.

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope.

</deferred>

---

*Phase: 05-plugin-packaging*
*Context gathered: 2026-03-28*
