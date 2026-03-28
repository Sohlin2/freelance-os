begin;
  create extension if not exists pgtap with schema extensions;
  select plan(9);

  -- Verify all 9 domain tables exist
  select has_table('public', 'api_keys', 'api_keys table exists');
  select has_table('public', 'clients', 'clients table exists');
  select has_table('public', 'projects', 'projects table exists');
  select has_table('public', 'proposals', 'proposals table exists');
  select has_table('public', 'invoices', 'invoices table exists');
  select has_table('public', 'time_entries', 'time_entries table exists');
  select has_table('public', 'scope_definitions', 'scope_definitions table exists');
  select has_table('public', 'scope_changes', 'scope_changes table exists');
  select has_table('public', 'follow_ups', 'follow_ups table exists');

  select * from finish();
rollback;
