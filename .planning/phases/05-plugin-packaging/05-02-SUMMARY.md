---
phase: 05-plugin-packaging
plan: 02
subsystem: infra
tags: [npm, plugin, testing, readme, vitest, packaging]

# Dependency graph
requires:
  - phase: 05-plugin-packaging
    plan: 01
    provides: plugin.json, .mcp.json, build script, and publishable package.json
provides:
  - Vitest test suite (41 tests) validating plugin manifest, userConfig, MCP config, build output, secret scanning, and npm pack contents
  - npm-focused README with install command, API key setup, skill descriptions, and keychain security info
affects: [npm-publishing, plugin-validation, user-onboarding]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Secret scan tests plant temp files in .claude/skills/ source dir (not skills/ build output) — build script wipes and recreates skills/ so source is the correct injection point"
    - "npm pack --dry-run --json for reliable pack content parsing (returns structured JSON with files array)"
    - "TDD: tests written against existing infrastructure from Plan 01 — all passed on GREEN run"

key-files:
  created:
    - tests/plugin-package.test.ts
    - README.md
  modified: []

key-decisions:
  - "Secret scan tests inject temp files into .claude/skills/ source (not skills/ build output) — the build script copies source to build output before scanning, so source injection is required for the scan to trigger"
  - "README is user-facing only — no developer setup, build instructions, or contribution guide per D-12"
  - "Stub placeholder README created during Task 1 to satisfy npm pack test, replaced with full content in Task 2"

patterns-established:
  - "Plugin package test pattern: read JSON files from ROOT, run build in beforeAll, use execSync for CLI verification"
  - "npm pack test pattern: --dry-run --json returns structured file list without creating tarball artifact"

requirements-completed: [INFRA-04, INFRA-05]

# Metrics
duration: 218s
completed: 2026-03-28
---

# Phase 05 Plan 02: Plugin Packaging Tests and README Summary

**41-test Vitest suite validating INFRA-04/05 plugin manifest, userConfig, MCP config, secret scanning, and npm pack contents; plus npm-focused README with install command and keychain API key setup**

## Performance

- **Duration:** 218 sec (~3.6 min)
- **Started:** 2026-03-28T17:22:04Z
- **Completed:** 2026-03-28T17:25:42Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `tests/plugin-package.test.ts` with 41 tests covering all INFRA-04 and INFRA-05 requirements: plugin.json manifest structure, userConfig sensitive field, .mcp.json type/URL/auth header, build output (5 skills), secret scan rejection of `service_role` and `eyJ` JWT patterns, package.json publishing fields, and npm pack contents (correct inclusions and exclusions)
- Created `README.md` with all required sections for npm audience: install command, API key setup with keychain mention, all 5 skills listed, requirements, MIT license — no developer/build content
- Full test suite: 145 tests across 10 test files all passing

## Task Commits

1. **Task 1: Write plugin packaging tests** - `7730be8` (test)
2. **Task 2: Create npm-focused README** - `b738074` (feat)

## Files Created/Modified

- `tests/plugin-package.test.ts` - 41 Vitest tests covering INFRA-04 and INFRA-05 requirements
- `README.md` - npm-focused README with install, API key, skills, keychain security info, MIT license

## Decisions Made

- Secret scan tests inject temp files into `.claude/skills/` source directory — build script wipes and recreates `skills/` build output on each run, so injecting into the build output gets deleted before the scan runs; source injection is the correct approach
- README is strictly user-facing (D-12) — no developer setup, build instructions, contribution guide, or architecture details
- Placeholder README created at end of Task 1 to satisfy npm pack test (README.md must exist for npm pack to include it); replaced with full content in Task 2

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Secret scan tests corrected to plant files in source dir**
- **Found during:** Task 1 verification (3 tests failing)
- **Issue:** Initial implementation planted temp files in `skills/` (build output). The build script does `rm skills/` then `cp .claude/skills/ -> skills/` before scanning, so temp files in `skills/` were deleted before the scan ran.
- **Fix:** Changed temp file paths to `.claude/skills/freelance-proposals/TEMP_*.md` (the source directory that gets copied to build output)
- **Files modified:** `tests/plugin-package.test.ts`
- **Commit:** `7730be8`

**2. [Rule 1 - Bug] README stub created during Task 1 for npm pack test**
- **Found during:** Task 1 verification
- **Issue:** npm pack test verified README.md is included in the tarball, but README.md did not exist (it is created in Task 2). The test would fail with `false` since README.md was absent.
- **Fix:** Created minimal placeholder `README.md` (3 lines) during Task 1 so the npm pack test could verify the inclusion. Task 2 replaced it with full content.
- **Files modified:** `README.md`
- **Commit:** `7730be8` (stub), `b738074` (full content)

---

**Total deviations:** 2 auto-fixed (Rule 1 - bugs found during verification)
**Impact on plan:** Both fixes were necessary for tests to be valid. No scope creep.

## Issues Encountered

None beyond the two auto-fixed deviations above.

## User Setup Required

None.

## Known Stubs

None — README.md is fully written with real content. All tests validate actual artifacts.

## Self-Check: PASSED

- FOUND: tests/plugin-package.test.ts
- FOUND: README.md
- FOUND commit: 7730be8 (test - plugin packaging tests)
- FOUND commit: b738074 (feat - npm README)

---
*Phase: 05-plugin-packaging*
*Completed: 2026-03-28*
