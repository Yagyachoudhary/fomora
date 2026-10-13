/**
 * Product archetypes for the Build feature.
 *
 * THE DIVISION OF LABOUR THAT MAKES THIS TRUSTWORTHY
 * The model's only jobs are (a) match a free-text description to one of these
 * archetypes and (b) write the industry-specific caveats. It never picks prices
 * and it never does arithmetic — every number the user sees is computed here,
 * from lib/stack-pricing.ts. A model asked to multiply token rates by traffic
 * will produce plausible, wrong totals, and a wrong total is the one thing this
 * feature cannot survive.
 *
 * Token shapes below are deliberate estimates, not measurements. They assume a
 * competent but not heavily optimised implementation. They are the single
 * biggest source of error in the output, which is why the UI says so.
 */

import type { ChatModel } from "./stack-pricing";

export type Layer = {
  role: string;
  pick: string;
  why: string;
  /** The open or free option for this layer. */
  freeAlt?: string;
  /** The point at which the free option stops being the right call. */
  altBreaksAt?: string;
};

export type Archetype = {
  id: string;
  name: string;
  blurb: string;
  /** What one billable interaction is called. */
  unit: string;
  unitPlural: string;
  /** Typical tokens per unit, across the whole interaction. */
  inTokens: number;
  outTokens: number;
  /** Share of input that is stable enough to cache (system prompt, catalogue). */
  cacheableShare: number;
  /** Non-token cost per unit — audio minutes, image renders, and so on. */
  surcharge?: { label: string; usdPerUnit: number; note: string };
  layers: Layer[];
  gotchas: string[];
};

