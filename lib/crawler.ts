import { anthropic, MODEL } from "./anthropic";

export type RawLaunch = {
  url: string;
  title: string;
  points: number;
  source: string;
  createdAt: string;
  hint?: string; // extra context (e.g. RSS description) to help classification
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
  /\b(ai|a\.i\.|llm|llms|gpt|claude|gemini|grok|mistral|deepseek|qwen|agent|agents|agentic|copilot|rag|embedding|embeddings|diffusion|transformer|multimodal|open-?weights|fine-?tun\w+|inference|anthropic|openai|hugging ?face|langchain|mcp|midjourney|stable ?diffusion|flux|runway|sora|veo|firefly|elevenlabs|suno|udio|comfyui|lora|text-?to-?image|text-?to-?video|text-?to-?speech|image ?gen\w*|video ?gen\w*|generative)\b/i;

// Stories that are usually discussion, showcase, or noise — not launches.
const NOISE_PATTERN =
  /\b(lawsuit|sued|regulation|opinion|why i|i think|rant|essay|is dead|considered harmful|ask hn|my first|i made this|feedback|help|question|workflow share|prompt share|showcase|wallpaper|meme|nsfw)\b/i;

const UA = "Mozilla/5.0 (compatible; FomoraBot/1.0; +https://fomora.vercel.app)";

/** Momentum on a 0-100 scale from a raw vote/point count. */
function momentumFromPoints(points: number, floor = 40, scale = 22) {
  return Math.min(97, Math.round(floor + Math.log10(Math.max(points, 1)) * scale));
}

/* ────────────────────────── Hacker News ────────────────────────── */

export async function fetchHackerNews(hoursBack = 48, minPoints = 15): Promise<RawLaunch[]> {
  try {
    const since = Math.floor(Date.now() / 1000) - hoursBack * 3600;
    const url =
      `https://hn.algolia.com/api/v1/search?tags=story` +
      `&numericFilters=created_at_i>${since},points>${minPoints}` +
      `&hitsPerPage=100`;

    const res = await fetch(url, { cache: "no-store", headers: { "User-Agent": UA } });
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
      .filter(h => h.url && h.title && AI_PATTERN.test(h.title) && !NOISE_PATTERN.test(h.title));
  } catch {
    return [];
  }
}

/* ────────────────────────── Product Hunt ────────────────────────── */

/**
 * Product Hunt's public RSS. No API key. Far better creative-tool coverage
 * than HN — this is where design, video, and image tools actually launch.
 */
export async function fetchProductHunt(): Promise<RawLaunch[]> {
  try {
    const res = await fetch("https://www.producthunt.com/feed", {
      cache: "no-store",
      headers: { "User-Agent": UA }
    });
    if (!res.ok) return [];
    const xml = await res.text();

    const chunks = xml.split(/<item>/i).slice(1);
    const out: RawLaunch[] = [];

    for (const c of chunks) {
      const pick = (tag: string) => {
        const m = c.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`, "i"));
        return m ? m[1].trim() : "";
      };

      const title = pick("title").replace(/<[^>]+>/g, "").trim();
      const link = pick("link").replace(/<[^>]+>/g, "").trim();
      const desc = pick("description").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      const date = pick("pubDate");

      if (!title || !link) continue;
      // Match against title AND description — PH titles are often just a product name.
      const haystack = `${title} ${desc}`;
      if (!AI_PATTERN.test(haystack)) continue;
      if (NOISE_PATTERN.test(title)) continue;

      out.push({
        url: link,
        title,
        // RSS carries no vote count; PH front-page placement implies real traction.
        points: 60,
        source: "Product Hunt",
        createdAt: date ? new Date(date).toISOString() : new Date().toISOString(),
        hint: desc.slice(0, 300)
      });
    }
    return out.slice(0, 40);
  } catch {
    return [];
  }
}

/* ────────────────────────── Reddit ────────────────────────── */

const DEFAULT_SUBS = [
  "StableDiffusion",   // image AI
  "midjourney",        // image AI
  "aivideo",           // video AI
  "LocalLLaMA",        // open models
  "artificial"         // general
];

/**
 * Reddit's public JSON endpoints. No auth needed for read-only.
 * This is where creative-AI tooling breaks before it reaches HN.
 */
export async function fetchReddit(subs: string[] = DEFAULT_SUBS, minScore = 80): Promise<RawLaunch[]> {
  const results: RawLaunch[] = [];

  await Promise.all(
    subs.map(async sub => {
      try {
        const res = await fetch(`https://www.reddit.com/r/${sub}/top.json?t=day&limit=25`, {
          cache: "no-store",
          headers: { "User-Agent": UA }
        });
        if (!res.ok) return;
        const json = (await res.json()) as {
          data?: { children?: Array<{ data?: Record<string, unknown> }> };
        };

        for (const child of json.data?.children ?? []) {
          const d = child.data;
          if (!d) continue;

          const title = String(d.title ?? "");
          const score = Number(d.score ?? 0);
          const isSelf = Boolean(d.is_self);
          const externalUrl = String(d.url ?? "");
          const permalink = String(d.permalink ?? "");

          // Self-posts are usually discussion or showcase, not launches.
          if (isSelf) continue;
          if (score < minScore) continue;
          if (!title || !externalUrl) continue;
          if (NOISE_PATTERN.test(title)) continue;
          // Skip direct media — those are art posts, not product news.
          if (/\.(jpg|jpeg|png|gif|webp|mp4)$/i.test(externalUrl)) continue;
          if (/(i\.redd\.it|v\.redd\.it|imgur\.com)/i.test(externalUrl)) continue;
          if (!AI_PATTERN.test(title)) continue;

          results.push({
            url: externalUrl,
            title,
            points: score,
            source: `r/${sub}`,
            createdAt: d.created_utc
              ? new Date(Number(d.created_utc) * 1000).toISOString()
              : new Date().toISOString(),
            hint: permalink ? `Discussed at reddit.com${permalink}` : undefined
          });
        }
      } catch {
        // one dead subreddit shouldn't kill the crawl
      }
    })
  );

  return results;
}

