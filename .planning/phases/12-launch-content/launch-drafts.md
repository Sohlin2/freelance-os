# FreelanceOS Launch Content

## X/Twitter Thread

**Tweet 1 (hook):**
I built an MCP server that turns Claude Code into a freelance business manager.

Proposals, invoices, time tracking, scope management, follow-ups — all conversational.

One install command. No browser needed.

**Tweet 2 (demo):**
Here's what it looks like:

"Draft a proposal for Acme Corp's website redesign at $150/hr"

Claude knows pricing strategy, scope clarity, revision limits, payment terms. Not just data entry — expert coaching.

37 MCP tools. 5 coaching skills. Your data, isolated and secure.

**Tweet 3 (how it works):**
How it works:

1. `claude plugin install freelance-os`
2. Paste your API key
3. Start talking to Claude about your clients

Skills teach Claude freelance best practices. MCP server persists everything. Row-level security keeps your data yours.

**Tweet 4 (pricing + CTA):**
Pricing:
- $19/month (7-day free trial)
- $40 lifetime (one-time, forever)

Built with @anthropabortionclaude's MCP protocol + @ClaudeCode plugin system.

Try it: https://buy.stripe.com/00w4gAac7bQP2HQ1vY2Ji01

npm: https://www.npmjs.com/package/freelance-os

@AnthropicAI

---

## Reddit: r/ClaudeAI

**Title:** I built a Claude Code plugin that manages my freelance business — proposals, invoices, time tracking, and more

**Body:**

I've been using Claude Code for development work, and I kept wishing I could also use it to manage the business side of freelancing. So I built FreelanceOS.

**What it does:** It's a Claude Code plugin with 37 MCP tools and 5 coaching skills that cover the full freelance lifecycle:

- **Clients** — Full CRM (contacts, rates, notes)
- **Proposals** — Draft with pricing strategy, scope, payment terms
- **Invoices** — Generate with line items, track status
- **Time tracking** — Log hours, aggregate per project
- **Scope** — Define boundaries, detect scope creep
- **Follow-ups** — Context-aware reminders

**How it works:** The plugin teaches Claude freelance best practices (not just CRUD). When you say "Draft a proposal for Acme Corp at $150/hr," Claude knows to include revision limits, payment milestones, and scope boundaries.

Data persists in a hosted Supabase backend with per-user row-level security. Your API key authenticates everything.

**Install:**
```
claude plugin install freelance-os
```

**Pricing:** $19/month (7-day trial) or $40 lifetime.

Happy to answer questions about the architecture (MCP SDK, Streamable HTTP, Supabase RLS) or the freelance workflows.

---

## Reddit: r/freelance

**Title:** Built a tool that lets me manage proposals, invoices, and clients without leaving my terminal

**Body:**

I'm a freelance developer and I was tired of context-switching between coding and admin work. Different tabs for CRM, invoicing, time tracking, project management...

So I built FreelanceOS — it's a plugin for Claude Code (Anthropic's AI coding tool) that adds freelance business management.

Now when I need to:
- Draft a proposal → I just tell Claude what the project is
- Generate an invoice → "Bill Acme for this week's hours"
- Check scope → "Is the blog section in scope for the redesign?"
- Follow up on payment → "Invoice #42 is 2 weeks overdue, draft a follow-up"

It knows best practices for each of these — pricing strategies, payment terms, follow-up timing and tone. Not just filling in forms.

If you use Claude Code (or are curious about it), check it out:

Install: `claude plugin install freelance-os`
Pricing: $19/month or $40 lifetime (one-time)

Link: https://freelance-os-production.up.railway.app

Would love feedback from other freelancers on what workflows matter most to you.

---

## Hacker News: Show HN

**Title:** Show HN: FreelanceOS – Manage your freelance business from Claude Code (MCP server + skill pack)

**Body:**

FreelanceOS is a Claude Code plugin that turns Claude into a freelance business manager. It ships as an npm package with 37 MCP tools and 5 coaching skills covering the full freelance lifecycle: clients, proposals, invoices, time tracking, scope management, and follow-ups.

Technical highlights:
- MCP SDK 1.x with Streamable HTTP transport (not SSE)
- Supabase backend with per-user RLS isolation (session-scoped context)
- API key auth with SHA256 hashing (raw keys never stored)
- Stripe billing with webhook-driven subscription lifecycle
- 5 SKILL.md files that teach Claude domain expertise (not just CRUD)

The interesting part is the skill pack design. Rather than building complex multi-step workflows, each skill teaches Claude freelance best practices — pricing strategy, scope management, follow-up timing. Claude's reasoning does the orchestration.

Install: `claude plugin install freelance-os`

$19/month or $40 lifetime. Skills work without a key (coaching only). MCP tools require a subscription.

https://freelance-os-production.up.railway.app
https://www.npmjs.com/package/freelance-os
