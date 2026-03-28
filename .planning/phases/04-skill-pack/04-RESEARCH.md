# Phase 4: Skill Pack - Research

**Researched:** 2026-03-28
**Domain:** Agent Skills SKILL.md format, Claude Code skill auto-invocation, token budget management
**Confidence:** HIGH

## Summary

Phase 4 is an authoring phase, not a coding phase. The deliverable is five SKILL.md files (plus optional sixth) plus a token-counting enforcement script. No MCP server code changes are needed — skills live in `.claude/skills/<name>/SKILL.md` and are loaded by Claude Code's plugin system, not the MCP server.

The Agent Skills spec (agentskills.io) is stable and well-documented. Claude Code extends it with Claude-specific frontmatter fields (`disable-model-invocation`, `user-invocable`, `context`, `allowed-tools`, etc.). The key design question for this phase is the description field: it drives auto-activation. A skill description must contain the natural-language triggers a freelancer would use so Claude loads the skill without being asked.

The token budget constraint (SKLL-03, 15,000 tokens) is achievable. The current 37-tool MCP manifest consumes roughly 6,000-7,000 tokens, leaving ~8,000-9,000 tokens for all five skill bodies. The enforcement script is a straightforward Node.js utility: read tool description strings from tool files, read SKILL.md bodies, estimate tokens, fail if over limit.

**Primary recommendation:** Author five SKILL.md files in `.claude/skills/`, each under 500 lines, with description fields tuned for auto-activation. Use a `scripts/count-tokens.ts` utility that runs in `npm test` to enforce the budget.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Skill Domains & Coverage**
- D-01: One SKILL.md file per domain entity — proposals, invoices, scope, follow-ups, time-tracking. Five skill files total.
- D-02: Optional 6th general "freelance advisor" skill at Claude's discretion — only if token budget allows. Covers cross-cutting coaching (pricing strategy, client relationships).
- D-03: Skill files map cleanly to existing tool files in `src/tools/` — each skill enhances the corresponding entity's tooling with domain knowledge.

**Knowledge Depth & Tone**
- D-04: Prescriptive coaching with specific defaults — "Include 2-3 revision rounds", "Net 30 payment terms", "Follow up 3 days after sending proposal". Feels like an expert mentor. User can always override.
- D-05: Include concrete templates/examples alongside coaching principles — e.g., proposal skill includes a sample proposal outline, invoice skill includes standard line item structures.
- D-06: Persona/tone at Claude's discretion — Claude picks the right voice per context (experienced peer vs. expert consultant).

**Invocation & Activation**
- D-07: Auto-trigger activation — skills fire automatically when Claude detects relevant intent (e.g., "draft a proposal" triggers proposal skill, "send a follow-up" triggers follow-up skill). Satisfies SKLL-02.
- D-08: Tool-aware skills — each SKILL.md references the MCP tools by name and describes the recommended workflow order (e.g., "call get_followup_context first, then compose the email, then call create_followup").
- D-09: Supporting files (separate .md for templates/checklists) at Claude's discretion — use if a single SKILL.md would be too long, keep in single file if content fits.

**Token Budget**
- D-10: Weighted allocation favoring highest coaching value — proposals and follow-ups get the largest share (per PROP-02, FLLW-02 requirements), scope management next, invoices and time-tracking get less (more mechanical, less coaching opportunity).
- D-11: Token counting enforcement script — a utility that measures total tokens across all tool descriptions + skill files, fails if over 15,000. Run during tests to catch bloat early. Satisfies SKLL-03 verification.

