begin;
  create extension if not exists pgtap with schema extensions;
  select plan(3);

  -- Create two test users
  insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at, instance_id, aud, role)
  values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'user_a@test.dev', '{}'::jsonb, now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'user_b@test.dev', '{}'::jsonb, now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated');

  -- Insert client as User A (bypass RLS with set local for setup)
  set local app.current_user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  insert into clients (user_id, name, email)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Session Scope Client', 'session@test.dev');

  -- Reset to clear any local setting
  reset app.current_user_id;

  -- Test 1: set_app_user_id executes without error
  select lives_ok(
    $$ select set_app_user_id('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid) $$,
    'set_app_user_id executes without error'
  );

  -- Test 2: After RPC call for User A, RLS returns User A data
  -- (This proves session scope works — the RPC set the config and it persists)
  perform set_app_user_id('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid);
  select is(
    (select count(*)::int from clients where name = 'Session Scope Client'),
    1,
    'User A sees own client after set_app_user_id RPC call (session scope works)'
  );

  -- Test 3: After RPC call for User B, RLS hides User A data
  perform set_app_user_id('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid);
  select is(
    (select count(*)::int from clients where name = 'Session Scope Client'),
    0,
    'User B cannot see User A client after set_app_user_id RPC call (RLS isolates)'
  );

  select * from finish();
rollback;
