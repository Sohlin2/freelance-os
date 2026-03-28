-- ============================================================
-- DEV-ONLY SEED DATA — DO NOT USE IN PRODUCTION
-- ============================================================
-- This seed file creates test users directly in auth.users
-- and populates domain tables with realistic sample data.
-- Run via: npx supabase db reset (resets + re-seeds)
-- ============================================================

-- Test User A (primary test user)
insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at, instance_id, aud, role)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'alice@test.dev',
  '{"name": "Alice Freelancer"}'::jsonb,
  now(), now(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated'
);

-- Test User B (for RLS isolation testing)
insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at, instance_id, aud, role)
values (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'bob@test.dev',
  '{"name": "Bob Freelancer"}'::jsonb,
  now(), now(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated'
);

-- API Key for User A
-- Raw key: fos_live_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4
-- SHA-256 hash computed by: encode(extensions.digest('fos_live_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4', 'sha256'), 'hex')
insert into api_keys (id, user_id, key_prefix, key_hash, name)
values (
  '11111111-1111-1111-1111-111111111111',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'fos_live_a1b',
  encode(extensions.digest('fos_live_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4', 'sha256'), 'hex'),
  'Alice dev key'
);

-- API Key for User B
insert into api_keys (id, user_id, key_prefix, key_hash, name)
values (
  '22222222-2222-2222-2222-222222222222',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'fos_live_x9y',
  encode(extensions.digest('fos_live_x9y8z7w6v5u4x9y8z7w6v5u4x9y8z7w6', 'sha256'), 'hex'),
  'Bob dev key'
);

-- Clients for User A
insert into clients (id, user_id, name, email, company, billing_rate, currency, notes)
values
  ('cccccccc-cccc-cccc-cccc-cccccccccc01', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Acme Corp', 'contact@acme.com', 'Acme Corporation', 150.00, 'USD', 'Long-term client, prefers email communication'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc02', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'StartupXYZ', 'hello@startupxyz.io', 'StartupXYZ Inc', 175.00, 'USD', 'Early-stage startup, flexible on scope');

-- Client for User B (for RLS isolation testing)
insert into clients (id, user_id, name, email, company, billing_rate, currency)
values ('cccccccc-cccc-cccc-cccc-cccccccccc03', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Bob Client Inc', 'info@bobclient.com', 'Bob Client Inc', 200.00, 'USD');

-- Projects for User A
insert into projects (id, user_id, client_id, name, description, status, budget, start_date)
values
  ('pppppppp-pppp-pppp-pppp-pppppppppp01', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccc01', 'Website Redesign', 'Full redesign of acme.com', 'active', 15000.00, '2026-03-01'),
  ('pppppppp-pppp-pppp-pppp-pppppppppp02', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccc02', 'MVP Build', 'Build MVP for StartupXYZ product', 'active', 25000.00, '2026-03-15');

-- Project for User B (for RLS isolation testing)
insert into projects (id, user_id, client_id, name, description, status, budget)
values ('pppppppp-pppp-pppp-pppp-pppppppppp03', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccc03', 'Bob Project', 'Bob private project', 'active', 10000.00);
