-- Helper to look up auth user ID by email (used by webhook for idempotent user creation)
create or replace function get_user_id_by_email(p_email text)
returns uuid
language sql
security definer
set search_path = ''
as $$
  select id from auth.users where email = p_email limit 1;
$$;
