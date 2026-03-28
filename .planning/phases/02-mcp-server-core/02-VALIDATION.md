---
phase: 2
slug: mcp-server-core
status: draft
nyquist_compliant: true
wave_0_complete: true
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
| 02-01-T1 | 01 | 1 | ALL | setup | `npx vitest run` | Created in task | ⬜ pending |
| 02-01-T2 | 01 | 1 | CRM-01 | compile+smoke | `npx tsc --noEmit && curl localhost:3000/mcp` | Created in task | ⬜ pending |
| 02-01-T3 | 01 | 1 | CRM-01 | unit | `npx vitest run tests/middleware/auth.test.ts` | Created in task | ⬜ pending |
| 02-02-T1 | 02 | 2 | CRM-01,CRM-03,CRM-04 | compile | `npx tsc --noEmit` | Created in task | ⬜ pending |
| 02-02-T2 | 02 | 2 | CRM-01,CRM-03,CRM-04 | unit | `npx vitest run tests/tools/clients.test.ts` | Created in task | ⬜ pending |
| 02-03-T1 | 03 | 3 | CRM-02,CRM-04 | compile | `npx tsc --noEmit` | Created in task | ⬜ pending |
| 02-03-T2 | 03 | 3 | CRM-02,CRM-04 | unit | `npx vitest run tests/tools/projects.test.ts` | Created in task | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Plan 02-01 (Wave 1) handles all setup:
- [x] `vitest.config.ts` — created in Plan 02-01 Task 1
- [x] `tests/middleware/auth.test.ts` — created in Plan 02-01 Task 3
- [x] Package installs — handled in Plan 02-01 Task 1
- [x] New migration `set_app_user_id` — handled in Plan 02-01 Task 1
- Test files for tools created in Plan 02-02 Task 2 and Plan 02-03 Task 2

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| MCP server starts and responds to initialize request | ALL | Requires running server + Claude Code or curl client | Start `npx tsx src/server.ts`, send MCP initialize via curl to POST /mcp |
| Auth rejection at HTTP level (401 before MCP) | CRM-01 | Requires HTTP-level inspection | curl POST /mcp without Authorization header, verify 401 response |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-28
