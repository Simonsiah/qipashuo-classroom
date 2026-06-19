# 奇葩说 Classroom Edition — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a cloud-hosted projector debate game where a teacher runs 奇葩说-style matches from a laptop keyboard while ~20 students vote from their phones via a room code, with a live vote bar and swing-based winner reveal.

**Architecture:** Next.js (App Router, TypeScript) front end on Vercel. Pure logic (room codes, device id, tally, swing, timer reducer) lives in framework-free modules under `src/lib` and is unit-tested first. Writes (create room, cast vote, snapshot) go through Next.js route handlers using the Supabase **service role** key server-side. Reads + the live vote bar use the Supabase **anon** client subscribing to Realtime directly from the Stage. Timers run entirely client-side, driven by keyboard events.

**Tech Stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Supabase (Postgres + Realtime), Vitest + React Testing Library, deployed on Vercel.

**Spec:** `docs/superpowers/specs/2026-06-19-qipashuo-classroom-design.md`

---

## File Structure

```
src/
  lib/
    roomCode.ts        # generate + validate 4-digit join codes (pure)
    deviceId.ts        # anonymous persistent device token (localStorage)
    tally.ts           # votes[] -> {a, b} counts + percentages (pure)
    swing.ts           # pre/final snapshots -> winner by net swing (pure)
    timer.ts           # timer reducer for single + double modes (pure)
    supabaseClient.ts  # browser anon client (reads + realtime)
    supabaseAdmin.ts   # server service-role client (writes)
    types.ts           # Room, Vote, Snapshot, TimerState types
  app/
    page.tsx                       # Setup screen
    join/page.tsx                  # enter room code -> redirect to vote
    room/[code]/page.tsx           # Stage server wrapper (loads room)
    room/[code]/StageClient.tsx    # Arena display + realtime + keyboard
    room/[code]/vote/page.tsx      # phone vote view
    api/rooms/route.ts             # POST create room
    api/rooms/[code]/vote/route.ts # POST upsert vote
    api/rooms/[code]/snapshot/route.ts # POST lock pre/final snapshot
  components/
    Arena.tsx          # full projector layout (presentational)
    TeamPanel.tsx      # one side's label + debaters
    TimerDisplay.tsx   # single + double clock rendering
    VoteBar.tsx        # blue/red split bar
    SwingLine.tsx      # "开场 50/50 -> 正方 +8" line
    WinnerReveal.tsx   # net-swing winner overlay
    JoinQR.tsx         # QR + code corner widget
    VoteButtons.tsx    # phone A/B buttons
supabase/
  schema.sql           # tables, constraints, RLS, realtime publication
```

**Boundary rule:** `src/lib/*` modules import nothing from React/Next — they are pure and unit-tested in isolation. Components are presentational and take props; the only stateful client component is `StageClient.tsx` (realtime + keyboard) and the vote page.

---

## Phase 0 — Scaffold

### Task 0.1: Initialize Next.js project

**Files:**
- Create: `package.json`, `next.config.mjs`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/globals.css`

- [ ] **Step 1: Scaffold Next.js + Tailwind + TypeScript**

Run in the project root (`奇葩说/`):
```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --no-eslint --use-npm
```
Accept overwrite prompts for the empty repo. If it refuses because the dir is non-empty (docs/ exists), scaffold in a temp dir and move files in, preserving `docs/` and `.git/`.

- [ ] **Step 2: Verify dev server boots**

Run: `npm run dev`
Expected: Next.js starts on `http://localhost:3000` with the default page. Stop it (Ctrl-C).

- [ ] **Step 3: Commit**
```bash
git add -A && git commit -m "chore: scaffold Next.js + Tailwind + TS"
```

### Task 0.2: Add Vitest + React Testing Library

**Files:**
- Create: `vitest.config.mts`, `vitest.setup.ts`
- Modify: `package.json` (add `test` script + devDeps)

- [ ] **Step 1: Install test deps**
```bash
npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Write `vitest.config.mts`**
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", setupFiles: ["./vitest.setup.ts"], globals: true },
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
});
```

