// Shared TypeScript types — mirrors the Supabase schema.

export type Profile = {
  id: string;
  email: string | null;
  name: string | null;
  role: string | null;
  industry: string | null;
  depth: string | null;
  interests: string[] | null;
  tools: string[] | null;
  goals: string[] | null;
  time_pref: string | null;
  daily_goal: number;
  created_at: string;
};

export type Launch = {
  id: string;
  url: string;
  name: string;
  source: string | null;
  category: string | null;
  description: string | null;
  raw_content: string | null;
  velocity: 'Exploding' | 'Heating up' | 'Steady' | 'Cooling' | null;
  signal_badge: 'Paradigm Shift' | 'High Signal' | 'Emerging' | 'Hype' | null;
  base_momentum: number | null;
  published_at: string | null;
  created_at: string;
};

export type FomoAnalysis = {
  fomo_score: number;
  verdict: string;
  why_you: string;
  time_to_learn: string;
  signal_badge: 'Paradigm Shift' | 'High Signal' | 'Emerging' | 'Hype';
  velocity: 'Exploding' | 'Heating up' | 'Steady' | 'Cooling';
  actions: string[];
  risks: string[];
  ignore_if: string;
};

export type UserLaunch = {
  id: string;
  user_id: string;
  launch_id: string;
  fomo_score: number | null;
  status: 'unseen' | 'viewed' | 'saved' | 'skipped' | 'acted_on';
  ai_analysis: FomoAnalysis | null;
  saved_at: string | null;
  acted_on_at: string | null;
  created_at: string;
};

export type LaunchWithScore = Launch & { fomo_score?: number; status?: string };

export const ROLES = ['Product Manager', 'Founder / CEO', 'Engineer', 'Designer', 'ML Researcher', 'Marketer', 'Finance Professional', 'Investor / VC', 'Student', 'Curious'] as const;
export const INDUSTRIES = ['SaaS', 'Fintech', 'Design', 'Healthcare', 'E-commerce', 'Education', 'AI / ML', 'Other'] as const;
export const DEPTHS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;
export const INTERESTS = ['AI Coding', 'Agents', 'Video AI', 'Voice AI', 'Image AI', 'Infra / MCP', 'Productivity', 'Search', 'Open Source'] as const;
export const TOOLS = ['Cursor', 'Claude', 'ChatGPT', 'Copilot', 'Notion AI', 'Linear', 'Figma AI', 'Perplexity', 'Lovable'] as const;
export const GOALS = ['Career growth', 'Build a startup', 'Stay informed', 'Create content', 'Ship faster', 'Invest / scout'] as const;
export const TIME_PREFS = ['Casual', 'Daily', 'Deep'] as const;
