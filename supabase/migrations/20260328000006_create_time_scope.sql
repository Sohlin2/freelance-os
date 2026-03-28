-- time_entries table
create table time_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  project_id    uuid not null references projects(id) on delete cascade,
  description   text not null,
  duration_minutes integer not null,
  entry_date    date not null default current_date,
  billable      boolean not null default true,
  archived_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_time_entries_user_id on time_entries (user_id);
create index idx_time_entries_project_id on time_entries (project_id);
create index idx_time_entries_entry_date on time_entries (entry_date);

create trigger handle_updated_at
  before update on time_entries
  for each row
  execute procedure extensions.moddatetime(updated_at);

alter table time_entries enable row level security;

create policy "users select own time_entries"
  on time_entries for select
  using (user_id = (select current_app_user_id()) and archived_at is null);

create policy "users insert own time_entries"
  on time_entries for insert
  with check (user_id = (select current_app_user_id()));

create policy "users update own time_entries"
  on time_entries for update
  using (user_id = (select current_app_user_id()))
  with check (user_id = (select current_app_user_id()));

-- scope_definitions table (one per project)
create table scope_definitions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  project_id    uuid not null references projects(id) on delete cascade,
  deliverables  text not null,
  boundaries    text,
  assumptions   text,
  exclusions    text,
  archived_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (project_id)
);

create index idx_scope_definitions_user_id on scope_definitions (user_id);
create index idx_scope_definitions_project_id on scope_definitions (project_id);

create trigger handle_updated_at
  before update on scope_definitions
  for each row
  execute procedure extensions.moddatetime(updated_at);

alter table scope_definitions enable row level security;

create policy "users select own scope_definitions"
  on scope_definitions for select
  using (user_id = (select current_app_user_id()) and archived_at is null);

create policy "users insert own scope_definitions"
  on scope_definitions for insert
  with check (user_id = (select current_app_user_id()));

create policy "users update own scope_definitions"
  on scope_definitions for update
  using (user_id = (select current_app_user_id()))
  with check (user_id = (select current_app_user_id()));

-- scope_changes table
create table scope_changes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  project_id      uuid not null references projects(id) on delete cascade,
  description     text not null,
  classification  scope_change_classification not null default 'needs_review',
  impact          text,
  requested_at    timestamptz not null default now(),
  resolved_at     timestamptz,
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_scope_changes_user_id on scope_changes (user_id);
create index idx_scope_changes_project_id on scope_changes (project_id);

create trigger handle_updated_at
  before update on scope_changes
  for each row
  execute procedure extensions.moddatetime(updated_at);

alter table scope_changes enable row level security;

create policy "users select own scope_changes"
  on scope_changes for select
  using (user_id = (select current_app_user_id()) and archived_at is null);

create policy "users insert own scope_changes"
  on scope_changes for insert
  with check (user_id = (select current_app_user_id()));

create policy "users update own scope_changes"
  on scope_changes for update
  using (user_id = (select current_app_user_id()))
  with check (user_id = (select current_app_user_id()));
