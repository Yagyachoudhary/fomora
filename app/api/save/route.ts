import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { launchId } = await req.json();
  if (!launchId) return NextResponse.json({ error: "launchId required" }, { status: 400 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("user_launches")
    .upsert(
      {
        user_id: user.id,
        launch_id: launchId,
        status: "saved",
        saved_at: new Date().toISOString()
      },
      { onConflict: "user_id,launch_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
