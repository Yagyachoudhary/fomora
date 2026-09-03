"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FomoraMascot } from "@/components/FomoraMascot";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Resend cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setErr("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true }
    });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setStep("code");
    setCooldown(45);
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    const token = code.replace(/\s/g, "");
    if (token.length < 6) {
      setErr("Enter the 6-digit code from your email.");
      return;
    }
    setBusy(true);
    setErr("");
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token,
      type: "email"
    });

    if (error) {
      setBusy(false);
      setErr(error.message.includes("expired") ? "That code expired. Request a new one." : error.message);
      return;
    }

    // Decide where to send them: onboarding if profile is incomplete
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", user.id).maybeSingle();
      router.push(profile?.role ? "/" : "/onboarding");
      router.refresh();
    } else {
      setErr("Signed in but couldn't load your session. Refresh and try again.");
    }
    setBusy(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">
        <div className="flex justify-center"><FomoraMascot size={140} /></div>

        {step === "email" ? (
          <>
            <h1 className="serif text-5xl font-black mt-6 text-center leading-none">Hi, I&apos;m Fomora.</h1>
            <p className="text-ink-soft text-center mt-4 text-base leading-relaxed">
              I&apos;ll tell you which AI launches actually matter to <strong>you</strong>.<br />
              Enter your email and I&apos;ll send you a 6-digit code.
            </p>
            <form onSubmit={sendCode} className="mt-8 space-y-3">
              <input
                className="input"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                autoComplete="email"
              />
              <button className="btn btn-primary w-full" type="submit" disabled={busy}>
                {busy ? "Sending…" : "Send code"}
              </button>
              {err && <p className="text-brand text-sm">{err}</p>}
            </form>
            <p className="text-muted text-xs text-center mt-6">No password. No spam. We won&apos;t email you again.</p>
          </>
        ) : (
          <>
            <h1 className="serif text-4xl font-black mt-6 text-center leading-tight">Check your email.</h1>
            <p className="text-ink-soft text-center mt-4 text-base leading-relaxed">
              I sent a 6-digit code to<br /><strong>{email}</strong>
            </p>
            <form onSubmit={verifyCode} className="mt-8 space-y-3">
              <input
                className="input text-center tracking-[0.5em] text-2xl font-semibold"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                autoFocus
              />
              <button className="btn btn-primary w-full" type="submit" disabled={busy || code.length < 6}>
                {busy ? "Verifying…" : "Verify & sign in"}
              </button>
              {err && <p className="text-brand text-sm">{err}</p>}
            </form>

            <div className="flex items-center justify-between mt-6 text-xs">
              <button
                onClick={() => { setStep("email"); setCode(""); setErr(""); }}
                className="text-muted uppercase tracking-[0.18em] font-semibold hover:text-ink"
              >
                ← Change email
              </button>
              <button
                onClick={() => sendCode()}
                disabled={cooldown > 0 || busy}
                className="text-muted uppercase tracking-[0.18em] font-semibold hover:text-ink disabled:opacity-40"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
