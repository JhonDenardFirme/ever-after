// -----------------------------------------------------------------------------
// lib/types.ts
//
// These interfaces mirror supabase/schema.sql, column for column. If the
// schema changes, this file changes in the SAME commit — no exceptions.
// Dates come back from Supabase as ISO strings, so everything temporal is
// typed as string here, not Date.
// -----------------------------------------------------------------------------

export type BeatType = 'travel' | 'arrival' | 'activity' | 'meal' | 'rest' | 'other';
export type FrameStatus = 'waiting' | 'developed';
export type AnswerKind = 'text' | 'frame' | 'word';

export interface Author {
  id: string;
  email: string;
  name: string;       // "Denard"
  nickname: string | null; // "Happy Pill"
  created_at: string;
}

// A "Fleeting Frames" — one story. The Prologue lives here as columns.
export interface Story {
  id: string;
  title: string;
  slug: string;
  starts_on: string | null;
  ends_on: string | null;
  setting: string | null;      // "Tagaytay"
  theme: string | null;        // "Home" — one word, set by Afterword Q8
  dedication: string | null;
  epigraph: string | null;
  description: string | null;
  soundtrack: string | null;
  cover_frame_id: string | null;
  keepsake_frame_id: string | null;
  created_at: string;
  updated_at: string;
}

// A Chapter doubles as a Storyboard beat — planned or lived, same row.
export interface Chapter {
  id: string;
  story_id: string;
  title: string;
  notes: string | null;        // short flavor line, shown in the beat detail
  scheduled_at: string | null; // null = "whenever it happens"
  setting: string | null;
  beat_type: BeatType;         // icon selection only — never branching logic
  sort_order: number;
  created_at: string;
}

// A Frame. A Waiting Frame is just status='waiting' with no media yet.
export interface Frame {
  id: string;
  chapter_id: string | null;
  media_url: string | null;    // null while waiting
  storage_path: string | null; // "frames/<uuid>.jpg" — needed to delete later
  caption: string | null;
  setting: string | null;
  status: FrameStatus;
  prompt_text: string | null;  // only meaningful while waiting
  authored_by: string | null;  // who LEFT the waiting frame
  developed_by: string | null; // who FILLED it
  width: number | null;
  height: number | null;
  sort_order: number;
  created_at: string;
  developed_at: string | null;
}

export interface AfterwordQuestion {
  id: string;
  story_id: string;
  question: string;
  answer_kind: AnswerKind; // 'frame' for Q1 (sets Keepsake), 'word' for Q8 (sets Theme)
  sort_order: number;
}

export interface AfterwordEntry {
  id: string;
  question_id: string;
  author_id: string;
  answer_text: string | null;
  answer_frame_id: string | null;
  created_at: string; // doubles as the Signature date
}
