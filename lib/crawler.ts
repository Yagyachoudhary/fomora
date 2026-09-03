import { anthropic, MODEL } from "./anthropic";

export type RawLaunch = {
  url: string;
  title: string;
  points: number;
  source: string;
  createdAt: string;
};

export type EnrichedLaunch = RawLaunch & {
  name: string;
  description: string;
  category: string;
  velocity: "Exploding" | "Heating up" | "Steady" | "Cooling";
  signal_badge: "Paradigm Shift" | "High Signal" | "Emerging" | "Hype";
  base_momentum: number;
};

// Keywords that suggest a story is about an AI product/launch rather than commentary.
const AI_PATTERN =
  /\b(ai|a\.i\.|llm|llms|gpt|claude|gemini|grok|mistral|deepseek|qwen|agent|agents|agentic|copilot|rag|embedding|embeddings|diffusion|transformer|multimodal|open-?weights|fine-?tun\w+|inference|anthropic|openai|hugging ?face|langchain|mcp)\b/i;

// Stories that are usually discussion, not launches — filter these out.
const NOISE_PATTERN =
  /\b(lawsuit|sued|regulation|opinion|why i|i think|rant|essay|is dead|considered harmful|ask hn)\b/i;

/**
 * Pull recent AI-related stories from Hacker News via the free Algolia API.
 * No API key required.
 */
export async function fetchHackerNews(hoursBack = 48, minPoints = 15): Promise<RawLaunch[]> {
  const since = Math.floor(Date.now() / 1000) - hoursBack * 3600;
  const url =
    `https://hn.algolia.com/api/v1/search?tags=story` +
    `&numericFilters=created_at_i>${since},points>${minPoints}` +
    `&hitsPerPage=100`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const json = (await res.json()) as { hits?: Array<Record<string, unknown>> };

  return (json.hits ?? [])
    .map(h => ({
      url: String(h.url ?? ""),
      title: String(h.title ?? ""),
      points: Number(h.points ?? 0),
      source: "Hacker News",
      createdAt: String(h.created_at ?? new Date().toISOString())
    }))
    .filter(h =>
      h.url &&
      h.title &&
      AI_PATTERN.test(h.title) &&
      !NOISE_PATTERN.test(h.title)
    );
}

/**
 * One Haiku call to categorize + describe a whole batch. Costs a fraction of a
 * cent per cron run, far cheaper than per-item calls.
 */
export async function enrichLaunches(raw: RawLaunch[]): Promise<EnrichedLaunch[]> {
  if (raw.length === 0) return [];

  const batch = raw.slice(0, 25);
  const list = batch
    .map((r, i) => `${i}. "${r.title}" (${r.points} points) — ${r.url}`)
    .join("\n");

  const system = `You classify AI product launches for a feed called Fomora.

For EACH numbered item, decide:
- name: the clean product/company name (not the headline). If it's not really a product, use a short topic name.
- description: one sentence, max 15 words, plain and factual. No hype adjectives.
- category: exactly one of "AI Coding", "AI Agents", "AI Infra", "Video AI", "Voice AI", "Image AI", "AI Productivity", "AI Search", "AI Design", "Open Source AI", "AI Research"
- velocity: one of "Exploding", "Heating up", "Steady", "Cooling" — infer from the points count (300+ Exploding, 120+ Heating up, 40+ Steady, else Cooling)
- signal_badge: one of "Paradigm Shift", "High Signal", "Emerging", "Hype" — be honest, most things are "Emerging"
- skip: true if this is NOT an AI product/launch/model release (e.g. it's commentary, a lawsuit, a think-piece)

Return ONLY a JSON array, one object per input item, in the same order:
[{"index":0,"name":"...","description":"...","category":"...","velocity":"...","signal_badge":"...","skip":false}, ...]

No prose, no markdown fences.`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system,
    messages: [{ role: "user", content: list }]
  });

  const first = response.content[0];
  const text = first?.type === "text" ? first.text : "[]";
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  let parsed: Array<Record<string, unknown>> = [];
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return [];
  }

  const out: EnrichedLaunch[] = [];
  for (const p of parsed) {
    const idx = Number(p.index);
    const src = batch[idx];
    if (!src || p.skip === true) continue;

    out.push({
      ...src,
      name: String(p.name ?? src.title).slice(0, 120),
      description: String(p.description ?? "").slice(0, 300),
      category: String(p.category ?? "AI Research"),
      velocity: (p.velocity as EnrichedLaunch["velocity"]) ?? "Steady",
      signal_badge: (p.signal_badge as EnrichedLaunch["signal_badge"]) ?? "Emerging",
      // Momentum: map HN points onto a 0-100 scale, capped.
      base_momentum: Math.min(97, Math.round(40 + Math.log10(Math.max(src.points, 1)) * 22))
    });
  }
  return out;
}
