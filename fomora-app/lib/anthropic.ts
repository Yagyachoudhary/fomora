import Anthropic from "@anthropic-ai/sdk";

if (!process.env.ANTHROPIC_API_KEY) {
  // Don't throw at import time in dev — let the API route surface the error.
  console.warn("[anthropic] ANTHROPIC_API_KEY is not set");
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? ""
});

// Haiku is the cheap workhorse. Swap for sonnet if you want better judgment per call.
export const MODEL = "claude-haiku-4-5-20251001";
