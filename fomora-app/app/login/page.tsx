"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FomoraMascot } from "@/components/FomoraMascot";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback` }
    });
    if (error) setErr(error.message);
    else setSent(true);
    setBusy(false);
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="flex justify-center"><FomoraMascot size={140} /></div>
          <h1 className="serif text-4xl font-extrabold mt-6">Check your email.</h1>
          <p className="text-ink-soft mt-3">
            Magic link sent to <strong>{email}</strong>. Click it and you're in.
          </p>
          <button onClick={() => { setSent(false); setEmail(""); }} className="text-muted text-xs uppercase tracking-[0.18em] font-semibold mt-8">
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">
        <div className="flex justify-center"><FomoraMascot size={140} /></div>
        <h1 className="serif text-5xl font-black mt-6 text-center leading-none">Hi, I'm Fomora.</h1>
        <p className="text-ink-soft text-center mt-4 text-base leading-relaxed">
          I'll tell you which AI launches actually matter to <strong>you</strong>.<br />
          Drop your email and I'll send you a one-click sign-in.
        </p>
        <form onSubmit={submit} className="mt-8 space-y-3">
          <input
            className="input"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoFocus
          />
          <button className="btn btn-primary w-full" type="submit" disabled={busy}>
            {busy ? "Sending…" : "Send magic link"}
          </button>
          {err && <p className="text-brand text-sm">{err}</p>}
        </form>
        <p className="text-muted text-xs text-center mt-6">No password. No spam. We won't email you again.</p>
      </div>
    </div>
  );
}
