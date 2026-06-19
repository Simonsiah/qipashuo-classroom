import type { SwingResult } from "@/lib/swing";

interface WinnerRevealProps {
  swing: SwingResult;
  labelA: string;
  labelB: string;
}

export function WinnerReveal({ swing, labelA, labelB }: WinnerRevealProps) {
  const headline =
    swing.winner === "a"
      ? `${labelA} 净胜 +${swing.margin} 票`
      : swing.winner === "b"
        ? `${labelB} 净胜 +${swing.margin} 票`
        : "平局";

  const accent =
    swing.winner === "a"
      ? "text-blue-400"
      : swing.winner === "b"
        ? "text-red-400"
        : "text-white";

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <h2 className={`text-7xl font-black tabular-nums ${accent}`}>
        {headline}
      </h2>
      <p className="text-3xl font-medium text-white/80">
        你没有赢下全场，你改变了全场
      </p>
    </div>
  );
}
