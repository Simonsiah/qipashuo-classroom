import { render, screen } from "@testing-library/react";
import { JoinQR } from "./JoinQR";

describe("JoinQR", () => {
  it("renders the code text", () => {
    render(<JoinQR code="4821" joinUrl="https://x.test/join/4821" />);
    expect(screen.getByText("4821")).toBeInTheDocument();
  });

  it("renders a QR svg and the caption", () => {
    const { container } = render(
      <JoinQR code="4821" joinUrl="https://x.test/join/4821" />,
    );
    expect(container.querySelector("svg")).toBeTruthy();
    expect(screen.getByText("扫码投票")).toBeInTheDocument();
  });
});