- [ ] **Step 3: Write `vitest.setup.ts`**
```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Add script** — in `package.json` add `"test": "vitest run"` and `"test:watch": "vitest"`.

- [ ] **Step 5: Smoke test** — create `src/lib/__smoke__.test.ts` with `it("runs", () => expect(1).toBe(1))`. Run `npm test`. Expected: PASS. Then delete the smoke file.

- [ ] **Step 6: Commit**
```bash
git add -A && git commit -m "chore: add vitest + RTL"
```

### Task 0.3: Supabase clients + env + types

**Files:**
- Create: `src/lib/supabaseClient.ts`, `src/lib/supabaseAdmin.ts`, `src/lib/types.ts`, `.env.local.example`
- Modify: `.gitignore` (ensure `.env.local` ignored — already covered by `.env*.local`)

- [ ] **Step 1: Install client**
```bash
npm i @supabase/supabase-js
```

- [ ] **Step 2: Write `src/lib/types.ts`**
```ts
export type Side = "a" | "b";
export type RoomStatus = "setup" | "live" | "revealed";
export interface Snapshot { a: number; b: number; }
export interface Room {
  id: string; code: string; topic: string;
  side_a_label: string; side_b_label: string;
  debaters_a: string[]; debaters_b: string[];
  timer_default_seconds: number;
  pre_vote_snapshot: Snapshot | null;
  final_snapshot: Snapshot | null;
  status: RoomStatus; created_at: string;
}
export interface Vote { id: string; room_id: string; device_id: string; side: Side; updated_at: string; }
```

- [ ] **Step 3: Write `src/lib/supabaseClient.ts`** (browser, anon, reads + realtime)
```ts
import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

- [ ] **Step 4: Write `src/lib/supabaseAdmin.ts`** (server, service role, writes)
```ts
import { createClient } from "@supabase/supabase-js";
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
```

- [ ] **Step 5: Write `.env.local.example`**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

- [ ] **Step 6: Commit**
```bash
git add -A && git commit -m "chore: supabase clients + types + env example"
```

### Task 0.4: Database schema

**Files:**
- Create: `supabase/schema.sql`

- [ ] **Step 1: Write `supabase/schema.sql`**
```sql
create table rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  topic text not null,
  side_a_label text not null default '正方',
  side_b_label text not null default '反方',
  debaters_a jsonb not null default '[]',
  debaters_b jsonb not null default '[]',
  timer_default_seconds int not null default 120,
  pre_vote_snapshot jsonb,
  final_snapshot jsonb,
  status text not null default 'setup',
  created_at timestamptz not null default now()
);

create table votes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  device_id text not null,
  side text not null check (side in ('a','b')),
  updated_at timestamptz not null default now(),
  unique (room_id, device_id)
);

-- Reads allowed to anon (Stage subscribes); writes only via service role.
alter table rooms enable row level security;
alter table votes enable row level security;
create policy "rooms readable" on rooms for select using (true);
create policy "votes readable" on votes for select using (true);

-- Realtime for the live bar
alter publication supabase_realtime add table votes;
```

- [ ] **Step 2: Apply manually** — run this in the new Supabase project's SQL editor. Document in `supabase/README.md`: "Run schema.sql in the SQL editor; copy the URL + anon + service_role keys into `.env.local`."

- [ ] **Step 3: Commit**
```bash
git add -A && git commit -m "feat: database schema (rooms, votes, RLS, realtime)"
```

---

## Phase 1 — Pure logic (TDD)

### Task 1.1: Room code generation + validation

**Files:**
- Create: `src/lib/roomCode.ts`
- Test: `src/lib/roomCode.test.ts`

- [ ] **Step 1: Write failing test**
```ts
import { generateRoomCode, isValidRoomCode } from "./roomCode";
describe("roomCode", () => {
  it("generates a 4-digit string", () => {
    const c = generateRoomCode();
    expect(c).toMatch(/^\d{4}$/);
  });
  it("validates format", () => {
    expect(isValidRoomCode("4821")).toBe(true);
    expect(isValidRoomCode("48")).toBe(false);
    expect(isValidRoomCode("abcd")).toBe(false);
  });
});
```

- [ ] **Step 2: Run, expect fail** — `npm test roomCode` → FAIL (module not found).

- [ ] **Step 3: Implement**
```ts
export function generateRoomCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
export function isValidRoomCode(code: string): boolean {
  return /^\d{4}$/.test(code);
}
```