### Claude's Discretion
- Whether to include the 6th general advisor skill (depends on token budget after the 5 entity skills)
- Persona/tone per skill file
- Whether to use supporting files or keep all content in single SKILL.md per domain
- Exact frontmatter fields per SKILL.md (trigger keywords, description, etc.)
- Template/checklist detail level within token budget
- Exact token allocation per skill (within the weighted priority: proposals/follow-ups > scope > invoices > time-tracking)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROP-02 | Smart prompts coach on proposal quality (pricing, scope clarity, revision limits, payment terms) | Proposal skill body contains prescriptive coaching rules; description field triggers auto-activation when user says "draft a proposal" or similar |
| FLLW-02 | Smart prompts advise on follow-up timing and tone based on context (late invoice vs check-in vs awaiting response) | Follow-up skill body contains timing/tone matrix per follow-up type; skill references get_followup_context to read live data before coaching |
| SKLL-01 | Skill pack provides freelance domain knowledge via SKILL.md files for proposals, invoices, scope, and follow-ups | Five SKILL.md files in `.claude/skills/` covering all four entities plus time-tracking |
| SKLL-02 | Skills are chat-invocable — user describes what they need, Claude applies domain knowledge automatically | Satisfied by description field auto-activation: Claude loads skill when description keywords match user intent |
| SKLL-03 | Total tool manifest stays under 15,000 tokens to preserve reasoning quality | Token-counting enforcement script in `scripts/count-tokens.ts`, run as vitest test |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Agent Skills spec | Current (agentskills.io) | SKILL.md format — frontmatter + markdown body | Open standard adopted by Claude Code, Cursor, and others; official spec site |
| Claude Code skills extension | Current (code.claude.com/docs/en/skills) | Additional frontmatter fields for invocation control | Official Anthropic extension of the Agent Skills spec |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 4.1.2 (already installed) | Token-counting enforcement test | Already in project; test file follows `tests/**/*.test.ts` pattern |
| Node.js built-ins (`fs`, `path`) | Node 20 LTS | Read skill files and tool descriptions in token-counting script | No new dependencies needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Approximate char/4 token counting | tiktoken / `@anthropic-ai/tokenizer` | tiktoken is far more accurate but adds a dependency; char/4 is a reliable conservative overestimate for prose — acceptable for a budget guard |

**Installation:** No new packages required. Everything needed is already in the project.

---

## Architecture Patterns

### Recommended Project Structure
```
.claude/
└── skills/
    ├── freelance-proposals/
    │   └── SKILL.md
    ├── freelance-invoices/
    │   └── SKILL.md
    ├── freelance-scope/
    │   └── SKILL.md
    ├── freelance-followups/
    │   └── SKILL.md
    └── freelance-time/
        └── SKILL.md
scripts/
└── count-tokens.ts        (token enforcement utility)
tests/
└── token-budget.test.ts   (vitest test that runs count-tokens)
```

**Why `.claude/skills/` not `skills/`:**
CLAUDE.md specifies `skills/<name>/SKILL.md` for plugin packaging (shipped with plugin). For this phase, skills live at `.claude/skills/` (project-scoped) because the plugin.json packaging is Phase 5's job. The two paths are not the same: `.claude/skills/` is loaded by Claude Code for the current project; `skills/` in the plugin root is what gets distributed. Phase 4 authors the content; Phase 5 packages it.

**Naming convention:** Use `freelance-` prefix to avoid collisions with any user-level skills. The `name` field in SKILL.md must match the directory name (Agent Skills spec requirement).

### Pattern 1: Auto-Invocable Domain Skill
**What:** A SKILL.md with a rich description field and no `disable-model-invocation` — Claude loads it automatically when conversation intent matches.
**When to use:** All five domain skills (proposals, invoices, scope, follow-ups, time). Users should never have to type skill names.

```yaml
# Source: code.claude.com/docs/en/skills - frontmatter reference
---
name: freelance-proposals
description: >
  Expert coaching for freelance project proposals. Use when drafting,
  reviewing, or pricing a proposal. Triggers on: "draft a proposal",
  "write a proposal", "how should I price this", "proposal for [client]",
  "what should I include in my proposal".
---

## When to invoke the tools
1. Call `list_clients` or `get_client` to confirm client context
2. Call `list_proposals` to check prior proposals for this client
3. Draft the proposal with coaching applied (see below)
4. Call `create_proposal` to persist the draft
5. Remind the user to call `update_proposal` with status: 'sent' after sending

## Proposal coaching principles
...
```

**Key insight on description field:** Claude Code loads skill descriptions at startup into a character budget (2% of context window, ~16,000 chars fallback). The description drives whether Claude auto-invokes the skill. Include both what the skill does AND the natural-language phrases users will say (per official docs: "Should include specific keywords that help agents identify relevant tasks"). Descriptions must be ≤ 1024 characters.

### Pattern 2: Token Budget Guard as Vitest Test
**What:** A vitest test that imports a token-counting utility, runs it, and `expect`s the result to be under 15,000.
**When to use:** SKLL-03 enforcement — runs on every `npm test`.

```typescript
// Source: project pattern — tests/**/*.test.ts
// tests/token-budget.test.ts
import { describe, it, expect } from 'vitest';
import { countManifestTokens } from '../scripts/count-tokens.js';

describe('Token budget (SKLL-03)', () => {
  it('total tool manifest + skill files must be under 15,000 tokens', async () => {
    const tokens = await countManifestTokens();
    console.log(`Current manifest size: ${tokens} tokens`);
    expect(tokens).toBeLessThan(15_000);
  });
});
```

