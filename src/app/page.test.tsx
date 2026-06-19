import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

import SetupPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
});

describe("Match setup screen", () => {
  it("renders topic, side labels (正方/反方), 3 debaters per side, and timer defaulting to 02:00", () => {
    render(<SetupPage />);

    // Topic
    expect(screen.getByLabelText(/辩题|Topic/)).toBeInTheDocument();

    // Side labels default to 正方/反方
    expect(screen.getByDisplayValue("正方")).toBeInTheDocument();
    expect(screen.getByDisplayValue("反方")).toBeInTheDocument();

    // 3 debater inputs per side -> 6 total
    expect(screen.getAllByLabelText(/辩手\s*[123]/).length).toBe(6);

    // Timer default 120s shown as 02:00 and selected
    const timer = screen.getByLabelText(/计时|Timer/) as HTMLSelectElement;
    expect(timer.value).toBe("120");
  });

  it("blocks submit when topic is empty (no fetch)", async () => {
    render(<SetupPage />);
    await userEvent.click(screen.getByRole("button", { name: /开始|Start/ }));
    expect(global.fetch).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("POSTs the right shape and navigates to /room/<code> on success", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ code: "4821" }),
    });

    render(<SetupPage />);

    await userEvent.type(
      screen.getByLabelText(/辩题|Topic/),
      "该不该取消寒假作业",
    );

    const debaterInputs = screen.getAllByLabelText(/辩手\s*[123]/);
    // First 3 are side A, last 3 are side B (by render order)
    await userEvent.type(debaterInputs[0], "小明");
    await userEvent.type(debaterInputs[3], "小红");

    await userEvent.click(screen.getByRole("button", { name: /开始|Start/ }));

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(url).toBe("/api/rooms");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body.topic).toBe("该不该取消寒假作业");
    expect(body.sideALabel).toBe("正方");
    expect(body.sideBLabel).toBe("反方");
    expect(body.debatersA).toEqual(["小明"]);
    expect(body.debatersB).toEqual(["小红"]);
    expect(body.timerDefaultSeconds).toBe(120);
    expect(Number.isInteger(body.timerDefaultSeconds)).toBe(true);

    await vi.waitFor(() =>
      expect(push).toHaveBeenCalledWith("/room/4821"),
    );
  });
});
