-- ============================================================
-- EVER AFTER 1.2 — Migration A (the foundation pass)
-- Run ONCE in Supabase SQL Editor on the LIVE database.
-- Safe to re-run (idempotent).
--
-- Fixes: "Could not find the 'media_type' column of 'frames'"
-- — Phase 4's upload action wrote a column the Phase 1 schema
-- never created. Adding it properly now, because 1.2 wants
-- video support and this column is exactly how that works.
-- ============================================================

alter table frames
  add column if not exists media_type text not null default 'image'
  check (media_type in ('image','video'));

-- Every existing row is a photo; the default covers them.
-- Nothing else changes in this migration. The couple-profile
-- and afterword migrations come with their own passes (see
-- EVERAFTER-1.2-PLAN.md).
