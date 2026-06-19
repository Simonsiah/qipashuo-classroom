# Supabase Setup

This directory contains the database schema for the 奇葩说 Classroom Edition app.

## Steps

1. Create a new project in the [Supabase dashboard](https://supabase.com/dashboard).
2. Open the project's **SQL Editor** and run the contents of [`schema.sql`](./schema.sql).
   This creates the `rooms` and `votes` tables, enables Row Level Security with
   public read policies, and adds the `votes` table to the `supabase_realtime`
   publication so vote changes stream to clients.
3. From **Project Settings → API**, copy the following into your local `.env.local`
   (see [`.env.local.example`](../.env.local.example) at the repo root):
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

The `service_role` key is secret and must never be exposed to the browser; it is
only used server-side via `src/lib/supabaseAdmin.ts`.
