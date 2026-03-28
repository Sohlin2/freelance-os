# Phase 1: Data Foundation - Research

**Researched:** 2026-03-28
**Domain:** Supabase schema design, PostgreSQL RLS with service-role key, API key hashing, Supabase CLI migrations, pgTAP testing
**Confidence:** HIGH (standard stack verified via official docs and npm registry; patterns cross-referenced from multiple authoritative sources)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Schema Design**
- D-01: snake_case naming everywhere — tables (clients, time_entries) and columns (created_at, billing_rate). Standard Postgres convention matching Supabase defaults.
- D-02: Postgres enums for status fields (e.g., CREATE TYPE project_status AS ENUM ('active', 'paused', 'completed')). Type-safe at DB level, picked up by Supabase type generator.
- D-03: Every table gets created_at (DEFAULT now()) and updated_at (via trigger) audit columns.
- D-04: Soft delete via archived_at TIMESTAMPTZ column. NULL = active, set = archived. No hard deletes on domain tables.

**API Key Strategy**
- D-05: Prefixed UUID format: fos_live_<uuid>. Prefix identifies product and environment. Store SHA-256 hash in DB, never the raw key. User sees full key once at creation.
- D-06: Keys are permanent until explicitly revoked or subscription lapses. No expiry rotation.
- D-07: Multiple API keys per user allowed. Each independently revocable.
- D-08: api_keys.user_id references auth.users(id). Users sign up via Supabase Auth, then create API keys. RLS uses the resolved user_id.

**RLS & Auth Flow**
- D-09: MCP server uses service role key. On each request: validate API key, look up user_id, call set_config('app.current_user_id', user_id). RLS policies read current_setting('app.current_user_id') to enforce isolation.
- D-10: RLS policies include AND archived_at IS NULL by default. Archived data invisible unless explicitly queried.
- D-11: Separate SELECT, INSERT, UPDATE, DELETE policies per table. Per-operation granularity.
- D-12: RLS policies written in same migration as table creation (carried forward from roadmap decisions).

**Dev Workflow**
- D-13: Local Supabase CLI (supabase start) for development. Migrations tested locally before applying to hosted instance.
- D-14: One migration per logical unit (e.g., 001_create_enums.sql, 002_create_clients_projects.sql, 003_create_proposals_invoices.sql). Each includes its own RLS policies.
- D-15: Realistic seed data — test user with sample clients, projects, invoices, etc. Clearly marked as dev-only.

