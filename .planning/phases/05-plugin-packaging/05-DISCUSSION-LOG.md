# Phase 5: Plugin Packaging - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 05-plugin-packaging
**Areas discussed:** Plugin manifest & structure, API key collection flow, Build & publish pipeline, Package identity & scope

---

## Plugin Manifest & Structure

### MCP Server Reference

| Option | Description | Selected |
|--------|-------------|----------|
| Remote server URL | plugin.json points to hosted Streamable HTTP endpoint. No local server process. | Yes |
| Bundled local server | plugin.json points to built JS in the package. Server runs locally via node. | |
| Both options | Default to remote, include local fallback via env var. | |

**User's choice:** Remote server URL
**Notes:** Matches hosted Supabase design -- server runs where the data lives.

### Skills Location

| Option | Description | Selected |
|--------|-------------|----------|
| Top-level skills/ dir | skills/freelance-proposals/SKILL.md, etc. Matches agentskills.io convention. | Yes |
| Inside .claude/skills/ | Keep current path. Less conventional for distributed package. | |
| You decide | Claude picks most compatible approach. | |

**User's choice:** Top-level skills/ dir
**Notes:** None

### Plugin Hooks

| Option | Description | Selected |
|--------|-------------|----------|
| No hooks for v1 | Keep it simple. Skills + MCP server is enough. | Yes |
| Onboarding hook | Post-install hook validates API key and shows welcome message. | |
| You decide | Claude evaluates whether hooks add value. | |

**User's choice:** No hooks for v1
**Notes:** None

---

## API Key Collection Flow

### Key Input Method

| Option | Description | Selected |
|--------|-------------|----------|
| userConfig in plugin.json | Plugin manifest declares key as userConfig with sensitive: true. Claude Code prompts at install. | Yes |
| Manual env var | User sets FREELANCEOS_API_KEY in shell profile or .env. | |
| Interactive setup command | Separate CLI command that prompts and stores key. | |

**User's choice:** userConfig in plugin.json
**Notes:** Key stored in OS keychain, never in plaintext.

### Missing/Invalid Key Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| MCP error with setup instructions | Clear error with actionable message pointing to /plugin configure. | Yes |
| Silent tool unavailability | Tools don't register if no key present. | |
| You decide | Claude picks best error UX. | |

**User's choice:** MCP error with setup instructions
**Notes:** None

---

## Build & Publish Pipeline

### Package Contents

| Option | Description | Selected |
|--------|-------------|----------|
| Skills + plugin.json only | No server code shipped. Lean install. | Yes |
| Skills + plugin.json + bundled server | Ship server too for local fallback. Larger package. | |
| You decide | Claude evaluates based on remote server decision. | |

**User's choice:** Skills + plugin.json only
**Notes:** Server runs on FreelanceOS infrastructure.

### Build Pipeline

| Option | Description | Selected |
|--------|-------------|----------|
| npm scripts only | build script copies skills, validates manifest, checks secrets. No tsup. | Yes |
| tsup + npm scripts | Use tsup even without server code. Adds build step. | |
| You decide | Claude picks simplest approach. | |

**User's choice:** npm scripts only
**Notes:** None

### Secret Scanning

| Option | Description | Selected |
|--------|-------------|----------|
| Build script check | build-plugin.js scans for secret patterns. Fails build if found. | Yes |
| .npmignore only | Rely on file exclusion only. | |
| Both | .npmignore + build script verification. | |

**User's choice:** Build script check
**Notes:** None

---

## Package Identity & Scope

### Package Name

| Option | Description | Selected |
|--------|-------------|----------|
| freelance-os | Unscoped, simple, matches project name. | Yes |
| @freelanceos/plugin | Scoped under org. Prevents name squatting. | |
| @freelanceos/claude-code | Scoped with platform context. | |

**User's choice:** freelance-os
**Notes:** None

### License

| Option | Description | Selected |
|--------|-------------|----------|
| MIT | Standard for npm. Skills are free marketing, server gated by key. | Yes |
| Proprietary / UNLICENSED | All rights reserved. More control. | |
| You decide | Claude picks based on monetization model. | |

**User's choice:** MIT
**Notes:** None

### README

| Option | Description | Selected |
|--------|-------------|----------|
| npm-specific README | Focused on install, setup, skills overview. Marketing + onboarding. | Yes |
| Reuse repo README | Same README for GitHub and npm. | |
| You decide | Claude picks best approach. | |

**User's choice:** npm-specific README
**Notes:** None

---

## Claude's Discretion

- Exact plugin.json metadata fields (description, version, author, repository)
- README content structure and copywriting
- Secret scanning patterns (beyond obvious service_role/supabase key patterns)
- .npmignore contents (dev files, tests, supabase/, src/)
- build-plugin.js implementation details
- Version strategy (semver, pre-release tags)
