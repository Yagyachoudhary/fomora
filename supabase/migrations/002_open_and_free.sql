-- Fomora — "Open & Free" layer
-- Adds the fields needed to answer: "is there a free/open way to do this?"
-- Run in Supabase SQL Editor after 001_initial_schema.sql

alter table launches add column if not exists pricing text;
-- 'open-source' | 'free' | 'freemium' | 'paid' | 'unknown'

alter table launches add column if not exists license text;
-- 'MIT', 'Apache-2.0', 'CC-BY-NC', 'Proprietary', etc.

alter table launches add column if not exists runs_locally boolean default false;
-- can a normal person run this on their own machine?

alter table launches add column if not exists languages text[];
-- ['English','Hindi','Tamil'] — for language-specific models

alter table launches add column if not exists free_alternative_to text;
-- 'ElevenLabs' — the paid product this replaces. This is the headline feature.

alter table launches add column if not exists hardware_note text;
-- 'Runs on 8GB VRAM' / 'CPU only' / 'Needs 24GB VRAM'

create index if not exists launches_pricing_idx on launches (pricing);
create index if not exists launches_local_idx on launches (runs_locally);

-- Backfill: everything already in the table is assumed commercial unless we know better.
update launches set pricing = 'paid' where pricing is null;
