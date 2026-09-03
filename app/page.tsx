import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BrandHeader } from "@/components/BrandHeader";
import { BottomNav } from "@/components/BottomNav";
import { PersonalizeFeed } from "@/components/PersonalizeFeed";
import type { Launch, UserLaunch } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RadarHomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();
  if (!profile?.role) redirect("/onboarding");

  const { data: stats } = await supabase
    .from("user_stats").select("*").eq("user_id", user.id).maybeSingle();

  // Pull launches + the user's per-user score (if any) in one round trip.
  const { data: rows } = await supabase
    .from("launches")
    .select(`id, url, name, source, category, description, velocity, signal_badge, base_momentum, created_at,
             user_launches ( fomo_score, status, ai_analysis )`)
    .order("base_momentum", { ascending: false, nullsFirst: false })
    .limit(20);

  type Row = Launch & { user_launches: Pick<UserLaunch, "fomo_score" | "status" | "ai_analysis">[] };
  const all = (rows ?? []) as unknown as Row[];

  // Filter out the cron heartbeat
  const real = all.filter(r => r.category !== "System");

  // Decorate with the user's personalized score, fall back to base_momentum.
  const decorated = real.map(r => {
    const ul = r.user_launches?.[0];
    const analysis = ul?.ai_analysis as { verdict?: string; ignore_if?: string } | null;
    return {
      ...r,
      fomo_score: ul?.fomo_score ?? r.base_momentum ?? 60,
      personalized: !!ul?.fomo_score,
      status: ul?.status ?? "unseen",
      verdict: analysis?.verdict ?? null,
      ignore_reason: analysis?.ignore_if ?? null
    };
  });

  // Rank everything, then split. Using a hard score threshold made the feed look
  // empty for users whose scores all landed low — rank-based split always fills both.
  const sorted = [...decorated].sort((a, b) => (b.fomo_score ?? 0) - (a.fomo_score ?? 0));
  const ignoreIds = new Set(
    sorted.filter(r => (r.fomo_score ?? 0) < 55).slice(-3).map(r => r.id)
  );
  const top = sorted.filter(r => !ignoreIds.has(r.id)).slice(0, 10);
  const ignore = sorted.filter(r => ignoreIds.has(r.id));

  // Emerging Signals — computed from real launch data, not hardcoded.
  // A category "heats up" based on how many accelerating launches it has and how
  // highly they score for this specific user.
  const catStats = new Map<string, { count: number; total: number; hot: number; newest: number }>();
  for (const r of decorated) {
    if (!r.category || r.category === "System") continue;
    const s = catStats.get(r.category) ?? { count: 0, total: 0, hot: 0, newest: 0 };
    s.count += 1;
    s.total += r.fomo_score ?? 0;
    if (r.velocity === "Exploding" || r.velocity === "Heating up") s.hot += 1;
    const ts = r.created_at ? new Date(r.created_at).getTime() : 0;
    if (ts > s.newest) s.newest = ts;
    catStats.set(r.category, s);
  }

  const EMERGING = [...catStats.entries()]
    .map(([name, s]) => ({
      name,
      avg: Math.round(s.total / s.count),
      count: s.count,
      hot: s.hot,
      // heat score: accelerating launches weigh heaviest, then avg relevance
      heat: s.hot * 25 + s.total / s.count
    }))
    .sort((a, b) => b.heat - a.heat)
    .slice(0, 3)
    .map((c, i) => ({
      rank: String(i + 1).padStart(2, "0"),
      name: c.name,
      desc: `${c.count} launch${c.count === 1 ? "" : "es"} tracked · avg FOMO ${c.avg} for you${c.hot > 0 ? ` · ${c.hot} accelerating right now` : ""}`
    }));

  const heroScore = top.length ? Math.round(top.slice(0, 5).reduce((s, x) => s + (x.fomo_score ?? 0), 0) / Math.min(5, top.length)) : 60;

  return (
    <>
      <BrandHeader streak={stats?.streak_current ?? 0} hearts={5} xp={stats?.xp_total ?? 0} />

      <main className="max-w-[1100px] mx-auto px-8 py-8">
        {/* Hero — compact two-column so the top launches stay above the fold */}
        <section className="hero">
          <div className="hero-left">
            <div className="hero-label">Today&apos;s Priority Score</div>
            <div className="hero-score">{heroScore}<sup>/100</sup></div>
          </div>
          <div className="hero-right">
            <div className="hero-lede">
              {top.length >= 5
                ? `${top.filter(x => (x.fomo_score ?? 0) >= 90).length || 'A few'} paradigm-shift launches demand your attention.`
                : 'Tune your Radar — paste your first launch in Analyze.'}
            </div>
            <div className="hero-sub">Tuned for {profile.role}{profile.industry ? ` in ${profile.industry}` : ''}</div>
          </div>
        </section>

        <PersonalizeFeed
          unscored={decorated.filter(r => !r.personalized).length}
          role={profile.role}
          industry={profile.industry}
        />

        {/* Top 10 */}
        <section>
          <div className="eyebrow">The Top {top.length}</div>
          <h2 className="section-title">What you should care about</h2>
          <div className="section-sub">Ranked by personalized FOMO. Not by hype.</div>
          <hr className="divider" />

          {top.length === 0 && (
            <div className="text-center py-16 text-muted">
              <p className="mb-4">No launches scored yet.</p>
              <Link href="/analyze" className="btn btn-primary inline-block">Analyze your first launch →</Link>
            </div>
          )}

          {top.map((r, idx) => (
            <article key={r.id} className={`launch ${(r.fomo_score ?? 0) < 60 ? "is-low" : ""}`}>
              <div className="launch-rank">{String(idx + 1).padStart(2, "0")}</div>

              <div>
                <div className="launch-meta">
                  <span className="launch-cat">{r.category}</span>
                  <span className="launch-src">· {r.source}</span>
                  {!r.personalized && <span className="launch-src">· global</span>}
                </div>

                <div className="flex gap-3 items-start">
                  <div className="logo-box">{r.name.slice(0, 1)}</div>
                  <div className="min-w-0">
                    <h3>{r.name}</h3>
                    <div className="launch-desc">{r.description}</div>
                  </div>
                </div>

                {r.verdict && <div className="quote">&ldquo;{r.verdict}&rdquo;</div>}

                <div className="launch-footer">
                  {r.signal_badge && (
                    <span className={`badge badge-box ${r.signal_badge === "Paradigm Shift" ? "" : "badge-high"}`}>
                      {r.signal_badge}
                    </span>
                  )}
                  {r.velocity && <span className="badge badge-muted">⚡ {r.velocity}</span>}
                  <Link href={`/analyze?url=${encodeURIComponent(r.url)}`} className="deeper ml-auto">
                    Analyze deeper →
                  </Link>
                </div>
              </div>

              <div className="score-col">
                <div className="fomo-num">{r.fomo_score}</div>
                <div className="fomo-label">Fomo Score</div>
                <div className="fomo-bar" style={{ ["--w" as string]: `${r.fomo_score}%` }} />
              </div>
            </article>
          ))}
        </section>

        {/* Emerging Signals */}
        {EMERGING.length > 0 && (
        <section className="bg-cream-2 p-10 mt-12">
          <div className="eyebrow" style={{ color: "var(--gold)" }}>Emerging Signals</div>
          <h2 className="section-title">Categories heating up</h2>
          <div className="mt-6">
            {EMERGING.map(s => (
              <div key={s.rank} className="flex items-start gap-4 py-4 border-t border-rule first:border-t-0">
                <div className="serif italic font-bold text-gold min-w-[40px] text-base">{s.rank}</div>
                <div className="flex-1">
                  <div className="serif font-extrabold text-2xl">{s.name}</div>
                  <div className="text-ink-soft text-sm mt-1 max-w-3xl">{s.desc}</div>
                </div>
                <div className="text-gold text-2xl">↗</div>
              </div>
            ))}
          </div>
        </section>
        )}

        {/* Ignore */}
        {ignore.length > 0 && (
          <section className="mt-12">
            <div className="eyebrow">Ignore These</div>
            <h2 className="section-title">Safely skip for now</h2>
            <hr className="divider" />
            {ignore.map(r => (
              <div key={r.id} className="ignore-row">
                <div>
                  <div className="ignore-name">{r.name}</div>
                  <div className="ignore-why">{r.ignore_reason ?? r.description}</div>
                </div>
                <div className="ignore-score">{r.fomo_score}</div>
              </div>
            ))}
          </section>
        )}
      </main>

      <BottomNav />
    </>
  );
}
