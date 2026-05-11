-- Fomora initial schema
-- Run in Supabase SQL editor (or `supabase db push` if using the CLI).

-- ── PROFILES ──────────────────────────────────────────────
create table if not exists profiles (
  id           uuid primary key references auth.users on delete cascade,
  email        text,
  name         text,
  role         text,
  industry     text,
  depth        text,
  interests    text[],
  tools        text[],
  goals        text[],
  time_pref    text,
  daily_goal   int  default 3,
  created_at   timestamptz default now()
);

-- ── LAUNCHES (global feed populated by crawler) ──────────
create table if not exists launches (
  id            uuid primary key default gen_random_uuid(),
  url           text unique not null,
  name          text not null,
  source        text,
  category      text,
  description   text,
  raw_content   text,
  velocity      text,
  signal_badge  text,
  base_momentum int,
  published_at  timestamptz,
  created_at    timestamptz default now()
);
create index if not exists launches_created_idx on launches (created_at desc);
create index if not exists launches_category_idx on launches (category);

-- ── PER-USER FOMO SCORES + INTERACTIONS ──────────────────
create table if not exists user_launches (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id) on delete cascade,
  launch_id    uuid references launches(id) on delete cascade,
  fomo_score   int,
  status       text default 'unseen',  -- unseen | viewed | saved | skipped | acted_on
  ai_analysis  jsonb,
  saved_at     timestamptz,
  acted_on_at  timestamptz,
  created_at   timestamptz default now(),
  unique (user_id, launch_id)
);
create index if not exists user_launches_user_score_idx
  on user_launches (user_id, fomo_score desc);

-- ── STREAKS + XP ─────────────────────────────────────────
create table if not exists user_stats (
  user_id           uuid primary key references profiles(id) on delete cascade,
  streak_current    int default 0,
  streak_longest    int default 0,
  streak_freezes    int default 2,
  last_activity_date date,
  xp_total          int default 0,
  xp_this_season    int default 0
);

-- ── DAILY ACTIVITY LOG ───────────────────────────────────
create table if not exists user_daily (
  user_id             uuid references profiles(id) on delete cascade,
  date                date,
  launches_reviewed   int default 0,
  goal_hit            boolean default false,
  primary key (user_id, date)
);

-- ── ACHIEVEMENTS ─────────────────────────────────────────
create table if not exists user_achievements (
  user_id         uuid references profiles(id) on delete cascade,
  achievement_key text,
  unlocked_at     timestamptz default now(),
  primary key (user_id, achievement_key)
);

-- ── ROW LEVEL SECURITY ───────────────────────────────────
alter table profiles          enable row level security;
alter table user_launches     enable row level security;
alter table user_stats        enable row level security;
alter table user_daily        enable row level security;
alter table user_achievements enable row level security;
alter table launches          enable row level security;

create policy "users see own profile"      on profiles          for all using (auth.uid() = id);
create policy "users see own user_launches" on user_launches    for all using (auth.uid() = user_id);
create policy "users see own stats"        on user_stats        for all using (auth.uid() = user_id);
create policy "users see own daily"        on user_daily        for all using (auth.uid() = user_id);
create policy "users see own achievements" on user_achievements for all using (auth.uid() = user_id);

-- launches are world-readable (everyone sees the same global feed)
create policy "launches public read" on launches for select using (true);
-- only service role writes to launches (the crawler)

-- ── HELPER: auto-create profile on signup ────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email) values (new.id, new.email);
  insert into user_stats (user_id) values (new.id);
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
