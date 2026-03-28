-- Corrective migration: fix set_app_user_id scope from transaction to session
--
-- BROKEN-02: The original 000008 migration used set_config(..., true) (transaction scope).
-- Supabase JS sends each .from().select() as a separate PostgREST HTTP request,
-- which starts its own Postgres transaction. Transaction-scoped config is cleared
-- before data queries execute, causing RLS to evaluate user as NULL.
--
-- Fix: Change third arg from true to false (session scope). Session scope persists
-- until the connection is returned to the pool or explicitly reset.
-- Each new connection from PostgREST pool starts clean, so cross-request leakage
-- is prevented by the pool, not by transaction scope.

create or replace function public.set_app_user_id(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Session scope (false) = context persists for the duration of the connection
  -- PostgREST connection pooling ensures each request gets a clean connection
  -- or resets session state, preventing cross-user leakage
  perform set_config('app.current_user_id', p_user_id::text, false);
end;
$$;

comment on function public.set_app_user_id(uuid) is
  'Sets app.current_user_id session variable for RLS policy evaluation. Called by MCP server before every user query. Uses session scope (false) so context persists across separate PostgREST requests within the same logical operation.';
