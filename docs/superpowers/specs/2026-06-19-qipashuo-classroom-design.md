# 奇葩说 Classroom Edition — Design Spec

**Date:** 2026-06-19
**Status:** Approved design, pending implementation plan

## 1. Summary

A cloud-hosted web app for running 奇葩说-style (U Can U BiBi) debates as a classroom game on a projector. The teacher drives the whole game from the laptop keyboard (the laptop is plugged into the projector). Students watch the projector and vote from their phones via a room code. The signature mechanic is **vote swing**: the winner is the side that *moves* the most votes between the opening vote and the final vote, not the side with the highest raw count.

## 2. Goals & Non-Goals

### Goals
- Editable match setup: topic, two side labels, up to 3 debater names per side (fewer allowed).
- Live audience voting from phones: one device = one vote, switchable anytime, anonymous.
- Live vote bar on the projector + swing capture (pre-vote and final snapshots) with a winner reveal.
- Two timer modes the teacher toggles live: single countdown and double chess-clock.
- Keyboard-only control from a single machine.

### Non-Goals (v1 / YAGNI)
- Accounts/auth, saved match history, multiple simultaneous rooms per teacher.
- Audience names/identity, leaderboards, post-match analytics.
- A separate mobile teacher-control panel (single-machine keyboard only).
- Showing vote percentages on phones (projector only — see §6).

## 3. Architecture

- **Framework:** Next.js (App Router).
- **Backend/state + realtime:** Supabase (Postgres + Realtime) in a **fresh Supabase project** (the existing account hit its free project limit; a new project under a different email/org is used).
- **Deploy:** Vercel.
- **Timers:** run **client-side** on the Stage screen, driven by keyboard events. No network round-trip for the clock, so countdown is lag-free.
- **Realtime:** the Stage subscribes to `votes` changes for its room via Supabase Realtime and recomputes the tally locally.

### Screens (routes)
1. **Setup** — `/`
   Teacher fills in: topic, side A label (default `正方`), side B label (default `反方`), up to 3 debater names per side, timer default (mm:ss, default `02:00`). "Start" creates a room → generates a 4-digit code → navigates to the Stage.
2. **Stage** — `/room/[code]`
   The Arena projector display + the keyboard control surface. Subscribes to realtime votes. This is the screen shown on the projector and controlled by the teacher's keyboard.
3. **Vote** — `/join` (enter code) and `/room/[code]/vote` (the phone voting view, also reachable by scanning the Stage QR).
   Shows topic + two large buttons (side A / side B). Tapping casts/switches the vote. Highlights the student's current pick. No percentages, no names, no login.

## 4. Data Model (Supabase Postgres)

### `rooms`
| column | type | notes |
|---|---|---|
| `id` | uuid pk | |
| `code` | text unique | 4-digit join code |
| `topic` | text | |
| `side_a_label` | text | default `正方` |
| `side_b_label` | text | default `反方` |
| `debaters_a` | jsonb | array of up to 3 names |
| `debaters_b` | jsonb | array of up to 3 names |
| `timer_default_seconds` | int | default 120 |
| `pre_vote_snapshot` | jsonb null | `{a:int,b:int}` captured when teacher presses `P` |
| `final_snapshot` | jsonb null | `{a:int,b:int}` captured when teacher presses `F` |
| `status` | text | `setup` \| `live` \| `revealed` |
| `created_at` | timestamptz | |

### `votes`
| column | type | notes |
|---|---|---|
| `id` | uuid pk | |
| `room_id` | uuid fk → rooms | |
| `device_id` | text | anonymous token from phone localStorage |
| `side` | text | `a` \| `b` |
| `updated_at` | timestamptz | |

- Unique constraint on `(room_id, device_id)` — one vote per device per room. Voting/switching is an **upsert** on that key.
- Live tally = count of `votes` grouped by `side` for the room.
- Realtime: Stage subscribes to inserts/updates/deletes on `votes` filtered by `room_id`.

## 5. Timers

Two modes, toggled live with `T`. Both default to the room's `timer_default_seconds` (120).

### Single countdown
- One clock for the current speaker.
- `SPACE` start/pause, `←` −30s, `→` +30s, `R` reset to default.

### Double chess-clock
- Two independent banks (side A and side B), each starting at the default.
- Only one bank counts down at a time; the active bank glows in its team color.
- `SPACE` hands the running clock to the other side (pauses active, starts other).
- `←`/`→` adjust ±30s on the **currently active** bank.
- `R` resets both banks to default.

### Timer end (0:00)
- Buzzer sound + red flash on the expired clock.
- (Double mode at 0:00: buzz + flash the expired side; it does not auto-switch in v1.)

## 6. Voting & Swing

- **One device one vote:** each phone generates a random `device_id` stored in its browser localStorage on first visit. Votes upsert by `(room_id, device_id)`. Switchable anytime. Not exam-grade (clearing storage / incognito allows a re-vote) — acceptable for a class game.
- **Live bar (projector only):** updates in real time as votes arrive. Phones never show percentages (prevents bandwagon bias).
- **Swing flow (teacher keyboard):**
  1. `P` — lock `pre_vote_snapshot` (开场票) at the start.
  2. Debate happens; bar moves live.
  3. `F` — lock `final_snapshot` (终票) and set status `revealed`.
  4. Stage reveals the winner by **net swing** = `(final_a − pre_a)` vs `(final_b − pre_b)`; the side with the larger gain wins. Display framing emphasizes mind-changing ("你没有赢下全场，你改变了全场").

## 7. Projector Layout — "Arena"

- **Top bar:** join code + QR (corner), topic centered.
- **Middle:** side A team panel (left, blue) · big timer (center) · side B team panel (right, red). In double-timer mode the center shows two banks side by side.
- **Bottom:** full-width live vote bar (blue/red split with percentages) + a swing line (`开场 50/50 → 正方 +8 · 32 票`).
- Dark stage aesthetic; team colors blue (A) / red (B).

## 8. Keyboard Map (single machine)

| key | action |
|---|---|
| `SPACE` | start/pause (single) · switch side (double) |
| `←` / `→` | −30s / +30s to the active clock |
| `R` | reset timer(s) to default |
| `T` | toggle single ⇄ double timer mode |
| `P` | lock pre-vote (开场票) |
| `F` | lock final vote (终票) + reveal winner |
| `Esc` | return to Setup |

## 9. Error / Edge Handling

- **Bad/expired room code on join:** friendly "房间不存在" message, back to `/join`.
- **Realtime drop:** Stage falls back to a periodic re-fetch of the tally (e.g. every few seconds) so the bar still updates if the websocket drops.
- **Snapshot guardrails:** `F` (final) is ignored until `P` (pre-vote) has been captured; reveal needs both snapshots.
- **Reset/`R`** only affects timers, never votes.
- **No votes yet:** bar shows 50/50 neutral state.

## 10. Testing Strategy

- **Unit:** swing calculation (winner from pre/final snapshots, ties), timer reducer (start/pause/switch/adjust/reset/expire for both modes), join-code generation/validation.
- **Component:** vote upsert (cast → switch → same device stays one vote), Arena renders teams/topic/bar from state.
- **Integration (mocked Supabase):** vote from a phone updates the Stage tally; `P`/`F` capture snapshots and produce the correct winner.
- **Manual:** projector + 2–3 phones happy path on real network before classroom use.

## 11. Open Questions / Future

- Optional later: saved match templates, multi-room, sound-pack choice, a "净胜票" animation on reveal, mobile control panel.
