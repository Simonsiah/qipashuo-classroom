"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isValidRoomCode } from "@/lib/roomCode";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidRoomCode(code)) {
      setError(true);
      return;
    }
    setError(false);
    router.push(`/room/${code}/vote`);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold text-zinc-900">加入投票 / Join</h1>
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-xs flex-col items-stretch gap-4"
      >
        <input
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={4}
          aria-label="房间号 / Room code"
          placeholder="4 位房间号"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, "").slice(0, 4));
            setError(false);
          }}
          className="rounded-xl border border-zinc-300 px-4 py-4 text-center text-3xl tracking-[0.5em] focus:border-blue-500 focus:outline-none"
        />
        {error && (
          <p className="text-sm text-red-600">请输入有效的 4 位房间号。</p>
        )}
        <button
          type="submit"
          className="rounded-xl bg-blue-600 py-4 text-lg font-bold text-white transition active:scale-95"
        >
          加入 / Join
        </button>
      </form>
    </div>
  );
}
