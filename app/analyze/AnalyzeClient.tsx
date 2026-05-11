"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BrandHeader } from "@/components/BrandHeader";
import { BottomNav } from "@/components/BottomNav";
import type { FomoAnalysis } from "@/lib/types";

export default function AnalyzeClient() {
  const params = useSearchParams();
  const prefill = params.get("url") ?? "";

  const [input, setInput] = useState(prefill);
  const [name, setName] = useState<string>("");
  const [launchId, setLaunchId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FomoAnalysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    if (prefill) submit(prefill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  async function submit(value?: string) {
    const v = (value ?? input).trim();
    if (!v) return;
    setBusy(true); setErr(""); setAnalysis(null); setSaved(false);
    try {
      const isUrl = /^https?:\/\//.test(v);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isUrl ? { url: v } : { text: v })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setName(data.name ?? "");
      setLaunchId(data.launchId ?? null);
      setAnalysis(data.analysis);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!launchId) { setSaved(true); return; }
    await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ launchId })
    });
    setSaved(true);
  }

  return (
    <>
      <BrandHeader />
      <main className="max-w-[1100px] mx-auto px-8 py-8">
        <section className="bg-[#0E0E0D] text-white p-12">
          <div className="text-[11px] uppercase tracking-[0.22em] text-white/60">Analyze</div>
          <h1 className="serif text-5xl md:text-6xl font-black mt-3 leading-none">Should you care<br />about this?</h1>
          <p className="text-white/70 mt-4 max-w-lg">Drop a URL, tweet, or paste raw text. Fomora returns a personalized FOMO score in under 30 seconds.</p>
          <form onSubmit={e => { e.preventDefault(); submit(); }} className="flex gap-3 mt-7 flex-col md:flex-row">
            <input
              className="flex-1 px-5 py-4 bg-white/5 border border-white/20 text-white text-base placeholder:text-white/40 focus:border-brand focus:outline-none"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Paste a URL, tweet, or product page…"
            />
            <button className="px-8 py-4 bg-brand text-white text-sm font-bold uppercase tracking-[0.1em] hover:bg-brand-deep disabled:bg-rule disabled:text-muted" disabled={busy} type="submit">
              {busy ? "Analyzing…" : "Analyze →"}
            </button>
          </form>
          {err && <p className="text-brand text-sm mt-4">{err}</p>}
        </section>

        {analysis && (
          <section className="bg-white border border-rule p-10 mt-0">
            <div className="flex gap-5 items-start">
              <div className="logo-box">{(name || "?").slice(0, 1)}</div>
              <div>
                <h2 className="serif text-3xl font-extrabold">{name}</h2>
                <div className="text-muted text-sm mt-1">Personalized analysis · {new Date().toLocaleDateString()}</div>
              </div>
            </div>

            <div className="flex items-baseline gap-4 mt-7">
              <div className="serif text-7xl font-black text-brand leading-none">{analysis.fomo_score}</div>
              <div className="serif text-2xl text-muted">/100</div>
            </div>
            <div className="serif italic text-xl mt-4 mb-7">&quot;{analysis.verdict}&quot;</div>

            <div className="grid md:grid-cols-2 gap-7 pt-7 border-t border-rule">
              <Block label="Why YOU should care">{analysis.why_you}</Block>
              <Block label="Time to learn">{analysis.time_to_learn}</Block>
              <Block label="Signal">
                <span className={`badge badge-box ${analysis.signal_badge === 'Paradigm Shift' ? '' : 'badge-high'}`}>{analysis.signal_badge}</span>
                <span className="block text-muted text-sm mt-2">⚡ {analysis.velocity}</span>
              </Block>
              <Block label="Suggested actions">
                <ul className="list-disc pl-5 space-y-1 text-ink-soft text-sm leading-relaxed">
                  {analysis.actions.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </Block>
              <Block label="Risks">
                <ul className="list-disc pl-5 space-y-1 text-ink-soft text-sm leading-relaxed">
                  {analysis.risks.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </Block>
              <Block label="Ignore if">{analysis.ignore_if}</Block>
            </div>

            <div className="flex gap-3 mt-8 pt-7 border-t border-rule">
              <button className="btn btn-primary" onClick={save} disabled={saved}>
                {saved ? "✓ Saved" : "Save to library"}
              </button>
              <button className="btn" onClick={() => { setAnalysis(null); setInput(""); }}>Analyze another</button>
            </div>
          </section>
        )}
      </main>
      <BottomNav />
    </>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[11px] uppercase tracking-[0.22em] text-brand font-semibold mb-2.5">{label}</h4>
      <div className="text-ink-soft text-sm leading-relaxed">{children}</div>
    </div>
  );
}
