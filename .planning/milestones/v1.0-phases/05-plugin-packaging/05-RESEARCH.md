# Phase 5: Plugin Packaging - Research

**Researched:** 2026-03-28
**Domain:** Claude Code plugin manifest, npm distribution, userConfig/keychain API key gating
**Confidence:** HIGH

## Summary

Phase 5 packages FreelanceOS into a Claude Code plugin that users install from npm. The package ships no server code — it contains only `plugin.json`, the five skill files, and a `README.md`. The MCP server remains on FreelanceOS infrastructure and is referenced via a remote URL in the plugin manifest. An API key collected at install time via `userConfig` is stored in the system keychain and injected as a Bearer token on every MCP request.

The Claude Code plugin system is well-documented with a complete official reference. The key technical pieces are: the `.claude-plugin/plugin.json` manifest (at this specific path inside the package), the `userConfig` field for keychain-stored secrets, the `.mcp.json` config file (or inline `mcpServers` in `plugin.json`) for the remote HTTP MCP server, and the `${user_config.KEY}` substitution syntax that threads the collected API key into the `Authorization` header. An npm package listed in a marketplace entry with `"source": "npm"` is the correct distribution path.

The build pipeline is a Node.js script (`scripts/build-plugin.js`) that copies `.claude/skills/*` to the top-level `skills/` dir, generates/validates `plugin.json`, and runs a secret scan before the package is published. No TypeScript compilation is needed since no server code ships.

**Primary recommendation:** Build the package as a plain directory with `skills/`, `.claude-plugin/plugin.json`, `.mcp.json`, and `README.md`. Write a `marketplace.json` in a separate GitHub-hosted catalog repo pointing to the npm package as source. Publish to npm with `private: false`.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Plugin Manifest & Structure**
- D-01: Remote server URL in `plugin.json` — `mcpServers` section points to hosted Streamable HTTP endpoint (e.g., `https://mcp.freelanceos.dev/mcp`), not a bundled local server.
- D-02: Skills live in top-level `skills/` directory in the published package — `skills/freelance-proposals/SKILL.md`, etc. Plugin manifest uses `"skills": ["skills/*"]`. Matches agentskills.io convention.
- D-03: No hooks for v1 — skills + MCP server reference is sufficient.

**API Key Collection Flow**
- D-04: API key collected via `userConfig` in plugin.json — `FREELANCEOS_API_KEY` declared with `userConfig: true, sensitive: true`. Claude Code prompts at install time and stores in system keychain automatically.
- D-05: API key passed as Bearer token in Authorization header — plugin.json `headers` section maps `Authorization: "Bearer ${FREELANCEOS_API_KEY}"`.
- D-06: Missing/invalid key returns MCP error with setup instructions — actionable message like "FreelanceOS API key not configured. Run /plugin configure freelance-os to set your key."

**Build & Publish Pipeline**
- D-07: npm package contains skills + plugin.json only — no server code shipped. Package contents: `package.json`, `plugin.json` (via `.claude-plugin/`), `skills/`, `README.md`.
- D-08: npm scripts only — `build` script runs `scripts/build-plugin.js` which copies `.claude/skills/*` to `skills/`, generates/validates `plugin.json`, verifies no secrets. `prepublishOnly` calls build.
- D-09: Build script includes secret scanning — scans all files for `service_role`, Supabase keys, `.env` content. Fails if found.

**Package Identity**
- D-10: Package name: `freelance-os` (unscoped)
- D-11: License: MIT
- D-12: npm-specific README focused on install command, API key setup, what skills are included.

### Claude's Discretion
- Exact plugin.json metadata fields (description, version, author, repository)
- README content structure and copywriting
- Secret scanning patterns (beyond service_role/supabase key patterns)
- .npmignore contents (dev files, tests, supabase/, src/)
- build-plugin.js implementation details
- Version strategy (semver, pre-release tags)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA-04 | Package is npm installable with Claude Code plugin manifest (plugin.json) | Plugin manifest must live at `.claude-plugin/plugin.json` inside the npm package root; `skills/` at package root; `.mcp.json` at package root for MCP server config |
| INFRA-05 | Plugin userConfig collects API key at install time (sensitive, stored in keychain) | `userConfig.FREELANCEOS_API_KEY` with `sensitive: true`; Claude Code stores in system keychain; accessed as `${user_config.FREELANCEOS_API_KEY}` in `.mcp.json` headers |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | 24.14.0 (installed) | Build script runtime | Already available; `build-plugin.js` is a plain Node ESM script |
| npm | 11.9.0 (installed) | Package publish/distribution | `npm pack`, `npm publish`; the official Claude Code plugin distribution channel |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node:fs/promises | built-in | Build script file operations | Copying skills, writing manifest |
| node:path | built-in | Build script path resolution | Cross-platform safe path joins |
| node:child_process | built-in | Optional: validate JSON schema | Could call `claude plugin validate` |