- [ ] **Step 4: Run, expect pass** — `npm test roomCode` → PASS.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: room code gen + validation"`

### Task 1.2: Device id (anonymous, persistent)

**Files:**
- Create: `src/lib/deviceId.ts`
- Test: `src/lib/deviceId.test.ts`

- [ ] **Step 1: Write failing test**
```ts
import { getDeviceId } from "./deviceId";
describe("getDeviceId", () => {
  beforeEach(() => localStorage.clear());
  it("creates and persists a stable id", () => {
    const a = getDeviceId();
    const b = getDeviceId();
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(8);
  });
  it("reuses across rooms (same browser, one token)", () => {
    const a = getDeviceId();
    localStorage.setItem("qps_other", "x");
    expect(getDeviceId()).toBe(a);
  });
});
```

- [ ] **Step 2: Run, expect fail.**

- [ ] **Step 3: Implement**
```ts
const KEY = "qps_device_id";
export function getDeviceId(): string {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
```

- [ ] **Step 4: Run, expect pass.**

- [ ] **Step 5: Commit** — `git commit -m "feat: persistent anonymous device id"`

### Task 1.3: Tally

**Files:**
- Create: `src/lib/tally.ts`
- Test: `src/lib/tally.test.ts`

- [ ] **Step 1: Write failing test**
```ts
import { tally } from "./tally";
describe("tally", () => {
  it("counts sides", () => {
    const t = tally([{ side: "a" }, { side: "a" }, { side: "b" }] as any);
    expect(t).toEqual({ a: 2, b: 1, total: 3, pctA: 67, pctB: 33 });
  });
  it("neutral 50/50 when empty", () => {
    expect(tally([])).toEqual({ a: 0, b: 0, total: 0, pctA: 50, pctB: 50 });
  });
});
```

- [ ] **Step 2: Run, expect fail.**

- [ ] **Step 3: Implement**
```ts
import type { Vote } from "./types";
export interface Tally { a: number; b: number; total: number; pctA: number; pctB: number; }
export function tally(votes: Pick<Vote, "side">[]): Tally {
  const a = votes.filter(v => v.side === "a").length;
  const b = votes.filter(v => v.side === "b").length;
  const total = a + b;
  if (total === 0) return { a: 0, b: 0, total: 0, pctA: 50, pctB: 50 };
  const pctA = Math.round((a / total) * 100);
  return { a, b, total, pctA, pctB: 100 - pctA };
}
```

- [ ] **Step 4: Run, expect pass.**

- [ ] **Step 5: Commit** — `git commit -m "feat: vote tally"`

### Task 1.4: Swing winner

**Files:**
- Create: `src/lib/swing.ts`
- Test: `src/lib/swing.test.ts`

- [ ] **Step 1: Write failing test**
```ts
import { computeSwing } from "./swing";
describe("computeSwing", () => {
  it("winner is the side that gained more", () => {
    const r = computeSwing({ a: 10, b: 10 }, { a: 18, b: 14 });
    expect(r).toEqual({ gainA: 8, gainB: 4, winner: "a", margin: 4 });
  });
  it("ties when gains equal", () => {
    const r = computeSwing({ a: 10, b: 10 }, { a: 12, b: 12 });
    expect(r.winner).toBe("tie");
    expect(r.margin).toBe(0);
  });
});
```

- [ ] **Step 2: Run, expect fail.**

- [ ] **Step 3: Implement**
```ts
import type { Snapshot, Side } from "./types";
export interface SwingResult { gainA: number; gainB: number; winner: Side | "tie"; margin: number; }
export function computeSwing(pre: Snapshot, final: Snapshot): SwingResult {
  const gainA = final.a - pre.a;
  const gainB = final.b - pre.b;
  const margin = Math.abs(gainA - gainB);
  const winner = gainA === gainB ? "tie" : gainA > gainB ? "a" : "b";
  return { gainA, gainB, winner, margin };
}
```

- [ ] **Step 4: Run, expect pass.**

- [ ] **Step 5: Commit** — `git commit -m "feat: swing winner calc"`

### Task 1.5: Timer reducer (single + double)

**Files:**
- Create: `src/lib/timer.ts`
- Test: `src/lib/timer.test.ts`

Design: a pure reducer over `TimerState`. Ticking is driven externally (the component calls `tick(state)` once per second); the reducer never reads the clock itself.

