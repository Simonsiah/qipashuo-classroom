export type Side = "a" | "b";
export type RoomStatus = "setup" | "live" | "revealed";
export interface Snapshot { a: number; b: number; }
export interface Room {
  id: string; code: string; topic: string;
  side_a_label: string; side_b_label: string;
  debaters_a: string[]; debaters_b: string[];
  timer_default_seconds: number;
  pre_vote_snapshot: Snapshot | null;
  final_snapshot: Snapshot | null;
  status: RoomStatus; created_at: string;
}
export interface Vote { id: string; room_id: string; device_id: string; side: Side; updated_at: string; }
