---
phase: 4
slug: skill-pack
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | SKLL-01 | integration | `npx vitest run tests/skills/` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | PROP-02 | integration | `npx vitest run tests/skills/proposal.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 1 | FLLW-02 | integration | `npx vitest run tests/skills/followup.test.ts` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 2 | SKLL-02 | integration | `npx vitest run tests/skills/invocation.test.ts` | ❌ W0 | ⬜ pending |
| 04-03-02 | 03 | 2 | SKLL-03 | unit | `npx vitest run tests/token-budget.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/skills/` — directory for skill validation tests
- [ ] `tests/token-budget.test.ts` — token budget enforcement test (SKLL-03)
- [ ] `scripts/count-tokens.ts` — token counting utility

*Existing vitest infrastructure from Phase 2/3 covers framework setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Claude proactively coaches on pricing/scope during proposal drafting | PROP-02 | Requires live Claude session to verify coaching behavior | Draft a proposal and verify coaching appears without prompting |
| Claude advises on timing/tone for follow-ups | FLLW-02 | Requires live Claude session to verify contextual advice | Create follow-ups for different contexts (late invoice, check-in, awaiting response) |
| Skills invoke automatically from natural language | SKLL-02 | Requires live Claude session with skills loaded | Describe needs in natural language, verify correct skill triggers |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
