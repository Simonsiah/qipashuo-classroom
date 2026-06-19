import type { Snapshot, Side } from "./types";
export interface SwingResult { gainA: number; gainB: number; winner: Side | "tie"; margin: number; }
export function computeSwing(pre: Snapshot, final: Snapshot): SwingResult {
  const gainA = final.a - pre.a;
  const gainB = final.b - pre.b;
  const margin = Math.abs(gainA - gainB);
  const winner = gainA === gainB ? "tie" : gainA > gainB ? "a" : "b";
  return { gainA, gainB, winner, margin };
}
