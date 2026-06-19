import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  useParams: () => ({ code: "1234" }),
}));

vi.mock("@/lib/deviceId", () => ({
  getDeviceId: () => "dev-1",
}));

import VotePage from "./page";

const room = {
  code: "1234",
  topic: "猫还是狗更适合当宠物",
  side_a_label: "正方",
  side_b_label: "反方",
  debaters_a: ["小明"],
  debaters_b: ["小红"],
};

function mockFetch() {
  const fetchMock = vi.fn((url: string | URL | Request, init?: RequestInit) => {
    const u = typeof url === "string" ? url : url.toString();
    if (u.includes("/vote")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      } as Response);
    }
    // GET room
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => room,
    } as Response);
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Vote page", () => {
  it("loads room labels and topic on mount", async () => {
    mockFetch();
    render(<VotePage />);
    expect(await screen.findByText(/猫还是狗更适合当宠物/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /正方/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /反方/ })).toBeInTheDocument();
  });

  it("POSTs vote with deviceId and side 'a' when side A is selected", async () => {
    const fetchMock = mockFetch();
    render(<VotePage />);
    await screen.findByText(/猫还是狗更适合当宠物/);

    await userEvent.click(screen.getByRole("button", { name: /正方/ }));

    await waitFor(() => {
      const voteCall = fetchMock.mock.calls.find((c) =>
        String(c[0]).includes("/vote"),
      );
      expect(voteCall).toBeTruthy();
      const init = voteCall![1] as RequestInit;
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body as string)).toEqual({
        deviceId: "dev-1",
        side: "a",
      });
      expect(String(voteCall![0])).toContain("/api/rooms/1234/vote");
    });
  });

  it("re-POSTs side 'b' when switching from A to B", async () => {
    const fetchMock = mockFetch();
    render(<VotePage />);
    await screen.findByText(/猫还是狗更适合当宠物/);

    await userEvent.click(screen.getByRole("button", { name: /正方/ }));
    await userEvent.click(screen.getByRole("button", { name: /反方/ }));

    await waitFor(() => {
      const voteCalls = fetchMock.mock.calls.filter((c) =>
        String(c[0]).includes("/vote"),
      );
      const lastSide = JSON.parse(
        (voteCalls[voteCalls.length - 1][1] as RequestInit).body as string,
      ).side;
      expect(lastSide).toBe("b");
    });
  });

  it("shows 房间不存在 for an unknown code (404)", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({ error: "room_not_found" }),
      } as Response),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<VotePage />);
    expect(await screen.findByText(/房间不存在/)).toBeInTheDocument();
  });

  it("renders no percentage text", async () => {
    mockFetch();
    const { container } = render(<VotePage />);
    await screen.findByText(/猫还是狗更适合当宠物/);
    expect(container.textContent ?? "").not.toContain("%");
  });
});
