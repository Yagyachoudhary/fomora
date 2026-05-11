import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Vercel cron hits this once a day (see vercel.json).
// Stub for now — replace the inner block with a real crawler that hits:
//   - Product Hunt API (https://api.producthunt.com/v2/api/docs)
//   - Hacker News front page (https://hn.algolia.com/api)
//   - YC launches RSS, Anthropic/OpenAI/Google blogs, etc.

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  // Vercel cron sends a bearer token; we check it against CRON_SECRET.
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // TODO: replace with real crawl. For now just upserts a heartbeat row so you
  // can confirm the cron actually runs in production logs.
  const now = new Date().toISOString();
  await supabase
    .from("launches")
    .upsert(
      {
        url: "https://fomora.app/_cron_heartbeat",
        name: "Cron heartbeat",
        source: "Fomora",
        category: "System",
        description: `Last cron run: ${now}`
      },
      { onConflict: "url" }
    );

  return NextResponse.json({ ok: true, ran_at: now });
}
