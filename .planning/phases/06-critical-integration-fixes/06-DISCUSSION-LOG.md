# Phase 6: Critical Integration Fixes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 06-critical-integration-fixes
**Areas discussed:** Migration strategy, Dependency scope, Doc reconciliation depth, Testing approach

---

## Migration Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| New migration (Recommended) | Create 000009 that runs CREATE OR REPLACE with false. Standard Supabase practice. | ✓ |
| Edit existing migration | Change true→false directly in 000008. Simpler but breaks immutable-migration convention. | |
| Both — fix 000008 + add 000009 | Fix source of truth AND add corrective migration for environments that already ran original. | |

**User's choice:** New migration (Recommended)
**Notes:** None — straightforward choice following Supabase conventions.

---

## Dependency Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Move both to dependencies (Recommended) | express + zod become runtime deps. Fixes self-hosted/dev. npm package still ships skills only. | ✓ |
| Move both + add express to files[] | Same plus include compiled server in npm package. Changes distribution model. | |
| Keep in devDeps, document workaround | Leave as-is, document that self-hosted users need npm install --include=dev. | |

**User's choice:** Move both to dependencies (Recommended)
**Notes:** None — keeps distribution model unchanged while fixing the install path.

---

## Doc Reconciliation Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Critical docs only (Recommended) | Fix REQUIREMENTS.md checkboxes (10 items) and source code comments. Skip cosmetic items. | ✓ |
| Full audit cleanup | Fix all 8 tech debt items across REQUIREMENTS, ROADMAP, SUMMARY, VERIFICATION. | |
| Code fixes only, no docs | Only fix migration + package.json + source code. Leave all doc updates. | |

**User's choice:** Critical docs only (Recommended)
**Notes:** None — focuses on docs that affect correctness, defers cosmetic fixes.

---

## Testing Approach

| Option | Description | Selected |
|--------|-------------|----------|
| pgTAP test (Recommended) | Test set_app_user_id → query flow in supabase test db. No external dependencies. | ✓ |
| Vitest integration test | Exercise withUserContext → query flow against local Supabase. Requires Docker. | |
| Manual verification only | Document steps, no automated test. Fix is a one-character change. | |

**User's choice:** pgTAP test (Recommended)
**Notes:** None — leverages existing pgTAP infrastructure from Phase 1.

---

## Claude's Discretion

- Exact pgTAP test structure and assertions
- New migration filename/timestamp convention
- Comment wording in with-user-context.ts
- Whether to add a note to existing 000008 migration comment pointing to corrective 000009

## Deferred Ideas

- SUMMARY frontmatter gaps (14 plans) — cosmetic
- ROADMAP.md phase status inconsistencies — cosmetic
- VERIFICATION.md frontmatter/body inconsistency — cosmetic
- .mcp.json placeholder URL — requires server deployment
