"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FomoraMascot } from "@/components/FomoraMascot";
import { BrandParrot } from "@/components/BrandParrot";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [cooldown, setCooldown] = useState(0);

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
    if (error) { setErr(error.message); return; }
    setStep("code");
    setCooldown(45);
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    const token = code.replace(/\s/g, "");
    if (token.length < 6) { setErr("Enter the full code from your email."); return; }
    setBusy(true);
    setErr("");
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token, type: "email" });

    if (error) {
      setBusy(false);
      setErr(
        error.message.toLowerCase().includes("expired")
          ? "That code didn't work — it may have expired. Request a new one."
          : "That code wasn't accepted. Double-check every digit, or request a new one."
      );
      return;
    }

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

  /* ─── Code entry: strip the marketing, they're already convinced ─── */
  if (step === "code") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full text-center">
          <div className="flex justify-center"><BrandParrot size={170} /></div>
          <h1 className="serif text-4xl font-black mt-6 leading-tight">Check your email.</h1>
          <p className="text-ink-soft mt-4 leading-relaxed">
            I sent a sign-in code to<br /><strong>{email}</strong>
          </p>
          <form onSubmit={verifyCode} className="mt-8 space-y-3">
            <input
              className="input text-center tracking-[0.35em] text-2xl font-semibold"
              type="text" inputMode="numeric" autoComplete="one-time-code"
              maxLength={8} required value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter code" autoFocus
            />
            <button className="btn btn-primary w-full" type="submit" disabled={busy || code.length < 6}>
              {busy ? "Verifying…" : "Verify & sign in"}
            </button>
            {err && <p className="text-brand text-sm">{err}</p>}
          </form>
          <div className="flex items-center justify-between mt-6 text-xs">
            <button onClick={() => { setStep("email"); setCode(""); setErr(""); }}
              className="text-muted uppercase tracking-[0.18em] font-semibold hover:text-ink">
              ← Change email
            </button>
            <button onClick={() => sendCode()} disabled={cooldown > 0 || busy}
              className="text-muted uppercase tracking-[0.18em] font-semibold hover:text-ink disabled:opacity-40">
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Landing + sign-in ─── */
  return (
    <div className="login-page">
      <div className="login-grid">

        {/* LEFT — what this is and why it's not a phishing page */}
        <div className="login-pitch">
          <div className="login-brandline">
            <span className="login-mascot-sm"><FomoraMascot size={44} /></span>
            <span className="login-wordmark">Fomora</span>
            <span className="login-free">Free to use</span>
          </div>

          <h1 className="login-h1">
            Stop reading every<br />AI launch.
          </h1>
          <p className="login-sub">
            Fomora scores every new AI release against <strong>your</strong> role, industry and
            interests — then tells you plainly whether to try it, watch it, or ignore it.
          </p>

          {/* Quick-scan pointers — most visitors read these and nothing else */}
          <ul className="login-pointers">
            <li>Completely free to use</li>
            <li>Analyze any AI release instantly</li>
            <li>A FOMO score from 0&ndash;100, built for you</li>
            <li>Tells you what to safely ignore</li>
            <li>Finds free tools that replace paid ones</li>
            <li>Stay current without reading everything</li>
          </ul>

          <ol className="login-steps">
            <li>
              <span className="login-step-n">01</span>
              <div>
                <strong>Tell us what you do</strong>
                <span>Three questions, about twenty seconds. Designer, founder, analyst, artist — whatever you are.</span>
              </div>
            </li>
            <li>
              <span className="login-step-n">02</span>
              <div>
                <strong>Get your personal Radar</strong>
                <span>The launches that matter to you, ranked. Plus the ones you can safely skip, and the free tools that replace the paid ones.</span>
              </div>
            </li>
            <li>
              <span className="login-step-n">03</span>
              <div>
                <strong>Analyze anything, any time</strong>
                <span>Paste any product link and get a FOMO score in seconds, written for your situation.</span>
              </div>
            </li>
          </ol>

          {/* Sample result — shows the product before asking for anything */}
          <div className="login-sample">
            <div className="login-sample-label">A real result</div>
            <div className="login-sample-row">
              <div>
                <div className="login-sample-name">Claude Code</div>
                <div className="login-sample-verdict">
                  &ldquo;Skip this unless you&apos;re building custom tools yourself — it&apos;s a developer
                  workflow accelerator, not a design asset.&rdquo;
                </div>
                <div className="login-sample-who">as scored for a Designer in E-commerce</div>
              </div>
              <div className="login-sample-score">32</div>
            </div>
          </div>
        </div>

        {/* RIGHT — the form */}
        <div className="login-form-wrap">
          <div className="login-parrot-wrap">
            <BrandParrot size={230} />
          </div>

          <div className="login-card login-card-tight">
            <h2 className="login-card-h">Get your Radar</h2>
            <p className="login-card-sub">No password. We email you a six-digit code.</p>

            <form onSubmit={sendCode} className="mt-6 space-y-3">
              <input
                className="input" type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" autoFocus autoComplete="email"
              />
              <button className="btn btn-primary w-full" type="submit" disabled={busy}>
                {busy ? "Sending…" : "Send code"}
              </button>
              {err && <p className="text-brand text-sm">{err}</p>}
            </form>

            <ul className="login-trust">
              <li>Free — no card, no trial</li>
              <li>No password to remember</li>
              <li>We never sell or share your email</li>
              <li>No rankings are ever paid for</li>
            </ul>
          </div>

          <p className="login-foot">
            Built by{" "}
            <a
              href="https://www.linkedin.com/in/yagya-choudhary-162251ab/"
              target="_blank"
              rel="noopener noreferrer"
              className="login-foot-link"
            >
              Yagya Choudhary
            </a>
            . Launches sourced from Hacker News, Product Hunt and Hugging Face.
          </p>
        </div>
      </div>
    </div>
  );
}
