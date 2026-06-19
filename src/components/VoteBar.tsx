interface VoteBarProps {
  pctA: number;
  pctB: number;
  labelA?: string;
  labelB?: string;
}

export function VoteBar({ pctA, pctB, labelA, labelB }: VoteBarProps) {
  return (
    <div className="w-full">
      {(labelA || labelB) && (
        <div className="mb-2 flex justify-between text-xl font-semibold">
          <span className="text-blue-400">{labelA}</span>
          <span className="text-red-400">{labelB}</span>
        </div>
      )}
      <div className="flex h-16 w-full overflow-hidden rounded-2xl">
        <div
          className="flex items-center justify-start bg-blue-700 px-4 text-2xl font-black tabular-nums text-white"
          style={{ width: `${pctA}%` }}
        >
          {pctA}%
        </div>
        <div
          className="flex items-center justify-end bg-red-700 px-4 text-2xl font-black tabular-nums text-white"
          style={{ width: `${pctB}%` }}
        >
          {pctB}%
        </div>
      </div>
    </div>
  );
}