```typescript
// scripts/count-tokens.ts
// Counts: all tool description strings in src/tools/*.ts
//       + all SKILL.md body content in .claude/skills/*/SKILL.md
// Token estimate: characters / 4 (conservative overestimate for prose)
export async function countManifestTokens(): Promise<number> { ... }
```

**Why char/4 is sufficient:** The 15,000 token limit is a soft quality-preservation threshold, not an exact Claude context boundary. A conservative overestimate means the script is stricter than needed, which is the safe direction.

### Pattern 3: Tool-Aware Workflow Instructions
**What:** Each skill body explicitly names the MCP tools and specifies the recommended call order.
**When to use:** All five skills (D-08 requirement). Transforms skills from passive knowledge into active orchestration guides.

```markdown
## Tool workflow for proposals
- **Before drafting:** `list_proposals` — check if prior proposals exist for this client
- **After coaching:** `create_proposal` — persist draft with status: 'draft'
- **After client accepts:** `accept_proposal` — this also seeds the scope definition
```

This is the differentiating pattern: the skill file tells Claude *how* to chain tools, not just *that* tools exist.

### Pattern 4: Follow-up Timing Matrix (FLLW-02)
**What:** Explicit decision table in the follow-ups skill mapping follow-up type to recommended timing and tone.
**When to use:** Satisfies FLLW-02 — Claude must advise on timing/tone without being asked.

```markdown
## Timing and tone by context

| Context | Tool type field | Wait time | Tone |
|---------|----------------|-----------|------|
| Awaiting proposal response | proposal_follow_up | 3 business days | Warm, brief — "Just checking in" |
| Invoice approaching due | invoice_overdue | Send day before due | Professional reminder |
| Invoice overdue | invoice_overdue | 3 days past due, then 7 days | Firm but not confrontational |
| General check-in | check_in | 4-6 weeks quiet | Relationship-first, no asks |
| Awaiting client response | awaiting_response | 48 hours | Light touch — "Did you get a chance to..." |
```

### Anti-Patterns to Avoid
- **Generic description fields:** "Helps with proposals" will not trigger auto-invocation reliably. Descriptions must include the phrases users actually say.
- **Tool references by wrong name:** If a skill says "call `save_proposal`" but the tool is `create_proposal`, Claude will fail. Every tool name in skills must match `src/tools/*.ts` exactly.
- **Single monolithic instruction block:** Keep skill bodies scannable. Claude reads skill content as context; structured sections (headers, tables, numbered lists) are easier to apply than paragraphs.
- **Skill content inside MCP tool descriptions:** Tool descriptions are for Claude to know when/how to call the tool. Domain coaching belongs in skills, not tool descriptions. Mixing them bloats the manifest AND confuses the two layers.
- **`disable-model-invocation: true` on domain skills:** This would break SKLL-02 (auto-invocation). Only use this for procedural skills with side effects (deploy, send). Domain knowledge skills should auto-invoke.
- **`user-invocable: false` unless intentional:** Hiding a skill from the `/` menu may surprise users. Leave default (`true`) so users can also invoke skills directly.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Skill auto-invocation | Custom Claude Code hooks or CLAUDE.md instruction to "always use skill X" | SKILL.md description field | Description field is the native mechanism; hooks are for tool events, not context injection |
| Token counting | Custom LLM call to count tokens | `chars / 4` approximation | No new dependency, conservative, sufficient for budget guard |
| Template storage | Storing templates in the MCP database | Supporting files in `.claude/skills/<name>/templates.md` | Skills can have supporting files loaded on demand; no DB needed |
| Skill invocation registry | A mapping of "user phrase → skill name" | SKILL.md description keywords | Claude handles this natively; duplicating it creates drift |

**Key insight:** The Agent Skills system handles everything about loading and invocation. The only work is authoring good content and keeping descriptions precise.

---

## Common Pitfalls

### Pitfall 1: Description Field Token Budget Overflow
**What goes wrong:** All skill descriptions are loaded into context at startup, within a 16,000-character budget. If descriptions are too long, Claude Code drops skills silently.
**Why it happens:** The startup budget covers all skills across all levels (enterprise > personal > project). A verbose description can crowd out other skills.
**How to avoid:** Keep each description under 200 characters of key phrases. Detailed coaching goes in the skill body, not the description.
**Warning signs:** Run `/context` in Claude Code — it warns if skills exceeded the character budget and were excluded.

