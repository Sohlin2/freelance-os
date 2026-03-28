---
phase: 3
slug: full-tool-suite
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.2 |
| **Config file** | `vitest.config.ts` (exists) |
| **Quick run command** | `npm test -- tests/tools/<entity>.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- tests/tools/<entity>.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | PROP-01 | unit | `npm test -- tests/tools/proposals.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | PROP-03 | unit | `npm test -- tests/tools/proposals.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | PROP-04 | unit | `npm test -- tests/tools/proposals.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | INV-01 | unit | `npm test -- tests/tools/invoices.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | INV-02 | unit | `npm test -- tests/tools/invoices.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 1 | INV-03 | unit | `npm test -- tests/tools/invoices.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-04 | 02 | 1 | INV-04 | unit | `npm test -- tests/tools/invoices.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 1 | TIME-01 | unit | `npm test -- tests/tools/time-entries.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-02 | 03 | 1 | TIME-02 | unit | `npm test -- tests/tools/time-entries.test.ts` | ❌ W0 | ⬜ pending |
| 03-04-01 | 04 | 1 | SCOPE-01 | unit | `npm test -- tests/tools/scope.test.ts` | ❌ W0 | ⬜ pending |
| 03-04-02 | 04 | 1 | SCOPE-02 | unit | `npm test -- tests/tools/scope.test.ts` | ❌ W0 | ⬜ pending |
| 03-04-03 | 04 | 1 | SCOPE-03 | unit | `npm test -- tests/tools/scope.test.ts` | ❌ W0 | ⬜ pending |
| 03-04-04 | 04 | 1 | SCOPE-04 | unit | `npm test -- tests/tools/scope.test.ts` | ❌ W0 | ⬜ pending |
| 03-05-01 | 05 | 1 | FLLW-01 | unit | `npm test -- tests/tools/follow-ups.test.ts` | ❌ W0 | ⬜ pending |
| 03-05-02 | 05 | 1 | FLLW-03 | unit | `npm test -- tests/tools/follow-ups.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/tools/proposals.test.ts` — stubs for PROP-01, PROP-03, PROP-04
- [ ] `tests/tools/invoices.test.ts` — stubs for INV-01, INV-02, INV-03, INV-04
- [ ] `tests/tools/time-entries.test.ts` — stubs for TIME-01, TIME-02
- [ ] `tests/tools/scope.test.ts` — stubs for SCOPE-01, SCOPE-02, SCOPE-03, SCOPE-04
- [ ] `tests/tools/follow-ups.test.ts` — stubs for FLLW-01, FLLW-03

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Claude drafts coherent proposal text | PROP-01 | Content quality is subjective | Ask Claude to draft a proposal, verify it includes project details |
| Follow-up email references real data | FLLW-01 | Requires checking natural language output | Ask Claude to draft follow-up, verify it includes invoice amount and days overdue |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
