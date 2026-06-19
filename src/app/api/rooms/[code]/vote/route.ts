import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { Side } from "@/lib/types";

function isSide(v: unknown): v is Side {
  return v === "a" || v === "b";
}

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

  const deviceId = typeof body.deviceId === "string" ? body.deviceId : "";
  const side = body.side;
  if (!deviceId || !isSide(side)) {
    return NextResponse.json({ error: "invalid_vote" }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  const { data: room } = await supabase
    .from("rooms")
    .select("id")
    .eq("code", code)
    .single();

  if (!room) {
    return NextResponse.json({ error: "room_not_found" }, { status: 404 });
  }

  const { error } = await supabase.from("votes").upsert(
    {
      room_id: room.id,
      device_id: deviceId,
      side,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "room_id,device_id" },
  );

  if (error) {
    return NextResponse.json({ error: "vote_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
