import 'server-only';
// -----------------------------------------------------------------------------
// lib/queries.ts
//
// Read-only helpers. Server Components call these directly (they're async,
// they run on the server, there's no client fetch anywhere). Writes live in
// app/actions/* instead — keeping reads and writes apart makes it obvious
// where revalidatePath() needs to be called.
//
// Every function returns typed data or null/[]. Errors are logged and
// swallowed into an empty result rather than thrown, because a Server
// Component that throws takes the whole route down with it. Phase 2 has no
// error boundary yet; failing soft is the right default for now.
// -----------------------------------------------------------------------------

import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import type { Story, Chapter, Frame, Author, AfterwordQuestion, AfterwordEntry, Couple } from '@/lib/types';

/** The couple hero (1.2). One row, id = 1. Null until they introduce themselves. */
export async function getCouple(): Promise<Couple | null> {
  const { data, error } = await supabaseAdmin()
    .from('couple')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    console.error('[queries] getCouple:', error.message);
    return null;
  }
  return (data as Couple) ?? null;
}

/** Every story, newest first. Powers The Library. */
export async function getStories(): Promise<Story[]> {
  const { data, error } = await supabaseAdmin()
    .from('stories')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[queries] getStories:', error.message);
    return [];
  }
  return (data ?? []) as Story[];
}

/** One story by its slug. Returns null if it doesn't exist -> caller 404s. */
export async function getStoryBySlug(slug: string): Promise<Story | null> {
  const { data, error } = await supabaseAdmin()
    .from('stories')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('[queries] getStoryBySlug:', error.message);
    return null;
  }
  return (data as Story) ?? null;
}

/**
 * The cover image URL for a story, if a cover Frame has been chosen.
 * In Phase 2 no Frames exist yet, so this always returns null and the hero
 * renders its empty state. Phase 4 makes it real without touching the hero.
 */
export async function getCoverUrl(story: Story): Promise<string | null> {
  // 1.2: an explicitly uploaded cover wins over the borrowed Keepsake cover.
  if (story.cover_url) return story.cover_url;
  if (!story.cover_frame_id) return null;

  const { data, error } = await supabaseAdmin()
    .from('frames')
    .select('media_url')
    .eq('id', story.cover_frame_id)
    .maybeSingle();

  if (error) {
    console.error('[queries] getCoverUrl:', error.message);
    return null;
  }
  return (data?.media_url as string | undefined) ?? null;
}

/** Every beat in a story. Ordering is applied client-side via lib/beats.ts
 *  so the rule lives in exactly one place. */
export async function getChapters(storyId: string): Promise<Chapter[]> {
  const { data, error } = await supabaseAdmin()
    .from('chapters')
    .select('*')
    .eq('story_id', storyId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[queries] getChapters:', error.message);
    return [];
  }
  return (data ?? []) as Chapter[];
}

/**
 * Every Frame belonging to any beat in this story, waiting or developed.
 *
 * Note: a Frame with a null chapter_id is deliberately NOT returned here —
 * it belongs to no beat, so no beat's Frame List should show it. Phase 4 adds
 * a separate "loose Frames" query for the Frame Wall, which does want them.
 */
export async function getFramesForStory(storyId: string): Promise<Frame[]> {
  const chapters = await getChapters(storyId);
  const ids = chapters.map((c) => c.id);
  if (ids.length === 0) return [];

  const { data, error } = await supabaseAdmin()
    .from('frames')
    .select('*')
    .in('chapter_id', ids)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[queries] getFramesForStory:', error.message);
    return [];
  }
  return (data ?? []) as Frame[];
}

/** Both of us, keyed by id — so a Waiting Frame can say who left it. */
export async function getAuthorsById(): Promise<Record<string, Author>> {
  const { data, error } = await supabaseAdmin().from('authors').select('*');
  if (error) {
    console.error('[queries] getAuthorsById:', error.message);
    return {};
  }
  return Object.fromEntries(((data ?? []) as Author[]).map((a) => [a.id, a]));
}

/** The eight questions, in the order they were seeded. */
export async function getAfterwordQuestions(storyId: string): Promise<AfterwordQuestion[]> {
  const { data, error } = await supabaseAdmin()
    .from('afterword_questions')
    .select('*')
    .eq('story_id', storyId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[queries] getAfterwordQuestions:', error.message);
    return [];
  }
  return (data ?? []) as AfterwordQuestion[];
}

/**
 * Every answer either of us has written for this story. Grouped by question
 * in the component, because a question with two answers renders them side by
 * side — that's the whole point of the unique(question_id, author_id) pair.
 */
export async function getAfterwordEntries(storyId: string): Promise<AfterwordEntry[]> {
  const questions = await getAfterwordQuestions(storyId);
  const ids = questions.map((q) => q.id);
  if (ids.length === 0) return [];

  const { data, error } = await supabaseAdmin()
    .from('afterword_entries')
    .select('*')
    .in('question_id', ids);

  if (error) {
    console.error('[queries] getAfterwordEntries:', error.message);
    return [];
  }
  return (data ?? []) as AfterwordEntry[];
}

/** The signed-in author, matched by email. Null if the session is gone. */
export async function getCurrentAuthor(): Promise<Author | null> {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;

  const { data } = await supabaseAdmin()
    .from('authors')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  return (data as Author) ?? null;
}