### Pitfall 2: Tool Name Drift
**What goes wrong:** A skill references `create_follow_up` but the actual tool is `create_followup` (no underscore before "up"). Claude calls the wrong tool or hallucinates a corrected name.
**Why it happens:** Skill files are authored text; they can silently diverge from tool registration names in `src/tools/*.ts`.
**How to avoid:** The token-counting script can also validate tool name references: extract all tool names from `registerTool(` calls in `src/tools/*.ts`, then scan skill body text for any `\`tool_name\`` references and assert they all appear in the known tool list. Add this as a second check in `token-budget.test.ts`.
**Warning signs:** Claude says "I tried to call X but encountered an error" during a follow-up workflow.

### Pitfall 3: Skill Content Bloat from Examples
**What goes wrong:** The proposal skill includes a full sample proposal (600+ words), consuming 800+ tokens of the budget on a single example, leaving too little for other skills.
**Why it happens:** D-05 requires concrete templates/examples. A full proposal template is large.
**How to avoid:** Use *structural outlines* not full drafts. A proposal outline (10-line bulleted structure) costs ~100 tokens and conveys the same pattern. Reserve full examples for supporting files (loaded on demand, not at skill invocation).
**Warning signs:** Token count script shows a single skill consuming >2,500 tokens.

### Pitfall 4: Coaching Tone Creating Friction
**What goes wrong:** Every tool call triggers a lengthy coaching lecture. User asks "save this proposal" and gets a five-paragraph coaching session before the save.
**Why it happens:** Skills don't distinguish between "user is drafting from scratch" and "user already has content and just wants to persist it".
**How to avoid:** Structure skill body with conditional logic: "If the user is starting fresh, apply all coaching. If the user has already written content and wants to store it, offer a quick review offer instead." Phrase coaching as offers: "Want me to check the pricing structure before saving?"
**Warning signs:** Users frequently say "just save it" or bypass the coaching.

### Pitfall 5: .claude/skills/ vs. skills/ Confusion
**What goes wrong:** Skills are authored in `skills/` (plugin root path) instead of `.claude/skills/` (project-level path). They don't load in the current dev session.
**Why it happens:** CLAUDE.md mentions `skills/<name>/SKILL.md` as the plugin layout. But that's the *distribution* path for Phase 5's plugin packaging. For Phase 4, skills must be in `.claude/skills/` to load in the current project.
**How to avoid:** Phase 4 creates `.claude/skills/`. Phase 5 copies/symlinks or copies to plugin `skills/` root when packaging.
**Warning signs:** Skills are present in the directory but `/skill-name` returns "not found" in Claude Code.

---

## Code Examples

### SKILL.md Minimal Viable Structure
```yaml
# Source: agentskills.io/specification + code.claude.com/docs/en/skills
---
name: freelance-proposals
description: >
  Expert coaching for freelance project proposals. Use when drafting,
  pricing, or reviewing proposals. Triggers on: write a proposal, draft
  a proposal, how should I price, proposal for client, what to include.
---

## When this skill applies
...

## Tool workflow
1. `list_proposals` — check prior proposals for this client
2. Draft content (coaching below applies here)
3. `create_proposal` — persist with status: 'draft'

## Coaching principles
...

## Quick reference
| Element | Recommendation |
|---------|---------------|
| Revision rounds | 2-3 rounds included, additional at hourly rate |
| Payment terms | 50% upfront, 50% on delivery (projects >$2K) |
| Validity | Proposals expire in 30 days |
```

