-- Fomora — score feedback
-- "Was this score right?" is the only way to know whether the scoring model is
-- any good. Direction matters more than a thumbs up/down: knowing a score was
-- TOO LOW vs TOO HIGH is what lets you actually recalibrate.

alter table user_launches add column if not exists score_feedback text;
-- 'too_low' | 'about_right' | 'too_high'

alter table user_launches add column if not exists score_feedback_at timestamptz;

-- The score at the moment feedback was given, so later re-scoring doesn't
-- destroy the evidence of what was being judged.
alter table user_launches add column if not exists score_at_feedback int;

create index if not exists user_launches_feedback_idx
  on user_launches (score_feedback) where score_feedback is not null;

-- Handy review query: where is the model systematically wrong?
--
--   select l.name, l.source, l.category,
--          ul.score_at_feedback, ul.score_feedback, count(*) over () as total
--   from user_launches ul join launches l on l.id = ul.launch_id
--   where ul.score_feedback in ('too_low','too_high')
--   order by ul.score_feedback_at desc;
