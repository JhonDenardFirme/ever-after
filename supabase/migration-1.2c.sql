-- ============================================================
-- EVER AFTER 1.2 — Migration C (cover photos)
-- Run ONCE in Supabase SQL Editor on the LIVE database.
-- Safe to re-run (idempotent).
--
-- Adds a story-level cover image that is independent of the Frame gallery.
-- Until now the "cover" was borrowed from the Keepsake Frame (cover_frame_id).
-- The 1.2 Prologue wants a cover you can upload directly, before any Frame
-- exists and without attaching it to a Moment — so it lives in its own column.
--
-- Display precedence stays backwards-compatible:
--   cover_url (explicit upload)  >  cover_frame_id (Keepsake)  >  empty state.
--
-- Cover images live in the existing public `frames` bucket under covers/<id>.
-- ============================================================

alter table stories
  add column if not exists cover_url text;
