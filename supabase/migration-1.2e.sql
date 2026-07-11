-- ============================================================
-- EVER AFTER 1.2 — Migration E (the Story Frontispiece)
-- Run ONCE in Supabase SQL Editor on the LIVE database.
-- Safe to re-run (idempotent). All additive — nothing dropped.
--
-- The Library's couple card becomes a full editorial "frontispiece": a hero
-- photograph blended into the brand, the relationship title, an editorial
-- statement, live story statistics, and the two authors. These columns back it.
--
--   hero_image_url         the frontispiece photograph
--   hero_focus_x / _y      focal point (percent) so any crop keeps the subject
--   since                  "Since 2024" — when the two of you began
--   dedication             an optional closing line
--
-- The relationship title reuses couple.headline; the editorial statement reuses
-- couple.story. Author names + avatars come from the authors table, not here.
-- ============================================================

alter table couple add column if not exists hero_image_url text;
alter table couple add column if not exists hero_focus_x int default 50;
alter table couple add column if not exists hero_focus_y int default 50;
alter table couple add column if not exists since date;
alter table couple add column if not exists dedication text;
