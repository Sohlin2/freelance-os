-- Fix mutable search_path on security definer functions (Supabase security advisory)
-- See: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
alter function public.set_app_user_id(uuid) set search_path = '';
alter function public.validate_api_key(text) set search_path = '';
alter function public.current_app_user_id() set search_path = '';
