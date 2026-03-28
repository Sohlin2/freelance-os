-- Exposes set_config to supabase-js via RPC (supabase-js has no raw SQL API)
-- Called by MCP server auth flow before every user-scoped query
--
-- NOTE: Uses transaction scope (set_config 3rd arg = true) deliberately.
-- This is safer than session scope (false) because the user context is
-- automatically cleared at transaction end, preventing cross-request leakage.
-- The RESEARCH.md Pattern 3 example used session scope (false), but the
-- research open question 3 analysis recommended transaction scope (true).
create or replace function public.set_app_user_id(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Transaction scope (true) = context cleared automatically at transaction end
  -- Session scope (false) would persist until explicitly reset or connection closes
  perform set_config('app.current_user_id', p_user_id::text, true);
end;
$$;

comment on function public.set_app_user_id(uuid) is
  'Sets app.current_user_id session variable for RLS policy evaluation. Called by MCP server before every user query. Uses transaction scope (true) for safety — see research open question 3.';
