"use client";
import { useEffect, useState } from "react";
import { FomoraMascot } from "./FomoraMascot";

/**
 * Live hero demo.
 *
 * A lone mascot in empty space reads as a 404 illustration. This shows the
 * actual product instead — and animates the one mechanic that makes Fomora
 * different: the SAME launches score completely differently depending on who
 * you are. Watch Claude Code go 32 → 94, or MCP go 93 → 19, as the persona
 * cycles. That argument lands faster than any sentence could.
 */

type Row = { name: string; cat: string; score: number };

const DEMOS: { who: string; rows: Row[] }[] = [
  {
    who: "Designer in E-commerce",
    rows: [
      { name: "Figma Make", cat: "Design Tools", score: 91 },
      { name: "FLUX.1 [schnell]", cat: "Image AI", score: 84 },
      { name: "Claude Code", cat: "AI Coding", score: 32 }
    ]
  },
  {
    who: "Product Manager in SaaS",
    rows: [
      { name: "Model Context Protocol", cat: "AI Infra", score: 93 },
      { name: "Granola", cat: "Productivity", score: 78 },
      { name: "Suno v5", cat: "Music AI", score: 24 }
    ]
  },
  {
    who: "Engineer",
    rows: [
      { name: "Claude Code", cat: "AI Coding", score: 94 },
      { name: "Model Context Protocol", cat: "AI Infra", score: 88 },
      { name: "Figma Make", cat: "Design Tools", score: 36 }
    ]
  },
  {
    who: "Musician / Audio",
    rows: [
      { name: "Suno v5", cat: "Music AI", score: 95 },
      { name: "ElevenLabs v3", cat: "Voice AI", score: 83 },
      { name: "Model Context Protocol", cat: "AI Infra", score: 19 }
    ]
  }
];

export function HeroDemo() {
  const [i, setI] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setI(n => (n + 1) % DEMOS.length), 3400);
    return () => clearInterval(t);
  }, []);

  const demo = DEMOS[i];

  return (
    <div className="hd">
      <div className="hd-card">
        <div className="hd-head">
          <span className="hd-head-label">Tuned for</span>
          <span className="hd-head-who" key={demo.who}>{demo.who}</span>
        </div>

        <div className="hd-rows">
          {demo.rows.map((r, idx) => (
            <div className="hd-row" key={`${demo.who}-${r.name}`} style={{ animationDelay: `${idx * 70}ms` }}>
              <div className="hd-rank">{String(idx + 1).padStart(2, "0")}</div>
              <div className="hd-main">
                <div className="hd-cat">{r.cat}</div>
                <div className="hd-name">{r.name}</div>
                <div className="hd-bar">
                  <span
                    className={r.score < 50 ? "hd-fill is-low" : "hd-fill"}
                    style={{ width: mounted ? `${r.score}%` : "0%" }}
                  />
                </div>
              </div>
              <div className={r.score < 50 ? "hd-score is-low" : "hd-score"}>{r.score}</div>
            </div>
          ))}
        </div>

        <div className="hd-foot">
          Same launches. Different person. Different answer.
        </div>
      </div>

      {/* parrot perches on the card rather than floating alone in space */}
      <div className="hd-parrot">
        <FomoraMascot size={120} animated />
      </div>
    </div>
  );
}
