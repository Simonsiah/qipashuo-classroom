import { generateRoomCode, isValidRoomCode } from "./roomCode";

describe("roomCode", () => {
  it("generates a 4-digit string", () => {
    expect(generateRoomCode()).toMatch(/^\d{4}$/);
  });
  it("validates format", () => {
    expect(isValidRoomCode("4821")).toBe(true);
    expect(isValidRoomCode("48")).toBe(false);
    expect(isValidRoomCode("abcd")).toBe(false);
  });
});
