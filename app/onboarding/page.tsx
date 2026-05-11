"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FomoraMascot } from "@/components/FomoraMascot";
import { ROLES, INDUSTRIES, DEPTHS, INTERESTS, TOOLS, GOALS, TIME_PREFS } from "@/lib/types";

type Answers = {
  role: string | null;
  industry: string | null;
  depth: string | null;
  interests: string[];
  tools: string[];
  goals: string[];
  time_pref: string | null;
  daily_goal: number | null;
};

const EMPTY: Answers = {
  role: null, industry: null, depth: null,
  interests: [], tools: [], goals: [],
  time_pref: null, daily_goal: null
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(EMPTY);
  const [busy, setBusy] = useState(false);

  const totalSteps = 10; // 0 welcome … 8 commit, 9 done
  const progress = (step / (totalSteps - 1)) * 100;

  function pickSingle<K extends keyof Answers>(key: K, value: string) {
    setAnswers(a => ({ ...a, [key]: value as Answers[K] }));
  }
  function toggleMulti(key: "interests" | "tools" | "goals", value: string, limit = 999) {
    setAnswers(a => {
      const arr = a[key];
      if (arr.includes(value)) return { ...a, [key]: arr.filter(v => v !== value) };
      if (arr.length >= limit) return a;
      return { ...a, [key]: [...arr, value] };
    });
  }

  const isValid = (() => {
    switch (step) {
      case 0: case 9: return true;
      case 1: return !!answers.role;
      case 2: return !!answers.industry;
      case 3: return !!answers.depth;
      case 4: return answers.interests.length >= 1;
      case 5: return answers.tools.length >= 1;
      case 6: return answers.goals.length >= 1;
      case 7: return !!answers.time_pref;
      case 8: return !!answers.daily_goal;
      default: return true;
    }
  })();

  async function next() {
    if (step === 8) {
      // Persist before showing done screen
      setBusy(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({
          role: answers.role,
          industry: answers.industry,
          depth: answers.depth,
          interests: answers.interests,
          tools: answers.tools,
          goals: answers.goals,
          time_pref: answers.time_pref,
          daily_goal: answers.daily_goal
        }).eq("id", user.id);
      }
      setBusy(false);
      setStep(9);
      return;
    }
    if (step === 9) { router.push("/"); return; }
    setStep(s => Math.min(s + 1, totalSteps - 1));
  }

  function back() {
    if (step > 0 && step !== 9) setStep(s => s - 1);
  }

  const labels: Record<number, string> = { 0: "Get started", 7: "Continue", 8: "Lock it in 🔒", 9: "Show me my Radar →" };

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      {/* progress bar */}
      <div className="h-1.5 bg-rule mx-8 mt-6 rounded-full overflow-hidden">
        <div className="h-full bg-brand transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* header */}
      <div className="flex items-center justify-between px-8 py-4">
        <button onClick={back} disabled={step === 0 || step === 9} className="text-2xl text-ink disabled:opacity-0 disabled:pointer-events-none">←</button>
        <button onClick={() => router.push("/")} className="text-[11px] uppercase tracking-[0.18em] text-muted font-semibold hover:text-ink">Skip for now</button>
      </div>

      {/* body */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 overflow-y-auto">
        <div className="w-full max-w-2xl text-center">

          {step === 0 && (
            <div className="py-8">
              <div className="flex justify-center mb-8"><FomoraMascot size={180} /></div>
              <h1 className="serif text-5xl md:text-6xl font-black leading-none">Hi, I'm Fomora.</h1>
              <p className="text-ink-soft text-lg mt-5 max-w-md mx-auto leading-relaxed">
                I'll tell you which AI launches actually matter to <strong>you</strong>.<br />
                Not the world. Just you. Takes 60 seconds.
              </p>
            </div>
          )}

          {step === 1 && (
            <Question eyebrow="Step 1 of 8" title="What do you do?" sub="This shapes everything. Pick what's closest.">
              <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto">
                {ROLES.map(r => (
                  <Card key={r} selected={answers.role === r} onClick={() => pickSingle("role", r)}>{r}</Card>
                ))}
              </div>
            </Question>
          )}

          {step === 2 && (
            <Question eyebrow="Step 2 of 8" title="Which industry?" sub="So launches get scored against your actual work.">
              <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto">
                {INDUSTRIES.map(i => (
                  <Card key={i} selected={answers.industry === i} onClick={() => pickSingle("industry", i)}>{i}</Card>
                ))}
              </div>
            </Question>
          )}

          {step === 3 && (
            <Question eyebrow="Step 3 of 8" title="How technical are you?" sub="Honest answers get you a better feed.">
              <div className="grid gap-3 max-w-xl mx-auto">
                {DEPTHS.map(d => (
                  <Card key={d} selected={answers.depth === d} onClick={() => pickSingle("depth", d)}>{d}</Card>
                ))}
              </div>
            </Question>
          )}

          {step === 4 && (
            <Question eyebrow="Step 4 of 8" title="What gets you excited?" sub="Pick up to 3. Ranks higher in your Radar.">
              <p className={`text-sm font-semibold mb-5 ${answers.interests.length === 3 ? "text-brand" : "text-muted"}`}>
                {answers.interests.length} of 3 selected
              </p>
              <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto">
                {INTERESTS.map(i => (
                  <Card key={i} center selected={answers.interests.includes(i)} onClick={() => toggleMulti("interests", i, 3)}>{i}</Card>
                ))}
              </div>
            </Question>
          )}

          {step === 5 && (
            <Question eyebrow="Step 5 of 8" title="What do you already use?" sub="So I don't keep recommending tools you live in.">
              <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto">
                {TOOLS.map(t => (
                  <Card key={t} center selected={answers.tools.includes(t)} onClick={() => toggleMulti("tools", t)}>{t}</Card>
                ))}
              </div>
            </Question>
          )}

          {step === 6 && (
            <Question eyebrow="Step 6 of 8" title="Why are you here?" sub="Pick all that apply.">
              <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto">
                {GOALS.map(g => (
                  <Card key={g} selected={answers.goals.includes(g)} onClick={() => toggleMulti("goals", g)}>{g}</Card>
                ))}
              </div>
            </Question>
          )}

          {step === 7 && (
            <Question eyebrow="Step 7 of 8" title="How much time per day?" sub="Pick what's realistic. Change it any time.">
              <div className="grid gap-3 max-w-xl mx-auto">
                {TIME_PREFS.map(t => (
                  <Card key={t} selected={answers.time_pref === t} onClick={() => pickSingle("time_pref", t)}>
                    {t === "Casual" && "Casual — 5 min, quick scan"}
                    {t === "Daily" && "Daily — 15 min, full Radar"}
                    {t === "Deep" && "Deep learner — 30+ min, actually try things"}
                  </Card>
                ))}
              </div>
            </Question>
          )}

          {step === 8 && (
            <Question eyebrow="Step 8 of 8 · Final commit" title="Set your streak goal." sub="Reviewing this many launches a day = your streak. Don't break it.">
              <div className="grid grid-cols-4 gap-3 max-w-xl mx-auto">
                {[1, 3, 5, 10].map(n => (
                  <button
                    key={n}
                    onClick={() => setAnswers(a => ({ ...a, daily_goal: n }))}
                    className={`relative p-7 border-2 transition-all ${answers.daily_goal === n ? "border-brand bg-[#FFF6F4]" : "border-rule bg-white hover:border-ink"}`}
                  >
                    {n === 3 && <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] px-2 py-0.5 bg-brand text-white tracking-wider uppercase font-bold whitespace-nowrap">Pick me</span>}
                    <div className={`serif text-5xl font-black leading-none ${answers.daily_goal === n ? "text-brand" : "text-ink"}`}>{n}</div>
                    <div className="text-[11px] uppercase tracking-wider text-muted mt-2 font-semibold">a day</div>
                  </button>
                ))}
              </div>
            </Question>
          )}

          {step === 9 && (
            <div className="py-8">
              <div className="w-32 h-32 rounded-full bg-brand mx-auto flex items-center justify-center text-white text-6xl shadow-xl">✓</div>
              <h1 className="serif text-5xl font-black mt-7 leading-none">You're set.</h1>
              <p className="text-ink-soft mt-5 text-base max-w-md mx-auto leading-relaxed">
                Your first AI Radar is loading.<br />
                <strong className="text-ink">
                  {answers.daily_goal} launches/day · {answers.role} in {answers.industry} · {answers.interests.join(", ")}
                </strong>
              </p>
              <div className="flex gap-8 justify-center mt-9 pt-8 border-t border-rule">
                <div className="text-center"><div className="serif text-3xl font-extrabold text-brand">+50</div><div className="text-[10px] uppercase tracking-[0.18em] text-muted mt-1 font-semibold">Welcome XP</div></div>
                <div className="text-center"><div className="serif text-3xl font-extrabold text-brand">🔥1</div><div className="text-[10px] uppercase tracking-[0.18em] text-muted mt-1 font-semibold">Day streak</div></div>
                <div className="text-center"><div className="serif text-3xl font-extrabold text-brand">🎯</div><div className="text-[10px] uppercase tracking-[0.18em] text-muted mt-1 font-semibold">Goal locked</div></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* footer */}
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
