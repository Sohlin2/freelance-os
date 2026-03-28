begin;
  create extension if not exists pgtap with schema extensions;
  select plan(3);

  -- Create test user
  insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at, instance_id, aud, role)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'test@test.dev', '{}'::jsonb, now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated');

  -- Create API key with known hash
  insert into api_keys (user_id, key_prefix, key_hash, name)
  values (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'fos_live_tes',
    encode(extensions.digest('fos_live_test_key_12345678901234567890', 'sha256'), 'hex'),
    'Test key'
  );

  -- Test 1: Valid key returns correct user_id
  select is(
    validate_api_key('fos_live_test_key_12345678901234567890'),
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'valid API key returns correct user_id'
  );

  -- Test 2: Invalid key returns NULL
  select is(
    validate_api_key('fos_live_invalid_key_does_not_exist'),
    null::uuid,
    'invalid API key returns NULL'
  );

  -- Test 3: Revoked key returns NULL
  update api_keys set revoked_at = now() where key_prefix = 'fos_live_tes';
  select is(
    validate_api_key('fos_live_test_key_12345678901234567890'),
    null::uuid,
    'revoked API key returns NULL'
  );

  select * from finish();
rollback;
