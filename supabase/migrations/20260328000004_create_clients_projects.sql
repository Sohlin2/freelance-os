-- clients table
create table clients (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  email         text,
  phone         text,
  company       text,
  billing_rate  numeric(10, 2),
  currency      text not null default 'USD',
  notes         text,
  archived_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_clients_user_id on clients (user_id);

create trigger handle_updated_at
  before update on clients
  for each row
  execute procedure extensions.moddatetime(updated_at);

alter table clients enable row level security;

-- RLS per D-09, D-10, D-11 with subquery optimization (Pitfall 6)
create policy "users select own clients"
  on clients for select
  using (user_id = (select current_app_user_id()) and archived_at is null);

create policy "users insert own clients"
  on clients for insert
  with check (user_id = (select current_app_user_id()));

create policy "users update own clients"
  on clients for update
  using (user_id = (select current_app_user_id()))
  with check (user_id = (select current_app_user_id()));

-- No DELETE policy: soft delete via UPDATE to set archived_at (per D-04)

-- projects table
create table projects (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  client_id     uuid not null references clients(id) on delete cascade,
  name          text not null,
  description   text,
  status        project_status not null default 'active',
  budget        numeric(12, 2),
  currency      text not null default 'USD',
  start_date    date,
  end_date      date,
  archived_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_projects_user_id on projects (user_id);
create index idx_projects_client_id on projects (client_id);
create index idx_projects_status on projects (status);

create trigger handle_updated_at
  before update on projects
  for each row
  execute procedure extensions.moddatetime(updated_at);

alter table projects enable row level security;

create policy "users select own projects"
  on projects for select
  using (user_id = (select current_app_user_id()) and archived_at is null);

create policy "users insert own projects"
  on projects for insert
  with check (user_id = (select current_app_user_id()));

create policy "users update own projects"
  on projects for update
  using (user_id = (select current_app_user_id()))
  with check (user_id = (select current_app_user_id()));
