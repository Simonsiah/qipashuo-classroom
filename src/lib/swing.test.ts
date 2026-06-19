import { computeSwing } from "./swing";

describe("computeSwing", () => {
  it("winner is the side that gained more", () => {
    expect(computeSwing({ a: 10, b: 10 }, { a: 18, b: 14 }))
      .toEqual({ gainA: 8, gainB: 4, winner: "a", margin: 4 });
  });
  it("ties when gains equal", () => {
    const r = computeSwing({ a: 10, b: 10 }, { a: 12, b: 12 });
    expect(r.winner).toBe("tie");
    expect(r.margin).toBe(0);
  });
});
