-- ============================================================
-- EVER AFTER 1.2 — Migration B (The Library redesign)
-- Run ONCE in Supabase SQL Editor on the LIVE database.
-- Safe to re-run (idempotent).
--
-- Adds what the couple hero + profile avatars need:
--   1. authors.avatar_url   — an uploaded profile picture (falls back to the
--                             Google account image when null).
--   2. couple               — a single-row table holding the editable "who we
--                             are" hero on The Library.
--   3. a public `profiles` storage bucket for avatars + couple photos.
--
-- Same security posture as everything else: deny-all RLS, service-role only.
-- ============================================================

-- 1. Avatar on each author -----------------------------------------------------
alter table authors
  add column if not exists avatar_url text;

-- 2. The couple hero. Single row, enforced by check (id = 1). --------------------
create table if not exists couple (
  id                   int primary key default 1 check (id = 1),
  headline             text,   -- the hero headline, e.g. "Denard & Airhyl"
  story                text,   -- a short paragraph about the two of them
  member_one_name      text,
  member_one_note      text,   -- their little "Hi, I'm ..." line
  member_one_photo_url text,
  member_two_name      text,
  member_two_note      text,
  member_two_photo_url text,
  updated_at           timestamptz default now()
);

alter table couple enable row level security;

-- 3. The profiles bucket. Public READ (so next/image + <img> can fetch by URL);
--    writes still only happen server-side through the service role. -------------
insert into storage.buckets (id, name, public)
values ('profiles', 'profiles', true)
on conflict (id) do nothing;
