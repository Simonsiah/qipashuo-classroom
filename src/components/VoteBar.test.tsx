import { render, screen } from "@testing-library/react";
import { VoteBar } from "./VoteBar";

describe("VoteBar", () => {
  it("renders both percentages", () => {
    render(<VoteBar pctA={58} pctB={42} />);
    expect(screen.getByText("58%")).toBeInTheDocument();
    expect(screen.getByText("42%")).toBeInTheDocument();
  });

  it("sizes the A segment to pctA% width", () => {
    render(<VoteBar pctA={58} pctB={42} />);
    const aSeg = screen.getByText("58%");
    expect(aSeg).toHaveStyle({ width: "58%" });
  });

  it("sizes the B segment to pctB% width", () => {
    render(<VoteBar pctA={58} pctB={42} />);
    const bSeg = screen.getByText("42%");
    expect(bSeg).toHaveStyle({ width: "42%" });
  });
});
