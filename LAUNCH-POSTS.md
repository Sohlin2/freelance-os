# FreelanceOS Launch Posts — Ready to Paste

## X/Twitter Thread

Post each tweet separately. Tweet 1 is the hook — make it count.

---

**Tweet 1:**
I built an MCP server that turns Claude Code into a freelance business manager.

Proposals, invoices, time tracking, scope management, follow-ups — all conversational.

One install command. No browser needed.

Thread:

---

**Tweet 2:**
Here's what it looks like in practice:

"Draft a proposal for Acme Corp's website redesign at $150/hr"

Claude doesn't just fill in blanks — it includes:
- Pricing breakdown
- Revision limits
- Payment milestones
- Scope boundaries

37 MCP tools. 5 coaching skills. Your data, isolated and secure.

---

**Tweet 3:**
Setup takes 60 seconds:

1. claude plugin install freelance-os
2. Paste your API key
3. Start talking to Claude about your clients

Skills teach Claude freelance best practices. MCP server persists everything. Row-level security keeps your data yours.

---

**Tweet 4:**
Pricing (launch pricing — going up later):

$19/month — 7-day free trial, cancel anytime
$40 lifetime — one payment, forever access

npm: https://www.npmjs.com/package/freelance-os
Try it: https://freelance-os-production.up.railway.app

Built with @AnthropicAI's MCP protocol + Claude Code plugin system.

---

**Tweet 5 (engagement):**
If you freelance and use Claude Code — what admin task eats the most time?

For me it was invoicing and follow-ups. That's why those two are the most powerful parts of FreelanceOS.

Open to feature requests.

---

## Reddit: r/ClaudeAI

**Title:** I built a Claude Code plugin that manages my entire freelance business — proposals, invoices, time tracking, scope, and follow-ups

**Body:**

I've been using Claude Code for development work, and I kept wishing I could also use it to manage the business side of freelancing. So I built FreelanceOS.

**What it does:** It's a Claude Code plugin with 37 MCP tools and 5 coaching skills that cover the full freelance lifecycle:

- **Clients** — Full CRM (contacts, billing rates, notes, project history)
- **Proposals** — Draft with pricing strategy, scope, revision limits, payment terms
- **Invoices** — Generate with line items, tax, status tracking (draft/sent/paid/overdue)
- **Time tracking** — Log hours, aggregate per project for billing
- **Scope** — Define boundaries, log changes, detect scope creep
- **Follow-ups** — Context-aware reminders with the right tone and timing

**The interesting part** is the coaching skills. Rather than building complex multi-step workflows, each skill teaches Claude freelance best practices. When you say "Draft a proposal for Acme Corp at $150/hr," Claude knows to include revision limits, payment milestones, and scope boundaries. It's domain expertise, not just data entry.

**Tech stack** for those interested: MCP SDK 1.x, Streamable HTTP transport, Supabase backend with per-user RLS isolation, Stripe billing with webhook-driven lifecycle, API key auth with SHA256 hashing.

**Install:**
```
claude plugin install freelance-os
```

**Pricing:** $19/month (7-day free trial) or $40 lifetime.

https://freelance-os-production.up.railway.app

Happy to answer questions about the architecture or the freelance workflows. What admin tasks would you want Claude to handle?

---

## Reddit: r/freelance

**Title:** Built a tool that manages proposals, invoices, and time tracking without leaving my terminal

**Body:**

I'm a freelance developer and I was tired of context-switching between coding and admin. Different tabs for CRM, invoicing, time tracking, project management...

So I built FreelanceOS — it's a plugin for Claude Code (Anthropic's AI coding assistant) that adds freelance business management.

Now when I need to:
- **Draft a proposal** — I just describe the project and Claude writes it with proper pricing, payment terms, and scope
- **Generate an invoice** — "Bill Acme for this week's hours" and it aggregates time entries into a proper invoice
- **Check scope** — "Is the blog section in scope for the Acme redesign?" and it checks against the defined scope
- **Follow up on payment** — "Invoice #42 is 2 weeks overdue, draft a follow-up" and it pulls all context to write the right message

