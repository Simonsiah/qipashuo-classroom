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
