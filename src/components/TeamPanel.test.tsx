import { render, screen } from "@testing-library/react";
import { TeamPanel } from "./TeamPanel";

describe("TeamPanel", () => {
  it("renders label and all debater names", () => {
    render(<TeamPanel side="a" label="正方" debaters={["小明", "小刚"]} />);
    expect(screen.getByText("正方")).toBeInTheDocument();
    expect(screen.getByText(/小明/)).toBeInTheDocument();
    expect(screen.getByText(/小刚/)).toBeInTheDocument();
  });

  it("side a uses a blue-ish class", () => {
    const { container } = render(
      <TeamPanel side="a" label="正方" debaters={[]} />,
    );
    expect(container.innerHTML).toMatch(/blue/);
    expect(container.innerHTML).not.toMatch(/red/);
  });

  it("side b uses a red-ish class", () => {
    const { container } = render(
      <TeamPanel side="b" label="反方" debaters={[]} />,
    );
    expect(container.innerHTML).toMatch(/red/);
    expect(container.innerHTML).not.toMatch(/blue/);
  });
});
