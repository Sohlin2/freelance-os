-- follow_ups table (project_id nullable per Domain Table Schema)
create table follow_ups (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  client_id     uuid not null references clients(id) on delete cascade,
  project_id    uuid references projects(id) on delete set null,
  type          follow_up_type not null default 'check_in',
  subject       text not null,
  content       text not null,
  sent_at       timestamptz,
  archived_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_follow_ups_user_id on follow_ups (user_id);
create index idx_follow_ups_client_id on follow_ups (client_id);
create index idx_follow_ups_project_id on follow_ups (project_id);

create trigger handle_updated_at
  before update on follow_ups
  for each row
  execute procedure extensions.moddatetime(updated_at);

alter table follow_ups enable row level security;

create policy "users select own follow_ups"
  on follow_ups for select
  using (user_id = (select current_app_user_id()) and archived_at is null);

create policy "users insert own follow_ups"
  on follow_ups for insert
  with check (user_id = (select current_app_user_id()));

create policy "users update own follow_ups"
  on follow_ups for update
  using (user_id = (select current_app_user_id()))
  with check (user_id = (select current_app_user_id()));
