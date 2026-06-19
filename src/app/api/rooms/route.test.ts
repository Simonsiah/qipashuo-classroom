import { describe, it, expect, vi, beforeEach } from "vitest";

const insert = vi.fn();
const from = vi.fn(() => ({ insert }));
const client = { from };

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: () => client,
}));

vi.mock("@/lib/roomCode", async (orig) => {
  const actual = await orig<typeof import("@/lib/roomCode")>();
  return { ...actual, generateRoomCode: vi.fn(() => "1234") };
});

import { POST } from "./route";
import { generateRoomCode } from "@/lib/roomCode";

function req(body: unknown) {
  return new Request("http://x/api/rooms", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// insert(...).select().single() chain returning { data, error }
function insertResult(result: { data?: unknown; error?: unknown }) {
  const single = vi.fn().mockResolvedValue(result);
  const select = vi.fn(() => ({ single }));
  insert.mockReturnValueOnce({ select });
  return { single, select };
}

beforeEach(() => {
  vi.clearAllMocks();
  (generateRoomCode as ReturnType<typeof vi.fn>).mockReturnValue("1234");
});

describe("POST /api/rooms", () => {
  it("happy path inserts with status 'live' and returns the code", async () => {
    insertResult({ data: { code: "1234" }, error: null });
    const res = await POST(req({ topic: "校服该不该取消" }));
    expect(from).toHaveBeenCalledWith("rooms");
    const row = insert.mock.calls[0][0];
    expect(row).toMatchObject({
      code: "1234",
      topic: "校服该不该取消",
      status: "live",
      side_a_label: "正方",
      side_b_label: "反方",
      timer_default_seconds: 120,
    });
    expect([200, 201]).toContain(res.status);
    expect(await res.json()).toEqual({ code: "1234" });
  });

  it("trims empty debater strings and keeps custom labels", async () => {
    insertResult({ data: { code: "1234" }, error: null });
    await POST(
      req({
        topic: "T",
        sideALabel: "支持",
        sideBLabel: "反对",
        debatersA: ["小明", "  ", ""],
        debatersB: [],
      }),
    );
    const row = insert.mock.calls[0][0];
    expect(row.side_a_label).toBe("支持");
    expect(row.side_b_label).toBe("反对");
    expect(row.debaters_a).toEqual(["小明"]);
    expect(row.debaters_b).toEqual([]);
  });

  it("empty topic -> 400", async () => {
    const res = await POST(req({ topic: "   " }));
    expect(res.status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });

  it("a 4th debater on a side -> 400", async () => {
    const res = await POST(req({ topic: "T", debatersA: ["a", "b", "c", "d"] }));
    expect(res.status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });

  it("timerDefaultSeconds below 30 -> 400", async () => {
    const res = await POST(req({ topic: "T", timerDefaultSeconds: 10 }));
    expect(res.status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });

  it("retries once on unique code collision", async () => {
    insertResult({ data: null, error: { code: "23505" } });
    insertResult({ data: { code: "5678" }, error: null });
    (generateRoomCode as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce("1234")
      .mockReturnValueOnce("5678");
    const res = await POST(req({ topic: "T" }));
    expect(insert).toHaveBeenCalledTimes(2);
    expect([200, 201]).toContain(res.status);
    expect(await res.json()).toEqual({ code: "5678" });
  });
});
