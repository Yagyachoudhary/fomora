"use client";
import { useState } from "react";

/**
 * "Was this score right?" — thumbs up / down on every launch card.
 *
 * One tap registers. A thumbs-down then offers an optional second tap for
 * direction, because knowing a score was wrong is far less useful than knowing
 * which way it was wrong. Both taps are optimistic — nothing blocks on the request.
 */
export function ScoreFeedback({
  launchId,
  initial
}: {
  launchId: string;
  initial?: string | null;
}) {
  const [value, setValue] = useState<string | null>(initial ?? null);
  const [askDirection, setAskDirection] = useState(false);

  async function send(feedback: string) {
    setValue(feedback);
    if (feedback === "wrong") setAskDirection(true);
    else setAskDirection(false);

    try {
      await fetch("/api/score-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ launchId, feedback })
      });
    } catch {
      // Non-critical — never interrupt reading the feed for a failed vote.
    }
  }

  if (value === "about_right") {
    return <div className="sf sf-done">Thanks — noted.</div>;
  }

  if (value && value !== "wrong") {
    return <div className="sf sf-done">Thanks — that helps calibrate.</div>;
  }

  if (askDirection) {
    return (
      <div className="sf">
        <span className="sf-q">Which way?</span>
        <button className="sf-btn" onClick={() => send("too_low")}>Too low</button>
        <button className="sf-btn" onClick={() => send("too_high")}>Too high</button>
      </div>
    );
  }

  return (
    <div className="sf">
      <span className="sf-q">Score right?</span>
      <button className="sf-ico" onClick={() => send("about_right")} aria-label="Score looks right" title="Score looks right">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 10v12" />
          <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
        </svg>
      </button>
      <button className="sf-ico sf-down" onClick={() => send("wrong")} aria-label="Score looks wrong" title="Score looks wrong">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 14V2" />
          <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
        </svg>
      </button>
    </div>
  );
}
