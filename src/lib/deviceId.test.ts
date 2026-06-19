import { getDeviceId } from "./deviceId";

describe("getDeviceId", () => {
  beforeEach(() => localStorage.clear());
  it("creates and persists a stable id", () => {
    const a = getDeviceId();
    const b = getDeviceId();
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(8);
  });
  it("reuses across rooms (same browser, one token)", () => {
    const a = getDeviceId();
    localStorage.setItem("qps_other", "x");
    expect(getDeviceId()).toBe(a);
  });
});
