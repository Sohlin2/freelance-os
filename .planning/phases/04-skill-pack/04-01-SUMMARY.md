---
phase: 04-skill-pack
plan: 01
subsystem: testing
tags: [vitest, typescript, token-budget, skill-pack, validation]

# Dependency graph
requires:
  - phase: 03-full-tool-suite
    provides: 37 registered MCP tools in src/tools/*.ts that are measured by this script
provides:
  - Token counting utility that measures src/tools/*.ts registerTool config blocks and SKILL.md bodies
  - Tool name extraction that dynamically finds all 37 registered tool names
  - Skill tool reference validator that checks SKILL.md backtick identifiers against registered tools
  - Vitest test enforcing SKLL-03 15,000 token budget constraint
affects: [04-skill-pack plans 02-04, any plan that adds new tools or skill files]

# Tech tracking
tech-stack:
  added: [tsconfig.scripts.json for standalone scripts/ TypeScript compilation]
  patterns: [char/4 token estimation, registerTool config block extraction via bracket-counting parser]

key-files:
  created:
    - scripts/count-tokens.ts
    - tests/token-budget.test.ts
    - tsconfig.scripts.json
  modified: []

key-decisions:
  - "Token counting uses Math.ceil(chars/4) conservative approximation per D-11 research decision"
  - "extractRegisterToolBlocks() uses bracket-depth parser to capture full config objects rather than fragile line-by-line regex"
  - "tsconfig.scripts.json extends base tsconfig with types: ['node'] override since scripts/ is not in src/ rootDir"
  - "validateSkillToolRefs filters backtick identifiers by tool name prefixes to avoid false positives from non-tool snake_case strings"

patterns-established:
  - "Pattern: scripts/ dir for standalone TypeScript utilities that run outside the MCP server bundle"
  - "Pattern: tsconfig.scripts.json extends base tsconfig for scripts/ compilation without changing rootDir"

requirements-completed: [SKLL-03]

# Metrics
duration: 5min
completed: 2026-03-28
---

# Phase 04 Plan 01: Token Budget Enforcement Summary

**Token budget enforcement infrastructure: char/4 counter measuring 37 tool registerTool blocks + SKILL.md bodies, with vitest test enforcing < 15,000 token SKLL-03 constraint**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-28T17:13:39Z
- **Completed:** 2026-03-28T17:17:55Z
- **Tasks:** 2
- **Files modified:** 3 created, 0 modified

## Accomplishments

- `scripts/count-tokens.ts` exports three functions: `countManifestTokens`, `extractRegisteredToolNames`, `validateSkillToolRefs` — the Wave 0 test scaffold for SKLL-03
- `tests/token-budget.test.ts` enforces < 15,000 token budget; current baseline is ~6,630 tokens (tools only, no skills yet)
- Tool name extraction confirmed to find all 37 registered tools dynamically (no hardcoding)

## Task Commits

Each task was committed atomically:

1. **Task 1: Token counting and tool name validation utility** - `839efc0` (feat)
2. **Task 2: Token budget vitest test** - `f4233f8` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `scripts/count-tokens.ts` - Three exported functions: token counting, tool name extraction, skill tool reference validation
- `tests/token-budget.test.ts` - Vitest test enforcing SKLL-03 budget and validating 37 tool names found
- `tsconfig.scripts.json` - TypeScript config for scripts/ dir (extends base, adds types: ['node'])

## Decisions Made

- Used bracket-depth parser in `extractRegisterToolBlocks()` instead of line-by-line regex — more robust for multiline config objects; avoids false truncation on tools with complex inputSchema
- Added `tsconfig.scripts.json` because the base tsconfig has `rootDir: "src"` and cannot include scripts/ without error; the scripts tsconfig overrides rootDir and adds `types: ['node']`
- `validateSkillToolRefs` filters by tool prefixes (`create_`, `get_`, etc.) to avoid flagging non-tool snake_case identifiers as invalid references

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added tsconfig.scripts.json for scripts/ TypeScript compilation**
- **Found during:** Task 1 (token counting utility verification)
- **Issue:** Base tsconfig has `rootDir: "src"` which excludes scripts/; `tsc --noEmit scripts/count-tokens.ts` failed with TS5112 (can't mix file args with tsconfig) and then @types/node not found without tsconfig
- **Fix:** Created `tsconfig.scripts.json` extending base tsconfig with `rootDir: "."`, `noEmit: true`, and `types: ["node"]` override
- **Files modified:** tsconfig.scripts.json (created)
- **Verification:** `npx tsc --project tsconfig.scripts.json` exits 0
- **Committed in:** 839efc0 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (blocking infrastructure issue)
**Impact on plan:** tsconfig.scripts.json is a necessary addition — plan's verification step assumed TypeScript compilation would work without it; the fix enables the acceptance criteria to be verified.

## Issues Encountered

- Node_modules not present in worktree — ran `npm install` before compilation (standard worktree setup, not a code issue)

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Token budget enforcement infrastructure is complete; all subsequent skill authoring plans (04-02, 04-03, 04-04) can run `npx vitest run tests/token-budget.test.ts` after adding skill content to verify they stay under budget
- Current baseline: ~6,630 tokens with 37 tools and 0 skills — budget has ~8,370 tokens of remaining capacity for skill bodies
- Tool name validation is ready to catch typos when skills reference tool names via backtick identifiers

---
*Phase: 04-skill-pack*
*Completed: 2026-03-28*

## Self-Check: PASSED

- FOUND: scripts/count-tokens.ts
- FOUND: tests/token-budget.test.ts
- FOUND: tsconfig.scripts.json
- FOUND commit: 839efc0 (Task 1)
- FOUND commit: f4233f8 (Task 2)
