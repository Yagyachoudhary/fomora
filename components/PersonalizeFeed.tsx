"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Shown on the Radar when some launches still carry global scores.
 * One click batch-scores the whole feed for this user.
 */
export function PersonalizeFeed({ unscored }: { unscored: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function run() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/score-feed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scoring failed");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (unscored === 0) return null;

  return (
    <div className="bg-[#FFF6F4] border border-brand/30 p-6 mb-10 flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex-1">
        <div className="serif font-extrabold text-xl">
          {unscored} launch{unscored === 1 ? "" : "es"} still showing global scores
        </div>
        <p className="text-ink-soft text-sm mt-1">
          Score them against your profile to see what actually matters to you. Takes about 10 seconds.
        </p>
        {err && <p className="text-brand text-sm mt-2">{err}</p>}
      </div>
      <button onClick={run} disabled={busy} className="btn btn-primary whitespace-nowrap">
        {busy ? "Scoring…" : "Personalize my feed"}
      </button>
    </div>
  );
}