export const ARCHETYPES: Archetype[] = [
  {
    id: "support-chatbot",
    name: "Customer support chatbot",
    blurb: "Answers questions about orders, products and policy, with tool access to your own data.",
    unit: "conversation",
    unitPlural: "conversations",
    inTokens: 15000,
    outTokens: 1200,
    cacheableShare: 0.6,
    layers: [
      { role: "Chat model", pick: "Budget tier", why: "Support chat is retrieval plus tool calls plus a polite sentence. The reasoning lives in your tool design, not the model." },
      { role: "Retrieval", pick: "pgvector in Postgres", why: "A catalogue is 10k–200k items. You are two orders of magnitude below where a dedicated vector DB pays off.", freeAlt: "pgvector", altBreaksAt: "~10M vectors" },
      { role: "Embeddings", pick: "text-embedding-3-small", why: "Embedding an entire catalogue costs a couple of dollars. This line never matters." },
      { role: "Auth + DB", pick: "Supabase Pro", why: "Free tier pauses after 7 days idle, which is disqualifying for anything customer-facing." },
      { role: "Hosting", pick: "Vercel Pro", why: "Hobby forbids commercial use, and a support bot on a storefront is commercial." },
      { role: "Tracing", pick: "Langfuse self-hosted", why: "Without traces you cannot tell whether the bot invented a refund policy.", freeAlt: "Langfuse", altBreaksAt: "team size, not volume" }
    ],
    gotchas: [
      "Never let the model state stock, price or refund eligibility from memory — make every one of those a tool call against your own database.",
      "Conversation history is what makes cost grow non-linearly. Truncate aggressively or your 6-turn estimate becomes a 20-turn bill.",
      "Prompt caching is the single biggest lever here; the system prompt and catalogue context repeat on every turn."
    ]
  },
  {
    id: "rag-search",
    name: "Document / knowledge search",
    blurb: "Natural-language search across your own documents, with cited answers.",
    unit: "query",
    unitPlural: "queries",
    inTokens: 6000,
    outTokens: 600,
    cacheableShare: 0.35,
    layers: [
      { role: "Chat model", pick: "Budget tier", why: "Synthesis over retrieved chunks. Retrieval quality dominates the result far more than model choice." },
      { role: "Vector store", pick: "pgvector in Postgres", why: "Cheaper and simpler until roughly 10M vectors.", freeAlt: "pgvector", altBreaksAt: "~10M vectors, then Pinecone" },
      { role: "Embeddings", pick: "text-embedding-3-small", why: "Indexing is one-off; re-indexing on document change is the recurring cost." },
      { role: "Chunking", pick: "Semantic, 400–800 tokens", why: "The highest-leverage thing you will tune. Most bad RAG is bad chunking, not a bad model." },
      { role: "Hosting", pick: "Vercel Pro", why: "Commercial use." }
    ],
    gotchas: [
      "Citations are not optional — an uncited RAG answer is indistinguishable from a hallucination to the person reading it.",
      "Re-indexing cost scales with how often your documents change, not with how many you have.",
      "Measure retrieval separately from generation, or you will tune the wrong half for weeks."
    ]
  },
  {
    id: "image-gen",
    name: "Image generation product",
    blurb: "Generates or edits images from prompts — product shots, variations, creative assets.",
    unit: "image",
    unitPlural: "images",
    inTokens: 800,
    outTokens: 150,
    cacheableShare: 0.5,
    surcharge: { label: "Image render", usdPerUnit: 0.04, note: "Hosted render cost per image. Self-hosting FLUX on a rented GPU changes this to a fixed hourly cost." },
    layers: [
      { role: "Image model", pick: "Hosted API first", why: "GPU orchestration is a separate engineering project. Buy it until volume justifies owning it." },
      { role: "Prompt rewriting", pick: "Budget tier LLM", why: "Rewriting a user prompt into a good image prompt is worth far more than a bigger image model." },
      { role: "Storage + CDN", pick: "Supabase Storage", why: "Images are heavy. Egress, not generation, becomes the surprise line on your bill." },
      { role: "Moderation", pick: "Provider moderation endpoint", why: "Non-negotiable if users can type anything.", freeAlt: "Most providers include it" },
      { role: "Hosting", pick: "Vercel Pro", why: "Commercial use." }
    ],
    gotchas: [
      "Generation is slow enough that you need a job queue, not a request-response endpoint. This shapes your whole architecture.",
      "Storage and bandwidth usually overtake generation cost before you expect them to.",
      "Self-hosting FLUX flips you from per-image to per-GPU-hour, which only wins at sustained high volume — idle GPUs bill too."
    ]
  },
  {
    id: "voice-agent",
    name: "Voice agent / phone bot",
    blurb: "Takes or makes calls, understands speech, responds in a natural voice.",
    unit: "minute of call",
    unitPlural: "minutes of calls",
    inTokens: 4000,
    outTokens: 400,
    cacheableShare: 0.5,
    surcharge: { label: "Speech in + out", usdPerUnit: 0.07, note: "Combined speech-to-text and text-to-speech per minute. This dominates the LLM cost, often by 5x." },
    layers: [
      { role: "Speech to text", pick: "Hosted streaming STT", why: "Latency is the product. Batch transcription feels broken on a live call.", freeAlt: "Whisper self-hosted", altBreaksAt: "needs sub-300ms streaming" },
      { role: "Chat model", pick: "Budget tier", why: "Must respond in under a second. Smaller models win on latency, and latency beats eloquence here." },
      { role: "Text to speech", pick: "Hosted streaming TTS", why: "Voice quality is the thing users judge you on." },
      { role: "Telephony", pick: "Twilio or similar", why: "Per-minute carrier cost on top of everything else." },
      { role: "Hosting", pick: "Vercel Pro + a persistent worker", why: "Serverless alone cannot hold a websocket for a 10-minute call." }
    ],
    gotchas: [
      "The LLM is the cheap part. Speech in and out typically costs several times more per minute.",
      "Serverless functions time out mid-call — you need a long-lived process somewhere, which breaks the all-Vercel story.",
      "Interruption handling is most of the engineering work and none of the demo."
    ]
  },
  {
    id: "transcription",
    name: "Transcription & meeting notes",
    blurb: "Turns audio into text, then into summaries, actions and searchable records.",
    unit: "hour of audio",
    unitPlural: "hours of audio",
    inTokens: 12000,
    outTokens: 1500,
    cacheableShare: 0.3,
    surcharge: { label: "Transcription", usdPerUnit: 0.36, note: "Hosted STT per audio hour. Self-hosted Whisper trades this for GPU time." },
    layers: [
      { role: "Transcription", pick: "Hosted STT, or self-hosted Whisper", why: "The only decision that moves the bill. Everything else is rounding.", freeAlt: "Whisper self-hosted", altBreaksAt: "~50k minutes/month, where GPU cost beats per-minute pricing" },
      { role: "Summarisation", pick: "Budget tier", why: "Summarising a transcript is easy work. Do not overpay for it." },
      { role: "Storage", pick: "Supabase Storage", why: "Audio files are large and you will be asked to retain them." },
      { role: "Search", pick: "pgvector", why: "Semantic search over transcripts is the feature people actually return for." },
      { role: "Hosting", pick: "Vercel Pro", why: "Commercial use." }
    ],
    gotchas: [
      "Batch transcription is far cheaper than streaming. Only pay for streaming if users watch it appear live.",
      "Recording consent is a legal requirement in many jurisdictions — this is a product decision, not a settings toggle.",
      "Diarisation (who said what) is what makes notes useful and is often priced separately."
    ]
  },
  {
    id: "content-gen",
    name: "Bulk content generation",
    blurb: "Produces descriptions, listings, posts or variants at scale from structured input.",
    unit: "piece",
    unitPlural: "pieces",
    inTokens: 2000,
    outTokens: 3000,
    cacheableShare: 0.55,
    layers: [
      { role: "Generation model", pick: "Balanced tier", why: "Output quality is the product here, and output tokens dominate the bill — this is the one archetype where paying more is defensible." },
      { role: "Batch API", pick: "Yes, if you can wait", why: "Halves every rate. Bulk generation is almost never latency-sensitive." },
      { role: "Review queue", pick: "Human-in-the-loop UI", why: "Publishing unreviewed generated copy is how brands end up in screenshots." },
      { role: "Storage", pick: "Supabase Postgres", why: "Version every generation; you will need to roll one back." },
      { role: "Hosting", pick: "Vercel Pro", why: "Commercial use." }
    ],
    gotchas: [
      "Output-heavy workloads invert the usual maths — output tokens are 8–10x input, so output rate is the number that matters.",
      "The batch API halves cost for work nobody is waiting on. Most bulk generation qualifies.",
      "Generated copy at scale is an SEO liability if it is thin. Volume is not the goal."
    ]
  },
  {
    id: "workflow-agent",
    name: "Autonomous workflow agent",
    blurb: "Plans and executes multi-step tasks against real tools and APIs.",
    unit: "task run",
    unitPlural: "task runs",
    inTokens: 45000,
    outTokens: 4000,
    cacheableShare: 0.5,
    layers: [
      { role: "Reasoning model", pick: "Balanced or premium tier", why: "The only archetype where model quality genuinely decides whether it works. A cheap model loops and fails." },
      { role: "Tool layer", pick: "MCP or typed function calls", why: "Agent reliability is mostly tool design — narrow, well-described tools beat clever prompts." },
      { role: "State", pick: "Supabase Postgres", why: "Runs are long and fail midway. Without durable state you cannot resume." },
      { role: "Tracing", pick: "Langfuse self-hosted", why: "Non-negotiable. An untraced agent failure is unfixable.", freeAlt: "Langfuse" },
      { role: "Hosting", pick: "Vercel Pro + a worker", why: "Multi-minute runs exceed serverless timeouts." }
    ],
    gotchas: [
      "Token use per run is wildly variable — a looping agent can cost 10x your estimate. Hard-cap steps and spend per run.",
      "This is the archetype where cheap models are a false economy; a failed run costs more than the tokens you saved.",
      "Give it a dry-run mode before you let it touch anything that writes."
    ]
  },
  {
    id: "semantic-rec",
    name: "Semantic search & recommendations",
    blurb: "Finds and ranks items by meaning rather than keywords — products, content, people.",
    unit: "1,000 searches",
    unitPlural: "thousand searches",
    inTokens: 1500,
    outTokens: 200,
    cacheableShare: 0.4,
    layers: [
      { role: "Embeddings", pick: "text-embedding-3-small", why: "Almost all the work. The LLM is optional here." },
      { role: "Vector store", pick: "pgvector in Postgres", why: "Catalogue-scale data sits comfortably inside Postgres.", freeAlt: "pgvector", altBreaksAt: "~10M vectors" },
      { role: "Re-ranking", pick: "Budget tier LLM, top 20 only", why: "Re-rank a shortlist, never the whole index. This keeps cost flat as the catalogue grows." },
      { role: "Caching", pick: "Cache popular queries", why: "Search traffic is extremely head-heavy; caching the top queries removes most of the bill." },
      { role: "Hosting", pick: "Vercel Pro", why: "Commercial use." }
    ],
    gotchas: [
      "Hybrid search (keyword + vector) beats pure vector almost every time. Pure semantic search fails on exact SKUs and names.",
      "Re-embedding the catalogue on every change is the cost that creeps up on you, not query volume.",
      "Cache aggressively — a small set of queries will be most of your traffic."
    ]
  }
];