/* ────────────────────────── Combine ────────────────────────── */

/**
 * Pull every source in parallel and de-duplicate by normalized URL.
 * A launch appearing on multiple sources gets a momentum boost — cross-source
 * presence is a genuine signal that something is breaking out.
 */
export async function fetchAllSources(): Promise<RawLaunch[]> {
  const [hn, ph, reddit] = await Promise.all([
    fetchHackerNews(48, 15),
    fetchProductHunt(),
    fetchReddit()
  ]);

  const byUrl = new Map<string, RawLaunch>();
  const norm = (u: string) => u.replace(/[?#].*$/, "").replace(/\/$/, "").toLowerCase();

  for (const item of [...hn, ...ph, ...reddit]) {
    const key = norm(item.url);
    const existing = byUrl.get(key);
    if (!existing) {
      byUrl.set(key, item);
    } else {
      // Seen on more than one source — merge and boost.
      byUrl.set(key, {
        ...existing,
        points: Math.round((existing.points + item.points) * 0.8),
        source: `${existing.source} + ${item.source}`,
        hint: existing.hint ?? item.hint
      });
    }
  }

  return [...byUrl.values()].sort((a, b) => b.points - a.points);
}

/* ────────────────────────── Enrich ────────────────────────── */

/**
 * One Haiku call to categorize + describe a whole batch. Costs a fraction of a
 * cent per cron run, far cheaper than per-item calls.
 */
export async function enrichLaunches(raw: RawLaunch[]): Promise<EnrichedLaunch[]> {
  if (raw.length === 0) return [];

  const batch = raw.slice(0, 30);
  const list = batch
    .map((r, i) => `${i}. "${r.title}" [${r.source}, ${r.points} pts] — ${r.url}${r.hint ? ` — ${r.hint}` : ""}`)
    .join("\n");

  const system = `You classify AI product launches for a feed called Fomora.

For EACH numbered item, decide:
- name: the clean product/company name (not the headline). If it's not really a product, use a short topic name.
- description: one sentence, max 15 words, plain and factual. No hype adjectives.
- category: exactly one of "AI Coding", "AI Agents", "AI Infra", "Image AI", "Video AI", "3D & Animation", "Music & Audio AI", "Voice AI", "Writing AI", "Design Tools", "AI Productivity", "AI Search", "Marketing AI", "Data & Analytics", "Open Source AI", "AI Research"
- velocity: one of "Exploding", "Heating up", "Steady", "Cooling" — infer from the points count (300+ Exploding, 120+ Heating up, 40+ Steady, else Cooling)
- signal_badge: one of "Paradigm Shift", "High Signal", "Emerging", "Hype" — be honest, most things are "Emerging"
- skip: true if this is NOT an AI product/launch/model release — e.g. commentary, a lawsuit, a think-piece, someone showing off their own artwork, or a tutorial

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
      base_momentum: momentumFromPoints(src.points)
    });
  }
  return out;
}