No additional npm dependencies needed. The build script is pure Node.js built-ins.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain Node.js build script | tsup / tsc | No TypeScript to compile in the package; unnecessary overhead |
| `.mcp.json` at package root | Inline `mcpServers` in plugin.json | Both work; separate file is cleaner and matches standard plugin layout |
| npm only | GitHub-hosted marketplace | GitHub marketplace requires users to register your marketplace URL; npm source in a marketplace.json is the cleaner public distribution path |

**Installation (dev only — no runtime deps in the published package):**
```bash
# No new npm deps needed for this phase
# Build script uses Node built-ins only
```

**Version verification:** Current package has `"version": "0.1.0"` and `"private": true`. Both must change for publishing.

---

## Architecture Patterns

### Recommended Project Structure (Published Package)

```
freelance-os/                     # npm package root
├── .claude-plugin/               # REQUIRED: manifest goes here (NOT at root)
│   └── plugin.json               # Plugin manifest
├── skills/                       # Skills at package root (auto-discovered)
│   ├── freelance-proposals/
│   │   └── SKILL.md
│   ├── freelance-followups/
│   │   └── SKILL.md
│   ├── freelance-scope/
│   │   └── SKILL.md
│   ├── freelance-invoices/
│   │   └── SKILL.md
│   └── freelance-time/
│       └── SKILL.md
├── .mcp.json                     # MCP server config (auto-discovered)
├── package.json                  # npm manifest (private: false, no src/ deps)
├── README.md                     # npm-focused README
└── scripts/
    └── build-plugin.js           # Build + secret scan script (excluded from pack)
```

**CRITICAL:** The `.claude-plugin/` directory must contain only `plugin.json`. All other plugin components (`skills/`, `.mcp.json`) must be at the **package root**, not inside `.claude-plugin/`.

### Source vs Published Layout

The source repo has skills in `.claude/skills/`. The build script must copy them to `skills/` (top-level) before publish. The `scripts/` dir contains the build script and is excluded from the npm package via `.npmignore`.

```
Source repo                 →   Published package
.claude/skills/*/SKILL.md   →   skills/*/SKILL.md
.claude-plugin/plugin.json  →   .claude-plugin/plugin.json (generated)
(src/ excluded entirely)    →   (not shipped)
```

### Pattern 1: plugin.json Manifest (at `.claude-plugin/plugin.json`)

```json
// Source: https://code.claude.com/docs/en/plugins-reference
{
  "name": "freelance-os",
  "version": "0.1.0",
  "description": "Freelance business manager for Claude Code — proposals, invoices, follow-ups, scope, and time tracking",
  "author": {
    "name": "FreelanceOS",
    "url": "https://freelanceos.dev"
  },
  "homepage": "https://freelanceos.dev",
  "repository": "https://github.com/your-org/freelance-os",
  "license": "MIT",
  "keywords": ["freelance", "proposals", "invoices", "mcp", "crm"],
  "skills": "./skills/",
  "userConfig": {
    "FREELANCEOS_API_KEY": {
      "description": "Your FreelanceOS API key (from freelanceos.dev/dashboard)",
      "sensitive": true
    }
  }
}
```

Note: `mcpServers` is NOT in plugin.json — it lives in the separate `.mcp.json` file at package root. Both approaches work, but separating them is the standard layout. The `${user_config.FREELANCEOS_API_KEY}` substitution works in `.mcp.json`.

### Pattern 2: .mcp.json (at package root)

