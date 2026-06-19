import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VoteButtons } from "./VoteButtons";

describe("VoteButtons", () => {
  it("renders both side labels", () => {
    render(
      <VoteButtons
        labelA="正方"
        labelB="反方"
        selected={null}
        onVote={() => {}}
      />,
    );
    expect(screen.getByText("正方")).toBeInTheDocument();
    expect(screen.getByText("反方")).toBeInTheDocument();
  });

  it("renders debater names when provided", () => {
    render(
      <VoteButtons
        labelA="正方"
        labelB="反方"
        debatersA={["小明", "小刚"]}
        debatersB={["小红"]}
        selected={null}
        onVote={() => {}}
      />,
    );
    expect(screen.getByText(/小明/)).toBeInTheDocument();
    expect(screen.getByText(/小刚/)).toBeInTheDocument();
    expect(screen.getByText(/小红/)).toBeInTheDocument();
  });

  it("calls onVote with 'a' when side A is clicked", async () => {
    const onVote = vi.fn();
    render(
      <VoteButtons labelA="正方" labelB="反方" selected={null} onVote={onVote} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /正方/ }));
    expect(onVote).toHaveBeenCalledWith("a");
  });

  it("calls onVote with 'b' when side B is clicked", async () => {
    const onVote = vi.fn();
    render(
      <VoteButtons labelA="正方" labelB="反方" selected={null} onVote={onVote} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /反方/ }));
    expect(onVote).toHaveBeenCalledWith("b");
  });

  it("marks the selected side with aria-pressed", () => {
    render(
      <VoteButtons labelA="正方" labelB="反方" selected="a" onVote={() => {}} />,
    );
    expect(screen.getByRole("button", { name: /正方/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /反方/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("renders no numeric or percentage text", () => {
    const { container } = render(
      <VoteButtons
        labelA="正方"
        labelB="反方"
        debatersA={["小明"]}
        debatersB={["小红"]}
        selected="b"
        onVote={() => {}}
      />,
    );
    expect(container.textContent ?? "").not.toMatch(/[%]|\d/);
  });
});
