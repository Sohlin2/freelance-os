begin;
  create extension if not exists pgtap with schema extensions;
  select plan(4);

  -- Create two test users
  insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at, instance_id, aud, role)
  values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'user_a@test.dev', '{}'::jsonb, now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'user_b@test.dev', '{}'::jsonb, now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated');

  -- Insert clients as User A
  set local app.current_user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  insert into clients (user_id, name, email) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Client A1', 'a1@test.dev');
  insert into clients (user_id, name, email) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Client A2', 'a2@test.dev');

  -- Insert client as User B
  set local app.current_user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  insert into clients (user_id, name, email) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'Client B1', 'b1@test.dev');

  -- Test 1: User A sees only their own clients
  set local app.current_user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  select is(
    (select count(*)::int from clients),
    2,
    'User A sees exactly 2 clients'
  );

  -- Test 2: User B sees only their own client
  set local app.current_user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  select is(
    (select count(*)::int from clients),
    1,
    'User B sees exactly 1 client'
  );

  -- Test 3: User B cannot see User A's client names
  select is(
    (select count(*)::int from clients where name = 'Client A1'),
    0,
    'User B cannot see Client A1'
  );

  -- Test 4: Archived clients are hidden
  set local app.current_user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  update clients set archived_at = now() where name = 'Client A2';
  select is(
    (select count(*)::int from clients),
    1,
    'User A sees 1 client after archiving one'
  );

  select * from finish();
rollback;
