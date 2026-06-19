// A tiny WebAudio buzzer for the stage. Browsers block audio playback until a
// user gesture occurs, so the AudioContext is created/resumed lazily on the
// first keypress (primeAudio). buzz() is a no-op until then.

let ctx: AudioContext | null = null;

type AudioCtor = typeof AudioContext;

function getAudioCtor(): AudioCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    AudioContext?: AudioCtor;
    webkitAudioContext?: AudioCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/**
 * Lazily create/resume the singleton AudioContext. Must be called from within a
 * user gesture (e.g. the first keydown) to satisfy browser autoplay policies.
 */
export function primeAudio(): void {
  const Ctor = getAudioCtor();
  if (!Ctor) return;
  if (!ctx) {
    try {
      ctx = new Ctor();
    } catch {
      ctx = null;
      return;
    }
  }
  if (ctx.state === "suspended" && typeof ctx.resume === "function") {
    void ctx.resume();
  }
}

/** Play a short beep. No-op until primeAudio() has run. */
export function buzz(): void {
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 660;
    gain.gain.value = 0.2;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    osc.start(now);
    osc.stop(now + 0.2);
  } catch {
    // Defensive: never let a buzzer failure break the stage.
  }
}

// Exposed for tests to reset the singleton between cases.
export function __resetForTest(): void {
  ctx = null;
}
