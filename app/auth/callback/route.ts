import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Magic-link callback: Supabase redirects here with ?code=...
// We exchange the code for a session, then route to /onboarding if the user
// hasn't completed setup, otherwise to /.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        const redirect = profile?.role ? next : "/onboarding";
        return NextResponse.redirect(`${origin}${redirect}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
