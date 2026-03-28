---
phase: 5
slug: plugin-packaging
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-28
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 2.x |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run tests/plugin-package.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/plugin-package.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before phase completion:** Full suite must be green (145 tests across all phases)
- **Max feedback latency:** 10 seconds

---

## Phase 5 Test Coverage

| Test | File | What It Verifies |
|------|------|------------------|
| Plugin packaging | tests/plugin-package.test.ts | Manifest structure, userConfig sensitive API key, .mcp.json Bearer token, build script output, secret scan (no service_role/JWT/fos_live_ leakage), npm pack contents (41 tests) |

---

## Feedback Signals

- `npx vitest run tests/plugin-package.test.ts` — 41 tests pass, 0 failures
- Build script output: "Build complete. 5 skills ready. No secrets detected."
- `npm pack --dry-run --json` — confirms .claude-plugin/plugin.json, .mcp.json, skills/, README.md all present; no src/, tests/, .planning/ leakage

---

## Compliance Checklist

- [x] Wave 0 tests exist (tests/plugin-package.test.ts with 41 tests covering manifest, MCP config, build, and secret scanning)
- [x] Quick run command works (`npx vitest run tests/plugin-package.test.ts` exits 0)
- [x] Sampling rate defined (plugin test after every packaging change, full suite after each plan wave)
- [x] Feedback signals documented (test count, build script output, pack dry-run contents)

**Approval:** approved 2026-03-28
