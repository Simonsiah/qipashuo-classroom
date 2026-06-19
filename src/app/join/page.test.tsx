import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

import JoinPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Join page", () => {
  it("navigates to the vote route for a valid 4-digit code", async () => {
    render(<JoinPage />);
    await userEvent.type(screen.getByRole("textbox"), "1234");
    await userEvent.click(screen.getByRole("button", { name: /加入|Join/ }));
    expect(push).toHaveBeenCalledWith("/room/1234/vote");
  });

  it("shows validation and does not navigate for an invalid code", async () => {
    render(<JoinPage />);
    await userEvent.type(screen.getByRole("textbox"), "12");
    await userEvent.click(screen.getByRole("button", { name: /加入|Join/ }));
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByText(/4\s*位|四位|有效/)).toBeInTheDocument();
  });
});
