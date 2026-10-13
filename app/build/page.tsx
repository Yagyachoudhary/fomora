import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BuildClient from "./BuildClient";

export const dynamic = "force-dynamic";

export default async function BuildPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile?.role) redirect("/onboarding");

  return <BuildClient />;
}
