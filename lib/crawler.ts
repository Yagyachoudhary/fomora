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

// Operational noise — outages, incidents, status pages. These are not launches,
// but they trend on HN and were scoring 85+ before this filter existed.
const OPS_PATTERN =
  /\b(status (?:page|report|update)|outage|incident|degraded|downtime|post-?mortem|scheduled maintenance|is down|elevated (?:errors|error rates?)|service disruption)\b/i;

// Status subdomains never carry launches.
const OPS_URL_PATTERN = /(^|\/\/|\.)status\.[a-z0-9-]+\./i;

function isNoise(title: string, url = "") {
  return NOISE_PATTERN.test(title) || OPS_PATTERN.test(title) || OPS_URL_PATTERN.test(url);
}

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
      .filter(h => h.url && h.title && AI_PATTERN.test(h.title) && !isNoise(h.title, h.url));
  } catch {
    return [];
  }
}

/* ────────────────────────── Product Hunt ────────────────────────── */

/**
 * Product Hunt's public feed. Note this is ATOM, not RSS — entries are <entry>,
 * and the link is an href attribute rather than element text. Parsing it as RSS
 * silently yields zero results.
 */
export async function fetchProductHunt(): Promise<RawLaunch[]> {
  try {
    const res = await fetch("https://www.producthunt.com/feed", {
      cache: "no-store",
      headers: { "User-Agent": UA }
    });
    if (!res.ok) return [];
    const xml = await res.text();

    const decode = (s: string) =>
      s
        .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&");

    const chunks = xml.split(/<entry[\s>]/i).slice(1);
    const out: RawLaunch[] = [];

    for (const c of chunks) {
      const titleM = c.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      const linkM = c.match(/<link[^>]*href=["']([^"']+)["']/i);
      const contentM = c.match(/<content[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content>/i);
      const dateM = c.match(/<(?:updated|published)[^>]*>([\s\S]*?)<\//i);

      const title = titleM ? decode(titleM[1]).replace(/<[^>]+>/g, "").trim() : "";
      const link = linkM ? linkM[1].trim() : "";
      const desc = contentM
        ? decode(contentM[1]).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
        : "";
      const date = dateM ? dateM[1].trim() : "";

      if (!title || !link) continue;
      // Match on title AND description — PH titles are often just a bare product name.
      if (!AI_PATTERN.test(`${title} ${desc}`)) continue;
      if (isNoise(title, link)) continue;

      out.push({
        url: link,
        title,
        // The feed carries no vote count; front-page placement implies real traction.
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

/* ────────────────────────── Hugging Face ────────────────────────── */

const HF_PIPELINES = [
  "text-to-image",
  "text-to-video",
  "text-to-speech",
  "automatic-speech-recognition",
  "image-to-video",
  "text-to-audio",
  "image-to-image"
];

/**
 * Hugging Face's public API. No auth, no blocking, and it is where open image,
 * audio and video models actually land — the coverage Hacker News misses
 * entirely. Replaces Reddit, which now 403s on both its JSON and RSS endpoints.
 */
export async function fetchHuggingFace(daysBack = 45, minLikes = 25): Promise<RawLaunch[]> {
  const cutoff = Date.now() - daysBack * 86400000;
  const results: RawLaunch[] = [];

  await Promise.all(
    HF_PIPELINES.map(async tag => {
      try {
        const url =
          `https://huggingface.co/api/models?pipeline_tag=${encodeURIComponent(tag)}` +
          `&sort=likes&direction=-1&limit=30`;
        const res = await fetch(url, { cache: "no-store", headers: { "User-Agent": UA } });
        if (!res.ok) return;
        const json = (await res.json()) as Array<Record<string, unknown>>;

        for (const m of json) {
          const id = String(m.id ?? m.modelId ?? "");
          const likes = Number(m.likes ?? 0);
          const created = m.createdAt ? new Date(String(m.createdAt)).getTime() : 0;
          if (!id || likes < minLikes) continue;
          // Only recent releases — this is a launch feed, not a leaderboard.
          if (created && created < cutoff) continue;

          results.push({
            url: `https://huggingface.co/${id}`,
            title: id.split("/").pop() ?? id,
            points: likes,
            source: "Hugging Face",
            createdAt: created ? new Date(created).toISOString() : new Date().toISOString(),
            hint: `Open model on Hugging Face, pipeline: ${tag}, ${likes} likes`
          });
        }
      } catch {
        // one dead pipeline shouldn't kill the crawl
      }
    })
  );

  return results;
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
 * DISABLED — Reddit now returns 403 for unauthenticated requests on both its
 * .json and .rss endpoints, regardless of User-Agent. Kept for reference in case
 * we later add OAuth. Hugging Face replaced it as the creative-coverage source.
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
export type SourceDiagnostics = { hn: number; productHunt: number; huggingFace: number };
export let lastSourceDiag: SourceDiagnostics = { hn: 0, productHunt: 0, huggingFace: 0 };

export async function fetchAllSources(): Promise<RawLaunch[]> {
  const [hn, ph, hf] = await Promise.all([
    fetchHackerNews(48, 15),
    fetchProductHunt(),
    fetchHuggingFace()
  ]);

  // Record raw per-source counts BEFORE dedupe, so a source returning zero is
  // distinguishable from a source whose items all got merged away.
  lastSourceDiag = { hn: hn.length, productHunt: ph.length, huggingFace: hf.length };

  const byUrl = new Map<string, RawLaunch>();
  const norm = (u: string) => u.replace(/[?#].*$/, "").replace(/\/$/, "").toLowerCase();

  for (const item of [...hn, ...ph, ...hf]) {
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
export type EnrichDiagnostics = {
  sent: number;
  parsed: number;
  skipped: number;
  kept: number;
  error?: string;
  rawSample?: string;
};

/**
 * Same as enrichLaunches but also reports what happened. Used by the cron so a
 * silent failure can't hide behind "inserted: 0".
 */
export async function enrichLaunchesVerbose(
  raw: RawLaunch[]
): Promise<{ items: EnrichedLaunch[]; diag: EnrichDiagnostics }> {
  const diag: EnrichDiagnostics = { sent: 0, parsed: 0, skipped: 0, kept: 0 };
  if (raw.length === 0) return { items: [], diag };

  const batch = raw.slice(0, 30);
  diag.sent = batch.length;

  const list = batch
    .map((r, i) => `${i}. "${r.title}" [${r.source}, ${r.points} pts] — ${r.url}${r.hint ? ` — ${r.hint}` : ""}`)
    .join("\n");

  const system = `You classify AI product launches for a feed called Fomora.

For EACH numbered item, decide:
- name: the clean product/company name (not the headline). If it's not really a product, use a short topic name.
- description: one sentence, max 15 words, plain and factual. No hype adjectives.
- category: exactly one of "AI Coding", "AI Agents", "AI Infra", "Image AI", "Video AI", "3D & Animation", "Music & Audio AI", "Voice AI", "Writing AI", "Design Tools", "AI Productivity", "AI Search", "Marketing AI", "Data & Analytics", "Open Source AI", "AI Research"
- velocity: one of "Exploding", "Heating up", "Steady", "Cooling" — infer from the points count (300+ Exploding, 120+ Heating up, 40+ Steady, else Cooling)
- signal_badge: one of "Paradigm Shift", "High Signal", "Emerging", "Hype"
- skip: true in any of these cases, otherwise false:
    (a) it is not about an AI product, model, tool or research release
    (b) it is an outage, status report, incident or service disruption
    (c) it describes the SAME underlying news as an EARLIER item in this list —
        keep the earliest occurrence and skip the later ones. Two headlines about
        the same release from different sites are duplicates even when the
        wording and URLs differ.

Apart from those three cases, be permissive: it is better to include a marginal
item than to drop a real launch.

Return ONLY a JSON array, one object per input item, same order:
[{"index":0,"name":"...","description":"...","category":"...","velocity":"...","signal_badge":"...","skip":false}]

No prose, no markdown fences.`;

  let text = "";
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system,
      messages: [{ role: "user", content: list }]
    });
    const first = response.content[0];
    text = first?.type === "text" ? first.text : "";
  } catch (e) {
    diag.error = `anthropic call failed: ${e instanceof Error ? e.message : String(e)}`;
    return { items: [], diag };
  }

  // Pull out the JSON array even if the model wrapped it in prose or fences.
  let cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) cleaned = cleaned.slice(start, end + 1);

  let parsed: Array<Record<string, unknown>> = [];
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    diag.error = `json parse failed: ${e instanceof Error ? e.message : String(e)}`;
    diag.rawSample = text.slice(0, 400);
    return { items: [], diag };
  }
  diag.parsed = parsed.length;

  const out: EnrichedLaunch[] = [];
  for (const p of parsed) {
    const idx = Number(p.index);
    const src = batch[idx];
    if (!src) continue;
    if (p.skip === true) { diag.skipped += 1; continue; }

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
  diag.kept = out.length;
  return { items: out, diag };
}

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
