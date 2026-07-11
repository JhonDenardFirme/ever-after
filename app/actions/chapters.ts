'use server';
// -----------------------------------------------------------------------------
// app/actions/chapters.ts
//
// Chapters are Storyboard beats. Same row, whether planned ahead or added
// after the fact — that's the whole "the planner IS the album, unfilled" idea
// from the masterfile, and it's why there's no separate `beats` table.
//
// Every action guards with requireAuthor() first. See lib/guard.ts for why.
// -----------------------------------------------------------------------------

import { revalidatePath } from 'next/cache';
import { requireAuthor, attempt, type Result } from '@/lib/guard';
import { supabaseAdmin } from '@/lib/supabase';
import { copy } from '@/lib/copy';
import { purgeFramesForChapter } from '@/lib/purge';
import type { Chapter, BeatType } from '@/lib/types';

const BEAT_TYPES: BeatType[] = ['travel', 'arrival', 'activity', 'meal', 'rest', 'other'];

/** Revalidate both the storyboard and the prologue — beat counts show on both. */
function refresh(slug: string) {
  revalidatePath(`/story/${slug}/storyboard`);
  revalidatePath(`/story/${slug}/frames`);
  revalidatePath(`/story/${slug}`);
}

/**
 * A new beat starts untimed and lands at the end of the untimed group.
 * sort_order = (highest existing) + 1. Time and setting get filled in after,
 * through the editor — asking for five fields up front would make sketching
 * feel like paperwork.
 */
export async function createChapter(
  storyId: string,
  slug: string,
  title: string
): Promise<Result<Chapter>> {
  return attempt(async () => {
    await requireAuthor();

    const clean = title.trim();
    if (!clean) return { ok: false, error: copy.validation.beatNeedsName };

    const db = supabaseAdmin();

    const { data: last } = await db
      .from('chapters')
      .select('sort_order')
      .eq('story_id', storyId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = ((last?.sort_order as number | undefined) ?? -1) + 1;

    const { data, error } = await db
      .from('chapters')
      .insert({ story_id: storyId, title: clean, sort_order: nextOrder })
      .select('*')
      .single();

    if (error || !data) return { ok: false, error: error?.message ?? copy.validation.couldNotAddBeat };

    refresh(slug);
    return { ok: true, data: data as Chapter };
  });
}

const EDITABLE = ['title', 'notes', 'scheduled_at', 'setting', 'beat_type'] as const;
export type ChapterField = (typeof EDITABLE)[number];

/**
 * Saves one field of a beat. `scheduled_at` arrives as a UTC ISO string (the
 * client converts from datetime-local — see lib/beats.ts, and mind the
 * timezone offset trap in there).
 *
 * Clearing the time returns a beat to "whenever it happens" and drops it into
 * the untimed group. That's a real, intentional behaviour, not a side effect.
 */
export async function updateChapter(
  chapterId: string,
  slug: string,
  field: ChapterField,
  value: string
): Promise<Result<Chapter>> {
  return attempt(async () => {
    await requireAuthor();

    if (!EDITABLE.includes(field)) {
      return { ok: false, error: `"${field}" isn't an editable field.` };
    }

    const trimmed = value.trim();
    const next = trimmed === '' ? null : trimmed;

    if (field === 'title' && next === null) {
      return { ok: false, error: copy.validation.beatNeedsName };
    }
    if (field === 'beat_type' && (next === null || !BEAT_TYPES.includes(next as BeatType))) {
      return { ok: false, error: copy.validation.unknownBeatType };
    }

    const { data, error } = await supabaseAdmin()
      .from('chapters')
      .update({ [field]: next })
      .eq('id', chapterId)
      .select('*')
      .single();

    if (error || !data) return { ok: false, error: error?.message ?? copy.validation.couldNotSave };

    refresh(slug);
    return { ok: true, data: data as Chapter };
  });
}

/**
 * Deleting a beat takes its Frames with it — photos, storage objects, all of it.
 *
 * This has to be explicit. `frames.chapter_id` is ON DELETE SET NULL, and
 * `frames` has no story_id, so a Frame whose chapter vanishes becomes
 * permanently unreachable rather than merely unattached. The confirmation copy
 * says "this beat and everything in it will be gone for good" — purging first
 * is what makes that sentence true instead of a lie. See lib/purge.ts.
 */
export async function deleteChapter(chapterId: string, slug: string): Promise<Result> {
  return attempt(async () => {
    await requireAuthor();

    const db = supabaseAdmin();

    const purged = await purgeFramesForChapter(db, chapterId);
    if (purged.error) return { ok: false, error: purged.error };

    const { error } = await db.from('chapters').delete().eq('id', chapterId);
    if (error) return { ok: false, error: error.message };

    refresh(slug);
    return { ok: true, data: undefined };
  });
}

/**
 * Rewrites sort_order for the untimed beats after a drag.
 *
 * Only untimed beats are ever passed here — timed ones are positioned by their
 * clock time, and letting a drag move them would desync visual order from
 * actual time. The UI enforces that by only making untimed beats draggable;
 * this action doesn't re-check, because a caller sending timed beats would
 * only be reordering a field nobody reads for them.
 */
export async function reorderChapters(
  slug: string,
  order: { id: string; sort_order: number }[]
): Promise<Result> {
  return attempt(async () => {
    await requireAuthor();

    const db = supabaseAdmin();

    // No bulk-update-by-id in PostgREST, so it's one call per row. With a
    // handful of beats that's fine; if this ever grows, move it to an RPC.
    const results = await Promise.all(
      order.map(({ id, sort_order }) =>
        db.from('chapters').update({ sort_order }).eq('id', id)
      )
    );

    const failed = results.find((r) => r.error);
    if (failed?.error) return { ok: false, error: failed.error.message };

    refresh(slug);
    return { ok: true, data: undefined };
  });
}
