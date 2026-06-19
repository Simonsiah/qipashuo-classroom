import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateRoomCode } from "@/lib/roomCode";

const MAX_DEBATERS = 3;
const MIN_TIMER_SECONDS = 30;
const DEFAULT_TIMER_SECONDS = 120;

function cleanDebaters(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((d) => (typeof d === "string" ? d.trim() : ""))
    .filter((d) => d.length > 0);
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  if (!topic) {
    return NextResponse.json({ error: "topic_required" }, { status: 400 });
  }

  const debatersA = cleanDebaters(body.debatersA);
  const debatersB = cleanDebaters(body.debatersB);
  if (debatersA.length > MAX_DEBATERS || debatersB.length > MAX_DEBATERS) {
    return NextResponse.json({ error: "too_many_debaters" }, { status: 400 });
  }

  let timerDefaultSeconds = DEFAULT_TIMER_SECONDS;
  if (body.timerDefaultSeconds !== undefined && body.timerDefaultSeconds !== null) {
    const t = Number(body.timerDefaultSeconds);
    if (!Number.isFinite(t) || t < MIN_TIMER_SECONDS) {
      return NextResponse.json({ error: "timer_too_short" }, { status: 400 });
    }
    timerDefaultSeconds = t;
  }

  const sideALabel =
    typeof body.sideALabel === "string" && body.sideALabel.trim()
      ? body.sideALabel.trim()
      : "正方";
  const sideBLabel =
    typeof body.sideBLabel === "string" && body.sideBLabel.trim()
      ? body.sideBLabel.trim()
      : "反方";

  const supabase = supabaseAdmin();

  async function insertOnce(code: string) {
    return supabase
      .from("rooms")
      .insert({
        code,
        topic,
        side_a_label: sideALabel,
        side_b_label: sideBLabel,
        debaters_a: debatersA,
        debaters_b: debatersB,
        timer_default_seconds: timerDefaultSeconds,
        status: "live",
      })
      .select()
      .single();
  }

  let code = generateRoomCode();
  let { data, error } = await insertOnce(code);

  // Retry once on unique code collision
  if (error && (error as { code?: string }).code === "23505") {
    code = generateRoomCode();
    ({ data, error } = await insertOnce(code));
  }

  if (error || !data) {
    console.error("[/api/rooms] Supabase insert error:", JSON.stringify(error));
    return NextResponse.json({ error: "create_failed", detail: error }, { status: 500 });
  }

  return NextResponse.json({ code }, { status: 201 });
}
