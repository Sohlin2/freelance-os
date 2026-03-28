# Phase 4: Skill Pack - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

SKILL.md domain knowledge files are authored and activated so Claude gives expert-quality guidance on proposals, invoices, scope, and follow-ups — not just mechanical data operations. Covers PROP-02 (proposal coaching), FLLW-02 (follow-up timing/tone coaching), SKLL-01 (skill pack provides freelance domain knowledge), SKLL-02 (chat-invocable, auto-activated), SKLL-03 (total tool manifest under 15,000 tokens).

</domain>

<decisions>
## Implementation Decisions

### Skill Domains & Coverage
- **D-01:** One SKILL.md file per domain entity — proposals, invoices, scope, follow-ups, time-tracking. Five skill files total.
- **D-02:** Optional 6th general "freelance advisor" skill at Claude's discretion — only if token budget allows. Covers cross-cutting coaching (pricing strategy, client relationships).
- **D-03:** Skill files map cleanly to existing tool files in `src/tools/` — each skill enhances the corresponding entity's tooling with domain knowledge.

### Knowledge Depth & Tone
- **D-04:** Prescriptive coaching with specific defaults — "Include 2-3 revision rounds", "Net 30 payment terms", "Follow up 3 days after sending proposal". Feels like an expert mentor. User can always override.
- **D-05:** Include concrete templates/examples alongside coaching principles — e.g., proposal skill includes a sample proposal outline, invoice skill includes standard line item structures.
- **D-06:** Persona/tone at Claude's discretion — Claude picks the right voice per context (experienced peer vs. expert consultant).

### Invocation & Activation
- **D-07:** Auto-trigger activation — skills fire automatically when Claude detects relevant intent (e.g., "draft a proposal" triggers proposal skill, "send a follow-up" triggers follow-up skill). Satisfies SKLL-02.
- **D-08:** Tool-aware skills — each SKILL.md references the MCP tools by name and describes the recommended workflow order (e.g., "call get_followup_context first, then compose the email, then call create_followup").
- **D-09:** Supporting files (separate .md for templates/checklists) at Claude's discretion — use if a single SKILL.md would be too long, keep in single file if content fits.

### Token Budget
- **D-10:** Weighted allocation favoring highest coaching value — proposals and follow-ups get the largest share (per PROP-02, FLLW-02 requirements), scope management next, invoices and time-tracking get less (more mechanical, less coaching opportunity).
- **D-11:** Token counting enforcement script — a utility that measures total tokens across all tool descriptions + skill files, fails if over 15,000. Run during tests to catch bloat early. Satisfies SKLL-03 verification.

### Claude's Discretion
- Whether to include the 6th general advisor skill (depends on token budget after the 5 entity skills)
- Persona/tone per skill file
- Whether to use supporting files or keep all content in single SKILL.md per domain
- Exact frontmatter fields per SKILL.md (trigger keywords, description, etc.)
- Template/checklist detail level within token budget
- Exact token allocation per skill (within the weighted priority: proposals/follow-ups > scope > invoices > time-tracking)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project specs
- `.planning/PROJECT.md` — Core value ("manage entire client lifecycle without leaving Claude Code"), smart prompts as differentiator
- `.planning/REQUIREMENTS.md` — PROP-02 (proposal coaching), FLLW-02 (follow-up timing/tone), SKLL-01 (domain knowledge via SKILL.md), SKLL-02 (chat-invocable), SKLL-03 (15K token limit)
- `.planning/ROADMAP.md` §Phase 4 — Success criteria, dependency on Phase 3

### Technology & format specs
- `CLAUDE.md` §Technology Stack > Skill Pack Technologies — Agent Skills spec (agentskills.io), SKILL.md format with YAML frontmatter
- `CLAUDE.md` §Plugin Structure — Skills directory layout, plugin integration

### Prior phase foundations
- `.planning/phases/02-mcp-server-core/02-CONTEXT.md` — Tool patterns, server structure (D-09: modular layout in src/tools/)
- `.planning/phases/03-full-tool-suite/03-CONTEXT.md` — All entity tool decisions: proposal workflow (D-01 through D-05), invoice generation (D-06 through D-09), time entries (D-10-D-11), scope management (D-12 through D-15), follow-up drafting (D-16 through D-19)

### Existing tool implementations
- `src/tools/proposals.ts` — Proposal tool implementations (create, get, list, update, accept)
- `src/tools/invoices.ts` — Invoice tool implementations
- `src/tools/scope.ts` — Scope tool implementations (create, get, list, log_scope_change, check_scope)
- `src/tools/follow-ups.ts` — Follow-up tool implementations (create, get, list, mark_sent, get_context)
- `src/tools/time-entries.ts` — Time entry tool implementations (create, get, list, update, delete, aggregate)
- `src/server.ts` — Tool registration pattern and current manifest

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/tools/*.ts` — 7 tool files with complete tool descriptions and Zod schemas. Skills must reference these tool names exactly.
- `src/server.ts` — Current tool manifest structure. Token counting script will need to parse this to measure manifest size.
- Existing tool descriptions serve as the baseline for what Claude already knows about each entity.

### Established Patterns
- Tools are data stores, Claude is the brain (Phase 3 D-01, D-07, D-12) — skills amplify this pattern by teaching Claude WHEN and HOW to use tools effectively
- `withUserContext` wrapper on all DB operations — skills don't need to teach auth/context patterns, just domain workflows
- Modular registration: `registerXTools(server, userId)` per entity — skills layer on top, not inside tool code

### Integration Points
- Skills directory: `skills/<name>/SKILL.md` per Agent Skills spec
- Skills are loaded by Claude Code's plugin system, not by the MCP server itself
- Tool manifest token count includes both MCP tool descriptions AND skill file content loaded into context
- `src/server.ts` registers tools — skill files reference these tool names but don't modify server code

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. All decisions captured above emerged from the discussion.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-skill-pack*
*Context gathered: 2026-03-28*
