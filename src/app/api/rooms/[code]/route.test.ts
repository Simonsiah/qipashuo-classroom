import { describe, it, expect, vi, beforeEach } from "vitest";

const single = vi.fn();
const eq = vi.fn(() => ({ single }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn((table: string) => {
  if (table === "rooms") return { select };
  throw new Error("unexpected table " + table);
});

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: () => ({ from }),
}));

import { GET } from "./route";

function ctx(code: string) {
  return { params: Promise.resolve({ code }) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/rooms/[code]", () => {
  it("returns public room fields for a known code", async () => {
    single.mockResolvedValue({
      data: {
        code: "1234",
        topic: "猫还是狗",
        side_a_label: "正方",
        side_b_label: "反方",
        debaters_a: ["小明"],
        debaters_b: ["小红"],
      },
      error: null,
    });

    const res = await GET(new Request("http://x/api/rooms/1234"), ctx("1234"));
    expect(from).toHaveBeenCalledWith("rooms");
    expect(eq).toHaveBeenCalledWith("code", "1234");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      code: "1234",
      topic: "猫还是狗",
      side_a_label: "正方",
      side_b_label: "反方",
      debaters_a: ["小明"],
      debaters_b: ["小红"],
    });
  });

  it("returns 404 for an unknown code", async () => {
    single.mockResolvedValue({ data: null, error: null });
    const res = await GET(new Request("http://x/api/rooms/9999"), ctx("9999"));
    expect(res.status).toBe(404);
  });
});
