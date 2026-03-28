# FreelanceOS

**Manage your entire freelance business from Claude Code.** Proposals, invoices, time tracking, scope management, and follow-ups — all conversational.

[![npm version](https://img.shields.io/npm/v/freelance-os)](https://www.npmjs.com/package/freelance-os)

## Install

```bash
claude plugin install freelance-os
```

When prompted, paste your API key. That's it — start managing your freelance business conversationally.

## Get Your API Key

| Plan | Price | Link |
|------|-------|------|
| **Monthly** | $19/month | [Subscribe](https://buy.stripe.com/bJefZi83Zg75dmu2A22Ji00) |
| **Lifetime** | $40 one-time | [Buy Once](https://buy.stripe.com/00w4gAac7bQP2HQ1vY2Ji01) |

Your API key is delivered instantly after purchase. Stored in your system keychain — never in plaintext.

## What You Get

### 37 MCP Tools

Full CRUD across your entire freelance lifecycle:

| Entity | Tools | What You Can Do |
|--------|-------|-----------------|
| **Clients** | create, list, get | Full CRM — contacts, billing rates, notes |
| **Projects** | create, list, get, update | Track work per client with budgets and timelines |
| **Proposals** | create, list, get, update | Draft, price, send — auto-seeds scope on accept |
| **Invoices** | create, list, get, update | JSONB line items, tax, status tracking (draft/sent/paid/overdue) |
| **Time** | create, list, aggregate | Log hours, aggregate per project for invoicing |
| **Scope** | create_definition, list_changes, log_change | Define boundaries, detect scope creep |
| **Follow-ups** | create, list, get, mark_sent | Context-aware reminders and check-ins |

### 5 Coaching Skills

Claude learns freelance best practices — not just data entry:

| Skill | What It Does |
|-------|-------------|
| **Proposals** | Pricing strategy, scope clarity, revision limits, payment terms |
| **Invoices** | Line item structure, payment terms, overdue management |
| **Follow-ups** | Timing, tone, and content for every follow-up scenario |
| **Scope** | Scope definition, change requests, creep detection |
| **Time** | Logging practices, hour aggregation, time-to-invoice workflow |

## How It Works

```
You (Claude Code) → "Draft a proposal for Acme Corp's website redesign at $150/hr"
                         ↓
Claude (with FreelanceOS skills) → Expert proposal with pricing, terms, scope
                         ↓
MCP Server → Saves to your secure, isolated database
```

- **5 skill files** teach Claude freelance domain expertise
- **Hosted MCP server** persists all data with per-user isolation
- **API key auth** — your data is yours, protected by row-level security
- **Works offline** — coaching skills work without a key (data persistence requires one)

## Example Workflows

**New client onboarding:**
> "I have a new client, Acme Corp. Contact is Jane at jane@acme.com. They need a website redesign, budget around $5k."

**End-of-week invoicing:**
> "Show me all uninvoiced time for the Acme project this week and generate an invoice."

**Scope creep detection:**
> "Jane asked for a blog section — is that in scope for the Acme redesign?"

**Follow-up on overdue invoice:**
> "Invoice #INV-042 is 2 weeks overdue. Draft a polite but firm follow-up to Jane."

## Requirements

- [Claude Code](https://claude.ai/code) (CLI, desktop, or IDE extension)
- FreelanceOS API key ([get one here](https://buy.stripe.com/00w4gAac7bQP2HQ1vY2Ji01))

## License

MIT — skills are free, MCP server requires an API key.
