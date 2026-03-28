-- api_keys table (per D-05, D-06, D-07, D-08)
create table api_keys (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  key_prefix  text not null,
  key_hash    text not null,
  name        text,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index for fast lookup by hash
create index idx_api_keys_key_hash on api_keys (key_hash);
-- Index for listing user's keys
create index idx_api_keys_user_id on api_keys (user_id);

-- moddatetime trigger (per D-03)
create trigger handle_updated_at
  before update on api_keys
  for each row
  execute procedure extensions.moddatetime(updated_at);

-- Enable RLS (per D-11, D-12)
alter table api_keys enable row level security;

-- RLS: users can see their own keys
create policy "users select own api_keys"
  on api_keys for select
  using (user_id = (select current_app_user_id()) and revoked_at is null);

create policy "users insert own api_keys"
  on api_keys for insert
  with check (user_id = (select current_app_user_id()));

create policy "users update own api_keys"
  on api_keys for update
  using (user_id = (select current_app_user_id()))
  with check (user_id = (select current_app_user_id()));

-- validate_api_key function (security definer, per D-05, D-09)
create or replace function public.validate_api_key(p_key text)
returns uuid
language plpgsql security definer
as $$
declare
  v_user_id uuid;
  v_hash text;
begin
  v_hash := encode(extensions.digest(p_key, 'sha256'), 'hex');
  select user_id into v_user_id
    from api_keys
   where key_hash = v_hash
     and revoked_at is null;
  return v_user_id;
end;
$$;

comment on function public.validate_api_key(text) is
  'Validates an API key by hashing it and looking up the user_id. Returns NULL if key is invalid or revoked.';
