import { createClient } from "@/lib/supabase/server";
import { scoreFomo } from "@/lib/scoring";
import { fetchLaunchContent } from "@/lib/launch-fetcher";
import { NextResponse } from "next/server";

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

    if (url) {
      // 1. Is this a launch we already know about?
      const { data: known } = await supabase
        .from("launches")
        .select("name, description, raw_content")
        .eq("url", url)
        .maybeSingle();

      if (known && (known.raw_content || known.description)) {
        launchName = known.name;
        launchText = [known.name, known.description, known.raw_content].filter(Boolean).join(". ");
      } else {
        // 2. Try to fetch the page
        const fetched = await fetchLaunchContent(url);
        launchName = fetched.name !== "Unknown" ? fetched.name : launchName;
        launchText = fetched.text || text || "";

        // 4. If the page was unscrapeable, let the model reason from name + url.
        if (launchText.length < 40) {
          launchText = `${launchName}. An AI product/announcement at ${url}. The page could not be fully scraped — evaluate based on the product name and what is publicly known about it.`;
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
    let launchId: string | null = null;
    if (url) {
      const { data: launchRow } = await supabase
        .from("launches")
        .upsert(
          { url, name: launchName, raw_content: launchText.slice(0, 5000) },
          { onConflict: "url" }
        )
        .select()
        .single();
      launchId = launchRow?.id ?? null;

      if (launchId) {
        await supabase.from("user_launches").upsert(
          {
            user_id: user.id,
            launch_id: launchId,
            fomo_score: analysis.fomo_score,
            status: "viewed",
            ai_analysis: analysis as unknown as Record<string, unknown>
          },
          { onConflict: "user_id,launch_id" }
        );
      }
    }

    return NextResponse.json({ name: launchName, analysis, launchId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[analyze]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
