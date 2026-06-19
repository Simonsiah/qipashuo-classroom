import { render } from "@testing-library/react";
import { WinnerReveal } from "./WinnerReveal";
import type { SwingResult } from "@/lib/swing";

const framing = "你没有赢下全场，你改变了全场";

describe("WinnerReveal", () => {
  it("renders A net-win headline plus framing", () => {
    const swing: SwingResult = { gainA: 10, gainB: 2, winner: "a", margin: 8 };
    const { container } = render(
      <WinnerReveal swing={swing} labelA="正方" labelB="反方" />,
    );
    expect(container.textContent).toContain("正方 净胜 +8 票");
    expect(container.textContent).toContain(framing);
  });

  it("renders B net-win headline", () => {
    const swing: SwingResult = { gainA: 1, gainB: 6, winner: "b", margin: 5 };
    const { container } = render(
      <WinnerReveal swing={swing} labelA="正方" labelB="反方" />,
    );
    expect(container.textContent).toContain("反方 净胜 +5 票");
  });

  it("renders 平局 on a tie, with framing", () => {
    const swing: SwingResult = { gainA: 3, gainB: 3, winner: "tie", margin: 0 };
    const { container } = render(
      <WinnerReveal swing={swing} labelA="正方" labelB="反方" />,
    );
    expect(container.textContent).toContain("平局");
    expect(container.textContent).toContain(framing);
  });
});
