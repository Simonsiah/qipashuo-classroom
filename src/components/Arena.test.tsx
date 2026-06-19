import { render, screen } from "@testing-library/react";
import { Arena } from "./Arena";
import type { TimerState } from "@/lib/timer";
import type { RoomStatus, Snapshot } from "@/lib/types";

const timer: TimerState = {
  mode: "single",
  def: 120,
  running: false,
  expired: false,
  single: 119,
  bankA: 120,
  bankB: 120,
  active: "a",
};

function makeRoom(
  status: RoomStatus,
  pre: Snapshot | null = null,
  final: Snapshot | null = null,
) {
  return {
    topic: "应不应该禁止课外补习",
    side_a_label: "正方",
    side_b_label: "反方",
    debaters_a: ["小明", "小刚"],
    debaters_b: ["小红"],
    status,
    pre_vote_snapshot: pre,
    final_snapshot: final,
  };
}

const tally = { a: 18, b: 14, total: 32, pctA: 56, pctB: 44 };

describe("Arena", () => {
  it("renders topic, both team labels, code, and a vote percentage", () => {
    render(
      <Arena
        room={makeRoom("live", { a: 10, b: 10 })}
        tally={tally}
        timer={timer}
        code="4821"
        joinUrl="https://x.test/join/4821"
      />,
    );
    expect(screen.getByText("应不应该禁止课外补习")).toBeInTheDocument();
    expect(screen.getByText("正方")).toBeInTheDocument();
    expect(screen.getByText("反方")).toBeInTheDocument();
    expect(screen.getByText("4821")).toBeInTheDocument();
    expect(screen.getByText("56%")).toBeInTheDocument();
  });

  it("renders the WinnerReveal headline when revealed with snapshots", () => {
    render(
      <Arena
        room={makeRoom("revealed", { a: 10, b: 10 }, { a: 18, b: 14 })}
        tally={tally}
        timer={timer}
        code="4821"
        joinUrl="https://x.test/join/4821"
      />,
    );
    expect(screen.getByText(/净胜 \+4 票/)).toBeInTheDocument();
  });

  it("does not render WinnerReveal before reveal", () => {
    render(
      <Arena
        room={makeRoom("live", { a: 10, b: 10 })}
        tally={tally}
        timer={timer}
        code="4821"
        joinUrl="https://x.test/join/4821"
      />,
    );
    expect(screen.queryByText(/净胜/)).not.toBeInTheDocument();
  });
});
