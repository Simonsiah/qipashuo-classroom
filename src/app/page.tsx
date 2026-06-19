"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TIMER_OPTIONS = [
  { seconds: 60, label: "01:00" },
  { seconds: 90, label: "01:30" },
  { seconds: 120, label: "02:00" },
  { seconds: 180, label: "03:00" },
];

export default function SetupPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [sideALabel, setSideALabel] = useState("正方");
  const [sideBLabel, setSideBLabel] = useState("反方");
  const [debatersA, setDebatersA] = useState(["", "", ""]);
  const [debatersB, setDebatersB] = useState(["", "", ""]);
  const [timerDefaultSeconds, setTimerDefaultSeconds] = useState(120);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topicValid = topic.trim().length > 0;

  function updateDebater(
    side: "a" | "b",
    index: number,
    value: string,
  ) {
    const setter = side === "a" ? setDebatersA : setDebatersB;
    setter((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topicValid || submitting) return;

    setSubmitting(true);
    setError(null);

    const body = {
      topic: topic.trim(),
      sideALabel: sideALabel.trim() || "正方",
      sideBLabel: sideBLabel.trim() || "反方",
      debatersA: debatersA.map((d) => d.trim()).filter(Boolean),
      debatersB: debatersB.map((d) => d.trim()).filter(Boolean),
      timerDefaultSeconds,
    };

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError("创建失败，请重试。");
        setSubmitting(false);
        return;
      }
      const data = (await res.json()) as { code: string };
      router.push(`/room/${data.code}`);
    } catch {
      setError("网络错误，请重试。");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 p-6 text-zinc-900">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-2xl flex-col gap-8 py-8"
      >
        <header className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">奇葩说 · 课堂版</h1>
          <p className="text-zinc-500">设置一场新的辩论 / Set up a match</p>
        </header>

        {/* Topic */}
        <div className="flex flex-col gap-2">
          <label htmlFor="topic" className="text-sm font-semibold">
            辩题 / Topic
          </label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="该不该告诉好朋友 TA 的恋人出轨了?"
            className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-lg focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Sides */}
        <div className="grid gap-6 sm:grid-cols-2">
          {(["a", "b"] as const).map((side) => {
            const isA = side === "a";
            const label = isA ? sideALabel : sideBLabel;
            const setLabel = isA ? setSideALabel : setSideBLabel;
            const debaters = isA ? debatersA : debatersB;
            const sideName = isA ? "正方" : "反方";
            return (
              <fieldset
                key={side}
                className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4"
              >
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor={`side-${side}-label`}
                    className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
                  >
                    {isA ? "正方 / Side A" : "反方 / Side B"}
                  </label>
                  <input
                    id={`side-${side}-label`}
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="rounded-lg border border-zinc-300 px-3 py-2 font-semibold focus:border-blue-500 focus:outline-none"
                  />
                </div>
                {debaters.map((value, i) => (
                  <input
                    key={i}
                    type="text"
                    aria-label={`${sideName} 辩手${i + 1}`}
                    placeholder={`辩手${i + 1}`}
                    value={value}
                    onChange={(e) => updateDebater(side, i, e.target.value)}
                    className="rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  />
                ))}
              </fieldset>
            );
          })}
        </div>

        {/* Timer */}
        <div className="flex flex-col gap-2">
          <label htmlFor="timer" className="text-sm font-semibold">
            发言计时 / Timer
          </label>
          <select
            id="timer"
            value={timerDefaultSeconds}
            onChange={(e) => setTimerDefaultSeconds(Number(e.target.value))}
            className="w-40 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-lg focus:border-blue-500 focus:outline-none"
          >
            {TIMER_OPTIONS.map((opt) => (
              <option key={opt.seconds} value={opt.seconds}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!topicValid || submitting}
          className="rounded-xl bg-blue-600 py-4 text-lg font-bold text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "创建中…" : "开始 / Start"}
        </button>
      </form>
    </div>
  );
}
