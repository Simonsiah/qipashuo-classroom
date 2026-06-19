export function generateRoomCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
export function isValidRoomCode(code: string): boolean {
  return /^\d{4}$/.test(code);
}
