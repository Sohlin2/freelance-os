# Pitfalls Research

**Domain:** Claude Code skill pack + MCP server + Supabase SaaS (freelance management)
**Researched:** 2026-03-28
**Confidence:** HIGH (multiple sources verified per finding)

---

## Critical Pitfalls

### Pitfall 1: Tool Description Vagueness Causing LLM Misfires

**What goes wrong:**
Tool names like `create_invoice`, `get_client`, or `search_data` cause Claude to call the wrong tool, supply misformatted parameters, or make redundant tool calls. When multiple tools have semantically similar names (e.g., `get_status`, `fetch_status`, `query_status`), the model disambiguates incorrectly based on token similarity rather than intent.

**Why it happens:**
Developers treat MCP like a REST API — exposing atomic CRUD endpoints that map 1:1 to database operations. MCP is a UI for agents, not a REST gateway. The LLM must infer purpose, parameter format, and when to use each tool purely from metadata. Ambiguous metadata produces ambiguous behavior.

**How to avoid:**
- Name tools with the pattern `{action}_{specific_resource}` (e.g., `draft_client_proposal`, `log_time_against_project`, `flag_scope_creep`)
- Write docstrings with usage context, not just parameter names: "Use this when the freelancer mentions a new client conversation or onboarding. Do NOT use for updating existing client records."
- Design tools around freelancer outcomes (e.g., `start_new_project` that sets up client, project, and scope in one call) rather than atomic DB operations
- Keep total tools at 10–20 maximum. Anything beyond that creates decision paralysis and semantic overlap

**Warning signs:**
- Claude picks the wrong tool in testing more than 10% of the time
- Claude makes 2–3 tool calls to accomplish something that should be 1 call
- Tool call logs show frequent parameter errors on the same tool

**Phase to address:** MCP server foundation phase (tool schema design must be locked before any feature work builds on it)

---

### Pitfall 2: MCP Tool Definitions Eating the Context Window

**What goes wrong:**
Each MCP tool definition costs 550–1,400 tokens (name + description + JSON schema + field descriptions). A 15-tool server with detailed schemas can consume 10,000–20,000 tokens of context window on every single request — before Claude has read a single file or processed any conversation history. In a 20-turn conversation, this static overhead compounds into significant cost and degrades Claude's reasoning quality on the actual task.

**Why it happens:**
Developers write thorough documentation in tool schemas (good intent, wrong placement) and don't measure the token cost of their tool registry against their expected conversation length.

**How to avoid:**
- Measure token cost of all tool definitions combined before shipping. Run `wc` or a tokenizer against the serialized tool manifest
- Keep individual tool descriptions under 200 tokens; use examples only for tools with non-obvious parameter formats
- Prefer high-level composite tools over many atomic tools. One `manage_project` tool beats five separate `create_project`, `update_project`, `archive_project`, etc.
- Load skill pack prompts only when contextually relevant, not on every invocation

**Warning signs:**
- Conversation quality degrades noticeably in long sessions (context compression kicking in early)
- API costs per conversation are 3–5x what you estimated
- Claude starts "forgetting" earlier conversation details mid-session

**Phase to address:** MCP server foundation phase + skill pack authoring phase

---

### Pitfall 3: Supabase Service Role Key Leaking Through the MCP Server

**What goes wrong:**
The MCP server needs full database access (bypassing Row Level Security) to operate as a service. If the service role key is hardcoded in package source, committed to a public repo, logged in verbose mode, or returned in an error response, any user who can read the MCP server's environment can access every FreelanceOS customer's data.

**Why it happens:**
During local development, service role key is pasted into `.env` files and treated like any other config. The key works everywhere and makes RLS feel like an obstacle. Developers ship what works locally. The key ends up in git history, npm package source, or CI logs.

**How to avoid:**
- Never put the service role key in the npm-distributed package at all. It belongs on the server side (your hosted backend), not on the user's machine
- The MCP server should authenticate with FreelanceOS using the user's API key (the subscription key), which is then validated server-side before any Supabase operation is performed
- Use Supabase's new `sb_secret_...` key format and rotate on any suspected compromise
- Add `.env` and key patterns to `.gitignore` and a pre-commit hook check

**Warning signs:**
- Service role key appears anywhere in npm package source after `npm pack`
- Verbose error logs include connection strings or key values
- Any git diff shows a key-shaped string

