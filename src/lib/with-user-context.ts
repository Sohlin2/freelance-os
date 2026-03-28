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
  // Uses transaction scope (true) deliberately — safer than session scope (false)
  // because context auto-clears at transaction end, preventing cross-request leakage.
  // RESEARCH.md Pattern 3 used session scope (false), but open question 3 analysis
  // recommended transaction scope (true). See migration SQL for matching comment.
  await db.rpc('set_app_user_id', { p_user_id: userId });
  return fn(db);
}
