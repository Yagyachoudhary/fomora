import { createClient } from "@/lib/supabase/server";
import { scoreFeedBatch } from "@/lib/scoring";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Scores the user's whole Radar feed in one Claude call.
 * Called after onboarding, and on demand from the Radar page.
 * Only scores launches this user hasn't been scored on yet.
 */
export async function POST() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles").select("*").eq("id", user.id).single();
    if (!profile?.role) {
      return NextResponse.json({ error: "Complete onboarding first" }, { status: 400 });
    }

    // Which launches has this user already been scored on?
    const { data: alreadyScored } = await supabase
      .from("user_launches")
      .select("launch_id")
      .eq("user_id", user.id)
      .not("fomo_score", "is", null);
    const scoredIds = new Set((alreadyScored ?? []).map(r => r.launch_id as string));

    // Pull the candidate feed.
    const { data: launches } = await supabase
      .from("launches")
      .select("id, name, description, category")
      .neq("category", "System")
      .order("base_momentum", { ascending: false, nullsFirst: false })
      .limit(25);

    const todo = (launches ?? []).filter(l => !scoredIds.has(l.id as string));
    if (todo.length === 0) {
      return NextResponse.json({ ok: true, scored: 0, note: "Feed already personalized." });
    }

    // One Claude call for the whole batch.
    const scores = await scoreFeedBatch(
      profile,
      todo.map(l => ({
        name: l.name as string,
        description: l.description as string | null,
        category: l.category as string | null
      }))
    );

    if (scores.length === 0) {
      return NextResponse.json({ ok: false, scored: 0, note: "Scoring returned nothing." });
    }

    const rows = scores
      .filter(s => todo[s.index])
      .map(s => ({
        user_id: user.id,
        launch_id: todo[s.index].id as string,
        fomo_score: Math.max(0, Math.min(100, Math.round(s.fomo_score))),
        status: "unseen",
        ai_analysis: {
          fomo_score: s.fomo_score,
          verdict: s.verdict,
          why_you: s.why_you,
          ignore_if: s.ignore_if
        } as unknown as Record<string, unknown>
      }));

    const { error } = await supabase
      .from("user_launches")
      .upsert(rows, { onConflict: "user_id,launch_id" });

    if (error) {
      console.error("[score-feed] upsert failed", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, scored: rows.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[score-feed]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
