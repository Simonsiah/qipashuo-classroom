import { describe, it, expect, vi, beforeEach } from "vitest";

// A fake oscillator / AudioContext we can inspect.
function makeFakeAudio() {
  const oscillator = {
    type: "" as OscillatorType,
    frequency: { value: 0 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
  const gain = {
    gain: { value: 0 },
    connect: vi.fn(),
  };
  const ctx = {
    state: "running",
    currentTime: 0,
    createOscillator: vi.fn(() => oscillator),
    createGain: vi.fn(() => gain),
    resume: vi.fn(() => Promise.resolve()),
    destination: {},
  };
  // Must be constructable via `new`, so use a real function (not an arrow).
  const AudioContextMock = vi.fn(function () {
    return ctx;
  });
  return { ctx, oscillator, gain, AudioContextMock };
}

describe("buzzer", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("buzz() does nothing before primeAudio() — no oscillator created", async () => {
    const { ctx, AudioContextMock } = makeFakeAudio();
    vi.stubGlobal("AudioContext", AudioContextMock);

    const { buzz } = await import("./buzzer");
    buzz();

    expect(AudioContextMock).not.toHaveBeenCalled();
    expect(ctx.createOscillator).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("after primeAudio(), buzz() creates an oscillator and starts/stops it", async () => {
    const { ctx, oscillator, AudioContextMock } = makeFakeAudio();
    vi.stubGlobal("AudioContext", AudioContextMock);

    const { primeAudio, buzz } = await import("./buzzer");
    primeAudio();
    expect(AudioContextMock).toHaveBeenCalledTimes(1);

    buzz();
    expect(ctx.createOscillator).toHaveBeenCalledTimes(1);
    expect(oscillator.start).toHaveBeenCalledTimes(1);
    expect(oscillator.stop).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });

  it("primeAudio() is idempotent (singleton context)", async () => {
    const { AudioContextMock } = makeFakeAudio();
    vi.stubGlobal("AudioContext", AudioContextMock);

    const { primeAudio } = await import("./buzzer");
    primeAudio();
    primeAudio();
    expect(AudioContextMock).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });
});
