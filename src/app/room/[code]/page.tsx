import { supabase } from "@/lib/supabaseClient";
import type { Room } from "@/lib/types";
import { StageClient } from "./StageClient";

// The Stage is the projector display the teacher drives from the laptop.
// This is a server component: it fetches the full room row (RLS allows the
// anon key to SELECT rooms) and hands it to the interactive client.
export default async function StagePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const { data: room } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", code)
    .single<Room>();

  if (!room) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#0f1117] text-white">
        <p className="text-3xl font-bold">房间不存在</p>
        <p className="mt-2 text-white/60">请检查房间号是否正确。</p>
      </div>
    );
  }

  // The QR encodes the path phones open to vote. For real phones it MUST be the
  // deployed origin, so we prefer NEXT_PUBLIC_BASE_URL when configured; otherwise
  // we fall back to a relative path (fine for same-origin/local testing).
  const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "";
  const joinUrl = `${base}/room/${room.code}/vote`;

  return <StageClient room={room} joinUrl={joinUrl} />;
}
