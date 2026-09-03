"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Two jobs:
 *  - Big banner when launches still carry global scores (nothing personalized yet).
 *  - Quiet "re-score" link once everything is scored, so a user who changed their
 *    profile isn't stuck looking at verdicts written for their old role.
 */
export function PersonalizeFeed({
  unscored,
  role,
  industry
}: {
  unscored: number;
  role?: string | null;
  industry?: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function run(force: boolean) {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/score-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scoring failed");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const who = [role, industry].filter(Boolean).join(" in ");

  if (unscored > 0) {
    return (
      <div className="bg-[#FFF6F4] border border-brand/30 p-6 mb-8 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <div className="serif font-extrabold text-xl">
            {unscored} launch{unscored === 1 ? "" : "es"} still showing global scores
          </div>
          <p className="text-ink-soft text-sm mt-1">
            Score them against your profile{who ? ` — ${who}` : ""} to see what actually matters to you. Takes about 10 seconds.
          </p>
          {err && <p className="text-brand text-sm mt-2">{err}</p>}
        </div>
        <button onClick={() => run(false)} disabled={busy} className="btn btn-primary whitespace-nowrap">
          {busy ? "Scoring…" : "Personalize my feed"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 mb-6 text-sm">
      <span className="text-muted">
        Scored for <strong className="text-ink-soft">{who || "your profile"}</strong>
      </span>
      <button
        onClick={() => run(true)}
        disabled={busy}
        className="text-muted uppercase tracking-[0.14em] text-[11px] font-bold hover:text-brand disabled:opacity-50"
      >
        {busy ? "Re-scoring…" : "↻ Re-score feed"}
      </button>
      {err && <span className="text-brand text-xs">{err}</span>}
    </div>
  );
}