- [ ] **Step 1: Write failing test**
```ts
import { initTimer, reduce } from "./timer";
const D = 120;
describe("timer reducer", () => {
  it("single: start/pause/tick", () => {
    let s = initTimer(D, "single");
    s = reduce(s, { type: "TOGGLE" });        // running
    expect(s.running).toBe(true);
    s = reduce(s, { type: "TICK" });
    expect(s.single).toBe(119);
    s = reduce(s, { type: "TOGGLE" });        // paused
    s = reduce(s, { type: "TICK" });
    expect(s.single).toBe(119);               // no change while paused
  });
  it("single: adjust +/-30 clamps at 0", () => {
    let s = initTimer(10, "single");
    s = reduce(s, { type: "ADJUST", delta: -30 });
    expect(s.single).toBe(0);
    s = reduce(s, { type: "ADJUST", delta: 30 });
    expect(s.single).toBe(30);
  });
  it("single: expires at 0 and flags expired", () => {
    let s = initTimer(1, "single");
    s = reduce(s, { type: "TOGGLE" });
    s = reduce(s, { type: "TICK" });
    expect(s.single).toBe(0);
    expect(s.expired).toBe(true);
    expect(s.running).toBe(false);
  });
  it("double: SPACE switches active bank, only active ticks", () => {
    let s = initTimer(D, "double");
    expect(s.active).toBe("a");
    s = reduce(s, { type: "TOGGLE" });   // run side a
    s = reduce(s, { type: "TICK" });
    expect(s.bankA).toBe(119);
    expect(s.bankB).toBe(120);
    s = reduce(s, { type: "SWITCH" });   // hand to b, keep running
    s = reduce(s, { type: "TICK" });
    expect(s.bankA).toBe(119);
    expect(s.bankB).toBe(119);
  });
  it("reset restores defaults", () => {
    let s = initTimer(D, "double");
    s = reduce(s, { type: "TOGGLE" });
    s = reduce(s, { type: "TICK" });
    s = reduce(s, { type: "RESET" });
    expect(s.bankA).toBe(120);
    expect(s.bankB).toBe(120);
    expect(s.running).toBe(false);
  });
});
```

- [ ] **Step 2: Run, expect fail.**

- [ ] **Step 3: Implement `src/lib/timer.ts`**
```ts
import type { Side } from "./types";
export type Mode = "single" | "double";
export interface TimerState {
  mode: Mode; def: number; running: boolean; expired: boolean;
  single: number; bankA: number; bankB: number; active: Side;
}
export type TimerAction =
  | { type: "TOGGLE" } | { type: "SWITCH" } | { type: "TICK" }
  | { type: "ADJUST"; delta: number } | { type: "RESET" }
  | { type: "SET_MODE"; mode: Mode };

export function initTimer(def: number, mode: Mode): TimerState {
  return { mode, def, running: false, expired: false, single: def, bankA: def, bankB: def, active: "a" };
}
const clamp = (n: number) => Math.max(0, n);

export function reduce(s: TimerState, a: TimerAction): TimerState {
  switch (a.type) {
    case "TOGGLE": return { ...s, running: !s.running, expired: false };
    case "SWITCH":
      if (s.mode !== "double") return s;
      return { ...s, active: s.active === "a" ? "b" : "a" };
    case "ADJUST": {
      if (s.mode === "single") return { ...s, single: clamp(s.single + a.delta), expired: false };
      return s.active === "a"
        ? { ...s, bankA: clamp(s.bankA + a.delta), expired: false }
        : { ...s, bankB: clamp(s.bankB + a.delta), expired: false };
    }
    case "RESET": return initTimer(s.def, s.mode);
    case "SET_MODE": return initTimer(s.def, a.mode);
    case "TICK": {
      if (!s.running) return s;
      if (s.mode === "single") {
        const v = clamp(s.single - 1);
        return { ...s, single: v, expired: v === 0, running: v === 0 ? false : s.running };
      }
      if (s.active === "a") {
        const v = clamp(s.bankA - 1);
        return { ...s, bankA: v, expired: v === 0, running: v === 0 ? false : s.running };
      }
      const v = clamp(s.bankB - 1);
      return { ...s, bankB: v, expired: v === 0, running: v === 0 ? false : s.running };
    }
  }
}
```

