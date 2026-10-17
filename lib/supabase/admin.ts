import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses RLS — server-side only, never import
 * this from a client component.
 *
 * `launches` is a SHARED table: every row is a candidate for every user's
 * Radar. Its RLS grants public read and nothing else, deliberately, so there is
 * no path for a signed-in user to write rows that would appear in other
 * people's feeds. /api/analyze still needs to record a launch, so it does that
 * here, under the server's own authority and with fields the server controls.
 *
 * Until this existed the analyze route wrote with the caller's session, RLS
 * silently rejected it, `launchId` came back null, and nothing was ever saved.
 * The write result was never checked, so it failed quietly for months.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Admin Supabase client needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
