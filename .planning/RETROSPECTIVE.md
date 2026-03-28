# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-28
**Phases:** 7 | **Plans:** 20 | **Commits:** 130

### What Was Built
- Supabase data layer with 9 tables, RLS multi-tenant isolation, pgTAP tests
- Streamable HTTP MCP server with 37 CRUD tools across 7 freelance entities
- 5 SKILL.md coaching files (proposals, invoices, scope, follow-ups, time) under 15K token budget
- npm-installable Claude Code plugin with keychain-backed API key and secret scanning
- Cross-phase integration fixes (RLS session scope, runtime deps, accept_proposal rollback)

### What Worked
- **Strict dependency ordering** (data → server → tools → skills → packaging) prevented rework — each phase built cleanly on the last
- **Milestone audit workflow** caught 2 critical integration breaks (RLS scope, missing runtime deps) and 11 tech debt items before shipping
- **TDD pattern** across all tool phases produced reliable test suites (102 tests in Phase 3 alone)
- **Token budget enforcement** with automated counting prevented skill pack bloat (12,103/15,000)
- **Decimal phase insertion** (Phase 6, 7) cleanly handled post-audit fixes without disrupting the roadmap

### What Was Inefficient
- **All 7 phases completed in a single day** — no real-world user feedback loop between phases; validation is code-level only
- **SUMMARY frontmatter gaps** accumulated across phases and weren't caught until the milestone audit — earlier enforcement would have prevented Phase 7's doc cleanup work
- **pgTAP tests require Docker** which wasn't available during development — tests are written but not yet executed against a live database

### Patterns Established
- `withUserContext(userId, callback)` pattern for all RLS-safe database operations
- `registerXTools(server, userId)` pattern for consistent tool registration across entities
- Conditional coaching in skills ("just save it" clause to avoid over-coaching)
- `Promise.all` for parallel Supabase queries within a single user context
- Session-scoped `set_config(false)` for PostgREST RLS context (not transaction-scoped)

### Key Lessons
1. **Integration testing > unit testing for multi-layer systems.** Unit tests with mocked Supabase caught API shape errors but missed the RLS session scope bug — only the milestone audit's cross-phase analysis found it.
2. **Audit before archiving, always.** The milestone audit caught 2 critical breaks and 11 debt items that would have shipped silently. The cost of the audit was far less than post-ship debugging.
3. **Runtime vs dev dependencies matter.** Express and Zod being in devDependencies broke server startup — a trivial fix but invisible until someone actually runs `npm install --production`.
4. **Token budgets need automated enforcement from day one.** Phase 4's first plan built the counter before any skills were written — this prevented budget creep across the remaining skill plans.

### Cost Observations
- Model mix: predominantly opus for execution, sonnet for research/planning agents
- Sessions: multiple within a single day
- Notable: entire v1.0 built in one day — GSD workflow automated most overhead (planning, verification, audit)

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Commits | Phases | Key Change |
|-----------|---------|--------|------------|
| v1.0 | 130 | 7 | First milestone — established GSD workflow patterns |

### Cumulative Quality

| Milestone | Tests | Nyquist Phases | Audit Score |
|-----------|-------|----------------|-------------|
| v1.0 | 180+ | 6/6 compliant | 79/79 must-haves, 29/29 requirements |

### Top Lessons (Verified Across Milestones)

1. Milestone audit before archival catches integration breaks that per-phase verification misses
2. Automated budget/constraint enforcement (token counting, secret scanning) prevents drift across phases
