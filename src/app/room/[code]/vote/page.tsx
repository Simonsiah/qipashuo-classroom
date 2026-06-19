"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getDeviceId } from "@/lib/deviceId";
import { VoteButtons } from "@/components/VoteButtons";
import type { Side } from "@/lib/types";

interface RoomPublic {
  code: string;
  topic: string;
  side_a_label: string;
  side_b_label: string;
  debaters_a: string[];
  debaters_b: string[];
}

export default function VotePage() {
  const params = useParams<{ code: string }>();
  const code = params?.code ?? "";

  const [room, setRoom] = useState<RoomPublic | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Side | null>(null);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/rooms/${code}`);
        if (cancelled) return;
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = (await res.json()) as RoomPublic;
        if (!cancelled) setRoom(data);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  async function handleVote(side: Side) {
    setSelected(side);
    try {
      await fetch(`/api/rooms/${code}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: getDeviceId(), side }),
      });
    } catch {
      // Network errors are non-fatal for the classroom flow; selection stays.
    }
  }

  if (notFound) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <p className="text-xl font-semibold text-zinc-700">房间不存在</p>
        <p className="mt-2 text-sm text-zinc-500">请检查房间号是否正确。</p>
      </div>
    );
  }

  if (loading || !room) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-zinc-500">加载中…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <h1 className="max-w-md text-center text-2xl font-bold text-zinc-900">
        {room.topic}
      </h1>
      <div className="w-full max-w-md">
        <VoteButtons
          labelA={room.side_a_label}
          labelB={room.side_b_label}
          debatersA={room.debaters_a}
          debatersB={room.debaters_b}
          selected={selected}
          onVote={handleVote}
        />
      </div>
    </div>
  );
}
