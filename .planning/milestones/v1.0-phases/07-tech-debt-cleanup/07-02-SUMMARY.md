---
phase: 07-tech-debt-cleanup
plan: "02"
subsystem: skills, proposals
tags: [tech-debt, skill-coaching, rollback, tdd]
dependency_graph:
  requires: []
  provides:
    - get_followup coaching in freelance-followups skill
    - archive_project coaching in freelance-proposals skill
    - accept_proposal rollback on scope upsert failure
  affects:
    - .claude/skills/freelance-followups/SKILL.md
    - .claude/skills/freelance-proposals/SKILL.md
    - src/tools/proposals.ts
    - tests/tools/proposals.test.ts
tech_stack:
  added: []
  patterns:
    - TDD red-green cycle for rollback behavior
    - Capture-then-restore pattern for transactional rollback
key_files:
  created: []
  modified:
    - .claude/skills/freelance-followups/SKILL.md
    - .claude/skills/freelance-proposals/SKILL.md
    - src/tools/proposals.ts
    - tests/tools/proposals.test.ts
decisions:
  - accept_proposal now returns isError: true on scope failure instead of silent partial-success; rollback restores original status and clears responded_at
  - archive_project coaching placed in new "Project lifecycle tools" section before "Coaching principles" in proposals skill for natural reading flow
metrics:
  duration: 199s
  completed: "2026-03-28"
  tasks: 2
  files: 4
---

# Phase 07 Plan 02: Orphaned Tool Coaching + accept_proposal Rollback Summary

**One-liner:** Added skill coaching for orphaned `get_followup` and `archive_project` tools, and hardened `accept_proposal` with status rollback + `isError: true` when scope seeding fails.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add skill coaching for get_followup and archive_project | 2b08047 | `.claude/skills/freelance-followups/SKILL.md`, `.claude/skills/freelance-proposals/SKILL.md` |
| 2 (RED) | Add failing rollback test | 5817747 | `tests/tools/proposals.test.ts` |
| 2 (GREEN) | Implement accept_proposal rollback | 4976d4d | `src/tools/proposals.ts` |

## What Was Built

### Task 1: Skill coaching for orphaned tools

**freelance-followups/SKILL.md** — Added `get_followup` to the "Also useful" section with coaching: "retrieve a specific follow-up by ID. Use when referencing a previously created follow-up to check its content, type, or sent status before drafting a new one."

**freelance-proposals/SKILL.md** — Added a new "Project lifecycle tools" section (before "Coaching principles") documenting `archive_project` with guidance on when to use it, that archiving is reversible (soft-delete via `archived_at`), and to always confirm with the freelancer before archiving.

### Task 2: accept_proposal rollback (TDD)

**Before:** When scope upsert failed after proposal status was set to 'accepted', the tool returned a partial-success response with no `isError` flag — making a broken state look like success.

**After:** Captures `originalStatus` before the status update. On scope failure, updates the proposal back to `originalStatus` with `responded_at: null`, then returns `isError: true` with a message explaining the rollback. All 15 proposal tests pass including the new rollback test.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All coaching is fully wired to real tool names. Rollback logic is fully implemented with no placeholder code.

## Self-Check: PASSED

Files exist:
- FOUND: .claude/skills/freelance-followups/SKILL.md
- FOUND: .claude/skills/freelance-proposals/SKILL.md
- FOUND: src/tools/proposals.ts
- FOUND: tests/tools/proposals.test.ts

Commits exist:
- FOUND: 2b08047
- FOUND: 5817747
- FOUND: 4976d4d

Test results: 15/15 passed
