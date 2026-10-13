"use client";

/**
 * Cost vs volume, log-log, one line per model tier.
 *
 * This chart exists to make one thing obvious that the crossover number states
 * but doesn't show: the lines are *stacked on top of each other* at low volume
 * and *fan apart* at high volume. That shape is the whole argument. Below the
 * crossover the three tiers are visually indistinguishable, which is the point —
 * you cannot save money there, so pick the better model. Past it they separate,
 * and the gap between the cheapest and dearest line becomes the real decision.
 *
 * Log-log is deliberate. On linear axes everything below 100k conversations is
 * squashed into the left edge and the flat region — the part most users are
 * actually in — becomes invisible.
 */

type Tier = {
  tier: "budget" | "balanced" | "premium";
  model: { name: string };
  perUnit: number;
};

const COLORS: Record<Tier["tier"], string> = {
  budget: "var(--leaf)",
  balanced: "var(--gold)",
  premium: "var(--brand)"
};

const W = 680;
const H = 280;
const PAD = { l: 56, r: 18, t: 18, b: 42 };
const IW = W - PAD.l - PAD.r;
const IH = H - PAD.t - PAD.b;

// Volume domain: 100 → 10M, as powers of ten.
const X_MIN = 2;
const X_MAX = 7;

export function CostCurve({
  tiers,
  fixedMonthly,
  unitsPerMonth,
  crossoverLow,
  crossoverHigh,
  unitPlural
}: {
  tiers: Tier[];
  fixedMonthly: number;
  unitsPerMonth: number;
  /** Where the dearest tier passes the infrastructure floor. */
  crossoverLow: number | null;
  /** Where the cheapest tier passes it. */
  crossoverHigh: number | null;
  unitPlural: string;
}) {
  const costAt = (perUnit: number, v: number) => fixedMonthly + perUnit * v;

  const topCost = Math.max(...tiers.map(t => costAt(t.perUnit, 10 ** X_MAX)));
  const yMin = Math.log10(Math.max(1, fixedMonthly * 0.5));
  const yMax = Math.ceil(Math.log10(topCost));

  const x = (v: number) => PAD.l + ((Math.log10(v) - X_MIN) / (X_MAX - X_MIN)) * IW;
  const y = (c: number) =>
    PAD.t + (1 - (Math.log10(Math.max(c, 1)) - yMin) / (yMax - yMin)) * IH;

  // Sample in log space so the curve is smooth across five orders of magnitude.
  const path = (perUnit: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 60; i++) {
      const v = 10 ** (X_MIN + ((X_MAX - X_MIN) * i) / 60);
      pts.push(`${i === 0 ? "M" : "L"}${x(v).toFixed(1)} ${y(costAt(perUnit, v)).toFixed(1)}`);
    }
    return pts.join(" ");
  };

  const xTicks = [3, 4, 5, 6, 7];
  const xLabel = (p: number) => (p >= 6 ? `${10 ** (p - 6)}M` : `${10 ** (p - 3)}k`);

  const yTicks: number[] = [];
  for (let p = Math.ceil(yMin); p <= yMax; p++) yTicks.push(p);
  const yLabel = (p: number) => (p >= 3 ? `$${10 ** (p - 3)}k` : `$${10 ** p}`);

  const clampedUnits = Math.min(Math.max(unitsPerMonth, 10 ** X_MIN), 10 ** X_MAX);
  const inRange = (n: number | null): n is number =>
    n !== null && n >= 10 ** X_MIN && n <= 10 ** X_MAX;
  const showBand = inRange(crossoverLow) && inRange(crossoverHigh);

  return (
    <figure className="cc">
      <svg viewBox={`0 0 ${W} ${H}`} className="cc-svg" role="img"
           aria-label={`Monthly cost against volume for three model tiers. Infrastructure dominates below ${crossoverLow?.toLocaleString() ?? "the lower threshold"} ${unitPlural} per month; model cost dominates above ${crossoverHigh?.toLocaleString() ?? "the upper threshold"}.`}>
        {/* horizontal gridlines */}
        {yTicks.map(p => (
          <g key={p}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(10 ** p)} y2={y(10 ** p)}
                  stroke="var(--rule)" strokeWidth="1" />
            <text x={PAD.l - 10} y={y(10 ** p) + 4} textAnchor="end" className="cc-axis">
              {yLabel(p)}
            </text>
          </g>
        ))}

        {/* x ticks */}
        {xTicks.map(p => (
          <text key={p} x={x(10 ** p)} y={H - PAD.b + 20} textAnchor="middle" className="cc-axis">
            {xLabel(p)}
          </text>
        ))}

        {/* the fixed-cost floor: what you pay at zero traffic */}
        <line x1={PAD.l} x2={W - PAD.r} y1={y(fixedMonthly)} y2={y(fixedMonthly)}
              stroke="var(--ink-soft)" strokeWidth="1.2" strokeDasharray="5 4" opacity="0.5" />
        <text x={W - PAD.r} y={y(fixedMonthly) - 7} textAnchor="end" className="cc-floor">
          infrastructure floor ${fixedMonthly}
        </text>

        {/* The crossover band. Left edge: the dearest model passes the
            infrastructure floor. Right edge: even the cheapest one does.
            Inside the band is where model choice starts to matter but hasn't
            taken over yet. */}
        {showBand && (
          <>
            <rect
              x={x(crossoverLow)} y={PAD.t}
              width={Math.max(0, x(crossoverHigh) - x(crossoverLow))}
              height={IH}
              fill="var(--gold)" opacity="0.1"
            />
            <line x1={x(crossoverLow)} x2={x(crossoverLow)} y1={PAD.t} y2={H - PAD.b}
                  stroke="var(--gold)" strokeWidth="1.3" strokeDasharray="4 4" opacity="0.85" />
            <line x1={x(crossoverHigh)} x2={x(crossoverHigh)} y1={PAD.t} y2={H - PAD.b}
                  stroke="var(--leaf)" strokeWidth="1.4" strokeDasharray="4 4" opacity="0.85" />
            <text x={x(crossoverHigh) + 7} y={PAD.t + 13} className="cc-cross">
              model cost takes over
            </text>
          </>
        )}

        {/* your current volume */}
        <line x1={x(clampedUnits)} x2={x(clampedUnits)} y1={PAD.t} y2={H - PAD.b}
              stroke="var(--ink)" strokeWidth="1.4" opacity="0.28" />
        <text x={x(clampedUnits) + 7} y={H - PAD.b - 8} className="cc-you">you</text>

        {/* tier curves */}
        {tiers.map(t => (
          <path key={t.tier} d={path(t.perUnit)} fill="none"
                stroke={COLORS[t.tier]} strokeWidth="2.4" strokeLinecap="round" />
        ))}

        {/* dot where each tier meets your volume */}
        {tiers.map(t => (
          <circle key={t.tier} cx={x(clampedUnits)} cy={y(costAt(t.perUnit, clampedUnits))}
                  r="4.5" fill={COLORS[t.tier]} stroke="#fff" strokeWidth="1.8" />
        ))}
      </svg>

      <figcaption className="cc-legend">
        {tiers.map(t => (
          <span key={t.tier} className="cc-key">
            <i style={{ background: COLORS[t.tier] }} />
            {t.model.name}
          </span>
        ))}
        <span className="cc-axis-note">{unitPlural} per month →</span>
      </figcaption>
    </figure>
  );
}

