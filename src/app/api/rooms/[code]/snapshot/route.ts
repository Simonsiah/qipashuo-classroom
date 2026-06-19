import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { tally } from "@/lib/tally";
import type { Snapshot } from "@/lib/types";

type Kind = "pre" | "final";

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const kind = body.kind;
  if (kind !== "pre" && kind !== "final") {
    return NextResponse.json({ error: "invalid_kind" }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  const { data: room } = await supabase
    .from("rooms")
    .select("id, pre_vote_snapshot")
    .eq("code", code)
    .single();

  if (!room) {
    return NextResponse.json({ error: "room_not_found" }, { status: 404 });
  }

  // Final snapshot requires the pre-vote snapshot to be locked first.
  if (kind === "final" && room.pre_vote_snapshot == null) {
    return NextResponse.json({ error: "pre_not_locked" }, { status: 409 });
  }

  const { data: votes } = await supabase
    .from("votes")
    .select("side")
    .eq("room_id", room.id);

  const t = tally(votes ?? []);
  const snapshot: Snapshot = { a: t.a, b: t.b };

  const patch: Record<string, unknown> =
    (kind as Kind) === "pre"
      ? { pre_vote_snapshot: snapshot }
      : { final_snapshot: snapshot, status: "revealed" };

  const { error } = await supabase.from("rooms").update(patch).eq("id", room.id);

  if (error) {
    return NextResponse.json({ error: "snapshot_failed" }, { status: 500 });
  }

  return NextResponse.json(snapshot, { status: 200 });
}
