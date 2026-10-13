import { createClient } from "@/lib/supabase/server";
import { anthropic, MODEL } from "@/lib/anthropic";
import { NextResponse } from "next/server";
import {
  ARCHETYPES,
  archetypeById,
  computeCost,
  crossoverUnits
} from "@/lib/archetypes";
import {
  CHAT_MODELS,
  FIXED_SERVICES,
  PRICES_VERIFIED_AT,
  priceCardIsStale,
  priceCardAgeDays,
  type ChatModel
} from "@/lib/stack-pricing";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Build a recommended stack for a described product.
 *
 * The model does exactly two things: choose an archetype, and write the
 * industry-specific caveats. Prices come from the curated card and every total
 * is computed in lib/archetypes.ts. If the model returns an archetype id that
 * doesn't exist we fall back rather than inventing one — a wrong-but-real
 * archetype is recoverable, a hallucinated stack is not.
 */

const SYSTEM = `You are Fomora's build advisor. You will be given a product description, an expected monthly volume, and an industry.

Your ONLY job is to classify and contextualise. You must NOT invent prices, model names, or cost figures — those are computed elsewhere from a verified price card.

Return ONLY this JSON object, no prose and no markdown fences:
{
  "archetype_id": "<exactly one id from the list provided>",
  "confidence": "high" | "medium" | "low",
  "restated": "<one sentence restating what they're building, max 18 words>",
  "industry_notes": ["<up to 3 constraints that this INDUSTRY imposes — compliance, data residency, latency, accuracy bar>"],
  "first_risk": "<the single thing most likely to go wrong in this build, one sentence>"
}

Rules:
- archetype_id MUST be one of the supplied ids. If nothing fits well, pick the closest and set confidence to "low".
- industry_notes must be specific to the named industry. Healthcare implies HIPAA and audit trails; fintech implies PCI and explainability; EU implies GDPR and data residency. If the industry imposes nothing unusual, return an empty array rather than padding it.
- first_risk is about THIS build, not generic AI advice.`;

type ModelReply = {
  archetype_id?: string;
  confidence?: string;
  restated?: string;
  industry_notes?: string[];
  first_risk?: string;
};

function pickTier(models: ChatModel[], tier: ChatModel["tier"]): ChatModel {
  return models.find(m => m.tier === tier) ?? models[0];
}

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const description = String(body.description ?? "").trim();
    const industry = String(body.industry ?? "").trim() || "General";
    const unitsPerMonth = Math.max(0, Number(body.unitsPerMonth) || 0);

    if (!description) {
      return NextResponse.json({ error: "Describe what you want to build." }, { status: 400 });
    }

    const catalogue = ARCHETYPES
      .map(a => `- ${a.id}: ${a.name} — ${a.blurb}`)
      .join("\n");

    let reply: ModelReply = {};
    try {
      const res = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 900,
        system: SYSTEM,
        messages: [{
          role: "user",
          content: `AVAILABLE ARCHETYPES:\n${catalogue}\n\nPRODUCT: ${description}\nINDUSTRY: ${industry}\nEXPECTED VOLUME: ${unitsPerMonth.toLocaleString()} per month`
        }]
      });
      const text = res.content.find(c => c.type === "text");
      const raw = text && text.type === "text" ? text.text : "";
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start !== -1 && end > start) reply = JSON.parse(raw.slice(start, end + 1));
    } catch (e) {
      console.error("[build-stack] classification failed", e);
      // Fall through — a stack from the default archetype still beats an error page.
    }

    const archetype = archetypeById(reply.archetype_id ?? "") ?? ARCHETYPES[0];
    const matched = !!archetypeById(reply.archetype_id ?? "");

    // ── Everything below is deterministic ──
    const tiers = (["budget", "balanced", "premium"] as const).map(tier => {
      const model = pickTier(CHAT_MODELS, tier);
      const cost = computeCost(archetype, model, unitsPerMonth);
      return { tier, model, cost };
    });

    const fixed = [
      FIXED_SERVICES.find(s => s.id === "supabase-pro")!,
      FIXED_SERVICES.find(s => s.id === "vercel-pro")!,
      FIXED_SERVICES.find(s => s.id === "langfuse-self")!
    ];
    const fixedMonthly = fixed.reduce((sum, s) => sum + s.monthly, 0);

    // The crossover is tier-specific, not a single point: the dearest model
    // overtakes the infrastructure floor long before the cheapest one does.
    // Reporting only the budget figure overstated how long model choice stays
    // irrelevant — the chart made that obvious. So we report the band.
    const crossoverLow = crossoverUnits(tiers[2].cost.perUnit, fixedMonthly);  // premium
    const crossoverHigh = crossoverUnits(tiers[0].cost.perUnit, fixedMonthly); // budget

    return NextResponse.json({
      ok: true,
      archetype: {
        id: archetype.id,
        name: archetype.name,
        blurb: archetype.blurb,
        unit: archetype.unit,
        unitPlural: archetype.unitPlural,
        layers: archetype.layers,
        gotchas: archetype.gotchas,
        surcharge: archetype.surcharge ?? null,
        inTokens: archetype.inTokens,
        outTokens: archetype.outTokens
      },
      matched,
      confidence: matched ? (reply.confidence ?? "medium") : "low",
      restated: reply.restated ?? description.slice(0, 120),
      industryNotes: Array.isArray(reply.industry_notes) ? reply.industry_notes.slice(0, 3) : [],
      firstRisk: reply.first_risk ?? null,
      unitsPerMonth,
      tiers: tiers.map(t => ({
        tier: t.tier,
        model: t.model,
        perUnit: t.cost.perUnit,
        monthlyModel: t.cost.monthlyModel,
        monthlySurcharge: t.cost.monthlySurcharge,
        monthlyVariable: t.cost.monthlyTotalVariable,
        monthlyAllIn: t.cost.monthlyTotalVariable + fixedMonthly
      })),
      fixed,
      fixedMonthly,
      crossoverLow,
      crossoverHigh,
      prices: {
        verifiedAt: PRICES_VERIFIED_AT,
        ageDays: priceCardAgeDays(),
        stale: priceCardIsStale()
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[build-stack]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
