"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FomoraMascot } from "@/components/FomoraMascot";
import { ROLES, INDUSTRIES, INTERESTS } from "@/lib/types";

type Answers = {
  role: string | null;
  industry: string | null;
  interests: string[];
};

const EMPTY: Answers = { role: null, industry: null, interests: [] };

// Everything we no longer ask gets a sensible default.
const DEFAULTS = {
  depth: "Intermediate",
  tools: [] as string[],
  goals: ["Stay informed"],
  time_pref: "Daily",
  daily_goal: 3
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(EMPTY);
  const [busy, setBusy] = useState(false);

  const totalSteps = 5; // 0 welcome · 1 role · 2 industry · 3 interests · 4 done
  const progress = (step / (totalSteps - 1)) * 100;

  function toggleInterest(value: string) {
    setAnswers(a => {
      if (a.interests.includes(value)) {
        return { ...a, interests: a.interests.filter(v => v !== value) };
      }
      if (a.interests.length >= 3) return a;
      return { ...a, interests: [...a.interests, value] };
    });
  }

  const isValid = (() => {
    switch (step) {
      case 0: case 4: return true;
      case 1: return !!answers.role;
      case 2: return !!answers.industry;
      case 3: return answers.interests.length >= 1;
      default: return true;
    }
  })();

  async function saveProfile(a: Answers) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({
      role: a.role,
      industry: a.industry,
      interests: a.interests,
      ...DEFAULTS
    }).eq("id", user.id);
  }

  async function next() {
    if (step === 3) {
      setBusy(true);
      await saveProfile(answers);
      setBusy(false);
      setStep(4);
      return;
    }
    if (step === 4) { router.push("/"); router.refresh(); return; }
    setStep(s => Math.min(s + 1, totalSteps - 1));
  }

  // Skip must still write a profile, otherwise "/" bounces the user
  // straight back here and they're stuck in a loop.
  async function skip() {
    setBusy(true);
    await saveProfile({
      role: answers.role ?? "Curious",
      industry: answers.industry ?? "Other",
      interests: answers.interests.length ? answers.interests : ["AI Coding", "Agents", "AI Infra"]
    });
    setBusy(false);
    router.push("/");
    router.refresh();
  }

  const labels: Record<number, string> = { 0: "Get started", 3: "Build my Radar", 4: "Show me my Radar →" };

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <div className="h-1.5 bg-rule mx-8 mt-6 rounded-full overflow-hidden">
        <div className="h-full bg-brand transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex items-center justify-between px-8 py-4">
        <button
          onClick={() => step > 0 && step !== 4 && setStep(s => s - 1)}
          disabled={step === 0 || step === 4}
          className="text-2xl text-ink disabled:opacity-0 disabled:pointer-events-none"
        >←</button>
        {step !== 4 && (
          <button onClick={skip} disabled={busy} className="text-[11px] uppercase tracking-[0.18em] text-muted font-semibold hover:text-ink">
            Skip for now
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 overflow-y-auto">
        <div className="w-full max-w-2xl text-center">

          {step === 0 && (
            <div className="py-8">
              <div className="flex justify-center mb-8"><FomoraMascot size={180} /></div>
              <h1 className="serif text-5xl md:text-6xl font-black leading-none">Hi, I&apos;m Fomora.</h1>
              <p className="text-ink-soft text-lg mt-5 max-w-md mx-auto leading-relaxed">
                I&apos;ll tell you which AI launches actually matter to <strong>you</strong>.<br />
                Three quick questions — 20 seconds.
              </p>
            </div>
          )}

          {step === 1 && (
            <Question eyebrow="Question 1 of 3" title="What do you do?" sub="This shapes how everything gets scored.">
              <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto">
                {ROLES.map(r => (
                  <Card key={r} selected={answers.role === r} onClick={() => setAnswers(a => ({ ...a, role: r }))}>{r}</Card>
                ))}
              </div>
            </Question>
          )}

          {step === 2 && (
            <Question eyebrow="Question 2 of 3" title="Which industry?" sub="So launches get scored against your actual work.">
              <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto">
                {INDUSTRIES.map(i => (
                  <Card key={i} selected={answers.industry === i} onClick={() => setAnswers(a => ({ ...a, industry: i }))}>{i}</Card>
                ))}
              </div>
            </Question>
          )}

          {step === 3 && (
            <Question eyebrow="Question 3 of 3" title="What gets you excited?" sub="Pick up to 3. These rank highest in your Radar.">
              <p className={`text-sm font-semibold mb-5 ${answers.interests.length === 3 ? "text-brand" : "text-muted"}`}>
                {answers.interests.length} of 3 selected
              </p>
              <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto">
                {INTERESTS.map(i => (
                  <Card key={i} center selected={answers.interests.includes(i)} onClick={() => toggleInterest(i)}>{i}</Card>
                ))}
              </div>
            </Question>
          )}

          {step === 4 && (
            <div className="py-8">
              <div className="w-32 h-32 rounded-full bg-brand mx-auto flex items-center justify-center text-white text-6xl shadow-xl">✓</div>
              <h1 className="serif text-5xl font-black mt-7 leading-none">You&apos;re set.</h1>
              <p className="text-ink-soft mt-5 text-base max-w-md mx-auto leading-relaxed">
                Your Radar is tuned for<br />
                <strong className="text-ink">{answers.role} in {answers.industry} · {answers.interests.join(", ")}</strong>
              </p>
              <p className="text-muted text-sm mt-6">You can fine-tune anything later from your Profile.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center px-8 py-6 border-t border-rule bg-cream">
        <button onClick={next} disabled={!isValid || busy} className="btn btn-primary w-full max-w-xl">
          {busy ? "Saving…" : (labels[step] ?? "Continue")}
        </button>
      </div>
    </div>
  );
}

function Question({ eyebrow, title, sub, children }: { eyebrow: string; title: string; sub: string; children: React.ReactNode }) {
  return (
    <>
      <div className="eyebrow">{eyebrow}</div>
      <h2 className="serif text-4xl md:text-5xl font-extrabold mt-3 leading-tight">{title}</h2>
      <p className="text-muted text-base mt-3 mb-8">{sub}</p>
      {children}
    </>
  );
}

function Card({ children, selected, onClick, center }: { children: React.ReactNode; selected: boolean; onClick: () => void; center?: boolean }) {
  return (
    <button onClick={onClick} className={`ob-card ${selected ? "selected" : ""} ${center ? "center" : ""}`}>{children}</button>
  );
}
