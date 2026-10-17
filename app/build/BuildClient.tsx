"use client";
import { useState } from "react";
import { BrandHeader } from "@/components/BrandHeader";
import { BottomNav } from "@/components/BottomNav";
import { CostCurve, CostSplit } from "@/components/CostCurve";
import type { Layer } from "@/lib/archetypes";
import type { ChatModel, FixedService } from "@/lib/stack-pricing";

type Tier = {
  tier: "budget" | "balanced" | "premium";
  model: ChatModel;
  perUnit: number;
  monthlyModel: number;
  monthlySurcharge: number;
  monthlyVariable: number;
  monthlyAllIn: number;
};

type Result = {
  archetype: {
    id: string; name: string; blurb: string; unit: string; unitPlural: string;
    layers: Layer[]; gotchas: string[];
    surcharge: { label: string; usdPerUnit: number; note: string } | null;
    inTokens: number; outTokens: number;
  };
  matched: boolean;
  confidence: string;
  restated: string;
  industryNotes: string[];
  firstRisk: string | null;
  unitsPerMonth: number;
  tiers: Tier[];
  fixed: FixedService[];
  fixedMonthly: number;
  crossoverLow: number | null;
  crossoverHigh: number | null;
  prices: { verifiedAt: string; ageDays: number; stale: boolean };
};

/** Volume presets. Typing an exact number is false precision at this stage. */
const VOLUMES = [
  { label: "Just launching", value: 1000, hint: "~1k/mo" },
  { label: "Early traction", value: 10000, hint: "~10k/mo" },
  { label: "Growing", value: 100000, hint: "~100k/mo" },
  { label: "At scale", value: 1000000, hint: "~1M/mo" }
];

const money = (n: number) =>
  n >= 100 ? `$${Math.round(n).toLocaleString()}`
  : n >= 1 ? `$${n.toFixed(2)}`
  : `$${n.toFixed(4)}`;

export default function BuildClient() {
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [units, setUnits] = useState(10000);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setBusy(true); setErr(""); setResult(null);
    try {
      const res = await fetch("/api/build-stack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, industry, unitsPerMonth: units })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setResult(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <BrandHeader />
      <main className="max-w-[1100px] mx-auto px-8 py-8">
        <section className="bg-[#0E0E0D] text-white p-12">
          <div className="text-[11px] uppercase tracking-[0.22em] text-white/60">Build</div>
          <h1 className="serif text-5xl md:text-6xl font-black mt-3 leading-none">
            What should you<br />build it with?
          </h1>
          <p className="text-white/70 mt-4 max-w-lg">
            Describe the product and your expected volume. Fomora returns the stack, what it costs,
            and the point where the cheap option stops being the right one.
          </p>

          <form onSubmit={submit} className="mt-8 grid gap-4">
            <input
              className="px-5 py-4 bg-white/5 border border-white/20 text-white text-base placeholder:text-white/40 focus:border-brand focus:outline-none"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="A support chatbot for my e-commerce store…"
            />
            <input
              className="px-5 py-4 bg-white/5 border border-white/20 text-white text-base placeholder:text-white/40 focus:border-brand focus:outline-none"
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              placeholder="Industry, e-commerce, healthcare, fintech… (optional)"
            />

            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/50 mb-3">
                Expected volume
              </div>
              <div className="bv-grid">
                {VOLUMES.map(v => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => setUnits(v.value)}
                    className={`bv-opt ${units === v.value ? "is-on" : ""}`}
                  >
                    <span className="bv-opt-label">{v.label}</span>
                    <span className="bv-opt-hint">{v.hint}</span>
                  </button>
                ))}
              </div>
              <p className="text-white/40 text-xs mt-3">
                This is the input that flips half the answers, so it&apos;s worth getting roughly right.
              </p>
            </div>

            <button
              className="px-8 py-4 bg-brand text-white text-sm font-bold uppercase tracking-[0.1em] hover:bg-brand-deep disabled:bg-white/10 disabled:text-white/40 justify-self-start"
              disabled={busy}
              type="submit"
            >
              {busy ? "Working it out…" : "Build my stack →"}
            </button>
          </form>
          {err && <p className="text-brand text-sm mt-4">{err}</p>}
        </section>

        {result && <StackResult r={result} />}
      </main>
      <BottomNav />
    </>
  );
}

