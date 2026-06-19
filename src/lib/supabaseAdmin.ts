import { createClient } from "@supabase/supabase-js";
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "service-role-placeholder";
  return createClient(url, key, { auth: { persistSession: false } });
}
