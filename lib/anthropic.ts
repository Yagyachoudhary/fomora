import Anthropic from "@anthropic-ai/sdk";

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("[anthropic] ANTHROPIC_API_KEY is not set");
}

// Identity-linked API keys require an explicit workspace header. Workspace-scoped
// keys don't. Sending the header when we have one works for both, so this is safe
// either way.
const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID?.trim();

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
  ...(workspaceId
    ? { defaultHeaders: { "anthropic-workspace-id": workspaceId } }
    : {})
});

// Haiku is the cheap workhorse. Swap for sonnet if you want better judgment per call.
export const MODEL = "claude-haiku-4-5-20251001";
