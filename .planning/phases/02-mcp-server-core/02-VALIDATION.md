---
phase: 2
slug: mcp-server-core
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.2 |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npx vitest run tests/` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 0 | ALL | setup | `npx vitest run` | No — W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | CRM-01 | unit | `npx vitest run tests/middleware/auth.test.ts` | No — W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | CRM-01 | unit | `npx vitest run tests/tools/clients.test.ts` | No — W0 | ⬜ pending |
| 02-02-03 | 02 | 1 | CRM-02 | unit | `npx vitest run tests/tools/projects.test.ts` | No — W0 | ⬜ pending |
| 02-02-04 | 02 | 1 | CRM-03 | unit | `npx vitest run tests/tools/clients.test.ts` | No — W0 | ⬜ pending |
| 02-02-05 | 02 | 1 | CRM-04 | unit | `npx vitest run tests/tools/clients.test.ts` | No — W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — minimal config for ESM + Node16 resolution
- [ ] `tests/middleware/auth.test.ts` — stubs for auth middleware (CRM-01 auth gate)
- [ ] `tests/tools/clients.test.ts` — stubs for client tool handlers (CRM-01, CRM-03, CRM-04)
- [ ] `tests/tools/projects.test.ts` — stubs for project tool handlers (CRM-02, CRM-04)
- [ ] Package installs: `npm install --save-dev tsup @types/node @types/express`
- [ ] New migration: `supabase/migrations/[timestamp]_create_set_app_user_id.sql`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| MCP server starts and responds to initialize request | ALL | Requires running server + Claude Code or curl client | Start `npx tsx src/server.ts`, send MCP initialize via curl to POST /mcp |
| Auth rejection at HTTP level (401 before MCP) | CRM-01 | Requires HTTP-level inspection | curl POST /mcp without Authorization header, verify 401 response |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
