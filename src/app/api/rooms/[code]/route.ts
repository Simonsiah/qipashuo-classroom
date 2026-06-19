import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;

  const supabase = supabaseAdmin();

  const { data: room } = await supabase
    .from("rooms")
    .select("code, topic, side_a_label, side_b_label, debaters_a, debaters_b")
    .eq("code", code)
    .single();

  if (!room) {
    return NextResponse.json({ error: "room_not_found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      code: room.code,
      topic: room.topic,
      side_a_label: room.side_a_label,
      side_b_label: room.side_b_label,
      debaters_a: room.debaters_a ?? [],
      debaters_b: room.debaters_b ?? [],
    },
    { status: 200 },
  );
}
