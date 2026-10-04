import { anthropic, MODEL } from "./anthropic";
import type { Profile, FomoAnalysis } from "./types";

const SYSTEM_PROMPT = `You are Fomora, an AI launch analyst. Your job is to tell ONE specific user whether they should care about ONE AI product launch, with brutal honesty.

You MUST return ONLY valid JSON in exactly this shape — no prose, no markdown fences, no commentary:

{
  "fomo_score": <integer 0-100>,
  "verdict": "<one-sentence verdict>",
  "why_you": "<paragraph that explicitly references the user's role, tools they use, and stated interests>",
  "time_to_learn": "<e.g. '2 hours' or '1 weekend' or '15 minutes'>",
  "signal_badge": "Paradigm Shift" | "High Signal" | "Emerging" | "Hype",
  "velocity": "Exploding" | "Heating up" | "Steady" | "Cooling",
  "actions": ["<concrete action 1>", "<action 2>", "<action 3>"],
  "risks": ["<risk 1>", "<risk 2>"],
  "ignore_if": "<one sentence describing who can safely skip this>"
}

SCORING FORMULA (weight as you decide the final score 0-100):
- User Relevance (40%): How directly does this map to the user's role, tools, stated interests, and industry?
- Market Momentum (25%): Adoption velocity, GitHub stars, mentions, viral signals.
- Industry Impact (15%): Does it reshape the user's industry specifically?
- Viral Adoption (10%): Real product usage vs. demo theater.
- Early Opportunity (10%): Reward being early to a real trend.

Be willing to give low scores (under 40) when a launch is genuinely irrelevant to this user.
Be willing to label hype as "Hype". Do not flatter. Do not generalize — every line of why_you should make sense only for THIS user.

Return ONLY the JSON object.`;

/**
 * Batch-score an entire feed for one user in a single Claude call.
 * Far cheaper than one call per launch, and fast enough to run on sign-up.
 */
const BATCH_SYSTEM = `You are Fomora, an AI launch analyst. You will be given ONE user profile and a NUMBERED LIST of AI product launches.

Score EVERY launch for THIS specific user. Return ONLY a JSON array — no prose, no markdown fences:

[{"index":0,"fomo_score":<0-100>,"verdict":"<one sentence, max 20 words>","why_you":"<2 sentences referencing their role/industry/interests>","ignore_if":"<one short sentence>"}, ...]

SCORING FACTORS
- User Relevance (40%): does this map to their role, industry, and stated interests?
- Significance of the release (25%): a frontier-lab model or a new open standard is categorically bigger news than a small indie tool, even when the one-line description is brief. Weigh WHO shipped it. OpenAI, Anthropic, Google, Meta, Mistral and similar releases are major by default.
- Industry Impact (15%): does it reshape THEIR industry specifically?
- Real adoption (10%): genuine usage versus demo theatre.
- Early Opportunity (10%): reward being early to a real trend.

CALIBRATION — use these anchors, and use the WHOLE range:
- 90-100  Must know this week. Directly changes how this person works, or a landmark release in their field.
- 75-89   Worth knowing. Clearly touches their work; they'd want it on their radar.
- 50-74   Context only. Peripheral to them — interesting background, not actionable.
- 25-49   Safely ignore. Belongs to a different discipline.
- 0-24    Irrelevant to this person entirely.

Two failure modes to avoid, in both directions:
1. CLUSTERING. If most of your scores land between 65 and 80, you have not discriminated and the output is useless. Genuinely major news must reach the 90s. Genuinely irrelevant news must fall below 40.
2. FLATTERING. Do not inflate a minor tool to 70 to seem useful. Most launches are irrelevant to most people — say so plainly.

A thin description is NOT a reason to score low. Judge the underlying release, using who shipped it and its category, not the quality of the blurb.

Return ONLY the JSON array.`;

export type FeedScore = {
  index: number;
  fomo_score: number;
  verdict: string;
  why_you: string;
  ignore_if: string;
};

