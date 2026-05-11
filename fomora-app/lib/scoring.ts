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
