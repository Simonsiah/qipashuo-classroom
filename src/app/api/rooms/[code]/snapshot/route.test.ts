import { describe, it, expect, vi, beforeEach } from "vitest";

// rooms: .select().eq().single()  and  .update().eq()
// votes: .select().eq()
const roomSingle = vi.fn();
const roomSelectEq = vi.fn(() => ({ single: roomSingle }));
const roomSelect = vi.fn(() => ({ eq: roomSelectEq }));
const updateEq = vi.fn(() => Promise.resolve({ error: null }));
const update = vi.fn((_patch: Record<string, unknown>) => ({ eq: updateEq }));

const votesSelectEq = vi.fn();
const votesSelect = vi.fn(() => ({ eq: votesSelectEq }));

const from = vi.fn((table: string) => {
  if (table === "rooms") return { select: roomSelect, update };
  if (table === "votes") return { select: votesSelect };
  throw new Error("unexpected table " + table);
});

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: () => ({ from }),
}));

import { POST } from "./route";

function req(body: unknown) {
  return new Request("http://x/api/rooms/1234/snapshot", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
function ctx(code: string) {
  return { params: Promise.resolve({ code }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  votesSelectEq.mockResolvedValue({
    data: [{ side: "a" }, { side: "a" }, { side: "b" }],
    error: null,
  });
});

describe("POST /api/rooms/[code]/snapshot", () => {
  it("pre stores tally as {a,b} and returns it", async () => {
    roomSingle.mockResolvedValue({
      data: { id: "room-1", pre_vote_snapshot: null },
      error: null,
    });
    const res = await POST(req({ kind: "pre" }), ctx("1234"));
    expect(roomSelectEq).toHaveBeenCalledWith("code", "1234");
    const [row] = update.mock.calls[0];
    expect(row).toEqual({ pre_vote_snapshot: { a: 2, b: 1 } });
    expect(updateEq).toHaveBeenCalledWith("id", "room-1");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ a: 2, b: 1 });
  });

  it("final when pre exists stores snapshot and sets status 'revealed'", async () => {
    roomSingle.mockResolvedValue({
      data: { id: "room-1", pre_vote_snapshot: { a: 1, b: 0 } },
      error: null,
    });
    const res = await POST(req({ kind: "final" }), ctx("1234"));
    const [row] = update.mock.calls[0];
    expect(row).toEqual({
      final_snapshot: { a: 2, b: 1 },
      status: "revealed",
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ a: 2, b: 1 });
  });

  it("final when pre is null -> 409", async () => {
    roomSingle.mockResolvedValue({
      data: { id: "room-1", pre_vote_snapshot: null },
      error: null,
    });
    const res = await POST(req({ kind: "final" }), ctx("1234"));
    expect(res.status).toBe(409);
    expect(update).not.toHaveBeenCalled();
  });

  it("unknown code -> 404", async () => {
    roomSingle.mockResolvedValue({ data: null, error: null });
    const res = await POST(req({ kind: "pre" }), ctx("9999"));
    expect(res.status).toBe(404);
    expect(update).not.toHaveBeenCalled();
  });

  it("invalid kind -> 400", async () => {
    const res = await POST(req({ kind: "bogus" }), ctx("1234"));
    expect(res.status).toBe(400);
  });
});
