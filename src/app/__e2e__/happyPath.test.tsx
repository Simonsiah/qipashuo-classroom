/**
 * Mocked end-to-end happy path for the 奇葩说 classroom flow.
 *
 * Drives the projector StageClient as the integration surface where votes,
 * timer, and snapshots converge. Supabase (initial vote fetch + realtime
 * channel), next/navigation, the buzzer, and global.fetch (snapshot POSTs)
 * are all mocked, so this runs at the component/API-boundary level with no
 * real browser or server.
 *
 * Scenario asserted in one cohesive pass:
 *   1. Stage renders with the topic, room code (QR join url), and an initial
 *      50/50 tally.
 *   2. Press `p` -> POSTs the pre snapshot {kind:"pre"} (开场票 locked at 1/1).
 *   3. Realtime votes swing toward Side A; the bar/percentage moves.
 *   4. Press `f` -> POSTs the final snapshot {kind:"final"}, status flips to
 *      revealed, and WinnerReveal headlines Side A as the net-swing winner
 *      ("净胜").
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import type { Room } from "@/lib/types";

// --- Mocks -----------------------------------------------------------------

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const primeAudioMock = vi.fn();
const buzzMock = vi.fn();
vi.mock("@/lib/buzzer", () => ({
  primeAudio: () => primeAudioMock(),
  buzz: () => buzzMock(),
}));

// Fake supabase: a realtime channel whose postgres_changes handler we capture,
// and a from().select().eq() that returns whatever votes the test has queued.
let changeHandler: ((payload: unknown) => void) | null = null;
let voteQueue: Array<{ side: "a" | "b" }> = [];
const removeChannelMock = vi.fn();

const channelObj = {
  on: vi.fn(
    (_event: string, _filter: unknown, handler: (p: unknown) => void) => {
      changeHandler = handler;
      return channelObj;
    },
  ),
  subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
};

vi.mock("@/lib/supabaseClient", () => ({
  supabase: {
    channel: vi.fn(() => channelObj),
    removeChannel: (ch: unknown) => removeChannelMock(ch),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: voteQueue, error: null })),
      })),
    })),
  },
}));

import { StageClient } from "@/app/room/[code]/StageClient";

const room: Room = {
  id: "room-uuid",
  code: "4821",
  topic: "网络是否让人更孤独",
  side_a_label: "正方",
  side_b_label: "反方",
  debaters_a: ["小明"],
  debaters_b: ["小红"],
  timer_default_seconds: 60,
  pre_vote_snapshot: null,
  final_snapshot: null,
  status: "live",
  created_at: "2026-01-01T00:00:00Z",
};

// fetch mock that routes snapshot POSTs by their {kind} body: the pre lock
// returns 1/1 (matching the live tally at that moment), the final lock returns
// 8/2 -> Side A gains +7, Side B gains +1, so A is the net-swing winner.
function installSnapshotFetch() {
  const fetchMock = vi.fn(
    (_url: string | URL | Request, init?: RequestInit) => {
      const kind = JSON.parse((init?.body as string) ?? "{}").kind;
      const body = kind === "pre" ? { a: 1, b: 1 } : { a: 8, b: 2 };
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => body,
      } as Response);
    },
  );
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function key(k: string) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: k }));
  });
}

// Flush microtasks (the async vote fetch / snapshot POST) under fake timers.
async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  changeHandler = null;
  voteQueue = [{ side: "a" }, { side: "b" }]; // 1a / 1b => 50% / 50%
  pushMock.mockClear();
  primeAudioMock.mockClear();
  buzzMock.mockClear();
  removeChannelMock.mockClear();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe("happy path: pre -> swing -> final -> reveal", () => {
  it("locks 开场票, swings to Side A, locks 终票, and reveals A as net-swing winner", async () => {
    const fetchMock = installSnapshotFetch();
    render(<StageClient room={room} joinUrl="/room/4821/vote" />);
    await flush();

    // 1. Stage renders with topic + an even initial tally.
    expect(screen.getByText(/网络是否让人更孤独/)).toBeInTheDocument();
    expect(screen.getAllByText("50%").length).toBeGreaterThan(0);

    // 2. Press `p` -> POSTs the pre snapshot {kind:"pre"}.
    key("p");
    await flush();
    const preCall = fetchMock.mock.calls.find((c) =>
      String(c[0]).includes("/snapshot"),
    );
    expect(preCall).toBeTruthy();
    expect(String(preCall![0])).toContain("/api/rooms/4821/snapshot");
    expect(
      JSON.parse((preCall![1] as RequestInit).body as string),
    ).toEqual({ kind: "pre" });

    // 3. Realtime votes swing toward Side A; re-fetch returns the new set.
    voteQueue = [{ side: "a" }, { side: "a" }, { side: "a" }, { side: "b" }]; // 3a/1b => 75/25
    act(() => {
      changeHandler?.({});
    });
    await flush();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();

    // 4. Press `f` -> POSTs the final snapshot and reveals the winner.
    key("f");
    await flush();
    await flush();

    const finalCall = fetchMock.mock.calls.find(
      (c) =>
        String(c[0]).includes("/snapshot") &&
        JSON.parse((c[1] as RequestInit).body as string).kind === "final",
    );
    expect(finalCall).toBeTruthy();

    // pre 1/1 -> final 8/2: A gains +7, B gains +1 => A wins by 6.
    expect(screen.getByText(/正方 净胜 \+6 票/)).toBeInTheDocument();
    expect(screen.getByText(/净胜/)).toBeInTheDocument();
  });
});
