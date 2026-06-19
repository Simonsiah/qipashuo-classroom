import type { Side } from "@/lib/types";

interface VoteButtonsProps {
  labelA: string;
  labelB: string;
  debatersA?: string[];
  debatersB?: string[];
  selected: Side | null;
  onVote: (side: Side) => void;
}

export function VoteButtons({
  labelA,
  labelB,
  debatersA = [],
  debatersB = [],
  selected,
  onVote,
}: VoteButtonsProps) {
  return (
    <div className="flex flex-col gap-4 w-full">
      <button
        type="button"
        aria-pressed={selected === "a"}
        onClick={() => onVote("a")}
        className={`w-full rounded-2xl py-10 px-6 text-white text-2xl font-bold transition active:scale-95 bg-blue-600 ${
          selected === "a"
            ? "ring-4 ring-blue-300 ring-offset-2"
            : "opacity-90 hover:opacity-100"
        }`}
      >
        <span className="block">{labelA}</span>
        {debatersA.length > 0 && (
          <span className="mt-2 block text-sm font-normal opacity-90">
            {debatersA.join(" · ")}
          </span>
        )}
      </button>

      <button
        type="button"
        aria-pressed={selected === "b"}
        onClick={() => onVote("b")}
        className={`w-full rounded-2xl py-10 px-6 text-white text-2xl font-bold transition active:scale-95 bg-red-600 ${
          selected === "b"
            ? "ring-4 ring-red-300 ring-offset-2"
            : "opacity-90 hover:opacity-100"
        }`}
      >
        <span className="block">{labelB}</span>
        {debatersB.length > 0 && (
          <span className="mt-2 block text-sm font-normal opacity-90">
            {debatersB.join(" · ")}
          </span>
        )}
      </button>
    </div>
  );
}
