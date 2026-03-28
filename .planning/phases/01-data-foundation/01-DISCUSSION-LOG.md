# Phase 1: Data Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 01-data-foundation
**Areas discussed:** Schema design, API key strategy, RLS & auth flow, Dev workflow

---

## Schema Design

### Table/column naming
| Option | Description | Selected |
|--------|-------------|----------|
| snake_case everywhere | Tables: clients, time_entries. Columns: created_at, billing_rate. Standard Postgres convention. | ✓ |
| camelCase columns | Tables: clients. Columns: createdAt. Closer to TypeScript but fights Postgres. | |
| Plural tables, singular types | snake_case in DB, camelCase in generated types via transform. | |

**User's choice:** snake_case everywhere

### Enum strategy
| Option | Description | Selected |
|--------|-------------|----------|
| Postgres enums | CREATE TYPE ... AS ENUM. Type-safe at DB level, generator picks them up. | ✓ |
| Text with check constraints | Easier to modify but less type-safe. | |
| Separate lookup tables | Maximum flexibility but overkill for small sets. | |

**User's choice:** Postgres enums

### Audit columns
| Option | Description | Selected |
|--------|-------------|----------|
| created_at + updated_at | Auto-set via DEFAULT and trigger. Covers 90% of audit needs. | ✓ |
| Full audit trail | created_at, updated_at, created_by, updated_by. More traceability. | |
| created_at only | Minimal, no update tracking. | |

**User's choice:** created_at + updated_at

### Delete strategy
| Option | Description | Selected |
|--------|-------------|----------|
| Soft delete with archived_at | NULL = active, set = archived. RLS filters by default. | ✓ |
| Hard delete | DELETE removes the row. No recovery. | |
| You decide | Let Claude choose. | |

**User's choice:** Soft delete with archived_at

---

## API Key Strategy

### Key format
| Option | Description | Selected |
|--------|-------------|----------|
| Prefixed UUID | fos_live_... Identifies product/environment. Store SHA-256 hash. | ✓ |
| Raw UUID v4 | Standard UUID. Simple but no identification. | |
| Random base62 token | Stripe-style sk_abc123. Shorter, URL-safe. | |

**User's choice:** Prefixed UUID

### Expiry policy
| Option | Description | Selected |
|--------|-------------|----------|
| Permanent until revoked | Valid until user revokes or subscription lapses. | ✓ |
| Expiry with rotation | Keys expire after N days, user must rotate. | |
| You decide | Let Claude choose. | |

**User's choice:** Permanent until revoked

### Keys per user
| Option | Description | Selected |
|--------|-------------|----------|
| Multiple keys allowed | One per machine, independently revocable. | ✓ |
| Single key per user | One key, one user. Simpler. | |
| You decide | Let Claude choose. | |

**User's choice:** Multiple keys allowed

### User identity link
| Option | Description | Selected |
|--------|-------------|----------|
| FK to Supabase auth.users | User signs up via Supabase Auth, then creates API keys. RLS uses auth.uid(). | ✓ |
| Standalone users table | Custom table separate from Supabase Auth. | |
| Key-only (no user account) | API key IS the identity. | |

**User's choice:** FK to Supabase auth.users

---

## RLS & Auth Flow

### Authentication to Supabase
| Option | Description | Selected |
|--------|-------------|----------|
| Service role + set_config | Server validates key, looks up user_id, calls set_config. RLS reads current_setting. | ✓ |
| Supabase Auth JWT per-request | Exchange API key for JWT. More native but complex. | |
| App-level filtering only | Service role bypasses RLS. Server adds WHERE clauses. | |

**User's choice:** Service role + set_config

### Archived row filtering
| Option | Description | Selected |
|--------|-------------|----------|
| Hide archived in RLS | Policies include AND archived_at IS NULL. | ✓ |
| Show everything | RLS only checks user_id. App filters archived. | |
| You decide | Let Claude choose. | |

**User's choice:** Hide archived in RLS

### Policy granularity
| Option | Description | Selected |
|--------|-------------|----------|
| Per-operation | Separate SELECT, INSERT, UPDATE, DELETE policies per table. | ✓ |
| Single ALL policy | One policy using USING + WITH CHECK. | |
| You decide | Let Claude choose. | |

**User's choice:** Per-operation

---

## Dev Workflow

### Development environment
| Option | Description | Selected |
|--------|-------------|----------|
| Local Supabase CLI | supabase start for local dev. Migrations tested locally first. | ✓ |
| Remote-only (hosted) | Develop against hosted instance. Simpler but risky. | |
| You decide | Let Claude choose. | |

**User's choice:** Local Supabase CLI

### Migration organization
| Option | Description | Selected |
|--------|-------------|----------|
| One per logical unit | Grouped by domain cohesion. Each includes its RLS policies. | ✓ |
| Single migration | One big migration. Simpler to reason about. | |
| One per table | Very granular. Clean separation but lots of files. | |

**User's choice:** One per logical unit

### Seed data
| Option | Description | Selected |
|--------|-------------|----------|
| Realistic seed data | Test user with sample clients, projects, invoices. Dev-only. | ✓ |
| Minimal seed | Just test user and API key. | |
| You decide | Let Claude choose. | |

**User's choice:** Realistic seed data

---

## Claude's Discretion

- Exact column types and nullable decisions per table
- Trigger implementation for updated_at
- Specific enum values for each status type
- Seed data content and volume
- Migration numbering scheme details

## Deferred Ideas

None — discussion stayed within phase scope.
