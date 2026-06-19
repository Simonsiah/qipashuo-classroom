import { formatClock } from "./formatClock";

describe("formatClock", () => {
  it("pads to mm:ss", () => {
    expect(formatClock(119)).toBe("01:59");
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(120)).toBe("02:00");
    expect(formatClock(5)).toBe("00:05");
  });
});
