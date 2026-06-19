import { render, screen } from "@testing-library/react";
import { TimerDisplay } from "./TimerDisplay";
import type { TimerState } from "@/lib/timer";

const base: TimerState = {
  mode: "single",
  def: 120,
  running: false,
  expired: false,
  single: 119,
  bankA: 120,
  bankB: 120,
  active: "a",
};

describe("TimerDisplay", () => {
  it("single mode renders one mm:ss clock", () => {
    render(<TimerDisplay timer={base} labelA="正方" labelB="反方" />);
    expect(screen.getByText("01:59")).toBeInTheDocument();
  });

  it("double mode renders both banks with an active and a dimmed bank", () => {
    const timer: TimerState = {
      ...base,
      mode: "double",
      bankA: 90,
      bankB: 75,
      active: "a",
    };
    render(<TimerDisplay timer={timer} labelA="正方" labelB="反方" />);
    const a = screen.getByTestId("bank-a");
    const b = screen.getByTestId("bank-b");
    expect(a.textContent).toContain("01:30");
    expect(b.textContent).toContain("01:15");
    expect(a.className).toMatch(/glow|active/);
    expect(b.className).not.toMatch(/glow|active/);
  });

  it("expired adds a red/flash class to the relevant clock", () => {
    const timer: TimerState = { ...base, single: 0, expired: true };
    render(<TimerDisplay timer={timer} labelA="正方" labelB="反方" />);
    const clock = screen.getByTestId("clock-single");
    expect(clock.className).toMatch(/red|flash/);
  });
});
