-- Enum types (D-02: Postgres enums for all status fields)
-- Values match the full freelance lifecycle domain
create type project_status as enum ('active', 'paused', 'completed');
create type proposal_status as enum ('draft', 'sent', 'accepted', 'declined', 'expired');
create type invoice_status as enum ('draft', 'sent', 'paid', 'overdue', 'void');
create type scope_change_classification as enum ('in_scope', 'out_of_scope', 'needs_review');
create type follow_up_type as enum ('proposal_follow_up', 'invoice_overdue', 'check_in', 'awaiting_response', 'other');

-- Helper function for RLS policies (D-09)
-- Used by all domain table RLS policies to identify the current user from session context.
-- MCP server sets this via: set_config('app.current_user_id', user_id, false)
-- Returns NULL if not set (unauthenticated context).
-- NULLIF handles the case where current_setting returns '' instead of NULL when unset (Pitfall 4).
-- STABLE (not VOLATILE) because the session variable does not change within a transaction.
create or replace function public.current_app_user_id()
returns uuid
language sql stable
as $$
  select nullif(current_setting('app.current_user_id', true), '')::uuid;
$$;

comment on function public.current_app_user_id() is
  'Returns the current authenticated user ID from the session variable set by the MCP server. Returns NULL if not set.';
