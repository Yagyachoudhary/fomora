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
  // "Open & Free" layer
  pricing: 'open-source' | 'free' | 'freemium' | 'paid' | 'unknown' | null;
  license: string | null;
  runs_locally: boolean | null;
  languages: string[] | null;
  free_alternative_to: string | null;
  hardware_note: string | null;
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

export const ROLES = [
  // Product & business
  'Product Manager', 'Founder / CEO', 'Marketer', 'Growth / Ops',
  'Finance Professional', 'Investor / VC', 'Consultant',
  // Technical
  'Engineer', 'Data / Analytics', 'ML Researcher',
  // Creative
  'Designer', 'Visual Artist', 'Illustrator', 'Photographer',
  'Filmmaker / Video', 'Musician / Audio', 'Writer', 'Content Creator',
  'Architect / 3D',
  // Other
  'Educator', 'Student', 'Curious'
] as const;

export const INDUSTRIES = [
  'SaaS', 'Fintech', 'E-commerce', 'Healthcare', 'Education',
  'Media & Publishing', 'Advertising', 'Film & TV', 'Music',
  'Gaming', 'Design Studio', 'Art & Illustration', 'Architecture',
  'Consulting', 'Retail', 'Manufacturing', 'Non-profit', 'AI / ML', 'Other'
] as const;

export const DEPTHS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;

export const INTERESTS = [
  // Creative
  'Image AI', 'Video AI', '3D & Animation', 'Music & Audio AI',
  'Design Tools', 'Writing AI', 'Voice AI',
  // Technical
  'AI Coding', 'Agents', 'Infra / MCP', 'Open Source', 'AI Research',
  // Applied
  'Productivity', 'Search', 'Marketing AI', 'Data & Analytics'
] as const;

export const TOOLS = [
  // Creative
  'Midjourney', 'Adobe Firefly', 'Photoshop', 'Runway', 'Sora',
  'ElevenLabs', 'Suno', 'Canva', 'Blender', 'Descript', 'Figma',
  // General assistants
  'ChatGPT', 'Claude', 'Gemini', 'Perplexity', 'Notion AI',
  // Developer
  'Cursor', 'Copilot', 'Lovable', 'Linear'
] as const;

export const GOALS = [
  'Career growth', 'Build a startup', 'Stay informed', 'Create content',
  'Ship faster', 'Improve my craft', 'Find new clients', 'Invest / scout'
] as const;

export const TIME_PREFS = ['Casual', 'Daily', 'Deep'] as const;