```json
// Source: https://code.claude.com/docs/en/mcp (env var expansion section)
//         https://code.claude.com/docs/en/plugins-reference (userConfig section)
{
  "mcpServers": {
    "freelance-os": {
      "type": "http",
      "url": "https://mcp.freelanceos.dev/mcp",
      "headers": {
        "Authorization": "Bearer ${user_config.FREELANCEOS_API_KEY}"
      }
    }
  }
}
```

**Key confirmed behaviors (HIGH confidence from official docs):**
- `${user_config.KEY}` substitution is valid in MCP server configs (headers, url, env)
- `sensitive: true` values go to system keychain (macOS) or `~/.claude/.credentials.json` (other platforms)
- Keychain storage has a ~2 KB total limit — API key value (`fos_live_<uuid>` = ~40 chars) is well within limit
- `"type": "http"` is the field name for Streamable HTTP transport in `.mcp.json`
- The plugin MCP server starts automatically when plugin is enabled

### Pattern 3: npm Source Entry in marketplace.json

For a GitHub-hosted marketplace catalog (separate repo):

```json
// Source: https://code.claude.com/docs/en/plugin-marketplaces
{
  "name": "freelanceos-marketplace",
  "owner": { "name": "FreelanceOS" },
  "plugins": [
    {
      "name": "freelance-os",
      "source": {
        "source": "npm",
        "package": "freelance-os"
      },
      "description": "Freelance business manager — proposals, invoices, follow-ups, scope tracking",
      "license": "MIT"
    }
  ]
}
```

Users install with: `claude plugin install freelance-os@freelanceos-marketplace`

### Pattern 4: build-plugin.js Script

```javascript
// scripts/build-plugin.js — runs as Node ESM (type: "module" in package.json)
import { copyFile, mkdir, readdir, writeFile, readFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SKILLS_SRC = join(ROOT, '.claude', 'skills');
const SKILLS_DEST = join(ROOT, 'skills');
const PLUGIN_DIR = join(ROOT, '.claude-plugin');
const PLUGIN_JSON = join(PLUGIN_DIR, 'plugin.json');

// 1. Clean and recreate skills/ output dir
// 2. Copy each skill dir from .claude/skills/ to skills/
// 3. Write/validate .claude-plugin/plugin.json
// 4. Secret scan all files about to be packed
// 5. Exit non-zero on any secret found
```

Secret scan patterns (beyond `service_role`):
- `SUPABASE_SERVICE_ROLE_KEY` or `service_role`
- `eyJ` prefix (base64 JWT — Supabase anon/service keys start with this)
- `fos_live_` (actual API key values — should never be in source files)
- Contents of `.env` files (scan for `=` lines that look like secrets)
- `SUPABASE_URL` with actual project hostname (not `localhost`)

### Pattern 5: package.json Changes for Publishing

```json
// Changes needed to existing package.json:
{
  "name": "freelance-os",
  "version": "0.1.0",
  "private": false,          // REMOVE private: true
  "type": "module",
  "scripts": {
    "build": "node scripts/build-plugin.js",
    "prepublishOnly": "npm run build"
    // Remove: db:reset, db:push, db:types, test:db, test, typecheck
    // (those are dev-only, not needed in published package)
  },
  "files": [
    ".claude-plugin/",
    "skills/",
    ".mcp.json",
    "README.md"
  ]
  // Remove: dependencies, devDependencies, engines (not needed in skills-only package)
}
```

Using `"files"` in package.json is cleaner than `.npmignore` — it explicitly whitelists what ships. The build script output (`skills/`, `.claude-plugin/`) is what gets packed; `scripts/`, `src/`, `supabase/`, `tests/` are not listed and are excluded automatically.

### Anti-Patterns to Avoid

