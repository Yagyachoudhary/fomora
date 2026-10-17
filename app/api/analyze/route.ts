import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { scoreFomo } from "@/lib/scoring";
import { fetchLaunchContent } from "@/lib/launch-fetcher";
import { NextResponse } from "next/server";
import { USER_ANALYSIS_SOURCE } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const url: string | undefined = body?.url;
    const text: string | undefined = body?.text;

    if (!url && !text) {
      return NextResponse.json({ error: "Provide a url or text" }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json(
        { error: "Complete onboarding first", redirect: "/onboarding" },
        { status: 400 }
      );
    }

    // Get the launch text. Priority:
    //   1. A known launch already in the DB (use its stored description/content)
    //   2. Live-fetched page content
    //   3. Pasted text
    //   4. Name + URL only (let the model reason from its own knowledge)
    let launchName = "Pasted text";
    let launchText = text ?? "";
    // Held so the persistence step below knows whether this URL already had a
    // row. If it did, we must not overwrite it: crawler rows carry a category,
    // description and momentum that a user-side scrape would wipe out.
    let knownId: string | null = null;

    if (url) {
      // 1. Is this a launch we already know about?
      const { data: known } = await supabase
        .from("launches")
        .select("id, name, description, raw_content")
        .eq("url", url)
        .maybeSingle();

      knownId = known?.id ?? null;

      if (known && (known.raw_content || known.description)) {
        launchName = known.name;
        launchText = [known.name, known.description, known.raw_content].filter(Boolean).join(". ");
      } else {
        // 2. Try to fetch the page
        const fetched = await fetchLaunchContent(url);

        // A refused URL is reported, not silently treated as an empty page.
        if (fetched.blocked) {
          return NextResponse.json(
            { error: `That URL can't be fetched: ${fetched.blocked}` },
            { status: 400 }
          );
        }

        launchName = fetched.name !== "Unknown" ? fetched.name : launchName;
        launchText = fetched.text || text || "";

        // 4. If the page was unscrapeable, let the model reason from name + url.
        if (launchText.length < 40) {
          launchText = `${launchName}. An AI product/announcement at ${url}. The page could not be fully scraped, so evaluate based on the product name and what is publicly known about it.`;
        }
      }
    }

    if (!launchText || launchText.length < 20) {
      return NextResponse.json(
        { error: "Couldn't read that. Paste the announcement text directly instead of a URL." },
        { status: 422 }
      );
    }

    // Run the FOMO scoring against the user's profile.
    const analysis = await scoreFomo(profile, launchText, launchName);

    // If we have a URL, persist the launch + the user's per-user analysis.
    let launchId: string | null = knownId;
    let saveError: string | null = null;

    if (url && !launchId) {
      // New URL. `launches` grants users read-only access by design, so this
      // write goes through the service role. ignoreDuplicates keeps a
      // concurrent analysis of the same URL from clobbering the first one.
      try {
        const admin = createAdminClient();
        const { error: insErr } = await admin
          .from("launches")
          .upsert(
            {
              url,
              name: launchName,
              raw_content: launchText.slice(0, 5000),
              source: USER_ANALYSIS_SOURCE
            },
            { onConflict: "url", ignoreDuplicates: true }
          );
        if (insErr) throw insErr;

        const { data: row, error: selErr } = await admin
          .from("launches").select("id").eq("url", url).maybeSingle();
        if (selErr) throw selErr;
        launchId = row?.id ?? null;
      } catch (e) {
        // Report rather than swallow. The old code ignored this result, so a
        // silent RLS rejection looked exactly like success.
        saveError = e instanceof Error ? e.message : "could not store this launch";
        console.error("[analyze] launch persist failed", e);
      }
    }

    if (launchId) {
      // user_launches RLS allows the owner to write their own row, so this one
      // correctly runs as the user.
      const { error: ulErr } = await supabase.from("user_launches").upsert(
        {
          user_id: user.id,
          launch_id: launchId,
          fomo_score: analysis.fomo_score,
          status: "viewed",
          ai_analysis: analysis as unknown as Record<string, unknown>
        },
        { onConflict: "user_id,launch_id" }
      );
      if (ulErr) {
        saveError = ulErr.message;
        console.error("[analyze] user_launches upsert failed", ulErr);
      }
    }

    // `saveable` tells the client whether the Save button can actually do
    // anything, so it stops claiming success when there is nothing to save.
    return NextResponse.json({
      name: launchName,
      analysis,
      launchId,
      saveable: !!launchId && !saveError,
      saveError
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[analyze]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
