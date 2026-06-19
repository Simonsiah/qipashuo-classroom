import { initTimer, reduce } from "./timer";
const D = 120;
describe("timer reducer", () => {
  it("single: start/pause/tick", () => {
    let s = initTimer(D, "single");
    s = reduce(s, { type: "TOGGLE" });
    expect(s.running).toBe(true);
    s = reduce(s, { type: "TICK" });
    expect(s.single).toBe(119);
    s = reduce(s, { type: "TOGGLE" });
    s = reduce(s, { type: "TICK" });
    expect(s.single).toBe(119);
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
    s = reduce(s, { type: "TOGGLE" });
    s = reduce(s, { type: "TICK" });
    expect(s.bankA).toBe(119);
    expect(s.bankB).toBe(120);
    s = reduce(s, { type: "SWITCH" });
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