- **Wrong manifest location:** `plugin.json` at package root (not `.claude-plugin/plugin.json`) — plugin will not load. The `.claude-plugin/` directory name is required exactly.
- **Skills inside `.claude-plugin/`:** Skills must be at package root, not inside the metadata dir.
- **Sensitive values in non-sensitive userConfig:** Marking `FREELANCEOS_API_KEY` as `sensitive: false` stores it in plaintext `settings.json`. Always use `sensitive: true` for API keys.
- **`${FREELANCEOS_API_KEY}` directly in headers:** The correct substitution syntax in `.mcp.json` for userConfig values is `${user_config.FREELANCEOS_API_KEY}`, not `${FREELANCEOS_API_KEY}` (which reads from environment variables).
- **Shipping `src/` or `supabase/`:** Service role key lives in `.env` (gitignored) but migration files in `supabase/` could expose schema details; keep it excluded. `src/` is the MCP server source — never ships.
- **`private: true` in package.json:** Prevents `npm publish`. Must be removed before first publish.
- **Version mismatch between `plugin.json` and `marketplace.json`:** Official docs warn that `plugin.json` version wins silently. For npm-sourced plugins, set version in `plugin.json` only (or in both consistently).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Keychain secret storage | Custom credential file logic | `userConfig` + `sensitive: true` in plugin.json | Claude Code handles OS keychain integration automatically; ~2KB limit fits perfectly for short API keys |
| API key injection into requests | Custom MCP auth middleware at plugin layer | `.mcp.json` headers + `${user_config.KEY}` | Header injection is built into Claude Code's HTTP MCP client; server already validates Bearer token |
| User prompting for API key | Postinstall npm script | `userConfig` in plugin.json | Claude Code shows a proper UI prompt at enable time; postinstall scripts require `--unsafe-perm` and are unreliable |
| Plugin file copying | Custom rsync/cp shell scripts | Node.js `fs/promises` in build-plugin.js | Cross-platform, no extra deps, already in Node.js |
| Package contents control | `.npmignore` | `"files"` array in package.json | Explicit allowlist prevents accidental inclusion of secrets; ignored files don't protect against new secret files being added |

**Key insight:** The Claude Code plugin system handles the hard parts (keychain storage, secret prompting, header injection). The implementation task is mostly file placement and manifest authorship.

---

## Common Pitfalls

### Pitfall 1: Wrong Plugin Manifest Location
**What goes wrong:** Placing `plugin.json` at the package root instead of `.claude-plugin/plugin.json`. Plugin silently fails to load or auto-discovers components without reading manifest metadata.
**Why it happens:** Natural assumption that top-level is the right place, confusion with `package.json`.
**How to avoid:** Build script must `mkdir -p .claude-plugin/` and write to `.claude-plugin/plugin.json`. Verify with `claude plugin validate .` after build.
**Warning signs:** `/plugin` command shows plugin name derived from directory name instead of manifest `name` field.

### Pitfall 2: userConfig Substitution Syntax Mismatch
**What goes wrong:** Using `${FREELANCEOS_API_KEY}` in `.mcp.json` instead of `${user_config.FREELANCEOS_API_KEY}`. MCP server gets an empty/undefined Authorization header, every tool call returns 401.
**Why it happens:** `${VAR}` syntax reads environment variables; `${user_config.KEY}` reads collected userConfig values. They look similar but are different namespaces.
**How to avoid:** In `.mcp.json`, always use `${user_config.KEY}` for userConfig values. Env var expansion (`${VAR}`) is for system environment variables only.
**Warning signs:** MCP server receives requests with `Authorization: Bearer ` (empty key) or `Authorization: Bearer undefined`.

### Pitfall 3: Secret Scan Missing Encoded Keys
**What goes wrong:** Secret scan checks for literal `service_role` string but misses base64-encoded JWT tokens (`eyJ...`) that Supabase uses for anon/service keys.
**Why it happens:** Supabase API keys are JWT tokens starting with `eyJ` — scanning for the string "service_role" won't catch a raw key value.
**How to avoid:** Add `eyJ` pattern to secret scan. Also scan for the specific `fos_live_` prefix in case a live key was accidentally committed.
**Warning signs:** `npm pack` tarball contains a file with a long base64 string starting with `eyJ`.

