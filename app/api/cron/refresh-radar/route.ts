import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { fetchAllSources, enrichLaunches } from "@/lib/crawler";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Daily crawler. Vercel cron hits this (see vercel.json).
 * Also callable manually for testing:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://fomora.vercel.app/api/cron/refresh-radar
 */
export async function GET(request: Request) {
  // Vercel cron sends the secret as a bearer token.
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Pull from Hacker News + Product Hunt + Reddit in parallel (all free, no keys).
    const raw = await fetchAllSources();
    if (raw.length === 0) {
      return NextResponse.json({ ok: true, found: 0, inserted: 0, note: "No AI stories matched." });
    }

    // 2. Skip anything already in the DB so we don't waste tokens re-classifying.
    const urls = raw.map(r => r.url);
    const { data: existing } = await supabase
      .from("launches")
      .select("url")
      .in("url", urls);
    const seen = new Set((existing ?? []).map(e => e.url as string));
    const fresh = raw.filter(r => !seen.has(r.url));

    if (fresh.length === 0) {
      return NextResponse.json({ ok: true, found: raw.length, inserted: 0, note: "All already tracked." });
    }

    // 3. One Haiku call to name, describe, and categorize the batch.
    const enriched = await enrichLaunches(fresh);

    // 4. Upsert into launches.
    let inserted = 0;
    if (enriched.length > 0) {
      const rows = enriched.map(e => ({
        url: e.url,
        name: e.name,
        source: e.source,
        category: e.category,
        description: e.description,
        velocity: e.velocity,
        signal_badge: e.signal_badge,
        base_momentum: e.base_momentum,
        published_at: e.createdAt
      }));

      const { error, count } = await supabase
        .from("launches")
        .upsert(rows, { onConflict: "url", count: "exact" });

      if (error) {
        console.error("[cron] upsert failed", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      inserted = count ?? rows.length;
    }

    // 5. Housekeeping: drop the old heartbeat row if it's still around.
    await supabase.from("launches").delete().eq("url", "https://fomora.app/_cron_heartbeat");

    // Per-source counts make it obvious at a glance if one feed has gone quiet.
    const bySource = raw.reduce<Record<string, number>>((acc, r) => {
      acc[r.source] = (acc[r.source] ?? 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      ok: true,
      ran_at: new Date().toISOString(),
      found: raw.length,
      new: fresh.length,
      inserted,
      by_source: bySource
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[cron]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
