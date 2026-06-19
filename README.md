# 奇葩说 · Classroom Edition

A 奇葩说-style classroom debate game. The projector shows a live **Stage** (arena,
timers, vote bar); students vote from their phones by entering a 4-digit room code.
The winner is decided not by the final headcount but by the **vote swing** — how
many people each side flipped between the opening vote (开场票) and the final vote
(终票). *"你没有赢下全场，你改变了全场。"*

## Tech stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS v4**
- **Supabase** — Postgres + Realtime (live vote updates)
- **Vitest** + jsdom + React Testing Library

## Setup

1. **Env file** — copy the example and fill it in:

   ```bash
   cp .env.local.example .env.local
   ```

2. **Supabase project** — create a project at [supabase.com](https://supabase.com).
   Open the **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql).

3. **Fill the 4 env vars** in `.env.local`:

   | Variable | Where to find it | Notes |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | browser/realtime client |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API | server-only, keep secret |
   | `NEXT_PUBLIC_BASE_URL` | your app's public origin | **critical for the QR** — phones can't resolve a relative path, so this must be the deployed origin (e.g. `https://your-app.vercel.app`) or `http://<your-LAN-ip>:3000` for local testing |

4. **Install + run:**

   ```bash
   npm install
   npm run dev
   ```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server (http://localhost:3000) |
| `npm run build` | Production build |
| `npm test` | Run the Vitest suite once |

## How to run a match (teacher)

1. Open `/` on the projector machine, fill in the **setup form** (topic, side labels,
   debaters, default timer), and press **Start**.
2. The projector navigates to `/room/<code>` — the **Stage**. Drive the whole match
   from the keyboard:

| Key | Action |
| --- | --- |
| `SPACE` | Single timer: start / pause · Double timer: start, then switch the clock to the other side |
| `←` / `→` | Adjust the clock −30s / +30s |
| `R` | Reset the timer |
| `T` | Toggle single ↔ double (per-side) timer |
| `P` | Lock the **pre-vote** (开场票) |
| `F` | Lock the **final vote** (终票) and reveal the swing winner |
| `Esc` | Back to setup |

A typical flow: lock the pre-vote with `P` before arguments begin, run the debate
on the timer, then lock the final vote with `F` to reveal who swung more of the room.

## How students join

- Scan the QR on the Stage, **or** go to `/join` and enter the 4-digit room code.
- Vote on `/room/<code>/vote`. **One device, one vote** — students can switch sides
  at any time until the final vote is locked. Phones never show the percentages
  (no bandwagon effect); the live bar lives on the projector only.

## Deploy (Vercel)

1. Import the repo into Vercel.
2. Set the **4 environment variables** in the Vercel project settings. Set
   `NEXT_PUBLIC_BASE_URL` to the **deployed origin** (e.g. `https://your-app.vercel.app`)
   — this is what the projector QR encodes, so getting it wrong means phones can't
   reach the join page.
3. Deploy.

## Manual classroom rehearsal checklist

Run this once on real hardware before using it in front of a class:

- [ ] Open the **Stage** on the projector (`/`, fill setup, Start).
- [ ] **Join from 2 phones** by scanning the QR (confirms `NEXT_PUBLIC_BASE_URL`).
- [ ] **Cast and switch votes** on both phones — confirm the projector vote bar moves.
- [ ] Press `T` to toggle **single ↔ double** timer; confirm the layout switches.
- [ ] Let a timer hit `00:00` and confirm the **buzzer sounds** — note it only fires
      *after the first keypress* on the Stage (browser audio-unlock), so press a key
      early.
- [ ] Press `P` to **lock the pre-vote**, run a short debate, then press `F` to
      **lock the final vote** — confirm the **swing winner reveal** appears with the
      correct 净胜 margin.
