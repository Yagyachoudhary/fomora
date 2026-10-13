/**
 * Curated price card for the Build feature.
 *
 * WHY THIS FILE EXISTS AS DATA, NOT A PROMPT
 * Asking a model to recall API prices produces confident, wrong numbers — it
 * quotes models that have been retired and rates that moved months ago. Asking
 * the web produces contradictions: when this file was first written, one source
 * had GPT-5 mini at $0.25/M input and another at $0.125, and Claude Haiku was
 * quoted at both $1/$5 and $0.10/$0.50 on the same day.
 *
 * So the numbers live here, by hand, with a date attached. The UI shows that
 * date. A stale price the user can see is honest; a stale price hidden behind a
 * confident answer is the failure mode this whole feature has to avoid.
 *
 * MAINTENANCE: re-check the vendor pricing pages monthly and bump
 * PRICES_VERIFIED_AT. If that date is more than ~6 weeks old the UI says so.
 * Anything marked `disputed` had sources disagree — verify before quoting it.
 */

export const PRICES_VERIFIED_AT = "2026-10-13";

/** Weeks after which the UI starts warning that the card needs a refresh. */
export const STALE_AFTER_DAYS = 45;

export type ChatModel = {
  id: string;
  name: string;
  vendor: string;
  tier: "budget" | "balanced" | "premium";
  /** USD per million input tokens. */
  inPerM: number;
  /** USD per million output tokens. */
  outPerM: number;
  /** USD per million cached input tokens, where published. */
  cachedInPerM?: number;
  note?: string;
  /** Sources disagreed on this rate — surface a warning next to it. */
  disputed?: boolean;
};

export const CHAT_MODELS: ChatModel[] = [
  {
    id: "gpt-5-nano",
    name: "GPT-5 nano",
    vendor: "OpenAI",
    tier: "budget",
    inPerM: 0.05,
    outPerM: 0.4,
    cachedInPerM: 0.005,
    note: "Cheapest credible option for retrieval-and-respond work."
  },
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash-Lite",
    vendor: "Google",
    tier: "budget",
    inPerM: 0.1,
    outPerM: 0.4,
    note: "Comparable to GPT-5 nano. Has a free tier for prototyping."
  },
  {
    id: "claude-haiku-5-5",
    name: "Claude Haiku 5.5",
    vendor: "Anthropic",
    tier: "budget",
    inPerM: 0.1,
    outPerM: 0.5,
    disputed: true,
    note: "Rate applies to prompts under 100k tokens; rises to $0.50/$2.50 above that."
  },
  {
    id: "gpt-5-mini",
    name: "GPT-5 mini",
    vendor: "OpenAI",
    tier: "balanced",
    inPerM: 0.25,
    outPerM: 2.0,
    cachedInPerM: 0.025,
    disputed: true,
    note: "One aggregator quoted half this. Verify before committing at volume."
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    vendor: "Google",
    tier: "balanced",
    inPerM: 0.3,
    outPerM: 2.5,
    note: "Consistent across every source checked — the most reliable number here."
  },
  {
    id: "gpt-5-4-nano",
    name: "GPT-5.4 nano",
    vendor: "OpenAI",
    tier: "balanced",
    inPerM: 0.2,
    outPerM: 1.25
  },
  {
    id: "gemini-3-8-flash",
    name: "Gemini 3.8 Flash",
    vendor: "Google",
    tier: "premium",
    inPerM: 0.75,
    outPerM: 3.75,
    note: "Introductory rate. Doubles to $1.50/$7.50 on 1 Jan 2027 — do not build a margin on this."
  },
  {
    id: "gpt-5-4-mini",
    name: "GPT-5.4 mini",
    vendor: "OpenAI",
    tier: "premium",
    inPerM: 0.75,
    outPerM: 4.5
  },
  {
    id: "claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    vendor: "Anthropic",
    tier: "premium",
    inPerM: 1.0,
    outPerM: 5.0,
    note: "Batch API halves both rates if you can tolerate async."
  }
];

export type EmbedModel = { id: string; name: string; vendor: string; perM: number; note?: string };

export const EMBED_MODELS: EmbedModel[] = [
  { id: "text-embedding-3-small", name: "text-embedding-3-small", vendor: "OpenAI", perM: 0.02, note: "Batch API is half price." },
  { id: "text-embedding-3-large", name: "text-embedding-3-large", vendor: "OpenAI", perM: 0.13, note: "Rarely worth 6.5x for product catalogues." }
];

export type FixedService = {
  id: string;
  name: string;
  role: string;
  monthly: number;
  /** Per seat rather than per project. */
  perSeat?: boolean;
  note?: string;
  /** Something that will bite you if you don't read it. */
  warning?: string;
};

export const FIXED_SERVICES: FixedService[] = [
  {
    id: "supabase-free",
    name: "Supabase Free",
    role: "Auth + Postgres + pgvector",
    monthly: 0,
    warning: "Projects pause after 7 days idle. Fine for prototypes, not for anything with real users."
  },
  {
    id: "supabase-pro",
    name: "Supabase Pro",
    role: "Auth + Postgres + pgvector",
    monthly: 25,
    note: "Includes $10 compute credit. Most small apps land at $35–75/mo once usage is counted."
  },
  {
    id: "vercel-hobby",
    name: "Vercel Hobby",
    role: "Hosting",
    monthly: 0,
    warning: "Non-commercial use only. If you charge for the product, you need Pro."
  },
  {
    id: "vercel-pro",
    name: "Vercel Pro",
    role: "Hosting",
    monthly: 20,
    perSeat: true,
    note: "Per seat, each with $20 usage credit. Overage meters, not seats, drive most real bills."
  },
  {
    id: "pinecone-builder",
    name: "Pinecone Builder",
    role: "Vector store",
    monthly: 20,
    note: "Only worth it past roughly 10M vectors — below that pgvector on Postgres you already pay for wins."
  },
  {
    id: "langfuse-self",
    name: "Langfuse (self-hosted)",
    role: "Tracing + eval",
    monthly: 0,
    note: "Open source. Without tracing you cannot tell whether your bot is lying to customers."
  }
];

export function modelById(id: string): ChatModel | undefined {
  return CHAT_MODELS.find(m => m.id === id);
}

export function serviceById(id: string): FixedService | undefined {
  return FIXED_SERVICES.find(s => s.id === id);
}

export function priceCardAgeDays(now = new Date()): number {
  const verified = new Date(`${PRICES_VERIFIED_AT}T00:00:00Z`);
  return Math.floor((now.getTime() - verified.getTime()) / 86_400_000);
}

export function priceCardIsStale(now = new Date()): boolean {
  return priceCardAgeDays(now) > STALE_AFTER_DAYS;
}