- [ ] **Step 4: Run, expect pass.**

- [ ] **Step 5: Commit** — `git commit -m "feat: timer reducer (single + double chess-clock)"`

---

## Phase 2 — Write API (route handlers, TDD with mocked Supabase)

> Pattern: each handler imports `supabaseAdmin()`. Tests mock `@/lib/supabaseAdmin` with `vi.mock` and assert the handler calls the right query and returns the right shape. Keep handlers thin; push any logic into `src/lib` (already done).

### Task 2.1: Create room — `POST /api/rooms`

**Files:**
- Create: `src/app/api/rooms/route.ts`
- Test: `src/app/api/rooms/route.test.ts`

- [ ] **Step 1: Write failing test** — mock `supabaseAdmin` to return an inserted room; assert the handler generates a code, inserts topic/labels/debaters/timer, sets `status: "live"`, and responds `{ code }`. Include a test that a 5th debater is rejected (max 3 per side) with 400.

- [ ] **Step 2: Run, expect fail.**

- [ ] **Step 3: Implement** — validate body (topic non-empty; ≤3 debaters/side; timer ≥ 30), `generateRoomCode()`, retry once on unique-code collision, insert with `status: 'live'`, return `{ code }`.

- [ ] **Step 4: Run, expect pass.**

- [ ] **Step 5: Commit** — `git commit -m "feat: create-room API"`

### Task 2.2: Cast/switch vote — `POST /api/rooms/[code]/vote`

**Files:**
- Create: `src/app/api/rooms/[code]/vote/route.ts`
- Test: `src/app/api/rooms/[code]/vote/route.test.ts`

- [ ] **Step 1: Write failing test** — body `{ deviceId, side }`. Assert it upserts on `(room_id, device_id)` so a second call with a different side updates (not duplicates). Assert invalid `side` → 400, unknown code → 404.

- [ ] **Step 2: Run, expect fail.**

- [ ] **Step 3: Implement** — look up room by `code` (must exist), `upsert({ room_id, device_id, side, updated_at: new Date().toISOString() }, { onConflict: "room_id,device_id" })`, return 200.

- [ ] **Step 4: Run, expect pass.**

- [ ] **Step 5: Commit** — `git commit -m "feat: vote upsert API"`

### Task 2.3: Lock snapshot — `POST /api/rooms/[code]/snapshot`

**Files:**
- Create: `src/app/api/rooms/[code]/snapshot/route.ts`
- Test: `src/app/api/rooms/[code]/snapshot/route.test.ts`

- [ ] **Step 1: Write failing test** — body `{ kind: "pre" | "final" }`. Handler computes current `tally()` from votes and writes `pre_vote_snapshot` or `final_snapshot`. Assert: `final` is rejected (409) if `pre_vote_snapshot` is null; setting `final` also flips `status` to `revealed`.

- [ ] **Step 2: Run, expect fail.**

- [ ] **Step 3: Implement** — fetch votes for room, `tally()`, store `{ a, b }`; guard final-needs-pre; on final set `status: 'revealed'`.

- [ ] **Step 4: Run, expect pass.**

- [ ] **Step 5: Commit** — `git commit -m "feat: snapshot API with pre-before-final guard"`

---

## Phase 3 — Phone vote flow

### Task 3.1: VoteButtons component

**Files:**
- Create: `src/components/VoteButtons.tsx`
- Test: `src/components/VoteButtons.test.tsx`

- [ ] **Step 1: Write failing test** — renders two buttons with side labels; clicking calls `onVote("a")`; the prop `selected="a"` adds an `aria-pressed`/highlight class. No percentages rendered anywhere.

- [ ] **Step 2: Run, expect fail.**

- [ ] **Step 3: Implement** — presentational; props `{ labelA, labelB, selected, onVote }`. Big tap targets, blue/red.

- [ ] **Step 4: Run, expect pass.**

- [ ] **Step 5: Commit** — `git commit -m "feat: VoteButtons component"`

### Task 3.2: Vote page — `room/[code]/vote`

**Files:**
- Create: `src/app/room/[code]/vote/page.tsx`
- Test: `src/app/room/[code]/vote/page.test.tsx`

