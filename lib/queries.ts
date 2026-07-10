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

import { supabaseAdmin } from '@/lib/supabase';
import type { Story } from '@/lib/types';

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