**Phase to address:** Authentication and API key gating phase (must be solved before any user data is stored)

---

### Pitfall 4: Missing or Misconfigured Row Level Security Exposes Cross-Tenant Data

**What goes wrong:**
Every FreelanceOS user's clients, invoices, and proposals live in the same Supabase tables. Without correct RLS policies on every table, a compromised user session or a bug in the MCP server's request context could return another user's data. The most common failure mode: RLS is enabled but policies are missing, causing queries to silently return empty results — a symptom that looks like a bug, not a security hole, delaying discovery.

**Why it happens:**
Supabase creates tables with RLS disabled by default. Developers add RLS as an afterthought after the data model is built, then write policies for the obvious tables (clients, projects) but miss junction tables (time_entries, scope_changes, proposal_versions). The second failure mode — forgetting to add policies after enabling RLS — returns empty results with no error, making it hard to detect in testing.

**How to avoid:**
- Enable RLS and write the base user policy (`user_id = auth.uid()` or equivalent) in the same migration that creates each table
- Use a migration checklist: every new table gets `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + at minimum one SELECT policy before the migration is considered done
- Test RLS as two separate Supabase clients (two different user sessions) in integration tests — verify User A cannot read User B's records
- For the MCP server's service role operations: apply user_id filtering in application code as a second layer, even though service role bypasses RLS

**Warning signs:**
- Queries return empty arrays after enabling RLS but before policies are written (easily confused with "no data" bugs)
- Integration tests use only a single test user
- Database migrations don't include RLS directives alongside CREATE TABLE

**Phase to address:** Data model and Supabase schema phase (must be correct from migration 1, not retrofitted)

---

### Pitfall 5: API Key Gating That Can Be Bypassed or Forged

**What goes wrong:**
The API key gating is the entire revenue model. If the validation logic can be bypassed — by passing a null key, a previously valid but cancelled key, or a key from another tier — paying users' data or premium features become accessible for free. Common failures: key validated client-side (in the npm package), validation results cached too aggressively, or the validation endpoint itself is unauthenticated.

**Why it happens:**
The MCP server lives on the user's machine. It feels like a client. Developers put key validation logic in the client because that's where the key is. But a client-side check is not a security check — anyone who can read the npm source can remove the check.

**How to avoid:**
- Key validation must happen server-side on the FreelanceOS API, not in the npm package. The MCP server sends the key with every request; the server validates and either responds with data or 401
- Never trust the result of a previous successful validation stored in-process. Validate on each meaningful operation (not necessarily every single tool call — once per session/hour is acceptable, but not once at install time)
- Rate-limit the validation endpoint to prevent brute-force key enumeration
- Hash stored keys (bcrypt or SHA-256 with salt) — if the database leaks, raw keys must not be exposed

**Warning signs:**
- Key validation happens before the HTTP request to your server (it's in the wrong place)
- A `NODE_ENV=test` or similar flag bypasses key checking
- Keys are stored in plaintext in the database

**Phase to address:** Authentication and API key gating phase

---

### Pitfall 6: Conversational State Lost Between Sessions Produces Confusing UX

**What goes wrong:**
A freelancer says "add 3 hours to the Acme project" in one session. Claude calls the right tool and confirms. In the next session, Claude has no memory of which project "Acme" is, what's in scope, or what was discussed. The user must re-establish context constantly. Worse: if the MCP tools return raw database rows as confirmation messages ("Created record id=47e2..."), the UX feels like a database console, not a business assistant.

**Why it happens:**
MCP tools are stateless by design — each call is a fresh operation. Developers focus on making the tools work and don't design the response format for conversational continuity. The session context that Claude accumulates during a conversation is discarded between sessions.

**How to avoid:**
- MCP tool responses should return human-readable summaries, not raw records. "Logged 3 hours to Acme Website Redesign (total: 18h / 40h budgeted)" instead of `{"id": "47e2...", "project_id": "...", "hours": 3}`
- Design tools that surface context proactively: when a user opens a project, return a summary of current status, time logged vs. budget, and any pending flags
- The skill pack's CLAUDE.md should prompt Claude to establish project context at the start of a work session
- Accept that Claude needs to look things up; make lookups fast (< 200ms) and low-friction so that "load context" is a cheap operation

**Warning signs:**
- Tool responses are raw JSON objects with UUIDs as primary identifiers
- Users frequently ask "what project was that again?" in the same session
- Claude asks for clarification on every request because it has no loaded context

**Phase to address:** Skill pack authoring phase + tool response design in MCP server

---

### Pitfall 7: CLAUDE.md Instruction Conflicts With Claude Code's Built-in System Prompt

**What goes wrong:**
Claude Code ships with a built-in system prompt that defines its behavior, output style, and reasoning modes. Instructions in CLAUDE.md that conflict with these built-in directives are silently ignored. Tone instructions, verbosity controls, and custom reasoning directives in CLAUDE.md do not override the built-in prompt — they lose. Developers discover this during testing when Claude behaves unexpectedly despite explicit CLAUDE.md instructions.

**Why it happens:**
CLAUDE.md feels like "configure Claude however you want." The hierarchy (built-in system prompt > CLAUDE.md) is not prominently documented. Developers write instructions that duplicate or contradict built-in behavior without knowing the conflict exists.

**How to avoid:**
- Use CLAUDE.md for domain knowledge and project-specific context, not for trying to change Claude Code's core behavior or output style
- Skill files are the right place for domain-specific instructions. Keep the scope narrow: "Here is what a good proposal contains. Here is how to identify scope creep."
- Test each CLAUDE.md / skill instruction in isolation to confirm Claude actually follows it, not just that it sounds reasonable
- Maintain skill file bodies under 500 lines. Use progressive disclosure: activation criteria in the description, depth in the body

**Warning signs:**
- Claude consistently ignores a specific CLAUDE.md instruction in testing
- CLAUDE.md exceeds 300 lines and nobody knows what's in the bottom half
- Skill files contain "When to Use This Skill" sections in the body (the description is the trigger, not the body)

**Phase to address:** Skill pack authoring phase

---

### Pitfall 8: stdio vs. HTTP Transport Mismatch at Scale

**What goes wrong:**
The MCP server is built using stdio transport (the natural starting point for npm-distributed Claude Code tools). This works correctly for a single user on a single machine. But when FreelanceOS adds server-side features — webhook handling, subscription event processing, async invoice reminders — stdio cannot receive events from the server. Additionally, stdio spawns a new process per client, which breaks any in-memory session state assumptions.

**Why it happens:**
stdio is the right choice for local, single-user MCP servers (the initial phase). But the hosted backend requirement for FreelanceOS means there will eventually be a need for the server to push events to clients. Developers don't plan for this transition and have to restructure transport architecture mid-build.

**How to avoid:**
- Accept the initial stdio transport for Phase 1 but do not build any features that depend on the server initiating communication with the client
- Design the Supabase schema to be poll-friendly (status columns + updated_at timestamps) rather than push-dependent
- Document the transport upgrade path in the architecture notes before it becomes a blocker

**Warning signs:**
- Any feature requires the MCP server to receive an event rather than respond to a tool call
- Planning discussions mention "webhooks from the FreelanceOS API to the MCP server"
- State is stored in MCP server process memory rather than Supabase

**Phase to address:** MCP server foundation phase (transport decision), revisited at backend features phase

---

### Pitfall 9: npm Package Version Fragmentation Breaks Existing Users

**What goes wrong:**
FreelanceOS ships v1.0.0 of the npm package. Users install it, configure it, and integrate it into their workflow. When v1.1.0 introduces a renamed tool, a changed parameter signature, or a new required Supabase migration, users who don't upgrade silently break. The MCP server calls tools that no longer match what the backend expects. Worse: auto-updated packages (via `npx @freelance-os/mcp@latest`) can break users without any action on their part.

**Why it happens:**
Developers treat the MCP server like a server they control. But the npm package is a distributed client artifact. Once published, versions are in the wild. Schema changes in Supabase that require a matching package version create a hard coupling that is easy to break.

**How to avoid:**
- Version the Supabase schema independently of the package. Use a `schema_version` table; the MCP server checks schema version on startup and reports incompatibility clearly
- Treat tool signature changes (renamed tools, added required parameters) as breaking changes that require a major version bump
- Pin the `npx` invocation in setup docs to a version range: `@freelance-os/mcp@^1.0.0`, not `@latest`
- Build a compatibility check tool call: `check_server_compatibility` that validates the package version against the backend API version

**Warning signs:**
- The migration guide says "run this SQL against your Supabase instance" without a version check
- No `schema_version` or `api_version` in the Supabase database
- Tool parameter signatures change between minor versions

**Phase to address:** Distribution and packaging phase

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Expose atomic CRUD tools (one tool per DB operation) | Faster initial build | LLM decision paralysis; excessive tool calls; fragile workflows | Never — design composite outcome-oriented tools from day one |
| Store API keys in plaintext in Supabase | No hashing implementation needed | Total credential exposure if DB leaks | Never |
| Skip RLS on "internal" tables (time entries, scope changes) | Fewer migrations to write | Cross-tenant data leakage; requires full schema rebuild to fix | Never |
| Build skill pack as one giant CLAUDE.md | Quick to start | Context bloat; instruction conflicts; unmaintainable | Never for production; acceptable for prototype/validation only |
| Hardcode Supabase service role key in npm package | Simplest auth path | Every npm install gives user admin DB access | Never |
| Use stdio transport only, assume no push features needed | Correct for Phase 1 | Blocks async notifications, webhook handling in later phases | Acceptable in Phase 1 with documented upgrade plan |
| Skip version compatibility check in MCP server | Faster shipping | Silent breakage when backend schema drifts from package version | Acceptable pre-v1.0; must be resolved before public release |
| Return raw DB records from tool calls | Trivial implementation | Terrible UX; users see UUIDs and raw timestamps | Acceptable in internal testing only |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase RLS + MCP service operations | Using `anon` key in MCP server, meaning user must be authenticated via Supabase Auth | MCP server uses service role key server-side, applies `user_id` filter in application logic; keep service role key out of npm package entirely |
| Supabase API key migration | Hardcoding `anon`/`service_role` key names; Supabase is migrating to `sb_publishable_...` / `sb_secret_...` format | Use environment variable names; update key references when Supabase completes migration |
| npm package + Claude Code skill activation | Putting activation criteria in the skill body, not the description | Activation criteria must be in the YAML `description` field; the body loads only after activation |
| MCP tool naming in Claude Code | Generic names like `search`, `create`, `update` conflict with other installed MCP servers | Use `freelanceos_{action}_{resource}` prefix for all tool names |
| API key validation timing | Validate once at install, cache result forever | Validate once per session with a short TTL; re-validate on 401 from backend |
| Supabase connection pooling | Spinning up a new Supabase client per MCP tool call | Create one Supabase client per MCP server process lifecycle; reuse it across tool calls |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading full client history on every tool call | Slow responses; context window fills quickly; high API cost | Paginate all list operations; return summaries by default, details on request | From first user with >10 clients |
| N+1 queries in invoice generation (one query per line item) | Invoice generation takes 3–5 seconds | Use Supabase joins or batch queries; fetch all line items in one query | With >5 line items per invoice |
| Unindexed `user_id` / `project_id` foreign keys | Slow queries as data grows; RLS policies using these columns are especially vulnerable | Add indexes on all foreign key columns and any column used in RLS policies in the same migration that creates the table | Noticeable at ~1,000 rows per table |
| Tool schema serialized to context on every request | High baseline token cost; degrades reasoning in long sessions | Keep tool descriptions concise; target <15,000 total tokens for all tool definitions combined | Immediately if tool count exceeds 20 with verbose descriptions |
| No connection pooling to Supabase from MCP server | Connection limit errors at moderate usage | Use Supabase connection pooler (PgBouncer, enabled by default on hosted plans) | At ~20 concurrent users |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Service role key in npm package source | Any user gets admin-level DB access; full data exposure | Service role key lives only on FreelanceOS backend server; npm package authenticates with FreelanceOS-issued API key |
| API key stored in plaintext in Supabase `api_keys` table | DB leak = all subscription keys exposed, all users compromised | Store bcrypt hash of the key; user is shown the key once on generation and it is never retrievable |
| No rate limiting on key validation endpoint | Brute-force key enumeration; denial of service | Rate limit by IP: max 5 validation attempts per minute; exponential backoff on failures |
| RLS policies using `user_metadata` JWT claims | User can modify their own `user_metadata`, escalating their own permissions | Use only `auth.uid()` and claims set server-side (in `app_metadata`, not `user_metadata`) in RLS policies |
| MCP tool inputs passed unsanitized to SQL | SQL injection via tool parameters | Use Supabase client's parameterized queries; never interpolate user-provided strings into raw SQL |
| Verbose error messages returning internal details | Attacker learns DB schema, key format, internal IDs | Return generic error messages to MCP clients; log full errors server-side only |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Tool responses return raw UUIDs and timestamps | User must mentally map "47e2a3..." to "Acme Corp"; feels like a database, not an assistant | Return human-readable summaries: "Logged 3h to Acme Website Redesign (18h / 40h used)" |
| No proactive context in responses | User must ask for status on every interaction; high friction | When a project is referenced, auto-include key stats (budget remaining, days until deadline, open scope changes) |
| Skill pack activates on every message (too broad trigger) | Skill instructions flood context regardless of what user is doing; increases cost and noise | Write narrow activation criteria: trigger proposal skills only when user mentions "proposal," "pitch," or "bid" |
| Invoice generation has no preview step | User asks Claude to create an invoice; it gets created immediately; errors are costly to fix | Tool design: `preview_invoice` before `create_invoice`; confirmation-first pattern for irreversible operations |
| Scope creep flagging is too aggressive | Freelancer feels nagged; disables the feature mentally or literally | Flag scope creep once per detected change, not on every related message; make the flag dismissible with context |
| No clear onboarding path in CLAUDE.md | User installs the package but Claude doesn't know what commands/workflows are available | CLAUDE.md should include a brief "To get started, ask Claude to..." section that Claude surfaces when the skill activates for the first time |

---

## "Looks Done But Isn't" Checklist

- [ ] **API key gating:** Validation appears in the npm package — verify it actually calls the FreelanceOS backend server and returns 401 with an invalid key
- [ ] **RLS coverage:** All tables have RLS enabled — verify by checking `pg_tables` and running a query as a second test user that should return zero rows
- [ ] **Tool naming uniqueness:** Tool names look fine in isolation — verify by installing alongside 2–3 other common MCP servers (GitHub, filesystem) and confirming no name collisions
- [ ] **Skill activation:** CLAUDE.md and skill files appear complete — verify by starting a fresh session with no project context and confirming skills activate on expected triggers
- [ ] **Context window budget:** Tool schemas look reasonable — verify by running `tiktoken` or equivalent against the serialized tool manifest; must be under 15,000 tokens total
- [ ] **Error handling:** Tools return errors gracefully — verify by sending invalid parameters, expired keys, and nonexistent resource IDs; confirm Claude receives actionable error strings, not Python tracebacks
- [ ] **Cross-tenant isolation:** RLS policies are written — verify with two user accounts; User A must not be able to retrieve, update, or delete User B's records through any tool
- [ ] **Version compatibility:** Package version and backend schema are in sync — verify by deploying a schema migration without an npm release; confirm the old package version reports an incompatibility error rather than silently failing

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Service role key leaked via npm package | HIGH | Rotate key immediately in Supabase; audit all operations with the old key in Supabase logs; publish new package version; notify all users to reinstall |
| RLS not enabled on tables after users have data | HIGH | Enable RLS and write policies in a migration; backfill `user_id` on any rows missing it; run cross-tenant isolation tests before re-enabling user access |
| Tool schema redesign needed after users adopted v1 | MEDIUM | Maintain backward-compatible tool aliases in v1.x; publish v2 with breaking changes as opt-in; document migration path clearly |
| CLAUDE.md bloat causing instruction conflicts | LOW | Audit and prune — remove any instruction Claude already follows by default; split into domain-specific skill files; test each instruction independently |
| API keys stored in plaintext discovered | HIGH | Hash all existing keys (requires key rotation since plaintext keys are now untrusted); force all users to regenerate keys; implement proper hashing going forward |
| Context window budget exceeded by tool schemas | LOW-MEDIUM | Audit each tool description for token waste; remove redundant descriptions; merge related tools into composite tools; re-test LLM decision quality after changes |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Tool description vagueness | MCP server foundation | Test: Claude picks correct tool >90% of the time in a 20-scenario test suite |
| Context window token bloat | MCP server foundation + skill pack authoring | Verify: total tool manifest tokens < 15,000; session cost within 2x of estimate |
| Service role key exposure | Authentication and API key gating | Verify: `npm pack` output contains no key-shaped strings; service role key never appears in npm package source |
| RLS missing or misconfigured | Data model and schema phase | Verify: two-user integration test; User A cannot access User B's data via any tool |
| API key bypass vulnerabilities | Authentication and API key gating | Verify: null key, expired key, and wrong-tier key all return 401 from backend |
| Conversational state loss / raw JSON responses | Skill pack authoring + tool response design | Verify: tool responses are human-readable; Claude surfaces project stats when referencing a project |
| CLAUDE.md instruction conflicts | Skill pack authoring | Verify: each CLAUDE.md instruction actually changes Claude's behavior in isolation testing |
| stdio transport limitations | MCP server foundation | Verify: no feature in Phase 1 requires server-initiated events; transport upgrade path documented |
| npm version fragmentation | Distribution and packaging | Verify: schema version check present; old package version reports clear incompatibility message |
| N+1 queries and missing indexes | Data model and schema phase | Verify: Supabase query analyzer shows index usage on all RLS-policy columns |

---

## Sources

- [MCP is Not the Problem, It's your Server — Phil Schmid](https://www.philschmid.de/mcp-best-practices) — Tool design anti-patterns, 5–15 tools per server, outcome-oriented tool design
- [MCP Server Security: Best Practices & Common Mistakes 2026 — Toolradar](https://toolradar.com/blog/mcp-server-security-best-practices) — 66% of MCP servers have security findings; 43% involve command injection; Confused Deputy Problem
- [Common Challenges in MCP Server Development — DEV Community](https://dev.to/nishantbijani/common-challenges-in-mcp-server-development-and-how-to-solve-them-35ne) — Tool description ambiguity, authorization gaps, observability
- [Your MCP Server Is Eating Your Context Window — Apideck](https://www.apideck.com/blog/mcp-server-eating-context-window-cli-alternative) — Token cost of tool definitions; 55,000+ tokens before first message
- [The MCP Tax: Hidden Costs of Model Context Protocol — MMNTM](https://www.mmntm.net/articles/mcp-context-tax) — Static context bloat; session cost compounding
- [How Claude Code Skills Work — MindStudio](https://www.mindstudio.ai/blog/claude-code-skills-common-mistakes-guide) — 3 common skill mistakes; monolithic CLAUDE.md; over-tool-loading
- [Claude Code Feels Dumber? The System Prompt Architecture Trap — Support Tools](https://support.tools/claude-code-system-prompt-behavior-claude-md-optimization-guide/) — Built-in system prompt overrides CLAUDE.md instructions; directive hierarchy
- [6 Common Supabase Auth Mistakes — Startupik](https://startupik.com/6-common-supabase-auth-mistakes-and-fixes/) — Session management, OAuth redirect issues, RLS configuration
- [Ultimate Guide to Secure API Key Management in Supabase — Makerkit](https://makerkit.dev/blog/tutorials/supabase-api-key-management) — Bcrypt hashing, private schema storage, rate limiting
- [Supabase RLS Best Practices — Makerkit](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices) — Multi-tenant RLS patterns, JWT claim pitfalls
- [MCP Transports Explained — DEV Community](https://dev.to/jefe_cool/mcp-transports-explained-stdio-vs-streamable-http-and-when-to-use-each-3lco) — stdio vs. HTTP tradeoffs; production deployment requirements
- [MCP Package Versioning — Model Context Protocol Registry](https://modelcontextprotocol.io/registry/versioning) — Semantic versioning, immutable published versions
- [The Weak Point in MCP Nobody's Talking About: API Versioning — Nordic APIs](https://nordicapis.com/the-weak-point-in-mcp-nobodys-talking-about-api-versioning/) — Breaking changes in MCP tool signatures; versioning gap in ecosystem
- [Securing Your MCP Server: Auth, Rate Limiting, Input Validation — SkillsHats](https://www.skillshats.com/blogs/securing-your-mcp-server-auth-rate-limiting-and-input-validation/) — Rate limiting for agentic callers; input sanitization
- [Claude Hallucination Issue in Plan Mode — GitHub](https://github.com/anthropics/claude-code/issues/20051) — Context compaction causing hallucination in long sessions
- [MCP Security in 2025: Key Risks and Attack Vectors — Data Science Dojo](https://datasciencedojo.com/blog/mcp-security-risks-and-challenges/) — 1,800+ unauthenticated MCP servers; supply chain attack via unofficial packages

---
*Pitfalls research for: Claude Code skill pack + MCP server + Supabase SaaS (FreelanceOS)*
*Researched: 2026-03-28*