### Pitfall 4: Skills Directory Not Rebuilt Before Pack
**What goes wrong:** `npm pack` captures a stale or empty `skills/` directory if build script didn't run, shipping a package that installs with no skills.
**Why it happens:** `skills/` is in `.gitignore` (it's a build artifact), so `git clean` or a fresh checkout removes it. If `prepublishOnly` doesn't run or fails silently, the pack captures the empty dir.
**How to avoid:** `prepublishOnly` calls `npm run build`. Build script exits with code 1 on any error. Add a post-build validation step that counts skill files and fails if count < 5.
**Warning signs:** Published tarball is unusually small (< 50 KB).

### Pitfall 5: Version Not Bumped Before Publish
**What goes wrong:** Re-publishing with the same version number fails with `npm ERR! 403 You cannot publish over the previously published versions`. Or if using a marketplace, cached old version is served.
**Why it happens:** npm registry forbids overwriting existing versions; Claude Code uses version for cache invalidation.
**How to avoid:** Use semver bump (`npm version patch`) as part of the publish workflow. Document in CHANGELOG.md.
**Warning signs:** `npm publish` returns 403.

### Pitfall 6: keychain 2 KB Limit
**What goes wrong:** If multiple sensitive userConfig values are stored across plugins, the ~2 KB keychain limit is shared. Adding more sensitive fields could silently fail to store.
**Why it happens:** Claude Code docs explicitly state the keychain storage is shared with OAuth tokens and has ~2 KB total limit.
**How to avoid:** Keep only one sensitive field (`FREELANCEOS_API_KEY`). The `fos_live_<uuid>` format is ~40 chars — well within budget. Do NOT add `SUPABASE_URL` or other fields as sensitive.
**Warning signs:** Key appears to save successfully but is not available in subsequent sessions.

---

## Code Examples

Verified patterns from official sources:

### .claude-plugin/plugin.json — Full manifest
```json
// Source: https://code.claude.com/docs/en/plugins-reference
{
  "name": "freelance-os",
  "version": "0.1.0",
  "description": "Freelance business manager for Claude Code",
  "author": { "name": "FreelanceOS", "url": "https://freelanceos.dev" },
  "homepage": "https://freelanceos.dev",
  "repository": "https://github.com/your-org/freelance-os",
  "license": "MIT",
  "keywords": ["freelance", "crm", "proposals", "invoices", "mcp"],
  "skills": "./skills/",
  "userConfig": {
    "FREELANCEOS_API_KEY": {
      "description": "Your FreelanceOS API key — get one at freelanceos.dev/dashboard",
      "sensitive": true
    }
  }
}
```

### .mcp.json — Remote HTTP MCP server with Bearer token
```json
// Source: https://code.claude.com/docs/en/mcp (env var expansion + HTTP server config)
{
  "mcpServers": {
    "freelance-os": {
      "type": "http",
      "url": "https://mcp.freelanceos.dev/mcp",
      "headers": {
        "Authorization": "Bearer ${user_config.FREELANCEOS_API_KEY}"
      }
    }
  }
}
```

### package.json — Publishing-ready (diffs from current)
```json
// Changes: remove "private": true, add "files", remove dev scripts
{
  "name": "freelance-os",
  "version": "0.1.0",
  "type": "module",
  "description": "Freelance business manager for Claude Code",
  "license": "MIT",
  "files": [
    ".claude-plugin/",
    "skills/",
    ".mcp.json",
    "README.md"
  ],
  "scripts": {
    "build": "node scripts/build-plugin.js",
    "prepublishOnly": "npm run build"
  }
}
```

### build-plugin.js — Skeleton with secret scan
```javascript
// scripts/build-plugin.js
import { cp, rm, mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SECRET_PATTERNS = [
  /service_role/i,
  /eyJ[A-Za-z0-9+/]{20,}/,      // base64 JWT prefix (Supabase keys)
  /fos_live_[0-9a-f-]{36}/,     // live API key values
  /SUPABASE_SERVICE_ROLE/i,
];

async function scanForSecrets(dir) {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const full = join(entry.parentPath ?? entry.path, entry.name);
    const content = await readFile(full, 'utf8').catch(() => '');
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(content)) {
        console.error(`SECRET DETECTED in ${full} — pattern: ${pattern}`);
        process.exit(1);
      }
    }
  }
}

async function build() {
  // 1. Rebuild skills/
  await rm(join(ROOT, 'skills'), { recursive: true, force: true });
  await cp(join(ROOT, '.claude', 'skills'), join(ROOT, 'skills'), { recursive: true });

  // 2. Ensure .claude-plugin/ exists and write plugin.json
  await mkdir(join(ROOT, '.claude-plugin'), { recursive: true });
  // (plugin.json is static; could validate here with JSON.parse)

  // 3. Secret scan all pack-included directories
  await scanForSecrets(join(ROOT, 'skills'));
  await scanForSecrets(join(ROOT, '.claude-plugin'));
  // Also scan .mcp.json
  const mcpContent = await readFile(join(ROOT, '.mcp.json'), 'utf8').catch(() => '');
  for (const p of SECRET_PATTERNS) {
    if (p.test(mcpContent)) {
      console.error(`SECRET DETECTED in .mcp.json — pattern: ${p}`);
      process.exit(1);
    }
  }

  // 4. Verify skill count
  const skills = await readdir(join(ROOT, 'skills'));
  if (skills.length < 5) {
    console.error(`Expected 5 skill dirs, found ${skills.length}`);
    process.exit(1);
  }

  console.log(`Build complete. ${skills.length} skills ready.`);
}

build().catch(e => { console.error(e); process.exit(1); });
```

### User install flow
```bash
# User adds marketplace (one-time setup):
claude plugin marketplace add https://github.com/your-org/freelanceos-marketplace

# User installs plugin:
claude plugin install freelance-os@freelanceos-marketplace
# → Claude Code prompts: "Enter your FreelanceOS API key:"
# → User enters fos_live_<uuid>
# → Stored in system keychain, injected as Authorization header on every MCP call
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `.claude/commands/` for distributable skills | `skills/<name>/SKILL.md` in a plugin | Dec 2025 (Agent Skills spec) | Commands still work but skills have frontmatter controls and proper plugin integration |
| Manual API key in `settings.json` | `userConfig` + `sensitive: true` in plugin.json | 2025 (plugin system) | OS keychain storage, no plaintext secrets, proper UI prompt at install time |
| SSE transport for remote MCP | Streamable HTTP (`"type": "http"`) | MCP spec 2025-03-26 | SSE is deprecated; all new remote servers should use Streamable HTTP |
| Postinstall npm scripts for setup | `userConfig` prompting at enable time | 2025 (plugin system) | More reliable, integrated with Claude Code UI, no npm script permission issues |

**Deprecated/outdated:**
- SSE MCP transport: deprecated in MCP spec 2025-03-26; retained for backwards compat only. Use `"type": "http"` in `.mcp.json`.
- `.claude/commands/` format: superseded by skills. Still supported but not the right format for a distributable plugin.

---

## Open Questions

1. **Exact hosted MCP server URL**
   - What we know: Decision D-01 says `https://mcp.freelanceos.dev/mcp` as an example
   - What's unclear: The actual domain and URL is not yet registered/deployed; Phase 5 produces a package that references this URL
   - Recommendation: Use a placeholder URL in the package (e.g., `https://mcp.freelanceos.dev/mcp`) with a note that it will 404 until the server is deployed. The package is "ready to publish" per success criteria even if the server isn't live yet.

2. **Marketplace hosting strategy**
   - What we know: npm source is supported for plugins. Users need a marketplace to discover and install.
   - What's unclear: Whether a separate marketplace GitHub repo is in scope for this phase, or if the success criterion ("Running `/plugin install freelanceos`") implies something simpler.
   - Recommendation: The success criteria say "or equivalent npm install flow" — create a minimal `marketplace.json` in the same repo (or a sibling) pointing to the npm package. Test with `claude plugin install` locally first.

3. **`readdir` recursive option availability**
   - What we know: `readdir` with `{ recursive: true }` was added in Node.js 20.
   - What's unclear: None — installed Node is 24.14.0, so this is confirmed available.
   - Recommendation: Use `{ recursive: true }` confidently; no polyfill needed.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build-plugin.js, npm scripts | Yes | v24.14.0 | — |
| npm | Publishing, pack verification | Yes | 11.9.0 | — |
| Claude Code CLI | `claude plugin validate`, install testing | Unknown | Unknown | Manual JSON validation |

**Missing dependencies with no fallback:**
- Claude Code CLI (`claude` command) — needed for `claude plugin validate .` and end-to-end install test. If not available in the dev environment, substitute with manual JSON schema validation.

**Missing dependencies with fallback:**
- Claude Code CLI for plugin validate: fallback is `node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/plugin.json','utf8'))"` for syntax check only.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.x |
| Config file | `vitest.config.ts` (exists) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-04 | npm pack produces tarball with correct manifest and skills | unit | `npm test` (pack validation test) | ❌ Wave 0 |
| INFRA-04 | plugin.json is valid JSON at `.claude-plugin/plugin.json` | unit | `npm test` | ❌ Wave 0 |
| INFRA-04 | `skills/` contains exactly 5 subdirectories after build | unit | `npm test` | ❌ Wave 0 |
| INFRA-05 | userConfig declares FREELANCEOS_API_KEY with `sensitive: true` | unit | `npm test` | ❌ Wave 0 |
| INFRA-05 | .mcp.json headers reference `${user_config.FREELANCEOS_API_KEY}` | unit | `npm test` | ❌ Wave 0 |
| INFRA-04 | Secret scan rejects files containing service_role patterns | unit | `npm test` | ❌ Wave 0 |
| INFRA-04 | Secret scan rejects files containing eyJ JWT patterns | unit | `npm test` | ❌ Wave 0 |
| INFRA-04 | npm pack tarball contains no src/, supabase/, scripts/ | unit | `npm test` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/plugin-package.test.ts` — covers INFRA-04, INFRA-05 (all rows above)
- [ ] No new fixtures needed — tests read generated files from `skills/`, `.claude-plugin/`, `.mcp.json` directly

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on This Phase |
|-----------|---------------------|
| TypeScript 5.x for all source code | Build script (`build-plugin.js`) is Node.js ESM (no TS needed — no src/ ships). Any new test files in `tests/` use TypeScript via vitest. |
| `@modelcontextprotocol/sdk` 1.x | Not used in plugin package (no server code ships). Relevant only as a reference for why remote URL transport is required. |
| `@supabase/supabase-js` 2.100.1 | Not shipped in plugin package. Lives on the server side only. |
| No SSE transport | `.mcp.json` uses `"type": "http"` (Streamable HTTP), not SSE. |
| Agent Skills SKILL.md format | Skills already authored in Phase 4 to this spec. Build script copies them unchanged. |
| Claude Code plugin format | The entire phase implements this. `plugin.json` at `.claude-plugin/`, skills at root, `.mcp.json` at root. |
| npm as distribution channel | `npm publish` is the publish step. `"files"` array controls package contents. |
| vitest for testing | New test file in `tests/plugin-package.test.ts` follows existing convention. |
| GSD workflow enforcement | All file changes go through GSD execute-phase flow. |

---

## Sources

### Primary (HIGH confidence)
- [Claude Code Plugins Reference](https://code.claude.com/docs/en/plugins-reference) — Complete plugin.json schema, userConfig fields, `sensitive: true` behavior, keychain storage, `${user_config.KEY}` substitution, `.claude-plugin/` directory requirement, plugin directory structure, CLI commands
- [Claude Code Plugin Marketplaces](https://code.claude.com/docs/en/plugin-marketplaces) — npm source format (`"source": "npm"`), marketplace.json schema, distribution patterns
- [Claude Code MCP docs](https://code.claude.com/docs/en/mcp) — `.mcp.json` HTTP server format (`"type": "http"`, `"url"`, `"headers"`), `${VAR}` env var expansion, `${user_config.KEY}` substitution in headers

### Secondary (MEDIUM confidence)
- [Claude Code Plugins README (GitHub)](https://github.com/anthropics/claude-code/blob/main/plugins/README.md) — Confirmed plugin system exists and is published
- [DEV Community: Claude Code plugin credentials](https://dev.to/rsdouglas/claude-code-plugin-credentials-what-the-new-keychain-storage-does-and-doesnt-do-cnf) — Confirms keychain behavior and ~2KB limit detail

### Tertiary (LOW confidence)
- None — all critical claims verified from official Anthropic documentation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — pure Node.js built-ins, no new deps, already installed
- Architecture: HIGH — plugin manifest format, directory layout, substitution syntax all from official docs
- Build script pattern: HIGH — Node.js fs/promises is stable; logic is straightforward file operations
- Pitfalls: HIGH — derived directly from official docs warnings + auth middleware already in place

**Research date:** 2026-03-28
**Valid until:** 2026-07-28 (plugin spec is stable; watch for Claude Code version changes to userConfig behavior)
