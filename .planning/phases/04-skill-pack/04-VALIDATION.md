---
phase: 4
slug: skill-pack
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-28
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 2.x |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run tests/skills/` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/skills/` for skill content tests or `npx vitest run tests/token-budget.test.ts` for budget tests
- **After every plan wave:** Run `npx vitest run`
- **Before phase completion:** Full suite must be green (104 tests, 9 files)
- **Max feedback latency:** 10 seconds

---

## Phase 4 Test Coverage

| Test | File | What It Verifies |
|------|------|------------------|
| Token budget enforcement | tests/token-budget.test.ts | Total tokens < 15,000 (SKLL-03); 37 tools found and all skill tool refs valid |
| Skill content tests | tests/skills/ | SKILL.md format, trigger phrases, tool name references across all 5 skills |

---

## Feedback Signals

- `npx vitest run` — 104 tests pass across 9 files, 0 failures
- `npx vitest run tests/token-budget.test.ts` — confirms total token count is under budget (12,331 at last verified run)
- Tool name validation test asserts `result.valid === true` — no broken tool references in skill files

---

## Compliance Checklist

- [x] Wave 0 tests exist (tests/skills/ directory and tests/token-budget.test.ts)
- [x] Quick run command works (`npx vitest run tests/skills/` exits 0)
- [x] Sampling rate defined (skill tests after skill commits, budget test after any skill change, full suite after each plan wave)
- [x] Feedback signals documented (test count, token count vs budget, tool ref validity)

**Approval:** approved 2026-03-28
