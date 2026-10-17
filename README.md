# Fomora

The AI launch analyzer. Pastes a URL or tweet → returns a personalized FOMO Score (0–100). Plus a Duolingo-style daily Radar feed of the launches you should actually care about.

**Stack:** Next.js 14 (App Router) · Supabase (Postgres + magic-link auth + RLS) · Anthropic Claude Haiku · Vercel.

**Cost at MVP scale:** $0–3/month. Vercel and Supabase free tiers cover everything except the LLM calls (Anthropic, ~$0.003 per analysis).

---

## What's in the box

```
fomora-app/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts         POST URL or text → FOMO analysis
│   │   └── cron/refresh-radar/      Daily Vercel cron (06:00 UTC)
│   ├── auth/callback/route.ts       Magic-link handler
│   ├── login/page.tsx               Landing page + email OTP sign-in
│   ├── onboarding/page.tsx          3-question Duolingo-style flow
│   ├── analyze/page.tsx             Paste URL → see analysis
│   ├── saved/page.tsx               Library of saved launches
│   ├── profile/page.tsx             Profile, stats, redo onboarding
│   ├── page.tsx                     Radar (home)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── BrandHeader.tsx              Top nav with streak/hearts/XP
│   ├── BottomNav.tsx                Radar / Analyze / Saved / Profile
│   └── FomoraMascot.tsx             SVG parrot, two sizes
├── lib/
│   ├── supabase/                    Browser, server, middleware clients
│   ├── anthropic.ts                 Claude SDK config
│   ├── scoring.ts                   FOMO scoring + system prompt
│   ├── launch-fetcher.ts            URL → text scraper
│   └── types.ts                     Shared types + onboarding option lists
├── supabase/
│   ├── migrations/001_initial_schema.sql
│   └── seed.sql                     10 hand-picked starter launches
├── middleware.ts                    Session refresh only (page-level auth checks)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
├── postcss.config.mjs
├── vercel.json                      Cron schedule
└── .env.example
```

---

## Setup (45 minutes, end to end)

### 1. Local install

```bash
cd fomora-app
npm install
cp .env.example .env.local
```

### 2. Create a Supabase project

1. Sign up at [supabase.com](https://supabase.com). Free, no card.
2. **New Project** → pick the region closest to you. Wait ~2 min.
3. **SQL Editor** → New query → paste the contents of `supabase/migrations/001_initial_schema.sql` → Run.
4. Same editor → paste `supabase/seed.sql` → Run. (Seeds 10 launches so the Radar isn't empty.)
5. **Authentication → Providers** → Email provider should be enabled by default. That's all you need for magic link.
6. **Authentication → URL Configuration** → set Site URL to `http://localhost:3000` for now. Add `https://your-app.vercel.app` later.
7. **Project Settings → API** → copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` *(server-only, never expose)*

### 3. Get an Anthropic API key

1. Sign up at [console.anthropic.com](https://console.anthropic.com).
2. **Settings → Billing** → add $5 of credit (lasts months at MVP scale).
3. **Settings → API Keys** → Create Key → copy into `.env.local` as `ANTHROPIC_API_KEY`.

### 4. Generate a cron secret

Pick any long random string and set it as `CRON_SECRET`. macOS:
```bash
openssl rand -hex 32
```

### 5. Run it

```bash
npm run dev
```

Open http://localhost:3000 → email OTP sign-in → onboarding → Radar.

---

## Deploy to Vercel

```bash
git init && git add . && git commit -m "init"
gh repo create fomora --public --source=.
git push -u origin main
```

1. Go to [vercel.com](https://vercel.com) → **Import Project** → pick your GitHub repo.
2. **Environment Variables** → add every entry from your `.env.local`. Set `NEXT_PUBLIC_SITE_URL` to your future Vercel URL (`https://fomora-xxx.vercel.app`).
3. Click **Deploy**. Live in ~90 seconds.
4. Back in Supabase → **Authentication → URL Configuration** → add your Vercel URL to Site URL and Redirect URLs.
5. Vercel cron auto-triggers daily based on `vercel.json` — make sure `CRON_SECRET` is set in Vercel's env vars.

---

## How the FOMO score works

The system prompt in `lib/scoring.ts` instructs Claude Haiku to weight five inputs:

| Factor | Weight | What it measures |
|--------|--------|------------------|
| User Relevance | 40% | Match between user's role/tools/interests and the launch |
| Market Momentum | 25% | Adoption velocity, GitHub stars, viral signals |
| Industry Impact | 15% | Does this reshape the user's industry specifically |
| Viral Adoption | 10% | Real product usage vs. demo theater |
| Early Opportunity | 10% | Reward being early to a real trend |

The model returns structured JSON: score, verdict, why_you, time_to_learn, signal_badge, velocity, actions, risks, ignore_if. Same launch → 95 for a coding-PM, 38 for a non-technical marketer.

---

## What's stubbed vs. shipped

**Shipped:**
- Email OTP auth end-to-end (Gmail SMTP relay)
- Onboarding writes to `profiles` (3 questions)
- `/api/analyze` calls Claude and persists per-user analysis to `user_launches`
- Radar home reads launches + user's personalized scores, falls back to global momentum
- Saved library, Profile with stats and tag editing
- Auth gating. Note: `middleware.ts` only refreshes the session; the
  logged-out and no-profile redirects are done per page (see `app/page.tsx`).
- Row-level security on every per-user table
- Vercel cron config (`0 6 * * *`, verified firing)
- The crawler: Hacker News, Product Hunt (Atom) and Hugging Face, with noise
  filters and model-family dedupe (`lib/crawler.ts`)
- Build tab: stack recommendations costed from a curated price card
- SSRF guard on user-supplied URLs (`lib/safe-fetch.ts`, see
  `scripts/check-ssrf-guard.mts`)

**Still stubbed:**
- Streak + XP increments. Schema is there, but nothing writes to `user_stats`,
  so both always render 0.
- Achievements. `user_achievements` exists, no unlock logic.
- Velocity snapshots. `launches.velocity` is set once at crawl time and never
  re-measured, so "Exploding"/"Cooling" never changes. This cannot be
  backfilled: every day without snapshots is history that is simply gone.
- The Saved page tabs do not filter.
- Push notifications and the daily digest email.

---

## Cost optimization (when you scale past free)

The single biggest lever: **don't recompute FOMO scores per individual user**. Cluster users into segments (e.g. "SaaS PM into AI Coding + Agents") and cache the scoring per segment. 100 similar users = 1 LLM call.

Other levers:
- Cache `fetchLaunchContent` results in Supabase (`launches.raw_content`). Known
  URLs already short-circuit; unknown ones are fetched once and stored.
- Switch low-stakes scoring to Haiku, save Sonnet for "deep dive" buttons.
- Move to Cloudflare Workers AI's free Llama 3.1 8B tier if you must hit $0. Quality drops noticeably.

---

## License

MIT. Build something with it.
