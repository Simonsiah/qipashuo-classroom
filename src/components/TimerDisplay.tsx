import type { TimerState } from "@/lib/timer";
import { formatClock } from "@/lib/formatClock";

interface TimerDisplayProps {
  timer: TimerState;
  labelA: string;
  labelB: string;
}

const expiredClass = "text-red-500 animate-pulse flash";

export function TimerDisplay({ timer, labelA, labelB }: TimerDisplayProps) {
  if (timer.mode === "single") {
    return (
      <div className="flex flex-col items-center gap-2">
        <div
          data-testid="clock-single"
          className={`text-8xl font-black tabular-nums ${
            timer.expired ? expiredClass : "text-white"
          }`}
        >
          {formatClock(timer.single)}
        </div>
        <span className="text-xl text-white/60">发言计时</span>
      </div>
    );
  }

  const aActive = timer.active === "a";
  const bActive = timer.active === "b";

  return (
    <div className="flex items-stretch gap-6">
      <Bank
        testId="bank-a"
        label={labelA}
        time={timer.bankA}
        active={aActive}
        expired={timer.expired && aActive}
        side="a"
      />
      <Bank
        testId="bank-b"
        label={labelB}
        time={timer.bankB}
        active={bActive}
        expired={timer.expired && bActive}
        side="b"
      />
    </div>
  );
}

function Bank({
  testId,
  label,
  time,
  active,
  expired,
  side,
}: {
  testId: string;
  label: string;
  time: number;
  active: boolean;
  expired: boolean;
  side: "a" | "b";
}) {
  const accent = side === "a" ? "text-blue-400" : "text-red-400";
  const ring = side === "a" ? "ring-blue-400" : "ring-red-400";
  const activeClass = active
    ? `glow active ring-4 ${ring} bg-black/40`
    : "opacity-40";
  return (
    <div
      data-testid={testId}
      className={`flex flex-col items-center gap-2 rounded-2xl px-6 py-4 transition ${activeClass}`}
    >
      <span className={`text-2xl font-bold ${accent}`}>{label}</span>
      <span
        className={`text-7xl font-black tabular-nums ${
          expired ? expiredClass : "text-white"
        }`}
      >
        {formatClock(time)}
      </span>
    </div>
  );
}