The key thing: it doesn't just fill in forms. It knows freelance best practices — pricing strategies, when to follow up, how to word things professionally but firmly, how to structure payment milestones to protect yourself.

**Install:** `claude plugin install freelance-os`

**Pricing:** $19/month (7-day free trial, cancel anytime) or $40 lifetime (one-time, forever)

https://freelance-os-production.up.railway.app

Would love feedback from other freelancers — what workflows matter most to you? What's your biggest admin time sink?

---

## Reddit: r/SideProject

**Title:** I built an MCP server that turns Claude Code into a freelance business manager — 37 tools, $40 lifetime

**Body:**

**What:** FreelanceOS — a Claude Code plugin with 37 MCP tools and 5 coaching skills for managing your freelance business conversationally.

**Problem:** Freelance developers already live in Claude Code for coding. But for proposals, invoices, time tracking, and follow-ups they still context-switch to 3-4 different browser tabs.

**Solution:** Install one plugin and manage everything from the same terminal. Skills teach Claude freelance domain expertise — it's not just CRUD, it's coaching.

**Tech:**
- MCP SDK 1.x with Streamable HTTP
- Supabase backend with per-user RLS
- Stripe billing (webhook-driven)
- API key auth (SHA256 hashed, stored in system keychain)

**Monetization:** $19/month (7-day trial) or $40 lifetime. Skills work free (coaching only), MCP tools require a subscription.

**Status:** Live on npm, listed on Smithery, Glama, mcp.so. Zero customers so far — just launched.

Install: `claude plugin install freelance-os`

https://freelance-os-production.up.railway.app
https://github.com/Sohlin2/freelance-os

Feedback welcome — especially on pricing and which features to prioritize.

---

## Hacker News: Show HN

**Title:** Show HN: FreelanceOS – Manage your freelance business from Claude Code (MCP + skills)

**Body:**

FreelanceOS is a Claude Code plugin that turns Claude into a freelance business manager. It ships as an npm package with 37 MCP tools and 5 coaching skills covering the full freelance lifecycle: clients, proposals, invoices, time tracking, scope management, and follow-ups.

Technical details:

- MCP SDK 1.x with Streamable HTTP transport (not deprecated SSE)
- Supabase backend with per-user RLS isolation (session-scoped context via set_config/current_setting)
- API key auth with SHA256 hashing — raw keys never stored, delivered once via Edge Function
- Stripe billing with webhook-driven subscription lifecycle
- 5 SKILL.md files using the Agent Skills spec (agentskills.io) — teaches Claude domain expertise rather than encoding multi-step workflows

The design philosophy: instead of building complex orchestration, each skill teaches Claude freelance best practices (pricing strategy, scope management, follow-up timing). Claude's reasoning does the orchestration. This means the system improves as Claude improves.

Install: `claude plugin install freelance-os`

$19/month (7-day trial) or $40 lifetime. Skills work without a key (coaching only). MCP tools require a subscription.

https://freelance-os-production.up.railway.app

https://www.npmjs.com/package/freelance-os

https://github.com/Sohlin2/freelance-os

---

## Product Hunt (Tagline + Description)

**Tagline:** Manage your freelance business from Claude Code — proposals, invoices, time tracking, and more

**Description:**

FreelanceOS turns Claude Code into your freelance business manager. Install one plugin and manage your entire client lifecycle conversationally — from proposal to payment.

37 MCP tools cover clients, proposals, invoices, time tracking, scope management, and follow-ups. 5 coaching skills teach Claude freelance best practices so it doesn't just store data — it advises on pricing, scope boundaries, payment terms, and follow-up timing.

Your data is isolated with per-user row-level security. API key lives in your system keychain. Stripe handles billing.

$19/month (7-day free trial) or $40 lifetime access.

**Maker comment:**

I built FreelanceOS because I was tired of context-switching between Claude Code (for development) and 3-4 browser tabs (for invoicing, time tracking, proposals). Now I do everything from one place.

The most interesting technical decision was using "coaching skills" instead of rigid workflows. Each skill teaches Claude domain expertise — pricing strategies, scope management, follow-up best practices. Claude's own reasoning handles the orchestration, which means the product gets better as the model improves.

Would love to hear what freelance workflows you'd want automated.
