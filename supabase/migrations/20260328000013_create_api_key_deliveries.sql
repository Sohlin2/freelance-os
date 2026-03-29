-- One-time API key delivery records (key shown once after checkout, then deleted)
create table api_key_deliveries (
  id uuid primary key default gen_random_uuid(),
  retrieval_token text not null unique,
  api_key_raw text not null,
  email text not null,
  plan text not null,
  expires_at timestamptz not null default (now() + interval '1 hour'),
  created_at timestamptz not null default now()
);

create index idx_api_key_deliveries_token on api_key_deliveries(retrieval_token);

alter table api_key_deliveries enable row level security;

grant select, insert, delete on api_key_deliveries to service_role;