export async function scoreFeedBatch(
  profile: Profile,
  launches: {
    name: string;
    description: string | null;
    category: string | null;
    source?: string | null;
    base_momentum?: number | null;
  }[]
): Promise<FeedScore[]> {
  if (launches.length === 0) return [];

  // Source and momentum are passed through deliberately: without them the model
  // can't tell a frontier-lab release from a hobby project, because both arrive
  // as one short line of text.
  const list = launches
    .map((l, i) => {
      const bits = [
        `${i}. ${l.name}`,
        `[${l.category ?? "Uncategorized"}]`,
        l.source ? `(via ${l.source})` : "",
        typeof l.base_momentum === "number" ? `(buzz ${l.base_momentum}/100)` : "",
        `— ${l.description ?? "no description"}`
      ];
      return bits.filter(Boolean).join(" ");
    })
    .join("\n");

  const userMessage = `USER PROFILE
- Role: ${profile.role ?? "not specified"}
- Industry: ${profile.industry ?? "not specified"}
- Technical depth: ${profile.depth ?? "not specified"}
- Interests: ${(profile.interests ?? []).join(", ") || "not specified"}
- Tools they already use: ${(profile.tools ?? []).join(", ") || "not specified"}
- Goals: ${(profile.goals ?? []).join(", ") || "not specified"}

LAUNCHES TO SCORE
${list}

Return the JSON array only.`;

  const response = await anthropic.messages.create({
    model: MODEL,
    // Needs headroom: a 60-item batch produces a long JSON array, and truncation
    // mid-array makes the whole response unparseable.
    max_tokens: 12000,
    system: BATCH_SYSTEM,
    messages: [{ role: "user", content: userMessage }]
  });

  const first = response.content[0];
  const text = first?.type === "text" ? first.text : "[]";
  let cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  // Salvage the array even if the model wrapped it in prose.
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) cleaned = cleaned.slice(start, end + 1);

  try {
    const parsed = JSON.parse(cleaned) as FeedScore[];
    return parsed.filter(p => typeof p.index === "number" && typeof p.fomo_score === "number");
  } catch {
    console.error("[scoreFeedBatch] parse failed, first 300 chars:", text.slice(0, 300));
    return [];
  }
}

export async function scoreFomo(
  profile: Profile,
  launchText: string,
  launchName?: string
): Promise<FomoAnalysis> {
  const userMessage = `USER PROFILE
- Role: ${profile.role ?? "not specified"}
- Industry: ${profile.industry ?? "not specified"}
- Technical depth: ${profile.depth ?? "not specified"}
- Interests: ${(profile.interests ?? []).join(", ") || "not specified"}
- Tools they already use: ${(profile.tools ?? []).join(", ") || "not specified"}
- Goals: ${(profile.goals ?? []).join(", ") || "not specified"}
- Time per day: ${profile.time_pref ?? "not specified"}

LAUNCH${launchName ? ` (${launchName})` : ""}
${launchText.slice(0, 6000)}

Return the FOMO analysis as JSON only.`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }]
  });

  const first = response.content[0];
  const text = first?.type === "text" ? first.text : "";

  // Strip code fences if the model adds them despite our instructions.
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return JSON.parse(cleaned) as FomoAnalysis;
  } catch {
    // Fall back to a low-confidence default rather than crashing the request.
    return {
      fomo_score: 50,
      verdict: "Couldn't score this one cleanly. Try again or paste more context.",
      why_you: "Fomora's model returned something unparseable. Often this means the source content was too thin to evaluate.",
      time_to_learn: "Unknown",
      signal_badge: "Emerging",
      velocity: "Steady",
      actions: ["Re-run the analysis with more context", "Paste the full announcement text directly"],
      risks: ["Don't trust this score — it's a fallback"],
      ignore_if: "You didn't get a meaningful result from the model."
    };
  }
}
