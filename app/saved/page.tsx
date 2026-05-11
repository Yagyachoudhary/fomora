import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BrandHeader } from "@/components/BrandHeader";
import { BottomNav } from "@/components/BottomNav";
import type { Launch } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows } = await supabase
    .from("user_launches")
    .select("fomo_score, status, saved_at, launches!inner(id, name, source, category, url)")
    .eq("user_id", user.id)
    .in("status", ["saved", "viewed", "acted_on"])
    .order("saved_at", { ascending: false, nullsFirst: false })
    .limit(50);

  type Row = { fomo_score: number | null; status: string; saved_at: string | null; launches: Pick<Launch, "id" | "name" | "source" | "category" | "url"> };
  const items = (rows ?? []) as unknown as Row[];

  return (
    <>
      <BrandHeader />
      <main className="max-w-[1100px] mx-auto px-8 py-8">
        <div className="eyebrow">Library</div>
        <h2 className="section-title">Your saved launches</h2>
        <div className="section-sub">Things you flagged to revisit — Fomora will check in 3 days later.</div>
        <hr className="divider" />

        {items.length === 0 ? (
          <div className="text-center py-16 text-muted">Nothing saved yet. Tap "Save to library" after running an analysis.</div>
        ) : (
          <div>
            {items.map((it, i) => (
              <div key={i} className="flex items-center gap-5 py-6 border-b border-rule">
                <div className="logo-box w-12 h-12 text-lg">{it.launches.name.slice(0, 1)}</div>
                <div>
                  <h4 className="serif font-extrabold text-xl">{it.launches.name}</h4>
                  <div className="text-muted text-xs uppercase tracking-wider mt-1">
                    {it.launches.category} · {it.launches.source} · {it.status.replace("_", " ")}
                  </div>
                </div>
                <div className="ml-auto serif font-black text-3xl text-brand">{it.fomo_score ?? "—"}</div>
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </>
  );
}
