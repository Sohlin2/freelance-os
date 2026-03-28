import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.js';

export function createUserClient(): SupabaseClient<Database> {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function withUserContext<T>(
  userId: string,
  fn: (db: SupabaseClient<Database>) => Promise<T>
): Promise<T> {
  const db = createUserClient();
  // Uses session scope (set_config 3rd arg = false) — PostgREST sends each
  // .from().select() as a separate HTTP request / Postgres transaction.
  // Transaction scope (true) would clear user context before data queries execute.
  // Session scope persists across requests within the same connection.
  // Connection pooling prevents cross-user leakage (each pool checkout is clean).
  // See migration 000009 for the corrective fix (000008 originally used true).
  await db.rpc('set_app_user_id', { p_user_id: userId });
  return fn(db);
}