export function archetypeById(id: string): Archetype | undefined {
  return ARCHETYPES.find(a => a.id === id);
}

export type CostBreakdown = {
  perUnit: number;
  monthlyModel: number;
  monthlySurcharge: number;
  monthlyTotalVariable: number;
};

/**
 * All money is computed here. Deterministic, auditable, no model involved.
 */
export function computeCost(a: Archetype, m: ChatModel, unitsPerMonth: number): CostBreakdown {
  const cachedIn = a.inTokens * a.cacheableShare;
  const freshIn = a.inTokens - cachedIn;
  // Where a vendor publishes no cached rate, assume the common ~90% discount.
  const cachedRate = m.cachedInPerM ?? m.inPerM * 0.1;

  const modelPerUnit =
    (freshIn / 1_000_000) * m.inPerM +
    (cachedIn / 1_000_000) * cachedRate +
    (a.outTokens / 1_000_000) * m.outPerM;

  const surchargePerUnit = a.surcharge?.usdPerUnit ?? 0;

  return {
    perUnit: modelPerUnit + surchargePerUnit,
    monthlyModel: modelPerUnit * unitsPerMonth,
    monthlySurcharge: surchargePerUnit * unitsPerMonth,
    monthlyTotalVariable: (modelPerUnit + surchargePerUnit) * unitsPerMonth
  };
}

/**
 * The volume at which variable cost overtakes fixed infrastructure — i.e. the
 * point where it starts being worth optimising the model at all. Below it,
 * model choice is noise and you should simply use the better one.
 */
export function crossoverUnits(perUnit: number, fixedMonthly: number): number | null {
  if (perUnit <= 0) return null;
  return Math.round(fixedMonthly / perUnit);
}
