import { describe, it, expect, vi, beforeEach } from "vitest";

const upsert = vi.fn();
const single = vi.fn();
const eq = vi.fn(() => ({ single }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn((table: string) => {
  if (table === "rooms") return { select };
  if (table === "votes") return { upsert };
  throw new Error("unexpected table " + table);
});

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: () => ({ from }),
}));

import { POST } from "./route";

function req(body: unknown) {
  return new Request("http://x/api/rooms/1234/vote", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
function ctx(code: string) {
  return { params: Promise.resolve({ code }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  single.mockResolvedValue({ data: { id: "room-1" }, error: null });
  upsert.mockResolvedValue({ error: null });
});

describe("POST /api/rooms/[code]/vote", () => {
  it("valid vote upserts with correct onConflict and returns 200", async () => {
    const res = await POST(req({ deviceId: "dev-1", side: "a" }), ctx("1234"));
    expect(from).toHaveBeenCalledWith("rooms");
    expect(eq).toHaveBeenCalledWith("code", "1234");
    expect(from).toHaveBeenCalledWith("votes");
    const [row, opts] = upsert.mock.calls[0];
    expect(row).toMatchObject({ room_id: "room-1", device_id: "dev-1", side: "a" });
    expect(typeof row.updated_at).toBe("string");
    expect(opts).toMatchObject({ onConflict: "room_id,device_id" });
    expect(res.status).toBe(200);
  });

  it("invalid side -> 400", async () => {
    const res = await POST(req({ deviceId: "dev-1", side: "x" }), ctx("1234"));
    expect(res.status).toBe(400);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("unknown code -> 404", async () => {
    single.mockResolvedValue({ data: null, error: null });
    const res = await POST(req({ deviceId: "dev-1", side: "a" }), ctx("9999"));
    expect(res.status).toBe(404);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("second call from same device with different side updates (upsert with new side)", async () => {
    await POST(req({ deviceId: "dev-1", side: "a" }), ctx("1234"));
    await POST(req({ deviceId: "dev-1", side: "b" }), ctx("1234"));
    const [row, opts] = upsert.mock.calls[1];
    expect(row).toMatchObject({ room_id: "room-1", device_id: "dev-1", side: "b" });
    expect(opts).toMatchObject({ onConflict: "room_id,device_id" });
  });
});
