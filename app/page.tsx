import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BrandHeader } from "@/components/BrandHeader";
import { BottomNav } from "@/components/BottomNav";
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
    .select(`id, url, name, source, category, description, velocity, signal_badge, base_momentum,
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
    return {
      ...r,
      fomo_score: ul?.fomo_score ?? r.base_momentum ?? 60,
      personalized: !!ul?.fomo_score,
      status: ul?.status ?? "unseen"
    };
  });

  const top = decorated.filter(r => (r.fomo_score ?? 0) >= 70).slice(0, 10);
  const ignore = decorated.filter(r => (r.fomo_score ?? 0) < 50).slice(0, 4);

  const heroScore = top.length ? Math.round(top.slice(0, 5).reduce((s, x) => s + (x.fomo_score ?? 0), 0) / Math.min(5, top.length)) : 60;

  return (
    <>
      <BrandHeader streak={stats?.streak_current ?? 0} hearts={5} xp={stats?.xp_total ?? 0} />

      <main className="max-w-[1100px] mx-auto px-8 py-8">
        {/* Hero */}
        <section className="hero">
          <div className="hero-label">Today's Priority Score</div>
          <div className="hero-score">{heroScore}<sup>/100</sup></div>
          <hr />
          <div className="hero-lede">
            {top.length >= 5
              ? `${top.filter(x => (x.fomo_score ?? 0) >= 90).length || 'A few'} paradigm-shift launches demand your attention.`
              : 'Tune your Radar — paste your first launch in Analyze.'}
          </div>
          <div className="hero-sub">Tuned for {profile.role}{profile.industry ? ` in ${profile.industry}` : ''}</div>
        </section>

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
            <article key={r.id} className="launch">
              <div className="flex items-baseline gap-3 text-sm">
                <span className="serif italic text-ink-soft min-w-[28px]">{String(idx + 1).padStart(2, "0")}</span>
                <span className="text-brand font-semibold tracking-wide">{r.category}</span>
                <span className="text-muted">· {r.source}</span>
                {!r.personalized && <span className="text-muted text-xs">(global score)</span>}
              </div>
              <div className="flex gap-4 items-start mt-3 pl-10">
                <div className="logo-box">{r.name.slice(0, 1)}</div>
                <div>
                  <h3>{r.name}</h3>
                  <div className="text-ink-soft text-sm mt-1">{r.description}</div>
                </div>
              </div>
              <div className="flex items-baseline gap-4 mt-5 pl-10">
                <span className="fomo-num">{r.fomo_score}</span>
                <span className="text-[11px] uppercase tracking-[0.22em] text-muted font-semibold">Fomo Score</span>
                <div className="flex-1 fomo-bar self-end mb-2" style={{ ["--w" as string]: `${r.fomo_score}%` }} />
              </div>
              <div className="flex items-center gap-5 pl-10 mt-3 flex-wrap">
                {r.signal_badge && (
                  <span className={`badge badge-box ${r.signal_badge === 'Paradigm Shift' ? '' : 'badge-high'}`}>{r.signal_badge}</span>
                )}
                {r.velocity && <span className="badge badge-muted">⚡ {r.velocity}</span>}
              </div>
              <Link href={`/analyze?url=${encodeURIComponent(r.url)}`} className="inline-flex items-center gap-2 pl-10 mt-5 font-bold text-sm hover:text-brand">
                Analyze deeper →
              </Link>
            </article>
          ))}
        </section>

        {/* Ignore */}
        {ignore.length > 0 && (
          <section className="mt-12">
            <div className="eyebrow">Ignore These</div>
            <h2 className="section-title">Safely skip for now</h2>
            <hr className="divider" />
            {ignore.map(r => (
              <div key={r.id} className="flex items-center py-4 border-t border-dashed border-rule first:border-t-0">
                <div>
                  <div className="serif font-bold text-lg text-muted">{r.name}</div>
                  <div className="text-muted text-sm mt-0.5">{r.description}</div>
                </div>
                <div className="ml-auto serif italic text-2xl text-muted">{r.fomo_score}</div>
              </div>
            ))}
          </section>
        )}
      </main>

      <BottomNav />
    </>
  );
}
