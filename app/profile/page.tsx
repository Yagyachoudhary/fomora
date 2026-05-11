import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BrandHeader } from "@/components/BrandHeader";
import { BottomNav } from "@/components/BottomNav";
import { SignOutButton } from "./sign-out";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { data: stats } = await supabase.from("user_stats").select("*").eq("user_id", user.id).maybeSingle();
  const { count } = await supabase.from("user_launches").select("*", { count: "exact", head: true }).eq("user_id", user.id);

  const initial = (profile?.name ?? profile?.email ?? "F")[0].toUpperCase();

  return (
    <>
      <BrandHeader streak={stats?.streak_current ?? 0} xp={stats?.xp_total ?? 0} />
      <main className="max-w-[1100px] mx-auto px-8 py-8">
        <div className="flex items-center gap-6 pb-8 border-b border-rule mb-8">
          <div className="w-20 h-20 rounded-full bg-leaf flex items-center justify-center text-white text-4xl serif font-extrabold">{initial}</div>
          <div>
            <h2 className="serif text-3xl font-extrabold">{profile?.name ?? profile?.email}</h2>
            <div className="text-muted text-sm mt-1">
              {profile?.role}{profile?.industry ? ` · ${profile.industry}` : ""}
              {profile?.created_at ? ` · Joined ${new Date(profile.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}` : ""}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-rule border border-rule mb-10">
          <Stat n={stats?.streak_current ?? 0} l="Day streak" />
          <Stat n={(stats?.xp_total ?? 0).toLocaleString()} l="Total XP" />
          <Stat n={count ?? 0} l="Launches reviewed" />
          <Stat n={profile?.daily_goal ?? 3} l="Daily goal" />
        </div>

        <div className="eyebrow">Tuning</div>
        <h2 className="section-title">What you care about</h2>
        <hr className="divider" />

        <TagSection label="Role" tags={[profile?.role, profile?.industry].filter(Boolean) as string[]} />
        <TagSection label="Interests" tags={profile?.interests ?? []} />
        <TagSection label="Tools you use" tags={profile?.tools ?? []} />
        <TagSection label="Goals" tags={profile?.goals ?? []} />

        <div className="mt-12 pt-8 border-t border-rule flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <div className="serif text-lg font-bold">Re-tune your Radar</div>
            <p className="text-muted text-sm mt-1 max-w-md">Role changed? New tools? Run setup again — Fomora rebuilds your feed in 60 seconds.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/onboarding" className="btn">Redo setup</Link>
            <SignOutButton />
          </div>
        </div>
      </main>
      <BottomNav />
    </>
  );
}

function Stat({ n, l }: { n: number | string; l: string }) {
  return (
    <div className="bg-cream p-6">
      <div className="serif text-4xl font-black leading-none">{n}</div>
      <div className="text-[11px] uppercase tracking-[0.18em] text-muted mt-2 font-semibold">{l}</div>
    </div>
  );
}

function TagSection({ label, tags }: { label: string; tags: string[] }) {
  return (
    <div className="mb-6">
      <p className="text-muted text-sm mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {tags.length === 0 && <span className="text-muted text-sm italic">Not set</span>}
        {tags.map((t, i) => (
          <span key={i} className="px-3 py-1.5 border border-ink text-xs uppercase tracking-wide font-semibold">{t}</span>
        ))}
      </div>
    </div>
  );
}
