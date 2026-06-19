import type { Side } from "./types";
export type Mode = "single" | "double";
export interface TimerState {
  mode: Mode; def: number; running: boolean; expired: boolean;
  single: number; bankA: number; bankB: number; active: Side;
}
export type TimerAction =
  | { type: "TOGGLE" } | { type: "SWITCH" } | { type: "TICK" }
  | { type: "ADJUST"; delta: number } | { type: "RESET" }
  | { type: "SET_MODE"; mode: Mode };

export function initTimer(def: number, mode: Mode): TimerState {
  return { mode, def, running: false, expired: false, single: def, bankA: def, bankB: def, active: "a" };
}
const clamp = (n: number) => Math.max(0, n);

export function reduce(s: TimerState, a: TimerAction): TimerState {
  switch (a.type) {
    case "TOGGLE": return { ...s, running: !s.running, expired: false };
    case "SWITCH":
      if (s.mode !== "double") return s;
      return { ...s, active: s.active === "a" ? "b" : "a" };
    case "ADJUST": {
      if (s.mode === "single") return { ...s, single: clamp(s.single + a.delta), expired: false };
      return s.active === "a"
        ? { ...s, bankA: clamp(s.bankA + a.delta), expired: false }
        : { ...s, bankB: clamp(s.bankB + a.delta), expired: false };
    }
    case "RESET": return initTimer(s.def, s.mode);
    case "SET_MODE": return initTimer(s.def, a.mode);
    case "TICK": {
      if (!s.running) return s;
      if (s.mode === "single") {
        const v = clamp(s.single - 1);
        return { ...s, single: v, expired: v === 0, running: v === 0 ? false : s.running };
      }
      if (s.active === "a") {
        const v = clamp(s.bankA - 1);
        return { ...s, bankA: v, expired: v === 0, running: v === 0 ? false : s.running };
      }
      const v = clamp(s.bankB - 1);
      return { ...s, bankB: v, expired: v === 0, running: v === 0 ? false : s.running };
    }
  }
}