- [ ] **Step 1: Write failing test** — mock fetch; on mount loads room labels; selecting a side POSTs to the vote API with `getDeviceId()` and `side`; switching re-POSTs the new side; the page never renders a percentage. Unknown code shows "房间不存在".

- [ ] **Step 2: Run, expect fail.**

- [ ] **Step 3: Implement** — client component; fetch room by code for labels, render `VoteButtons`, persist `selected` locally, POST on change. Friendly error for 404.

- [ ] **Step 4: Run, expect pass.**

- [ ] **Step 5: Commit** — `git commit -m "feat: phone vote page"`

### Task 3.3: Join page — `/join`

**Files:**
- Create: `src/app/join/page.tsx`
- Test: `src/app/join/page.test.tsx`

- [ ] **Step 1: Write failing test** — a 4-digit input; submitting a valid code routes to `/room/<code>/vote`; invalid code shows inline validation and does not navigate (use `isValidRoomCode`).

- [ ] **Step 2: Run, expect fail.**

- [ ] **Step 3: Implement** — numeric input + submit, `useRouter().push`.

- [ ] **Step 4: Run, expect pass.**

- [ ] **Step 5: Commit** — `git commit -m "feat: join-by-code page"`

---

## Phase 4 — Setup screen

### Task 4.1: Setup form — `/`

**Files:**
- Modify: `src/app/page.tsx`
- Test: `src/app/page.test.tsx`

- [ ] **Step 1: Write failing test** — renders topic input, side A/B label inputs (default 正方/反方), 3 debater inputs per side, timer default selector (default 02:00). Submitting POSTs to `/api/rooms` and on `{ code }` routes to `/room/<code>`. Empty topic blocks submit.

- [ ] **Step 2: Run, expect fail.**

- [ ] **Step 3: Implement** — controlled form; trims empty debater fields before submit; disables submit on empty topic.

- [ ] **Step 4: Run, expect pass.**

- [ ] **Step 5: Commit** — `git commit -m "feat: match setup screen"`

---

## Phase 5 — Presentational Arena components

### Task 5.1: TeamPanel

**Files:** Create `src/components/TeamPanel.tsx`, Test `src/components/TeamPanel.test.tsx`
- [ ] Test: renders side label + each debater name; `side="a"` → blue class, `side="b"` → red. Implement. Pass. Commit `feat: TeamPanel`.

### Task 5.2: VoteBar

**Files:** Create `src/components/VoteBar.tsx`, Test `src/components/VoteBar.test.tsx`
- [ ] Test: given `pctA=58` renders a left segment at 58% width showing "58%" and right "42%". Implement (flex widths). Pass. Commit `feat: VoteBar`.

### Task 5.3: SwingLine

**Files:** Create `src/components/SwingLine.tsx`, Test `src/components/SwingLine.test.tsx`
- [ ] Test: with pre `{a,b}` null → renders "开场 —"; with both → "开场 50/50 → 正方 +8 · 32 票" using labels + `computeSwing`. Implement. Pass. Commit `feat: SwingLine`.

### Task 5.4: TimerDisplay

**Files:** Create `src/components/TimerDisplay.tsx`, Test `src/components/TimerDisplay.test.tsx`
- [ ] Test: single mode renders one `mm:ss`; double mode renders two banks, active one has a glow class; `expired` adds a flashing/red class. Format 119 → "01:59". Implement. Pass. Commit `feat: TimerDisplay`.

### Task 5.5: JoinQR

**Files:** Create `src/components/JoinQR.tsx`, Test `src/components/JoinQR.test.tsx`
- [ ] Step 1: `npm i qrcode.react`. Test: renders the 4-digit code text and a QR encoding the join URL (`/room/<code>/vote`). Implement. Pass. Commit `feat: JoinQR`.

### Task 5.6: WinnerReveal

**Files:** Create `src/components/WinnerReveal.tsx`, Test `src/components/WinnerReveal.test.tsx`
- [ ] Test: given a `SwingResult` with `winner="a"`, renders the side-A label as 净胜 with `+margin` and the framing line "你没有赢下全场，你改变了全场"; `tie` renders a tie state. Implement. Pass. Commit `feat: WinnerReveal`.

### Task 5.7: Arena (composition)

