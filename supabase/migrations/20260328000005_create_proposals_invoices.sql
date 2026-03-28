-- proposals table
create table proposals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  client_id     uuid not null references clients(id) on delete cascade,
  project_id    uuid not null references projects(id) on delete cascade,
  title         text not null,
  content       text,
  status        proposal_status not null default 'draft',
  amount        numeric(12, 2),
  currency      text not null default 'USD',
  valid_until   date,
  sent_at       timestamptz,
  responded_at  timestamptz,
  archived_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_proposals_user_id on proposals (user_id);
create index idx_proposals_project_id on proposals (project_id);
create index idx_proposals_client_id on proposals (client_id);
create index idx_proposals_status on proposals (status);

create trigger handle_updated_at
  before update on proposals
  for each row
  execute procedure extensions.moddatetime(updated_at);

alter table proposals enable row level security;

create policy "users select own proposals"
  on proposals for select
  using (user_id = (select current_app_user_id()) and archived_at is null);

create policy "users insert own proposals"
  on proposals for insert
  with check (user_id = (select current_app_user_id()));

create policy "users update own proposals"
  on proposals for update
  using (user_id = (select current_app_user_id()))
  with check (user_id = (select current_app_user_id()));

-- invoices table
create table invoices (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  client_id       uuid not null references clients(id) on delete cascade,
  project_id      uuid not null references projects(id) on delete cascade,
  proposal_id     uuid references proposals(id),
  invoice_number  text not null,
  status          invoice_status not null default 'draft',
  line_items      jsonb not null default '[]'::jsonb,
  subtotal        numeric(12, 2) not null default 0,
  tax_rate        numeric(5, 4) default 0,
  tax_amount      numeric(12, 2) not null default 0,
  total           numeric(12, 2) not null default 0,
  currency        text not null default 'USD',
  issued_at       timestamptz,
  due_date        date,
  paid_at         timestamptz,
  notes           text,
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_invoices_user_id on invoices (user_id);
create index idx_invoices_project_id on invoices (project_id);
create index idx_invoices_client_id on invoices (client_id);
create index idx_invoices_status on invoices (status);

create trigger handle_updated_at
  before update on invoices
  for each row
  execute procedure extensions.moddatetime(updated_at);

alter table invoices enable row level security;

create policy "users select own invoices"
  on invoices for select
  using (user_id = (select current_app_user_id()) and archived_at is null);

create policy "users insert own invoices"
  on invoices for insert
  with check (user_id = (select current_app_user_id()));

create policy "users update own invoices"
  on invoices for update
  using (user_id = (select current_app_user_id()))
  with check (user_id = (select current_app_user_id()));
