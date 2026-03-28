# Phase 4: Skill Pack - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 04-skill-pack
**Areas discussed:** Skill domains & coverage, Knowledge depth & tone, Invocation & activation, Token budget allocation

---

## Skill Domains & Coverage

### How should skill files map to freelance domains?

| Option | Description | Selected |
|--------|-------------|----------|
| Per entity | One SKILL.md per domain: proposals, invoices, scope, follow-ups, time-tracking. Maps cleanly to existing tool files. | ✓ |
| Per workflow | Grouped by freelance workflow: proposal-to-close, invoicing-cycle, scope-management. | |
| Hybrid | Core entities get own skills + one cross-cutting 'freelance-advisor' skill. | |

**User's choice:** Per entity (Recommended)

### Which entities need their own skill file?

| Option | Description | Selected |
|--------|-------------|----------|
| All five domains | proposals, invoices, scope, follow-ups, time-tracking — complete coverage | ✓ |
| Requirements only + invoices | proposals, follow-ups, invoices, scope — skip time-tracking | |
| Requirements only | proposals, follow-ups — just PROP-02 and FLLW-02 | |

**User's choice:** All five domains

### General 'freelance advisor' skill?

| Option | Description | Selected |
|--------|-------------|----------|
| No general advisor | Keep it to entity-specific skills | |
| Add general advisor | A 6th skill file for cross-cutting freelance wisdom | |
| You decide | Claude picks based on token budget constraints | ✓ |

**User's choice:** You decide

---

## Knowledge Depth & Tone

### How opinionated should the skills be?

| Option | Description | Selected |
|--------|-------------|----------|
| Prescriptive | Specific best practices as defaults. Feels like an expert mentor. User can override. | ✓ |
| Suggestive | Gentle nudges: "Consider including revision limits". Less opinionated. | |
| Framework-based | Teach decision frameworks. Most educational but longest. | |

**User's choice:** Prescriptive (Recommended)

### What persona should Claude adopt?

| Option | Description | Selected |
|--------|-------------|----------|
| Experienced peer | Collaborative, confident, first-person | |
| Expert consultant | Authoritative, third-person | |
| You decide | Claude picks the right tone per context | ✓ |

**User's choice:** You decide

### Templates or coaching only?

| Option | Description | Selected |
|--------|-------------|----------|
| Coaching + templates | Include sample structures/outlines. More token cost but immediately actionable. | ✓ |
| Coaching only | Principles and checklists, no templates. | |
| You decide | Claude decides per domain based on token budget | |

**User's choice:** Coaching + templates

---

## Invocation & Activation

### How should skills activate?

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-trigger | Skills fire automatically when Claude detects relevant intent. Matches SKLL-02. | ✓ |
| Explicit invocation | User must reference the skill explicitly or use a slash command. | |
| Hybrid | Auto-trigger for drafting, explicit for informational queries. | |

**User's choice:** Auto-trigger (Recommended)

### Tool-awareness in skills?

| Option | Description | Selected |
|--------|-------------|----------|
| Tool-aware | Skills reference MCP tools by name and describe workflow order. | ✓ |
| Tool-agnostic | Skills only contain domain knowledge. Claude discovers tools from manifest. | |
| You decide | Claude decides based on what works best per domain | |

**User's choice:** Tool-aware (Recommended)

### Supporting files or single SKILL.md?

| Option | Description | Selected |
|--------|-------------|----------|
| Single SKILL.md each | All knowledge in one file per domain. Simpler. | |
| SKILL.md + supporting files | Core coaching in SKILL.md; separate template/checklist files. | |
| You decide | Claude decides based on content length per domain | ✓ |

**User's choice:** You decide

---

## Token Budget Allocation

### How to prioritize the 15K token budget?

| Option | Description | Selected |
|--------|-------------|----------|
| Weighted by coaching value | Proposals/follow-ups biggest share, scope next, invoices/time-tracking less. | ✓ |
| Equal split | ~2K-2.5K each. Simpler to manage. | |
| You decide | Claude allocates based on content needs per domain | |

**User's choice:** Weighted by coaching value

### Enforce 15K token limit?

| Option | Description | Selected |
|--------|-------------|----------|
| Enforce with script | Token counting utility, run during tests/CI. | ✓ |
| Manual inspection | Verify by eye during review. | |
| You decide | Claude decides the right enforcement approach | |

**User's choice:** Enforce with script

---

## Claude's Discretion

- Whether to include the 6th general advisor skill (token budget dependent)
- Persona/tone per skill file
- Whether to use supporting files or single SKILL.md per domain
- Exact frontmatter fields per SKILL.md
- Template detail level within token budget
- Exact token allocation per skill

## Deferred Ideas

None — discussion stayed within phase scope.