### Claude's Discretion
- Exact column types and nullable decisions per table (beyond what's specified above)
- Trigger implementation for updated_at
- Specific enum values for each status type (beyond examples given)
- Seed data content and volume
- Migration numbering scheme details

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA-01 | MCP server connects to hosted Supabase with full CRUD for all domain entities | All 9 domain tables defined with correct FK relationships; `@supabase/supabase-js` v2.100.1 client pattern documented; TypeScript type generation verified |
| INFRA-02 | API key authentication gates all MCP server access | SHA-256 hashing via pgcrypto `encode(digest(...,'sha256'),'hex')` verified; api_keys table schema with prefix lookup + hash comparison pattern documented |
| INFRA-03 | Supabase schema supports multi-tenant data isolation via RLS policies | `SET LOCAL app.current_user_id` + `current_setting()` RLS pattern verified; separate SELECT/INSERT/UPDATE/DELETE policies with `archived_at IS NULL` filter documented |
</phase_requirements>

---

## Summary

Phase 1 establishes the Supabase backend data layer that every subsequent phase depends on. The deliverables are nine domain tables with correct foreign key relationships, Postgres enum types for all status fields, RLS policies on every table enforcing per-user data isolation, an api_keys table supporting SHA-256-hashed key validation, an updated_at trigger via the moddatetime extension, and generated TypeScript types importable in the Phase 2 MCP server.

The central architectural challenge is the RLS isolation pattern. FreelanceOS uses the service role key server-side (which bypasses RLS by default). The chosen approach (D-09) threads user context into Postgres per-request using `SET LOCAL app.current_user_id = $user_id` inside a transaction, and RLS policies read it back via `current_setting('app.current_user_id', true)`. This is a well-established multi-tenant pattern with documented precedent. The critical implementation requirement is that every query touching user data must be wrapped in a transaction that sets this context before executing.

The dev workflow uses the Supabase CLI installed as an npm dev dependency (`npm install supabase --save-dev`) to avoid global install issues on Windows. Docker Desktop is required for `supabase start` (local stack). The `supabase db push` command can target the remote hosted instance directly via `--db-url` flag without running the local stack, which is the deployment path from migrations to production.

**Primary recommendation:** Write migrations SQL-first in `supabase/migrations/`, validate locally with `supabase db reset` (requires Docker), push to the hosted instance with `supabase db push --db-url`, and generate TypeScript types with `supabase gen types typescript --linked > src/types/database.ts`. Test RLS policies with `supabase test db` using pgTAP SQL files.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | 2.100.1 | Supabase client for database queries, auth, type-safe PostgREST | Official isomorphic client; v2.100.1 is current stable; required Node 20+ (already used) |
| `supabase` (CLI, dev dep) | 2.84.4 | Run migrations, generate TypeScript types, run pgTAP tests | Installed as `npm install supabase --save-dev`; `npx supabase` works without global install |
| `pgcrypto` (Postgres extension) | bundled with Supabase | SHA-256 hashing for API key storage | `encode(digest(key_value, 'sha256'), 'hex')` — available as `extensions.digest` in Supabase migrations |
| `moddatetime` (Postgres extension) | bundled with Supabase | Auto-update updated_at on row modification | `create extension if not exists moddatetime schema extensions;` then per-table trigger |
| `pgtap` (Postgres extension) | bundled with Supabase | SQL-level RLS policy testing | Run via `supabase test db`; test files in `supabase/tests/` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vitest` | 4.1.2 | TypeScript unit tests for key validation logic | Test the TypeScript function that hashes incoming API keys and compares against DB — does not require a DB connection |
| `typescript` | 6.0.2 | Type-safe source code | All server code; generated DB types import here |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SHA-256 via pgcrypto | bcrypt via `crypt()` / `gen_salt('bf')` | bcrypt is slower (better for brute-force resistance on standalone passwords); SHA-256 is appropriate here because the key is a long random UUID — entropy is already high, brute-force window is negligible. bcrypt adds complexity without meaningful security gain for 128-bit random inputs. |
| moddatetime trigger | Manual `SET updated_at = now()` in every UPDATE | Manual approach creates footgun — any UPDATE that forgets the column leaves stale timestamps. Trigger is reliable. |
| `supabase test db` (pgTAP) | Application-level Vitest with real DB calls | pgTAP runs in-database so it accurately tests RLS policies as the DB sees them; Vitest+real DB is good for integration tests but cannot easily simulate "authenticated as user A, verify user B's data is absent" without per-test auth setup |

**Installation:**
```bash
# Dev dependency (preferred on Windows — avoids global install issues)
npm install --save-dev supabase

# Runtime client
npm install @supabase/supabase-js
```

**Version verification (verified 2026-03-28 against npm registry):**
- `@supabase/supabase-js`: 2.100.1 (latest stable)
- `supabase` (CLI): 2.84.4 (latest stable npm release)
- `typescript`: 6.0.2
- `vitest`: 4.1.2
- Node.js on this machine: v24.14.0 (exceeds minimum Node 20 requirement)

---

## Architecture Patterns

### Recommended Project Structure
```
freelance-os/
├── supabase/
│   ├── config.toml                  # Supabase project config (generated by supabase init)
│   ├── migrations/
│   │   ├── 20260328000001_create_extensions.sql
│   │   ├── 20260328000002_create_enums.sql
│   │   ├── 20260328000003_create_api_keys.sql
│   │   ├── 20260328000004_create_clients_projects.sql
│   │   ├── 20260328000005_create_proposals_invoices.sql
│   │   ├── 20260328000006_create_time_scope.sql
│   │   └── 20260328000007_create_follow_ups.sql
│   ├── seed.sql                     # Dev-only seed data (runs with supabase db reset)
│   └── tests/
│       ├── rls_clients.test.sql
│       ├── rls_projects.test.sql
│       └── api_key_auth.test.sql
├── src/
│   └── types/
│       └── database.ts              # Generated: supabase gen types typescript --linked
└── package.json
```

Note: D-14 uses logical names rather than timestamps. Either works — timestamps are the Supabase CLI default when using `supabase migration new <name>` and are preferable because they prevent ordering conflicts when migrations are created on different branches. The migration name is the meaningful part.

### Pattern 1: updated_at Trigger (moddatetime extension)

**What:** Auto-update updated_at column on any UPDATE. Define once per table.
**When to use:** Every domain table (D-03).

```sql
-- Source: https://dev.to/paullaros/updating-timestamps-automatically-in-supabase-5f5o
-- In the extensions migration (run once):
create extension if not exists moddatetime schema extensions;

-- Per table (include in the same migration as table creation):
create trigger handle_updated_at
  before update on clients
  for each row
  execute procedure extensions.moddatetime(updated_at);
```

Note: Must use `extensions.moddatetime` (not plain `moddatetime`) in migrations because Supabase installs extensions in the `extensions` schema.

### Pattern 2: RLS Isolation via SET LOCAL + current_setting

**What:** MCP server uses the service role key (which bypasses RLS). Per-request, it sets a Postgres session variable scoped to the current transaction. RLS policies read it back.
**When to use:** Every query that reads or writes user-owned data (D-09).

```sql
-- Source: https://dev.to/blackie360/-enforcing-row-level-security-in-supabase-a-deep-dive-into-lockins-multi-tenant-architecture-4hd2
-- Helper function (defined in a migration):
create or replace function public.current_app_user_id()
returns uuid
language sql stable
as $$
  select current_setting('app.current_user_id', true)::uuid;
$$;

-- RLS policy on clients table (SELECT example):
create policy "users see own clients"
  on clients for select
  using (
    user_id = current_app_user_id()
    and archived_at is null
  );

-- INSERT example (WITH CHECK enforces the user_id they are inserting):
create policy "users insert own clients"
  on clients for insert
  with check (user_id = current_app_user_id());

-- UPDATE example:
create policy "users update own clients"
  on clients for update
  using (user_id = current_app_user_id())
  with check (user_id = current_app_user_id());

-- DELETE example (soft delete — no hard DELETE policy needed):
-- (archived_at update is covered by UPDATE policy)
```

TypeScript usage in the MCP server (Phase 2 pattern, documented here for context):
```typescript
// Source: https://marmelab.com/blog/2025/12/08/supabase-edge-function-transaction-rls.html
// Each tool call wraps its DB operations in a transaction:
async function withUserContext<T>(supabase: SupabaseClient, userId: string, fn: () => Promise<T>): Promise<T> {
  const { data, error } = await supabase.rpc('set_user_context_and_run', {
    p_user_id: userId,
    // ... or use raw SQL transaction via postgres.js / supabase.from + rpc
  });
  // Alternative using a raw SQL helper:
  // BEGIN; SET LOCAL app.current_user_id = '...'; <query>; COMMIT;
}
```

Note: `supabase-js` does not expose a direct `BEGIN/SET LOCAL/COMMIT` transaction API. The clean Phase 2 implementation uses a Postgres function wrapper or a raw DB connection (e.g., `postgres.js`). Document this as a Phase 2 concern — Phase 1 only needs the RLS policies and `current_app_user_id()` function defined correctly.

### Pattern 3: API Key Table and Validation

**What:** api_keys table stores a SHA-256 hash of the key (never the raw key). Validation query hashes the incoming key and compares.
**When to use:** Every MCP tool call (D-05, D-08).

```sql
-- api_keys table definition:
create table api_keys (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  key_prefix  text not null,           -- first 12 chars: "fos_live_" + 3 random chars for lookup
  key_hash    text not null,           -- encode(digest(full_key, 'sha256'), 'hex')
  name        text,                    -- user-assigned label
  revoked_at  timestamptz,             -- NULL = active
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Enable RLS on api_keys too (service role bypasses but explicit policy documents intent):
alter table api_keys enable row level security;

-- Validation function (security definer so service role can call it cleanly):
create or replace function public.validate_api_key(p_key text)
returns uuid   -- returns user_id if valid, null if invalid
language plpgsql security definer
as $$
declare
  v_user_id uuid;
  v_hash    text;
begin
  v_hash := encode(extensions.digest(p_key, 'sha256'), 'hex');
  select user_id into v_user_id
    from api_keys
   where key_hash = v_hash
     and revoked_at is null;
  return v_user_id;
end;
$$;
```

Key generation logic (TypeScript, for Phase 2 key-issuance tool):
```typescript
import { createHash, randomUUID } from 'node:crypto';

function generateApiKey(): { rawKey: string; keyHash: string; keyPrefix: string } {
  const rawKey = `fos_live_${randomUUID().replace(/-/g, '')}`;
  const keyHash = createHash('sha256').update(rawKey).digest('hex');
  const keyPrefix = rawKey.slice(0, 12); // "fos_live_" + first 3 UUID chars
  return { rawKey, keyHash, keyPrefix };
}
```

### Pattern 4: Postgres Enum Types

**What:** DB-level enums for status fields. Type-safe at the database and in generated TypeScript types.
**When to use:** All status columns (D-02).

```sql
-- Source: https://supabase.com/docs/guides/database/postgres/enums
create type project_status as enum ('active', 'paused', 'completed');
create type proposal_status as enum ('draft', 'sent', 'accepted', 'declined');
create type invoice_status as enum ('draft', 'sent', 'paid', 'overdue', 'void');
create type scope_change_classification as enum ('in_scope', 'out_of_scope', 'flagged');

-- Usage in table:
create table projects (
  ...
  status project_status not null default 'active',
  ...
);
```

Generated TypeScript types will include:
```typescript
export type Database = {
  public: {
    Enums: {
      project_status: 'active' | 'paused' | 'completed';
      // ...
    }
  }
}
```

### Pattern 5: TypeScript Type Generation

```bash
# Source: https://supabase.com/docs/reference/cli/supabase-gen-types
# From linked remote project (no Docker required):
npx supabase gen types typescript --linked > src/types/database.ts

# From local stack (requires Docker + supabase start):
npx supabase gen types typescript --local > src/types/database.ts
```

### Anti-Patterns to Avoid

- **Checking `auth.uid()` in RLS policies:** auth.uid() reads the JWT sub claim. The MCP server uses service role key — there is no JWT. Policies must use `current_setting('app.current_user_id', true)` instead.
- **Using service role key without setting user context:** Service role bypasses ALL RLS. If the `SET LOCAL app.current_user_id` is omitted before a query, the query runs as superuser with no row filtering — data from all users is visible.
- **Querying pgcrypto as `digest()` (no schema prefix):** In Supabase migrations, pgcrypto lives in the `extensions` schema. Use `extensions.digest()`, not `digest()`, in migration SQL. Alternatively, add `extensions` to search_path.
- **Forgetting `ENABLE ROW LEVEL SECURITY` before policies:** Creating policies without enabling RLS on the table is a silent no-op — policies are defined but never enforced.
- **Applying `archived_at IS NULL` to INSERT/UPDATE policies:** The `archived_at IS NULL` filter belongs in SELECT and UPDATE USING clauses only. INSERT WITH CHECK should not filter on archived_at (there is no existing row to check against on insert).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auto-update timestamps | Custom UPDATE triggers from scratch | `moddatetime` extension | Edge cases: `DEFAULT now()` on UPDATE does not work; triggers fire even if application forgets; moddatetime is battle-tested and maintained by the Postgres community |
| SHA-256 hashing in application | Node.js crypto before DB insert | `extensions.digest()` in validation function | Keeps hash computation and comparison in the DB; prevents timing attacks on comparison; centralizes the logic |
| RLS policy test assertions | Manually querying DB and comparing counts | pgTAP `supabase test db` | RLS failures are silent (no error, just missing rows); pgTAP allows `set_config` within test transactions to simulate user A/B isolation reliably |
| TypeScript database types | Manually typed interfaces | `supabase gen types typescript` | Hand-written types drift from schema; generated types re-run after every migration automatically |
| UUID primary keys | Auto-increment integers | `gen_random_uuid()` default | Prevents enumeration attacks; consistent with Supabase Auth user IDs (also UUIDs); required for multi-tenant FK relationships |

**Key insight:** The Supabase ecosystem is unusually self-contained for the data layer — the CLI, type generator, test runner, and extension library are all designed to work together. Resisting the urge to hand-roll any of these components saves significant maintenance burden.

---

## Common Pitfalls

### Pitfall 1: Service Role Key Silently Bypasses RLS
**What goes wrong:** MCP server initializes `createClient(url, serviceRoleKey)` and queries tables. All data for all users is returned because service role bypasses RLS. No error is thrown — the query just returns everything.
**Why it happens:** This is documented Supabase behavior. Service role is intended for admin operations where RLS should not apply.
**How to avoid:** Every query in the MCP server must be wrapped in a transaction that executes `SET LOCAL app.current_user_id = $userId` before any SELECT/INSERT/UPDATE. Verify by running the RLS pgTAP tests before any Phase 2 work.
**Warning signs:** A query returns rows with a `user_id` that does not match the authenticated user.

### Pitfall 2: moddatetime Extension Schema Prefix
**What goes wrong:** Migration runs `create extension if not exists moddatetime;` (without schema) and then `execute procedure moddatetime(updated_at)` — this works in the Supabase dashboard but fails in migrations with "function moddatetime() does not exist."
**Why it happens:** Supabase installs extensions into the `extensions` schema; migrations run with a search_path that does not include it by default.
**How to avoid:** Always use `create extension if not exists moddatetime schema extensions;` and reference it as `execute procedure extensions.moddatetime(updated_at)` in triggers.
**Warning signs:** `supabase db reset` fails with "function moddatetime() does not exist".

### Pitfall 3: pgcrypto digest() Missing Schema Prefix
**What goes wrong:** Migration uses `digest(key, 'sha256')` without schema prefix — works in dashboard SQL editor (which has a broader search_path) but fails when run via the CLI.
**Why it happens:** Same root cause as moddatetime — extensions schema not in default migration search_path.
**How to avoid:** Use `extensions.digest(key_value, 'sha256')` in all migration SQL.
**Warning signs:** Migration applies in dashboard but fails on `supabase db reset` or `supabase db push`.

### Pitfall 4: current_setting() Returns Empty String, Not NULL
**What goes wrong:** `current_setting('app.current_user_id', true)` returns an empty string (not NULL) when the config variable is not set. Casting to UUID throws an error.
**Why it happens:** The `true` (missing_ok) argument suppresses the "unrecognized configuration parameter" error but returns empty string instead of NULL.
**How to avoid:** The `current_app_user_id()` helper function must handle empty string: `NULLIF(current_setting('app.current_user_id', true), '')::uuid`. This returns NULL when not set, which causes the `user_id = current_app_user_id()` policy check to fail (correctly rejecting the query) rather than throwing a cast error.
**Warning signs:** Queries fail with "invalid input syntax for type uuid: ''" when no user context is set.

### Pitfall 5: Enum Values Cannot Be Removed
**What goes wrong:** An enum value is created (e.g., `proposal_status = 'pending'`) and later deemed wrong. `ALTER TYPE ... DROP VALUE` was not supported until Postgres 16 and is still risky if any rows use the value.
**Why it happens:** Postgres enums are append-only in practice.
**How to avoid:** Agree on all enum values before writing the migration. Document them in this research as authoritative. Do not add speculative values.
**Warning signs:** You need to add "remove an enum value" to a migration.

### Pitfall 6: RLS Policy Missing FROM Subquery Optimization
**What goes wrong:** Policy written as `using (user_id = current_app_user_id())` works correctly but the function is called once per row evaluated, causing performance issues at scale.
**Why it happens:** Supabase docs note that `(select auth.uid())` (with subquery wrapper) evaluates the function once per query rather than once per row.
**How to avoid:** Write all RLS policies as `using (user_id = (select current_app_user_id()))` — the subquery wrapper is a Postgres optimization hint.
**Warning signs:** Slow queries on tables with many rows for a single user; EXPLAIN ANALYZE shows function evaluated N times.

---

## Code Examples

Verified patterns from official sources:

### Enable RLS and Write Separate Per-Operation Policies
```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security
alter table clients enable row level security;

create policy "users select own clients"
  on clients for select
  using (
    user_id = (select current_app_user_id())
    and archived_at is null
  );

create policy "users insert own clients"
  on clients for insert
  with check (user_id = (select current_app_user_id()));

create policy "users update own clients"
  on clients for update
  using (user_id = (select current_app_user_id()))
  with check (user_id = (select current_app_user_id()));

-- No DELETE policy: soft-delete pattern uses UPDATE to set archived_at
```

### Generate TypeScript Types
```bash
# Source: https://supabase.com/docs/reference/cli/supabase-gen-types

# Step 1: link to the remote project (one-time)
npx supabase login
npx supabase link --project-ref <your-project-ref>

# Step 2: generate types (after each migration applied remotely)
npx supabase gen types typescript --linked > src/types/database.ts
```

### pgTAP RLS Isolation Test Pattern
```sql
-- Source: https://supabase.com/docs/guides/local-development/testing/overview
-- supabase/tests/rls_clients.test.sql
begin;
  create extension if not exists pgtap with schema extensions;
  select plan(3);

  -- Insert test data as user_1
  set local app.current_user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  insert into clients (user_id, name) values (current_setting('app.current_user_id')::uuid, 'Client A');

  -- Verify user_1 can see their own data
  select is(count(*)::int, 1, 'user_1 sees their own client')
    from clients where name = 'Client A';

  -- Switch to user_2
  set local app.current_user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  -- Verify user_2 cannot see user_1's data
  select is(count(*)::int, 0, 'user_2 cannot see user_1 client')
    from clients where name = 'Client A';

  select * from finish();
rollback;
```

### Migration File Naming Convention
Supabase CLI default format when using `supabase migration new <name>`:
```
supabase/migrations/20260328000001_create_extensions.sql
supabase/migrations/20260328000002_create_enums.sql
```
The timestamp prefix (YYYYMMDDHHmmss) ensures migrations apply in creation order regardless of filename alphabetical sort.

---

## Domain Table Schema

The nine required domain tables with their relationships (for use in migration planning):

```
auth.users          (Supabase Auth — pre-existing, not created in migrations)
  └─ api_keys       user_id → auth.users.id
  └─ clients        user_id → auth.users.id
       └─ projects       client_id → clients.id, user_id → auth.users.id
            └─ proposals      project_id → projects.id, client_id → clients.id
            └─ invoices       project_id → projects.id, client_id → clients.id
            └─ time_entries   project_id → projects.id
            └─ scope_definitions  project_id → projects.id (one per project)
            └─ scope_changes  project_id → projects.id
            └─ follow_ups     project_id → projects.id (nullable), client_id → clients.id
```

All domain tables also carry `user_id → auth.users.id` for RLS policy efficiency (avoids joins in policy checks).

**Recommended enum values (Claude's Discretion items resolved):**
```sql
create type project_status as enum ('active', 'paused', 'completed');
create type proposal_status as enum ('draft', 'sent', 'accepted', 'declined', 'expired');
create type invoice_status as enum ('draft', 'sent', 'paid', 'overdue', 'void');
create type scope_change_classification as enum ('in_scope', 'out_of_scope', 'needs_review');
create type follow_up_type as enum ('proposal_follow_up', 'invoice_overdue', 'check_in', 'awaiting_response', 'other');
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `npm install -g supabase` | `npm install --save-dev supabase` + `npx supabase` | ~2023 | Global npm install officially not supported; devDep install works on Windows without PATH issues |
| `auth.uid()` for all RLS | `current_setting()` when using service role | Ongoing pattern | Service role requires custom session variable; `auth.uid()` only works with JWT-authenticated clients |
| `moddatetime` without schema | `extensions.moddatetime` in migrations | Supabase CLI v1+ | Migration search_path differs from dashboard; schema prefix required in migration SQL |
| SHA-256 for API keys | SHA-256 remains appropriate for long random keys | — | bcrypt is better for passwords (low entropy); for 128-bit random UUIDs, SHA-256 is sufficient and simpler |

**Deprecated/outdated:**
- SSE transport in MCP: deprecated as of MCP spec 2025-03-26; use Streamable HTTP (out of phase scope but noted)
- Vault-based API key storage (j4w8n pattern): as of 2026 Supabase disabled the underlying infrastructure; simple pgcrypto hash in api_keys table is the current standard approach

---

## Open Questions

1. **Transaction wrapper for SET LOCAL in supabase-js**
   - What we know: `supabase-js` does not expose `BEGIN/SET LOCAL/COMMIT` transaction primitives directly. The standard `from().select()` API runs as individual statements.
   - What's unclear: Whether Phase 2 will use raw `postgres.js` for the transaction wrapper, or a Supabase RPC function that internally does `SET LOCAL`.
   - Recommendation: Phase 1 only needs the RLS policies and `current_app_user_id()` helper function in place. Phase 2 will resolve the transaction wrapper approach. Document as a Phase 2 decision.

2. **Supabase Auth user provisioning for API key issuance**
   - What we know: D-08 specifies `api_keys.user_id` references `auth.users(id)`. Users sign up via Supabase Auth first.
   - What's unclear: The user sign-up/provisioning flow is not part of this phase and is identified in STATE.md as a separate out-of-band concern (billing/provisioning system).
   - Recommendation: Phase 1 creates the `api_keys` table with the FK constraint. The sign-up flow is deferred. The seed data creates a test user directly in `auth.users` via `supabase/seed.sql` for development testing.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | All TypeScript work | Yes | v24.14.0 | — |
| npm | Package installation | Yes | 11.9.0 | — |
| Docker Desktop | `supabase start` (local stack) | No | — | Use `--db-url` flag to push migrations directly to remote hosted Supabase without local stack |
| Supabase CLI | Migrations, type gen, tests | No (not installed) | — | Install as dev dep: `npm install --save-dev supabase`; run via `npx supabase` |
| psql | Direct DB inspection | No | — | Supabase dashboard SQL editor; `supabase db push` covers migration application |
| Hosted Supabase project | All DB operations | Unknown | — | Must be created at supabase.com before any migrations can be applied |

**Missing dependencies with no fallback:**
- Hosted Supabase project: Must be created at supabase.com before Phase 1 can begin. Wave 0 must include this step.

**Missing dependencies with fallback:**
- Docker Desktop: Required for `supabase start` (local stack validation) and `supabase test db`. Without Docker, migrations can still be written and pushed to remote via `supabase db push --db-url`. However, pgTAP RLS tests require `supabase test db` which requires the local stack (Docker). If Docker is unavailable, RLS validation becomes manual.
- Supabase CLI: Not globally installed. Install as dev dependency (`npm install --save-dev supabase`) — this is actually the recommended approach for Windows. No blocking issue.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pgTAP (Supabase built-in) + vitest 4.1.2 (TypeScript unit tests) |
| Config file | `supabase/config.toml` (generated by `supabase init`); `vitest.config.ts` (Wave 0 gap) |
| Quick run command | `npx supabase test db` (RLS tests); `npx vitest run` (TypeScript unit tests) |
| Full suite command | `npx supabase test db && npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| INFRA-01 | All 9 domain tables exist with correct FK relationships | SQL/pgTAP schema test | `npx supabase test db` | Wave 0 |
| INFRA-02 | Valid API key returns user_id; invalid/missing returns null | SQL/pgTAP unit test + vitest | `npx supabase test db && npx vitest run` | Wave 0 |
| INFRA-03 | User A queries return only User A rows; User B rows absent | SQL/pgTAP RLS isolation test | `npx supabase test db` | Wave 0 |
| INFRA-03 | TypeScript types generated and importable | TypeScript compile check | `npx tsc --noEmit` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run` (TypeScript unit tests, fast)
- **Per wave merge:** `npx supabase test db && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `supabase/tests/rls_clients.test.sql` — covers INFRA-03 for clients table
- [ ] `supabase/tests/rls_projects.test.sql` — covers INFRA-03 for projects table
- [ ] `supabase/tests/api_key_validation.test.sql` — covers INFRA-02
- [ ] `supabase/tests/schema_exists.test.sql` — covers INFRA-01 (all tables present)
- [ ] `vitest.config.ts` — configuration for TypeScript unit tests
- [ ] Framework install: `npm install --save-dev supabase vitest typescript` — no package.json exists yet
- [ ] `supabase init` — generates `supabase/config.toml`; must run before any migrations
- [ ] Hosted Supabase project creation — required before `supabase link` and `supabase db push`

*(Docker Desktop installation is a human prerequisite for `supabase test db` — flag for executor)*

---

## Sources

### Primary (HIGH confidence)
- [supabase.com/docs/guides/database/postgres/row-level-security](https://supabase.com/docs/guides/database/postgres/row-level-security) — RLS policy SQL syntax, USING vs WITH CHECK, per-operation policies, auth.uid() pattern
- [supabase.com/docs/reference/cli/supabase-gen-types](https://supabase.com/docs/reference/cli/supabase-gen-types) — Type generation flags (--linked, --local, --project-id), output to stdout
- [supabase.com/docs/reference/cli/supabase-db-push](https://supabase.com/docs/reference/cli/supabase-db-push) — Push flags (--db-url, --dry-run, --linked)
- [supabase.com/docs/guides/local-development/testing/overview](https://supabase.com/docs/guides/local-development/testing/overview) — pgTAP test structure, `supabase test db`, test file location
- [supabase.com/docs/guides/deployment/database-migrations](https://supabase.com/docs/guides/deployment/database-migrations) — Migration workflow, supabase link + db push
- [supabase.com/docs/guides/local-development/cli/getting-started](https://supabase.com/docs/guides/local-development/cli/getting-started) — CLI installation (npx/devDep preferred on Windows; Docker required for local stack)
- [postgresql.org/docs/current/pgcrypto.html](https://www.postgresql.org/docs/current/pgcrypto.html) — `digest()` function, SHA-256 support, `encode(..., 'hex')` pattern
- npm registry (verified 2026-03-28): @supabase/supabase-js@2.100.1, supabase@2.84.4, typescript@6.0.2, vitest@4.1.2

### Secondary (MEDIUM confidence)
- [dev.to/paullaros/updating-timestamps-automatically-in-supabase-5f5o](https://dev.to/paullaros/updating-timestamps-automatically-in-supabase-5f5o) — moddatetime schema prefix requirement (`schema extensions`), trigger creation pattern — verified against Supabase CLI GitHub issues #151 and #4198 which confirm the schema prefix bug
- [dev.to/blackie360/-enforcing-row-level-security-in-supabase-a-deep-dive-into-lockins-multi-tenant-architecture-4hd2](https://dev.to/blackie360/-enforcing-row-level-security-in-supabase-a-deep-dive-into-lockins-multi-tenant-architecture-4hd2) — `current_setting('app.current_user_id')` in RLS policies + COALESCE pattern — cross-verified against PostgreSQL system admin functions docs
- [marmelab.com/blog/2025/12/08/supabase-edge-function-transaction-rls.html](https://marmelab.com/blog/2025/12/08/supabase-edge-function-transaction-rls.html) — `SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub = $1` transaction pattern (2025 dated article)
- [supabase.com/docs/guides/database/postgres/enums](https://supabase.com/docs/guides/database/postgres/enums) — CREATE TYPE AS ENUM syntax

### Tertiary (LOW confidence — flagged for validation)
- makerkit.dev API key management guide — bcrypt recommendation for API keys (de-prioritized; SHA-256 is sufficient for high-entropy random UUIDs per D-05)
- supabase-community/supabase-test-helpers GitHub — pgTAP helper functions (`tests.authenticate_as()`) — useful for Phase 1 tests but not verified against current Supabase CLI version

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all package versions verified against npm registry 2026-03-28
- Architecture (RLS pattern): MEDIUM-HIGH — core PostgreSQL `set_config`/`current_setting` is HIGH (official Postgres docs); the specific `app.current_user_id` pattern is MEDIUM (multiple independent sources agree; no single official Supabase doc covers it explicitly)
- moddatetime extension: HIGH — schema prefix requirement confirmed by official Supabase CLI GitHub issues
- pgcrypto SHA-256: HIGH — official PostgreSQL docs
- Pitfalls: HIGH for most (verified from official sources or CLI GitHub issues); MEDIUM for enum removal restriction (PostgreSQL docs confirm, behavior unchanged)
- Environment availability: HIGH — direct shell checks performed

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable ecosystem; Supabase CLI minor versions may update but patterns are stable)