### Token Counting Utility Pattern
```typescript
// scripts/count-tokens.ts
// Source: project pattern — Node.js built-ins only, no new deps
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

function estimateTokens(text: string): number {
  // char/4 is standard conservative estimate for prose
  return Math.ceil(text.length / 4);
}

export async function countManifestTokens(): Promise<number> {
  const projectRoot = new URL('..', import.meta.url).pathname;

  // 1. Tool descriptions from src/tools/*.ts
  const toolsDir = join(projectRoot, 'src/tools');
  let toolDescriptionChars = 0;
  for (const file of readdirSync(toolsDir)) {
    if (!file.endsWith('.ts')) continue;
    const content = readFileSync(join(toolsDir, file), 'utf8');
    // Extract description: '...' strings (tool description field values)
    const matches = content.matchAll(/description:\s*'([^']+)'/g);
    for (const [, desc] of matches) {
      toolDescriptionChars += desc.length;
    }
    // Also include tool names and parameter names as they appear in the manifest
    const toolNames = content.matchAll(/registerTool\(\s*'([^']+)'/g);
    for (const [, name] of toolNames) {
      toolDescriptionChars += name.length;
    }
  }

  // 2. SKILL.md body content from .claude/skills/*/SKILL.md
  const skillsDir = join(projectRoot, '.claude/skills');
  let skillBodyChars = 0;
  try {
    for (const skillDir of readdirSync(skillsDir)) {
      const skillFile = join(skillsDir, skillDir, 'SKILL.md');
      const content = readFileSync(skillFile, 'utf8');
      // Strip YAML frontmatter (between first --- and second ---)
      const bodyMatch = content.match(/^---[\s\S]*?---\n([\s\S]*)$/);
      const body = bodyMatch ? bodyMatch[1] : content;
      skillBodyChars += body.length;
    }
  } catch {
    // Skills dir may not exist yet during early test runs
  }

  return estimateTokens(toolDescriptionChars + '') + estimateTokens(skillBodyChars + '');
}
```

### Tool Name Validation Pattern
```typescript
// scripts/count-tokens.ts — additional validation
export function extractRegisteredToolNames(toolsDir: string): Set<string> {
  const names = new Set<string>();
  for (const file of readdirSync(toolsDir)) {
    if (!file.endsWith('.ts')) continue;
    const content = readFileSync(join(toolsDir, file), 'utf8');
    const matches = content.matchAll(/registerTool\(\s*'([^']+)'/g);
    for (const [, name] of matches) names.add(name);
  }
  return names;
}

export function extractSkillToolRefs(skillsDir: string): string[] {
  const refs: string[] = [];
  // Find backtick-quoted identifiers that look like tool names (snake_case)
  const toolRefPattern = /`([a-z][a-z0-9_]+)`/g;
  // ... scan skill bodies ...
  return refs;
}
```

---

## Token Budget Analysis

**Current baseline (37 tools, 2026-03-28):**
- Tool description strings: ~3,456 chars / 4 = ~864 tokens
- Tool names + parameter names + schema overhead: ~6,000-7,000 tokens total (estimated from full MCP manifest structure)
- **Conservative tool manifest estimate: 7,000 tokens**

**Remaining budget for skills: 15,000 - 7,000 = 8,000 tokens**

**Recommended allocation (D-10 weighted priority):**

| Skill | Tokens | Chars (approx) |
|-------|--------|---------------|
| freelance-proposals | 2,200 | ~8,800 chars |
| freelance-followups | 2,200 | ~8,800 chars |
| freelance-scope | 1,500 | ~6,000 chars |
| freelance-invoices | 1,000 | ~4,000 chars |
| freelance-time | 700 | ~2,800 chars |
| **Subtotal (5 skills)** | **7,600** | — |
| Buffer | 400 | — |
| **Total** | **14,600** | — |

At 7,600 tokens for skill bodies, there is no room for a 6th general advisor skill without exceeding budget. Decision: author the 5 entity skills first, measure actual token count, then add the advisor skill if the real count is substantially below 15,000.

**Note:** These are estimates. The enforcement script will measure the real count. Skill bodies should be written first, then measured, then trimmed if needed.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `.claude/commands/*.md` | `.claude/skills/<name>/SKILL.md` | December 2025 (Agent Skills spec) | Commands still work but skills add supporting files, frontmatter invocation control, and subagent execution |
| Manual `/skill-name` invocation | Auto-invocation via description keywords | December 2025 | Users don't need to know skill names; Claude loads them when relevant |
| CLAUDE.md instructions for domain knowledge | SKILL.md skill files | December 2025 | CLAUDE.md is project-wide context; skills are distributable units with precise invocation control |