function StackResult({ r }: { r: Result }) {
  const [tierIdx, setTierIdx] = useState(0);
  const active = r.tiers[tierIdx];
  const unitWord = r.unitsPerMonth === 1 ? r.archetype.unit : r.archetype.unitPlural;

  return (
    <section className="bg-white border border-rule border-t-0 p-10">
      {/* What we think you're building */}
      <div className="bs-head">
        <div>
          <div className="eyebrow">{r.archetype.name}</div>
          <h2 className="serif text-3xl font-extrabold mt-1">{r.restated}</h2>
          <p className="text-muted text-sm mt-2">
            {r.unitsPerMonth.toLocaleString()} {unitWord} per month
          </p>
        </div>
        {r.confidence === "low" && (
          <span className="bs-flag">Closest match, check this is right</span>
        )}
      </div>

      {/* Cost */}
      <div className="bs-block">
        <h3 className="bs-h3">What it costs</h3>
        <div className="bs-tiers">
          {r.tiers.map((t, i) => (
            <button
              key={t.tier}
              onClick={() => setTierIdx(i)}
              className={`bs-tier ${i === tierIdx ? "is-on" : ""}`}
            >
              <span className="bs-tier-name">{t.tier}</span>
              <span className="bs-tier-model">{t.model.name}</span>
              <span className="bs-tier-cost">{money(t.monthlyAllIn)}<small>/mo</small></span>
            </button>
          ))}
        </div>

        <table className="bs-table">
          <tbody>
            <tr>
              <td>Model ({active.model.name})</td>
              <td>{money(active.monthlyModel)}</td>
            </tr>
            {active.monthlySurcharge > 0 && r.archetype.surcharge && (
              <tr>
                <td>{r.archetype.surcharge.label}</td>
                <td>{money(active.monthlySurcharge)}</td>
              </tr>
            )}
            {r.fixed.map(f => (
              <tr key={f.id}>
                <td>{f.name} <span className="bs-role">{f.role}</span></td>
                <td>{f.monthly === 0 ? "Free" : `$${f.monthly}`}</td>
              </tr>
            ))}
            <tr className="bs-total">
              <td>Total</td>
              <td>{money(active.monthlyAllIn)}/mo</td>
            </tr>
          </tbody>
        </table>

        <CostSplit
          model={active.monthlyModel}
          surcharge={active.monthlySurcharge}
          fixed={r.fixedMonthly}
          surchargeLabel={r.archetype.surcharge?.label}
        />

        <p className="bs-perunit">
          {money(active.perUnit)} per {r.archetype.unit} · assumes ~{(r.archetype.inTokens / 1000).toFixed(0)}k in / {(r.archetype.outTokens / 1000).toFixed(1)}k out tokens
        </p>

        {active.model.disputed && (
          <p className="bs-warn">
            Sources disagreed on {active.model.name} pricing. {active.model.note} Verify before committing at volume.
          </p>
        )}
      </div>

      {/* The curve makes the threshold visible: three lines on top of each
          other on the left, fanning apart on the right. */}
      <div className="bs-block">
        <h3 className="bs-h3">Where it stops being free to ignore</h3>
        <CostCurve
          tiers={r.tiers}
          fixedMonthly={r.fixedMonthly}
          unitsPerMonth={r.unitsPerMonth}
          crossoverLow={r.crossoverLow}
          crossoverHigh={r.crossoverHigh}
          unitPlural={r.archetype.unitPlural}
        />
      </div>

      {/* The band — the part that's actually hard to get elsewhere */}
      {r.crossoverLow !== null && r.crossoverHigh !== null && (
        <div className="bs-threshold">
          <div className="bs-threshold-num">
            {r.crossoverLow.toLocaleString()}<span>to</span>{r.crossoverHigh.toLocaleString()}
          </div>
          <div>
            <div className="bs-threshold-lead">
              This is the band where model choice starts to matter.
            </div>
            <p>
              Under <strong>{r.crossoverLow.toLocaleString()}</strong> {r.archetype.unitPlural} a month,
              infrastructure dominates whichever model you pick, so pick the best one and spend your
              time elsewhere. Over <strong>{r.crossoverHigh.toLocaleString()}</strong>, even the cheapest
              model costs more than your whole infrastructure bill, and caching becomes your highest-leverage
              move. In between, you&apos;re trading quality against a bill that is growing but not yet dominant.
            </p>
            <p className="bs-threshold-you">
              You said {r.unitsPerMonth.toLocaleString()}, which is {
                r.unitsPerMonth < r.crossoverLow
                  ? "below the band. Use the best model you can; optimising here saves you single-digit dollars."
                  : r.unitsPerMonth > r.crossoverHigh
                    ? "above the band. Model choice and caching are now your two biggest levers."
                    : "inside the band. Worth comparing tiers properly on your own traffic before committing."
              }
            </p>
          </div>
        </div>
      )}

      {/* The stack */}
      <div className="bs-block">
        <h3 className="bs-h3">The stack</h3>
        {r.archetype.layers.map(l => (
          <div key={l.role} className="bs-layer">
            <div className="bs-layer-role">{l.role}</div>
            <div>
              <div className="bs-layer-pick">{l.pick}</div>
              <div className="bs-layer-why">{l.why}</div>
              {l.freeAlt && (
                <div className="bs-layer-alt">
                  Free option: <strong>{l.freeAlt}</strong>
                  {l.altBreaksAt && <> · stops being right at <strong>{l.altBreaksAt}</strong></>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Industry constraints */}
      {r.industryNotes.length > 0 && (
        <div className="bs-block">
          <h3 className="bs-h3">What your industry adds</h3>
          <ul className="bs-list">
            {r.industryNotes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      )}

      {/* Gotchas */}
      <div className="bs-block">
        <h3 className="bs-h3">What usually goes wrong</h3>
        {r.firstRisk && <p className="bs-firstrisk">{r.firstRisk}</p>}
        <ul className="bs-list">
          {r.archetype.gotchas.map((g, i) => <li key={i}>{g}</li>)}
        </ul>
      </div>

      {/* Provenance — the honesty line */}
      <div className={`bs-provenance ${r.prices.stale ? "is-stale" : ""}`}>
        {r.prices.stale ? (
          <>⚠ Prices last verified {r.prices.verifiedAt} ({r.prices.ageDays} days ago). Treat these as indicative and re-check the vendor pages.</>
        ) : (
          <>Prices verified {r.prices.verifiedAt}. Token estimates are informed guesses, not measurements. They&apos;re the largest source of error here.</>
        )}
      </div>
    </section>
  );
}
