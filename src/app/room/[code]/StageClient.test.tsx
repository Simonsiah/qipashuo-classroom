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

// Fake supabase: a channel whose postgres_changes handler we capture, and a
// from().select().eq() that returns whatever votes the current test queued.
let changeHandler: ((payload: unknown) => void) | null = null;
let voteQueue: Array<{ side: "a" | "b" }> = [];
const removeChannelMock = vi.fn();
const subscribeMock = vi.fn(() => ({ unsubscribe: vi.fn() }));

const channelObj = {
  on: vi.fn((_event: string, _filter: unknown, handler: (p: unknown) => void) => {
    changeHandler = handler;
    return channelObj;
  }),
  subscribe: subscribeMock,
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

import { StageClient } from "./StageClient";

const room: Room = {
  id: "room-uuid",
  code: "1234",
  topic: "猫还是狗更适合当宠物",
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

function mockFetchOk(jsonBody: unknown = { a: 1, b: 2 }) {
  const fetchMock = vi.fn((_url: string | URL | Request, _init?: RequestInit) =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: async () => jsonBody,
    } as Response),
  );
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function key(k: string) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: k }));
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  changeHandler = null;
  voteQueue = [{ side: "a" }, { side: "b" }, { side: "b" }]; // 1 a / 2 b => 33% / 67%
  pushMock.mockClear();
  primeAudioMock.mockClear();
  buzzMock.mockClear();
  removeChannelMock.mockClear();
  subscribeMock.mockClear();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

// Flush microtasks (the async vote fetch) under fake timers.
async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("StageClient", () => {
  it("renders the Arena topic and initial tally from fetched votes", async () => {
    render(<StageClient room={room} joinUrl="/room/1234/vote" />);
    await flush();
    expect(screen.getByText(/猫还是狗更适合当宠物/)).toBeInTheDocument();
    // 1a / 2b => 33% / 67%
    expect(screen.getByText("33%")).toBeInTheDocument();
    expect(screen.getByText("67%")).toBeInTheDocument();
  });

  it("re-fetches and updates tally when a realtime change fires", async () => {
    render(<StageClient room={room} joinUrl="/room/1234/vote" />);
    await flush();
    expect(screen.getByText("33%")).toBeInTheDocument();

    // Queue an even split for the next fetch, then fire the realtime handler.
    voteQueue = [{ side: "a" }, { side: "b" }];
    act(() => {
      changeHandler?.({});
    });
    await flush();
    expect(screen.getAllByText("50%").length).toBeGreaterThan(0);
  });

  it("key 't' toggles to double mode (two bank testids appear)", async () => {
    render(<StageClient room={room} joinUrl="/room/1234/vote" />);
    await flush();
    expect(screen.queryByTestId("bank-a")).not.toBeInTheDocument();
    key("t");
    expect(screen.getByTestId("bank-a")).toBeInTheDocument();
    expect(screen.getByTestId("bank-b")).toBeInTheDocument();
  });

  it("space starts the timer in single mode; first key primes audio", async () => {
    render(<StageClient room={room} joinUrl="/room/1234/vote" />);
    await flush();
    expect(screen.getByTestId("clock-single")).toHaveTextContent("01:00");

    key(" ");
    expect(primeAudioMock).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId("clock-single")).toHaveTextContent("00:59");
  });

  it("buzzes exactly once when the single timer reaches 0:00 and never re-fires", async () => {
    render(<StageClient room={room} joinUrl="/room/1234/vote" />);
    await flush();
    expect(screen.getByTestId("clock-single")).toHaveTextContent("01:00");

    key(" "); // start the single-mode countdown
    expect(buzzMock).not.toHaveBeenCalled();

    // Drive the clock all the way to zero (60s default).
    act(() => {
      vi.advanceTimersByTime(room.timer_default_seconds * 1000);
    });
    expect(screen.getByTestId("clock-single")).toHaveTextContent("00:00");
    expect(buzzMock).toHaveBeenCalledTimes(1);

    // Sitting at 0:00, further ticks must NOT re-fire the buzzer.
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByTestId("clock-single")).toHaveTextContent("00:00");
    expect(buzzMock).toHaveBeenCalledTimes(1);
  });

  it("ArrowLeft / ArrowRight adjust the single clock", async () => {
    render(<StageClient room={room} joinUrl="/room/1234/vote" />);
    await flush();
    key("ArrowRight"); // +30 => 1:30
    expect(screen.getByTestId("clock-single")).toHaveTextContent("01:30");
    key("ArrowLeft"); // -30 => 1:00
    expect(screen.getByTestId("clock-single")).toHaveTextContent("01:00");
  });

  it("key 'p' POSTs a pre snapshot", async () => {
    const fetchMock = mockFetchOk({ a: 1, b: 2 });
    render(<StageClient room={room} joinUrl="/room/1234/vote" />);
    await flush();
    key("p");
    await flush();
    const call = fetchMock.mock.calls.find((c) =>
      String(c[0]).includes("/snapshot"),
    );
    expect(call).toBeTruthy();
    expect(String(call![0])).toContain("/api/rooms/1234/snapshot");
    expect(JSON.parse((call![1] as RequestInit).body as string)).toEqual({
      kind: "pre",
    });
  });

  it("key 'f' POSTs final snapshot and reveals the winner headline", async () => {
    const roomWithPre: Room = {
      ...room,
      pre_vote_snapshot: { a: 5, b: 5 },
    };
    mockFetchOk({ a: 8, b: 2 }); // final snapshot returned by API
    render(<StageClient room={roomWithPre} joinUrl="/room/1234/vote" />);
    await flush();
    key("f");
    await flush();
    await flush();
    // pre 5/5 -> final 8/2: A swing +3, B swing -3, A wins by 6
    expect(screen.getByText(/净胜/)).toBeInTheDocument();
  });

  it("Escape navigates home", async () => {
    render(<StageClient room={room} joinUrl="/room/1234/vote" />);
    await flush();
    key("Escape");
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("cleans up channel + intervals on unmount", async () => {
    const { unmount } = render(
      <StageClient room={room} joinUrl="/room/1234/vote" />,
    );
    await flush();
    unmount();
    expect(removeChannelMock).toHaveBeenCalled();
  });
});
