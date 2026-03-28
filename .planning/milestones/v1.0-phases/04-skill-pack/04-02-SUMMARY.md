---
phase: 04-skill-pack
plan: 02
subsystem: skills
tags: [skill-pack, agent-skills, SKILL.md, proposals, follow-ups, scope-management, coaching]

requires:
  - phase: 04-01
    provides: token counting utility, token budget test (SKLL-03 enforcement)
  - phase: 03-full-tool-suite
    provides: all MCP tool implementations that skills reference by exact name

provides:
  - .claude/skills/freelance-proposals/SKILL.md — proposal coaching (pricing, scope clarity, revision limits, payment terms)
  - .claude/skills/freelance-followups/SKILL.md — follow-up timing/tone coaching with 7-context matrix
  - .claude/skills/freelance-scope/SKILL.md — scope definition, change request handling, creep detection

affects:
  - 04-03 (remaining skills: invoices, time-tracking — must stay under token budget after this plan's additions)

tech-stack:
  added: []
  patterns:
    - "SKILL.md files use descriptive frontmatter with trigger phrases for auto-invocation (SKLL-02)"
    - "Tool workflow sections reference exact MCP tool names from src/tools/ for tool-aware behavior (D-08)"
    - "Conditional coaching sections avoid over-coaching when user just wants to save data (Pitfall 4 avoidance)"
    - "Timing/tone matrices use markdown tables for scannable decision support"

key-files:
  created:
    - .claude/skills/freelance-proposals/SKILL.md
    - .claude/skills/freelance-followups/SKILL.md
    - .claude/skills/freelance-scope/SKILL.md
  modified: []

key-decisions:
  - "Conditional coaching pattern: each skill has 'if user just wants to save, persist immediately' clause to avoid over-coaching"
  - "Proposals skill includes accept_proposal in workflow since it seeds scope — cross-entity workflow documented in both proposal and scope skills"
  - "Follow-up skill documents invoice_reminder as a valid timing context (pre-due-date) even though the type enum uses invoice_overdue for both pre and post"

patterns-established:
  - "SKILL.md structure: When this skill applies -> Tool workflow -> Coaching principles -> Tables -> Conditional coaching"
  - "Tool workflow steps use backtick tool names for scanability"
  - "Token budget: 10,006 tokens with 3 skills loaded (~4,994 tokens remaining for plans 03 remaining skills)"

requirements-completed:
  - PROP-02
  - FLLW-02
  - SKLL-01
  - SKLL-02

duration: 5min
completed: 2026-03-28
---

# Phase 04 Plan 02: Skill Pack — Proposals, Follow-ups, Scope Summary

**Three SKILL.md coaching files for proposal pricing (50% upfront defaults), follow-up timing/tone matrix (7 contexts), and scope creep detection with 3-strike rule — 10,006 tokens total (4,994 remaining for Phase 04-03)**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-28T17:22:41Z
- **Completed:** 2026-03-28T17:27:52Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `freelance-proposals` skill: prescriptive pricing (20% buffer rule, $50/hr floor, payment terms table by project size), revision rounds coaching (2-3 rounds default with explicit per-hour overage rate), proposal structure outline table, conditional coaching to avoid over-explaining when user just wants to save content
- `freelance-followups` skill: 7-context timing/tone matrix with exact type field values matching the FOLLOW_UP_TYPE_ENUM in src/tools/follow-ups.ts, 3 follow-up limit rule, get_followup_context-first workflow requirement, follow-up count guidance for escalating firmness
- `freelance-scope` skill: dual workflow (define scope vs handle change request), accept_proposal scope seeding cross-reference, 3-strike rule for scope creep detection, scope vs revision distinction, change request response template

## Task Commits

1. **Task 1: Author proposal and follow-up SKILL.md files** - `353b550` (feat)
2. **Task 2: Author scope management SKILL.md** - `8ac3b88` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified

- `.claude/skills/freelance-proposals/SKILL.md` — Proposal coaching: pricing, scope clarity, revision limits, payment terms, proposal structure outline, tool workflow with create_proposal/list_proposals/accept_proposal
- `.claude/skills/freelance-followups/SKILL.md` — Follow-up coaching: timing/tone matrix for 7 contexts, 3 follow-up limit, get_followup_context-first workflow, mark_followup_sent confirmation step
- `.claude/skills/freelance-scope/SKILL.md` — Scope management: scope definition workflow, change request handling via check_scope, 3-strike creep rule, scope vs revision distinction, list_scope_changes history review

## Decisions Made

- **Conditional coaching pattern:** Each skill includes explicit "if user says just save it — persist immediately" clause. This prevents Claude from over-coaching freelancers who already know what they want and just need data stored.
- **Proposals skill includes accept_proposal in workflow:** accept_proposal is a transactional tool that also seeds scope — documenting this in proposals skill ensures freelancers don't miss the scope seeding step.
- **Follow-up skill uses invoice_overdue type for both pre-due and overdue contexts:** The schema's type enum uses invoice_overdue; the skill's matrix shows distinct timing (1 day before vs 3 days after) while using the same type value, with explicit tone guidance to differentiate the two cases.

## Deviations from Plan

None — plan executed exactly as written. All three SKILL.md files authored per the plan's detailed specifications. Token budget test passes (10,006 tokens, under 15,000 limit). All 104 tests pass.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Proposals, follow-ups, and scope skills complete
- Token budget: 10,006/15,000 tokens used (~67%), leaving ~4,994 tokens for Phase 04-03 (invoices + time-tracking skills)
- All 104 tests pass, token budget test confirms no invalid tool references

---
*Phase: 04-skill-pack*
*Completed: 2026-03-28*
