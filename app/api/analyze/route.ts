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

    // Get the launch text — either fetched from the URL or pasted directly.
    let launchName = "Pasted text";
    let launchText = text ?? "";
    if (url) {
      const fetched = await fetchLaunchContent(url);
      launchName = fetched.name;
      launchText = fetched.text || text || "";
    }

    if (!launchText || launchText.length < 50) {
      return NextResponse.json(
        { error: "Couldn't extract enough content. Paste the announcement text directly." },
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
