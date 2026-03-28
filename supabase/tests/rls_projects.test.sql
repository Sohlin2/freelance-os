begin;
  create extension if not exists pgtap with schema extensions;
  select plan(3);

  -- Create test users
  insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at, instance_id, aud, role)
  values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'user_a@test.dev', '{}'::jsonb, now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'user_b@test.dev', '{}'::jsonb, now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated');

  -- Create clients first (FK requirement)
  set local app.current_user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  insert into clients (id, user_id, name) values ('cccccccc-cccc-cccc-cccc-cccccccccc01'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'A Client');

  set local app.current_user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  insert into clients (id, user_id, name) values ('cccccccc-cccc-cccc-cccc-cccccccccc02'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'B Client');

  -- Create projects
  set local app.current_user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  insert into projects (user_id, client_id, name, status) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccc01'::uuid, 'Project A', 'active');

  set local app.current_user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  insert into projects (user_id, client_id, name, status) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccc02'::uuid, 'Project B', 'active');

  -- Test 1: User A sees only their project
  set local app.current_user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  select is(
    (select count(*)::int from projects),
    1,
    'User A sees exactly 1 project'
  );

  -- Test 2: User B sees only their project
  set local app.current_user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  select is(
    (select count(*)::int from projects),
    1,
    'User B sees exactly 1 project'
  );

  -- Test 3: User B cannot see User A's project
  select is(
    (select count(*)::int from projects where name = 'Project A'),
    0,
    'User B cannot see Project A'
  );

  select * from finish();
rollback;
