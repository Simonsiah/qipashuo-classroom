"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { initTimer, reduce } from "@/lib/timer";
import { tally } from "@/lib/tally";
import { primeAudio, buzz } from "@/lib/buzzer";
import { Arena } from "@/components/Arena";
import type { Room, Snapshot, Side, RoomStatus } from "@/lib/types";

interface StageClientProps {
  room: Room;
  joinUrl: string;
}

const FALLBACK_REFETCH_MS = 3000;

export function StageClient({ room, joinUrl }: StageClientProps) {
  const router = useRouter();

  const [timer, dispatch] = useReducer(
    reduce,
    initTimer(room.timer_default_seconds, "single"),
  );
  const [voteTally, setVoteTally] = useState(() => tally([]));
  const [preSnapshot, setPreSnapshot] = useState<Snapshot | null>(
    room.pre_vote_snapshot,
  );
  const [finalSnapshot, setFinalSnapshot] = useState<Snapshot | null>(
    room.final_snapshot,
  );
  const [status, setStatus] = useState<RoomStatus>(room.status);
  const audioPrimedRef = useRef(false);

  // Re-fetch all votes for this room and recompute the tally. Simple + correct.
  const refetchVotes = useCallback(async () => {
    const { data } = await supabase
      .from("votes")
      .select("side")
      .eq("room_id", room.id);
    setVoteTally(tally((data ?? []) as { side: Side }[]));
  }, [room.id]);

  // Initial load + realtime subscription + polling fallback.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await refetchVotes();
      if (cancelled) return;
    })();

    const channel = supabase
      .channel(`votes-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "votes",
          filter: `room_id=eq.${room.id}`,
        },
        () => {
          void refetchVotes();
        },
      )
      .subscribe();

    // Fallback poll in case the realtime socket drops.
    const poll = setInterval(() => {
      void refetchVotes();
    }, FALLBACK_REFETCH_MS);

    return () => {
      cancelled = true;
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [room.id, refetchVotes]);

  // Drive the timer: dispatch TICK every second; the reducer no-ops when paused.
  useEffect(() => {
    const id = setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => clearInterval(id);
  }, []);

  // Buzz exactly once on the rising edge of `expired`.
  const wasExpiredRef = useRef(false);
  useEffect(() => {
    if (timer.expired && !wasExpiredRef.current) buzz();
    wasExpiredRef.current = timer.expired;
  }, [timer.expired]);

  // Snapshot POST helper.
  const postSnapshot = useCallback(
    async (kind: "pre" | "final") => {
      try {
        const res = await fetch(`/api/rooms/${room.code}/snapshot`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind }),
        });
        if (!res.ok) return;
        const snap = (await res.json()) as Snapshot;
        if (kind === "pre") {
          setPreSnapshot(snap);
        } else {
          setFinalSnapshot(snap);
          setStatus("revealed");
        }
      } catch {
        // Network errors are non-fatal for the classroom flow.
      }
    },
    [room.code],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // First key of any kind unlocks audio (browser autoplay policy).
      if (!audioPrimedRef.current) {
        primeAudio();
        audioPrimedRef.current = true;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          if (timer.mode === "single") {
            dispatch({ type: "TOGGLE" });
          } else if (!timer.running) {
            dispatch({ type: "TOGGLE" }); // start the active bank
          } else {
            dispatch({ type: "SWITCH" }); // hand the clock to the other side
          }
          break;
        case "ArrowLeft":
          dispatch({ type: "ADJUST", delta: -30 });
          break;
        case "ArrowRight":
          dispatch({ type: "ADJUST", delta: 30 });
          break;
        case "r":
        case "R":
          dispatch({ type: "RESET" });
          break;
        case "t":
        case "T":
          dispatch({
            type: "SET_MODE",
            mode: timer.mode === "single" ? "double" : "single",
          });
          break;
        case "p":
        case "P":
          void postSnapshot("pre");
          break;
        case "f":
        case "F":
          void postSnapshot("final");
          break;
        case "Escape":
          router.push("/");
          break;
      }
    },
    [timer.mode, timer.running, postSnapshot, router],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="h-screen w-screen bg-[#0f1117]">
      <Arena
        room={{
          ...room,
          status,
          pre_vote_snapshot: preSnapshot,
          final_snapshot: finalSnapshot,
        }}
        tally={voteTally}
        timer={timer}
        code={room.code}
        joinUrl={joinUrl}
      />
      <footer className="pointer-events-none fixed bottom-2 left-0 right-0 text-center text-xs text-white/25">
        SPACE 计时 · ←/→ ±30s · R 重置 · T 单/双计时 · P 赛前票 · F 赛后票 ·
        Esc 退出
      </footer>
    </div>
  );
}
