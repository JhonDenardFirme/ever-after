import 'server-only';
// -----------------------------------------------------------------------------
// lib/purge.ts
//
// Deleting a chapter has to take its Frames with it, and this is why:
//
// `frames.chapter_id` is ON DELETE SET NULL. And `frames` has no `story_id` —
// a Frame reaches its story ONLY through its chapter. So a Frame whose chapter
// is deleted doesn't "come loose", it becomes permanently unreachable: an
// invisible row plus a photo sitting in the bucket that nothing will ever
// render or clean up.
//
// The confirmation copy already promises "This beat and everything in it will
// be gone for good." Before this helper existed, that was a lie. Now it isn't.
//
// If Ever After ever wants genuinely loose Frames (belonging to a story but no
// beat), that needs a `story_id` column on `frames` — a real migration, not a
// patch. Noted for whenever thematic stories arrive.
// -----------------------------------------------------------------------------

import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'frames';

/**
 * Removes every Frame attached to a chapter, and their storage objects.
 * Call this BEFORE deleting the chapter row.
 *
 * Same failure ordering as deleteFrame: rows first, objects second. A leaked
 * object is invisible waste; a dangling row is a broken image.
 */
export async function purgeFramesForChapter(
  db: SupabaseClient,
  chapterId: string
): Promise<{ error?: string }> {
  const { data: frames, error: readError } = await db
    .from('frames')
    .select('id, storage_path')
    .eq('chapter_id', chapterId);

  if (readError) return { error: readError.message };
  if (!frames || frames.length === 0) return {};

  const { error: deleteError } = await db.from('frames').delete().eq('chapter_id', chapterId);
  if (deleteError) return { error: deleteError.message };

  const paths = frames
    .map((f) => f.storage_path as string | null)
    .filter((p): p is string => Boolean(p));

  if (paths.length > 0) {
    const { error: storageError } = await db.storage.from(BUCKET).remove(paths);
    // Logged, not returned. The Frames are gone from the story either way.
    if (storageError) {
      console.error('[purge] orphaned objects:', paths.join(', '), storageError.message);
    }
  }

  return {};
}
