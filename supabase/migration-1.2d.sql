-- ============================================================
-- EVER AFTER 1.2 — Migration D (the Afterword rebuild)
-- Run ONCE in Supabase SQL Editor on the LIVE database.
-- Safe to re-run (idempotent).
--
-- Three changes the 1.2 Afterword needs:
--   1. afterword_questions.section — groups questions into the four-part bank
--      (Keepsake / Looking Back / Looking Within / Looking Ahead).
--   2. answer_kind gains 'rating' — light-touch answers alongside free text.
--   3. frames.story_id — the reversal flagged since Phase 4: a Frame that
--      belongs to a story WITHOUT a Moment. The Keepsake is now an independent
--      upload, so it needs a home that isn't a chapter.
--
-- Existing questions/answers are untouched; the new bank is added alongside.
-- ============================================================

-- 1. Section on questions ------------------------------------------------------
alter table afterword_questions
  add column if not exists section text;

-- 2. Allow 'rating' answers ----------------------------------------------------
alter table afterword_questions
  drop constraint if exists afterword_questions_answer_kind_check;
alter table afterword_questions
  add constraint afterword_questions_answer_kind_check
  check (answer_kind in ('text', 'frame', 'word', 'rating'));

-- 3. Story-level Frames (the Keepsake upload) ----------------------------------
alter table frames
  add column if not exists story_id uuid references stories(id) on delete cascade;
create index if not exists idx_frames_story on frames(story_id);
