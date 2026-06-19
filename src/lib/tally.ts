import type { Vote } from "./types";
export interface Tally { a: number; b: number; total: number; pctA: number; pctB: number; }
export function tally(votes: Pick<Vote, "side">[]): Tally {
  const a = votes.filter(v => v.side === "a").length;
  const b = votes.filter(v => v.side === "b").length;
  const total = a + b;
  if (total === 0) return { a: 0, b: 0, total: 0, pctA: 50, pctB: 50 };
  const pctA = Math.round((a / total) * 100);
  return { a, b, total, pctA, pctB: 100 - pctA };
}
