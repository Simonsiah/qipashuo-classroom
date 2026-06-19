import type { Snapshot } from "@/lib/types";
import { computeSwing } from "@/lib/swing";

interface SwingLineProps {
  pre: Snapshot | null;
  final: Snapshot | null;
  liveTally: { a: number; b: number };
  labelA: string;
  labelB: string;
}

export function SwingLine({
  pre,
  final,
  liveTally,
  labelA,
  labelB,
}: SwingLineProps) {
  if (pre === null) {
    return (
      <p className="text-2xl tabular-nums text-white/70">开场 —</p>
    );
  }

  const current = final ?? liveTally;
  const swing = computeSwing(pre, current);
  const total = current.a + current.b;

  const leader =
    swing.winner === "a"
      ? `${labelA} +${swing.margin}`
      : swing.winner === "b"
        ? `${labelB} +${swing.margin}`
        : "平";

  return (
    <p className="text-2xl tabular-nums text-white/80">
      开场 {pre.a}/{pre.b} → {leader} · {total} 票
    </p>
  );
}
