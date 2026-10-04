import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// 'about_right'  = thumbs up
// 'wrong'        = thumbs down, direction not yet given
// 'too_low' / 'too_high' = thumbs down, refined by the follow-up tap
const ALLOWED = ["about_right", "wrong", "too_low", "too_high"] as const;

/**
 * Records whether a FOMO score felt right to the user.
 * This is the feedback loop — without it there's no way to know whether the
 * scoring model is calibrated, and no data to improve it with.
 */
export async function POST(req: Request) {
  try {
    const { launchId, feedback } = await req.json();

    if (!launchId || !ALLOWED.includes(feedback)) {
      return NextResponse.json({ error: "launchId and a valid feedback value required" }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Capture the score as it stands now, so a later re-score doesn't erase
    // what was actually being judged.
    const { data: existing } = await supabase
      .from("user_launches")
      .select("fomo_score")
      .eq("user_id", user.id)
      .eq("launch_id", launchId)
      .maybeSingle();

    const { error } = await supabase
      .from("user_launches")
      .upsert(
        {
          user_id: user.id,
          launch_id: launchId,
          score_feedback: feedback,
          score_feedback_at: new Date().toISOString(),
          score_at_feedback: existing?.fomo_score ?? null
        },
        { onConflict: "user_id,launch_id" }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[score-feedback]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
