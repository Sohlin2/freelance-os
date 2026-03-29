-- subscriptions table for Stripe billing
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  stripe_subscription_id text unique,
  plan text not null default 'monthly',
  status text not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_subscriptions_user_id on subscriptions(user_id);
create index idx_subscriptions_stripe_customer_id on subscriptions(stripe_customer_id);

create trigger handle_updated_at
  before update on subscriptions
  for each row
  execute procedure extensions.moddatetime(updated_at);

alter table subscriptions enable row level security;

-- Users can read their own subscription
create policy "users select own subscriptions"
  on subscriptions for select
  using (user_id = (select current_app_user_id()));

-- Grant access to roles
grant select, insert, update on subscriptions to anon, authenticated, service_role;
