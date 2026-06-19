import type { RoomStatus, Snapshot } from "@/lib/types";
import type { TimerState } from "@/lib/timer";
import { computeSwing } from "@/lib/swing";
import { TeamPanel } from "./TeamPanel";
import { TimerDisplay } from "./TimerDisplay";
import { VoteBar } from "./VoteBar";
import { SwingLine } from "./SwingLine";
import { JoinQR } from "./JoinQR";
import { WinnerReveal } from "./WinnerReveal";

interface ArenaRoom {
  topic: string;
  side_a_label: string;
  side_b_label: string;
  debaters_a: string[];
  debaters_b: string[];
  status: RoomStatus;
  pre_vote_snapshot: Snapshot | null;
  final_snapshot: Snapshot | null;
}

interface ArenaProps {
  room: ArenaRoom;
  tally: { a: number; b: number; total: number; pctA: number; pctB: number };
  timer: TimerState;
  code: string;
  joinUrl: string;
}

export function Arena({ room, tally, timer, code, joinUrl }: ArenaProps) {
  const showWinner =
    room.status === "revealed" &&
    room.pre_vote_snapshot !== null &&
    room.final_snapshot !== null;

  return (
    <div className="relative flex aspect-video h-full w-full flex-col bg-[#0f1117] p-8 text-white">
      {/* Top bar: topic centered + JoinQR corner */}
      <header className="flex items-start justify-between gap-6">
        <div className="w-40" aria-hidden />
        <h1 className="flex-1 text-center text-5xl font-black tracking-wide">
          {room.topic}
        </h1>
        <div className="w-40 flex justify-end">
          <JoinQR code={code} joinUrl={joinUrl} />
        </div>
      </header>

      {/* Middle: TeamPanel A · TimerDisplay · TeamPanel B */}
      <main className="flex flex-1 items-center justify-between gap-8 py-8">
        <div className="flex-1">
          <TeamPanel
            side="a"
            label={room.side_a_label}
            debaters={room.debaters_a}
          />
        </div>
        <div className="flex shrink-0 justify-center">
          <TimerDisplay
            timer={timer}
            labelA={room.side_a_label}
            labelB={room.side_b_label}
          />
        </div>
        <div className="flex-1">
          <TeamPanel
            side="b"
            label={room.side_b_label}
            debaters={room.debaters_b}
          />
        </div>
      </main>

      {/* Bottom: VoteBar + SwingLine */}
      <footer className="flex flex-col gap-4">
        <VoteBar pctA={tally.pctA} pctB={tally.pctB} />
        <SwingLine
          pre={room.pre_vote_snapshot}
          final={room.final_snapshot}
          liveTally={{ a: tally.a, b: tally.b }}
          labelA={room.side_a_label}
          labelB={room.side_b_label}
        />
      </footer>

      {showWinner && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <WinnerReveal
            swing={computeSwing(
              room.pre_vote_snapshot as Snapshot,
              room.final_snapshot as Snapshot,
            )}
            labelA={room.side_a_label}
            labelB={room.side_b_label}
          />
        </div>
      )}
    </div>
  );
}
