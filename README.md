# FreelanceOS

Freelance business manager for Claude Code — manage proposals, invoices, follow-ups, scope, and time tracking without leaving your terminal.

## What it does

FreelanceOS is a Claude Code plugin that gives Claude expert knowledge about freelance business workflows. It connects to a hosted backend so all your client data persists across sessions. The plugin covers the full freelance lifecycle from drafting the first proposal through chasing the final invoice.

## Install

```bash
claude plugin install freelance-os
```

Requires Claude Code. On first enable, Claude Code prompts for your FreelanceOS API key. Your key is stored in your system keychain — never in a plaintext config file.

Get your API key at **freelanceos.dev/dashboard**.

## Skills included

| Skill | What it does |
|-------|-------------|
| **Proposals** | Draft project proposals with pricing, scope, and payment terms coaching |
| **Invoices** | Generate invoices with line items, track status (draft/sent/paid/overdue) |
| **Follow-ups** | Draft follow-up emails with context-aware timing and tone |
| **Scope Management** | Define project scope, log changes, detect scope creep |
| **Time Tracking** | Log time entries, aggregate hours for invoicing |

## How it works

- The plugin installs 5 skill files that teach Claude freelance best practices
- The plugin connects to FreelanceOS's hosted MCP server for data persistence
- Your API key authenticates requests and isolates your data from other users
- All data is stored securely with per-user row-level security policies

## API Key

1. Get your key at **freelanceos.dev/dashboard**
2. Your key is stored in your system keychain (never in plaintext config files)
3. To update your key: `claude plugin configure freelance-os`

## Requirements

- Claude Code
- Node.js 20+
- FreelanceOS API key (from freelanceos.dev/dashboard)

## License

MIT
