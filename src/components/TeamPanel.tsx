import type { Side } from "@/lib/types";

interface TeamPanelProps {
  side: Side;
  label: string;
  debaters: string[];
}

export function TeamPanel({ side, label, debaters }: TeamPanelProps) {
  const isA = side === "a";
  const accent = isA ? "text-blue-400" : "text-red-400";
  const border = isA ? "border-blue-900" : "border-red-900";
  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl border ${border} bg-black/20 px-6 py-8`}
    >
      <h2 className={`text-4xl font-black tracking-wide ${accent}`}>{label}</h2>
      {debaters.length > 0 && (
        <ul className="flex flex-col gap-1">
          {debaters.map((name) => (
            <li key={name} className="text-2xl text-white/80">
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
