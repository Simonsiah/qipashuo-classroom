import { createClient } from "@supabase/supabase-js";

// Fallbacks keep the constructor from throwing at import time (e.g. during
// `next build` when env vars aren't present). At runtime the real values are
// supplied via env; without them the client simply can't reach Supabase.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "anon-key-placeholder";

export const supabase = createClient(url, anonKey);
