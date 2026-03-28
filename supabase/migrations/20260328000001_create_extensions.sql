-- Enable required extensions in the extensions schema
-- Using `schema extensions` to avoid search_path conflicts in Supabase migrations
-- (bare `create extension` may create objects in public schema — use explicit schema)
create extension if not exists pgcrypto schema extensions;
create extension if not exists moddatetime schema extensions;
