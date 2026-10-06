"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BrandParrot } from "@/components/BrandParrot";
import { HeroDemo } from "@/components/HeroDemo";
import { CATEGORY_ICONS, CATEGORY_ORDER } from "@/components/CategoryIcons";

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
          ? "That code didn't work. It may have expired, so request a new one."
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

  /* ─── Code entry ─── */
  if (step === "code") {
    return (
      <div className="lp-code-page">
        <div className="lp-code-inner">
          <BrandParrot size={200} />
          <h1 className="lp-code-h">Check your email</h1>
          <p className="lp-code-sub">
            I sent a sign-in code to<br /><strong>{email}</strong>
          </p>
          <form onSubmit={verifyCode} className="lp-code-form">
            <input
              className="lp-code-input"
              type="text" inputMode="numeric" autoComplete="one-time-code"
              maxLength={8} required value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••••" autoFocus
            />
            <button className="btn-chunky w-full" type="submit" disabled={busy || code.length < 6}>
              {busy ? "Verifying…" : "Verify & sign in"}
            </button>
            {err && <p className="lp-err">{err}</p>}
          </form>
          <div className="lp-code-actions">
            <button onClick={() => { setStep("email"); setCode(""); setErr(""); }}>← Change email</button>
            <button onClick={() => sendCode()} disabled={cooldown > 0 || busy}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Landing ─── */
  return (
    <div className="lp">
      {/* slim top bar */}
      <header className="lp-top">
        <div className="lp-top-brand">
          <BrandParrot size={40} animate={false} className="lp-top-parrot" />
          <span className="lp-wordmark">Fomora</span>
        </div>
        <span className="lp-free">Free to use</span>
      </header>

      {/* HERO — one idea, lots of air */}
      <section className="lp-hero">
        <div className="lp-hero-art">
          <HeroDemo />
        </div>

        <div className="lp-hero-copy">
          <h1 className="lp-h1">
            Stop reading every<br />AI launch.
          </h1>
          <p className="lp-lede">
            Fomora scores every release against what <strong>you</strong> actually do,
            then tells you to try it, watch it, or ignore it.
          </p>

          <form onSubmit={sendCode} className="lp-form">
            <input
              className="lp-input" type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" autoComplete="email"
            />
            <button className="btn-chunky" type="submit" disabled={busy}>
              {busy ? "Sending…" : "Get started"}
            </button>
          </form>
          {err && <p className="lp-err">{err}</p>}
          <p className="lp-microcopy">No password. No card. We email you a sign-in code.</p>
        </div>
      </section>

      {/* Coverage strip — the Duolingo flag-row move. Answers "do you cover my
          thing?" at a glance, with no copy to read. */}
      <div className="lp-cats">
        <div className="lp-cats-scroll">
          {CATEGORY_ORDER.map(label => (
            <span className="lp-cat" key={label}>
              <span className="lp-cat-ico">{CATEGORY_ICONS[label]}</span>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* BELOW THE FOLD — the reassurance */}
      <section className="lp-how">
        <h2 className="lp-h2">How it works</h2>
        <div className="lp-steps">
          <div className="lp-step">
            <div className="lp-step-n">1</div>
            <h3>Tell us what you do</h3>
            <p>Three questions, twenty seconds. Designer, founder, analyst, artist, whatever you are.</p>
          </div>
          <div className="lp-step">
            <div className="lp-step-n">2</div>
            <h3>Get your Radar</h3>
            <p>The launches that matter to you, ranked. Plus what to skip, and the free tools that replace paid ones.</p>
          </div>
          <div className="lp-step">
            <div className="lp-step-n">3</div>
            <h3>Analyze anything</h3>
            <p>Paste any product link, get a score in seconds, written for your situation.</p>
          </div>
        </div>
      </section>

      {/* Proof */}
      <section className="lp-proof">
        <div className="lp-proof-card">
          <div className="lp-proof-label">A real result</div>
          <div className="lp-proof-row">
            <div>
              <div className="lp-proof-name">Claude Code</div>
              <div className="lp-proof-verdict">
                &ldquo;Skip this unless you&apos;re building custom tools yourself. It&apos;s a
                developer workflow accelerator, not a design asset.&rdquo;
              </div>
              <div className="lp-proof-who">scored for a Designer in E-commerce</div>
            </div>
            <div className="lp-proof-score">32</div>
          </div>
        </div>
        <p className="lp-proof-note">
          Most tools tell you what&apos;s exciting. Fomora will tell you to skip the most hyped
          launch of the week if it isn&apos;t for you.
        </p>
      </section>

      {/* Trust */}
      <section className="lp-trust">
        <div className="lp-trust-grid">
          <div><strong>Free</strong><span>No card, no trial, no upsell</span></div>
          <div><strong>No password</strong><span>Just a code to your inbox</span></div>
          <div><strong>Private</strong><span>We never sell or share your email</span></div>
          <div><strong>Unbought</strong><span>No ranking is ever paid for</span></div>
        </div>

        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="btn-chunky lp-bottom-cta">
          Get started, it&apos;s free
        </button>
      </section>

      {/* Who made this — a named human is the strongest anti-scam signal there is */}
      <section className="lp-maker">
        <div className="lp-maker-card">
          <div className="lp-maker-avatar">YC</div>
          <div className="lp-maker-body">
            <div className="lp-maker-label">Built by</div>
            <h3 className="lp-maker-name">Yagya Choudhary</h3>
            <p className="lp-maker-note">
              I got tired of scrolling past forty AI launches a day to find the one that
              mattered to me. Fomora is the filter I wanted. It&apos;s free, it has no ads,
              and no company has ever paid to rank higher in it.
            </p>
            <a
              className="lp-maker-link"
              href="https://www.linkedin.com/in/yagya-choudhary-162251ab/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Connect on LinkedIn →
            </a>
          </div>
        </div>

        <p className="lp-foot">
          Launches sourced from Hacker News, Product Hunt and Hugging Face.
        </p>
      </section>
    </div>
  );
}