**Files:** Create `src/components/Arena.tsx`, Test `src/components/Arena.test.tsx`
- [ ] Test: given a room + tally + timer state, renders topic, both `TeamPanel`s, `TimerDisplay`, `VoteBar`, `SwingLine`, `JoinQR`; when `status="revealed"` also renders `WinnerReveal`. Pure presentational (all data via props). Implement the Arena layout (from spec §7) with Tailwind. Pass. Commit `feat: Arena layout`.

---

## Phase 6 — Stage (realtime + keyboard) and audio

### Task 6.1: Buzzer audio helper

**Files:** Create `src/lib/buzzer.ts`, Test `src/lib/buzzer.test.ts`
- [ ] Test (jsdom, mock `AudioContext`): `primeAudio()` creates/resumes a context; `buzz()` is a no-op before prime and plays after. Implement a tiny WebAudio beep. Commit `feat: buzzer with audio-unlock`.

### Task 6.2: Stage server wrapper — `room/[code]/page.tsx`

**Files:** Create `src/app/room/[code]/page.tsx`
- [ ] Server component: fetch room by `code` via anon client; if missing render "房间不存在"; else render `<StageClient room={room} joinUrl=.../>`. (No unit test; covered by integration in 7.1.) Commit `feat: stage server wrapper`.

### Task 6.3: StageClient — realtime + keyboard

**Files:** Create `src/app/room/[code]/StageClient.tsx`, Test `src/app/room/[code]/StageClient.test.tsx`

- [ ] **Step 1: Write failing test** (mock `@/lib/supabaseClient` realtime channel + fetch):
  - Initial load fetches votes and renders the bar from `tally`.
  - A simulated realtime payload (new vote) updates the bar.
  - Key `t` toggles timer mode (single↔double via `SET_MODE`).
  - Key ` ` (space) dispatches TOGGLE in single / SWITCH semantics in double, and primes audio on first press.
  - Keys `ArrowLeft`/`ArrowRight` dispatch ADJUST ∓30/±30.
  - Key `r` dispatches RESET.
  - Key `p` POSTs snapshot `pre`; key `f` POSTs snapshot `final` then shows reveal.
  - A 1s `setInterval` (use `vi.useFakeTimers`) dispatches TICK while running.
  - Fallback: a periodic re-fetch updates the tally if no realtime event arrives.

- [ ] **Step 2: Run, expect fail.**

- [ ] **Step 3: Implement** — `useReducer(reduce, initTimer(...))`; subscribe to `votes` filtered by `room_id`; `useEffect` interval for TICK; `keydown` listener mapping the spec §8 keys; `p`/`f` call snapshot API then update local room status; render `<Arena .../>`. On `expired` transition, call `buzz()`.

- [ ] **Step 4: Run, expect pass.**

- [ ] **Step 5: Commit** — `git commit -m "feat: StageClient realtime + keyboard control"`

---

## Phase 7 — End-to-end, polish, deploy

### Task 7.1: Mocked end-to-end happy path

**Files:** Create `src/app/__e2e__/happyPath.test.tsx`
- [ ] Test (all network mocked): create room (Setup POST) → Stage renders with code → two phones (two device ids) POST votes → Stage bar reflects tally via realtime → press `p` → votes change → press `f` → `WinnerReveal` shows the correct net-swing winner. Commit `test: mocked end-to-end happy path`.

### Task 7.2: Manual test checklist + README

**Files:** Create `README.md`
- [ ] Document: env setup, `schema.sql` apply step, `npm run dev`, and a **manual classroom rehearsal checklist** (open Stage on projector, scan QR from 2 phones, cast/switch votes, run both timer modes, lock pre/final, confirm buzzer audio after first keypress). Commit `docs: README + manual test checklist`.

### Task 7.3: Deploy to Vercel

- [ ] Push repo to GitHub (`Simonsiah/qipashuo-classroom`). Import to Vercel. Set the three env vars (URL, anon, service role). Deploy. Smoke-test the live URL with one phone + the projector view. Commit any config (`vercel.json` only if needed).

---

## Definition of Done
- All unit/component/e2e tests pass (`npm test`).
- A teacher can: set up a match → open the Stage on a projector → students join by code/QR and vote/switch → live bar moves → lock pre-vote, run timers (both modes, buzzer fires) → lock final → see the net-swing winner.
- Deployed and smoke-tested on Vercel with a real phone.