/**
 * Where the money actually goes at the selected tier. One bar, because the
 * useful question is only ever "which of these three dominates".
 */
export function CostSplit({
  model,
  surcharge,
  fixed,
  surchargeLabel
}: {
  model: number;
  surcharge: number;
  fixed: number;
  surchargeLabel?: string;
}) {
  const total = model + surcharge + fixed;
  if (total <= 0) return null;
  const pct = (n: number) => (n / total) * 100;

  const parts = [
    { key: "model", label: "Model", value: model, color: "var(--brand)" },
    ...(surcharge > 0
      ? [{ key: "sur", label: surchargeLabel ?? "Usage", value: surcharge, color: "var(--gold)" }]
      : []),
    { key: "fixed", label: "Infrastructure", value: fixed, color: "var(--ink-soft)" }
  ].filter(p => p.value > 0);

  return (
    <div className="cs">
      <div className="cs-bar">
        {parts.map(p => (
          <span key={p.key} style={{ width: `${pct(p.value)}%`, background: p.color }}
                title={`${p.label}: ${Math.round(pct(p.value))}%`} />
        ))}
      </div>
      <div className="cs-keys">
        {parts.map(p => (
          <span key={p.key} className="cs-key">
            <i style={{ background: p.color }} />
            {p.label} <strong>{Math.round(pct(p.value))}%</strong>
          </span>
        ))}
      </div>
    </div>
  );
}