**Deprecated/outdated:**
- `.claude/commands/` files: Still supported but superseded by skills. Migrate on next edit. (CLAUDE.md: "Skills are recommended since they support additional features")
- SSE transport: Irrelevant to this phase but documented in STATE.md.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 4 is purely file authoring (SKILL.md content) plus a Node.js script using built-in modules. No external tools, services, or CLIs beyond the existing project toolchain are required.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.2 |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SKLL-03 | Total manifest + skills under 15,000 tokens | unit (script validation) | `npm test -- --reporter=verbose tests/token-budget.test.ts` | Wave 0 |
| PROP-02 | Proposal skill covers pricing, scope clarity, revision limits, payment terms | manual | Review skill body content | N/A — content authoring |
| FLLW-02 | Follow-up skill covers timing/tone matrix for all 4 follow-up types | manual | Review skill body content | N/A — content authoring |
| SKLL-01 | Five SKILL.md files exist for proposals, invoices, scope, follow-ups, time | smoke | `npm test -- tests/token-budget.test.ts` (existence is a precondition of counting) | Wave 0 |
| SKLL-02 | Skills auto-invoke when user describes need | manual | Start Claude Code session, say "draft a proposal", observe skill activation | N/A — Claude behavior |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/token-budget.test.ts` — covers SKLL-03 token enforcement
- [ ] `scripts/count-tokens.ts` — utility consumed by the test above

*(Existing test infrastructure in `tests/tools/*.test.ts` covers tool behavior; no changes needed there for Phase 4.)*

---

## Open Questions

1. **How does Claude Code count tokens against the 15,000 budget?**
   - What we know: The limit is stated in REQUIREMENTS.md as a product requirement. Claude Code uses a character budget for skill descriptions (~16,000 chars). The 15,000 token limit refers to the total manifest Claude must reason about.
   - What's unclear: Whether the 15,000 limit refers to input tokens sent to Claude per MCP call, or the total skill+tool context loaded at startup.
   - Recommendation: Use `chars/4` as the conservative metric. If the enforcement script passes, we're within budget by a reasonable margin.

2. **SKILL.md description field length vs. auto-invocation quality**
   - What we know: Description must be ≤ 1,024 characters. Skill descriptions are loaded at startup within the 16,000-char budget across all skills.
   - What's unclear: Whether Claude uses the description for semantic matching or keyword matching.
   - Recommendation: Include both the semantic intent ("Expert coaching for freelance proposals") and explicit trigger phrases ("Use when: draft a proposal, pricing this project, proposal for client"). This covers both matching strategies.

3. **Phase 4 vs. Phase 5 skill directory**
   - What we know: `.claude/skills/` = project-loaded; plugin `skills/` = distributed.
   - What's unclear: Whether Phase 5 should copy content from `.claude/skills/` to `skills/` or maintain one source of truth.
   - Recommendation: Phase 4 authors in `.claude/skills/`. Phase 5 decides the packaging strategy. Note this explicitly in the planner so it doesn't create a hard-to-unwind directory layout.

---

## Sources

### Primary (HIGH confidence)
- [agentskills.io/specification](https://agentskills.io/specification) — Fetched 2026-03-28. Spec for SKILL.md format: frontmatter fields (name, description, license, compatibility, metadata, allowed-tools), directory structure, progressive disclosure model, file size guidance (< 500 lines), supporting file patterns.
- [code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills) — Fetched 2026-03-28. Full Claude Code skills documentation: extended frontmatter fields (disable-model-invocation, user-invocable, context, agent, hooks, paths, effort, model), auto-invocation mechanics, character budget (2% of context window, 16K fallback), directory hierarchy (enterprise > personal > project > plugin), commands-to-skills migration, supporting files pattern, argument substitution.

### Secondary (MEDIUM confidence)
- Project source files (`src/tools/*.ts`) — Inspected 2026-03-28. 37 registered tools across 7 files. All tool names extracted and confirmed. Description character count: 3,456 chars for description strings alone.
- `vitest.config.ts` — Confirms test pattern: `tests/**/*.test.ts`, node environment, 10s timeout.

### Tertiary (LOW confidence)
- Token estimates (6,000-7,000 for full MCP manifest) — Based on char/4 approximation and typical MCP manifest overhead for tool schemas. Actual count depends on Zod schema serialization by the MCP SDK. The enforcement script will measure reality.

---

## Metadata

**Confidence breakdown:**
- SKILL.md format and frontmatter: HIGH — fetched from official agentskills.io spec and code.claude.com/docs directly
- Auto-invocation mechanism: HIGH — official Claude Code docs describe description-field-driven auto-invocation explicitly
- Token budget estimates: MEDIUM — char/4 approximation; actual MCP manifest serialization not measured
- Skill content (coaching knowledge): HIGH — domain knowledge (proposal pricing, follow-up timing) is stable professional practice, not a library API

**Research date:** 2026-03-28
**Valid until:** 2026-06-28 (stable spec; Claude Code skills format unlikely to change dramatically in 90 days)
