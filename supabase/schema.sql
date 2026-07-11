-- ============================================================
-- EVER AFTER — schema v1
-- Run once in Supabase SQL Editor. Idempotent (safe to re-run).
--
-- Denard's note to self: the DB speaks plain English (stories,
-- chapters, frames). ALL poetic language lives in lib/copy.ts.
-- A "Fleeting Frames" is a row in stories. A "Waiting Frame" is
-- a frames row with status='waiting'. That's the whole trick.
-- ============================================================

create extension if not exists "pgcrypto";

-- Authors. Two rows, seeded by hand at the bottom of this file.
-- Identified by email — must match what Google returns to NextAuth.
create table if not exists authors (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  name        text not null,          -- "Denard"
  nickname    text,                   -- "Happy Pill"
  avatar_url  text,                   -- 1.2: uploaded profile picture; falls back to the Google image
  created_at  timestamptz default now()
);

-- The couple hero on The Library (1.2). Single row, enforced by check (id = 1).
create table if not exists couple (
  id                   int primary key default 1 check (id = 1),
  headline             text,   -- the relationship title, "Denard & Airhyl"
  story                text,   -- the editorial statement on the frontispiece
  hero_image_url       text,   -- 1.2: the frontispiece hero photograph
  hero_focus_x         int default 50, -- focal point (percent) for cropping
  hero_focus_y         int default 50,
  since                date,   -- "Since 2024"
  dedication           text,   -- an optional closing line
  member_one_name      text,   -- (legacy; authors table now supplies names/avatars)
  member_one_note      text,
  member_one_photo_url text,
  member_two_name      text,
  member_two_note      text,
  member_two_photo_url text,
  updated_at           timestamptz default now()
);

-- A Fleeting Frames. The Prologue lives here as columns.
create table if not exists stories (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  slug              text not null unique,       -- "tagaytay-ii"
  starts_on         date,
  ends_on           date,
  setting           text,                       -- "Tagaytay"
  theme             text,                       -- "Home"
  dedication        text,
  epigraph          text,
  description       text,
  soundtrack        text,
  cover_url         text,                       -- 1.2: uploaded story cover (independent of any Frame)
  cover_frame_id    uuid,                       -- FK added below (frames doesn't exist yet)
  keepsake_frame_id uuid,                       -- FK added below
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- Chapters = Storyboard beats. Planned or lived, same row.
create table if not exists chapters (
  id            uuid primary key default gen_random_uuid(),
  story_id      uuid not null references stories(id) on delete cascade,
  title         text not null,                  -- "The scenery"
  notes         text,                           -- "Windows down once the air turns cool"
  scheduled_at  timestamptz,                    -- null = "whenever it happens"
  setting       text,
  beat_type     text not null default 'activity'
                check (beat_type in ('travel','arrival','activity','meal','rest','other')),
  sort_order    int not null default 0,
  created_at    timestamptz default now()
);

-- Frames. A Waiting Frame is status='waiting' with no media_url.
create table if not exists frames (
  id            uuid primary key default gen_random_uuid(),
  chapter_id    uuid references chapters(id) on delete set null,
  story_id      uuid references stories(id) on delete cascade, -- 1.2: story-level Frames (Keepsake upload) with no Moment
  media_url     text,                           -- null while waiting
  media_type    text not null default 'image'
                check (media_type in ('image','video')),
  storage_path  text,                           -- "<uuid>.jpg" — path WITHIN the bucket, needed to delete
  caption       text,
  setting       text,
  status        text not null default 'developed'
                check (status in ('waiting','developed')),
  prompt_text   text,                           -- only meaningful when waiting
  authored_by   uuid references authors(id),    -- who left the Waiting Frame
  developed_by  uuid references authors(id),    -- who filled it
  width         int,
  height        int,
  sort_order    int not null default 0,
  created_at    timestamptz default now(),
  developed_at  timestamptz
);

-- Forward references from stories -> frames (couldn't exist at create time)
alter table stories drop constraint if exists stories_cover_frame_fk;
alter table stories drop constraint if exists stories_keepsake_frame_fk;
alter table stories
  add constraint stories_cover_frame_fk
    foreign key (cover_frame_id) references frames(id) on delete set null,
  add constraint stories_keepsake_frame_fk
    foreign key (keepsake_frame_id) references frames(id) on delete set null;

-- The Afterword
create table if not exists afterword_questions (
  id          uuid primary key default gen_random_uuid(),
  story_id    uuid not null references stories(id) on delete cascade,
  question    text not null,
  section     text,                             -- 1.2: keepsake | back | within | ahead
  answer_kind text not null default 'text' check (answer_kind in ('text','frame','word','rating')),
  sort_order  int not null default 0
);

create table if not exists afterword_entries (
  id              uuid primary key default gen_random_uuid(),
  question_id     uuid not null references afterword_questions(id) on delete cascade,
  author_id       uuid not null references authors(id),
  answer_text     text,
  answer_frame_id uuid references frames(id) on delete set null,
  created_at      timestamptz default now(),   -- doubles as the Signature date
  unique (question_id, author_id)              -- one answer per author per question
);

-- Useful indexes
create index if not exists idx_chapters_story on chapters(story_id, sort_order);
create index if not exists idx_frames_chapter on frames(chapter_id, sort_order);
create index if not exists idx_frames_story on frames(story_id);
create index if not exists idx_aw_questions_story on afterword_questions(story_id, sort_order);

-- ============================================================
-- SECURITY: deny-all RLS.
-- Enabled with ZERO policies = the anon/public keys can read and
-- write NOTHING. Only the service-role key (server-side, in
-- lib/supabase.ts) gets through, because service role bypasses
-- RLS entirely. Authorization = the NextAuth email allowlist.
-- ============================================================
alter table authors             enable row level security;
alter table couple              enable row level security;
alter table stories             enable row level security;
alter table chapters            enable row level security;
alter table frames              enable row level security;
alter table afterword_questions enable row level security;
alter table afterword_entries   enable row level security;

-- ============================================================
-- STORAGE: the frames bucket. Public READ (so next/image can
-- fetch by URL) — writes still only happen server-side.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('frames', 'frames', true)
on conflict (id) do nothing;

-- 1.2: avatars + couple photos live here, also public-read.
insert into storage.buckets (id, name, public)
values ('profiles', 'profiles', true)
on conflict (id) do nothing;

-- ============================================================
-- SEED: the two of us. REPLACE the emails with the real Gmail
-- addresses used for Google sign-in — they must match exactly.
-- ============================================================
insert into authors (email, name, nickname) values
  ('denard@example.com', 'Denard', 'Penguin'),
  ('airhyl@example.com', 'Airhyl', 'Happy Pill')
on conflict (email) do nothing;
