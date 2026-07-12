'use server';
// -----------------------------------------------------------------------------
// app/actions/stories.ts
//
// Every write to the `stories` table. The auth guard now lives in lib/guard.ts
// (Phase 3 pulled it out so chapters.ts and frames.ts could share it).
//
// Reminder to self: after a write, revalidatePath() tells Next "this route's
// data is stale." Forget it and the DB updates while the screen doesn't.
// -----------------------------------------------------------------------------

import { revalidatePath } from 'next/cache';
import { requireAuthor, attempt, type Result } from '@/lib/guard';
import { supabaseAdmin } from '@/lib/supabase';
import { slugify } from '@/lib/slug';
import { copy, DEFAULT_AFTERWORD_QUESTIONS } from '@/lib/copy';
import type { Story } from '@/lib/types';

const COVER_BUCKET = 'frames';
const MAX_COVER_BYTES = 6 * 1024 * 1024;

/**
 * Finds a slug nobody's using. "tagaytay-ii" -> "tagaytay-ii-2" -> "-3"...
 * Two people will never race this hard enough to matter, so a simple loop
 * beats a database-level retry dance.
 */
async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  const db = supabaseAdmin();

  for (let n = 1; n < 50; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const { data } = await db.from('stories').select('id').eq('slug', candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${Date.now()}`;
}

/**
 * Begin a new chapter. Creates the story, then seeds its eight Afterword
 * questions so /afterword works from day one.
 *
 * The seed is per-story on purpose: editing the defaults in copy.ts later must
 * not silently rewrite the questions of stories already written.
 */
export async function createStory(title: string): Promise<Result<{ slug: string }>> {
  return attempt(async () => {
    await requireAuthor();

    const clean = title.trim();
    if (!clean) return { ok: false, error: copy.validation.storyNeedsName };

    const db = supabaseAdmin();
    const slug = await uniqueSlug(clean);

    const { data: story, error: storyError } = await db
      .from('stories')
      .insert({ title: clean, slug })
      .select('id, slug')
      .single();

    if (storyError || !story) {
      return { ok: false, error: storyError?.message ?? copy.validation.couldNotCreateStory };
    }

    const { error: qError } = await db.from('afterword_questions').insert(
      DEFAULT_AFTERWORD_QUESTIONS.map((q, i) => ({
        story_id: story.id,
        question: q.question,
        section: q.section,
        answer_kind: q.answer_kind,
        sort_order: i + 1,
      }))
    );

    // A story without its questions is recoverable (Phase 5 can backfill), so
    // don't roll back and lose the story over it. Just make the failure loud.
    if (qError) console.error('[createStory] seeding afterword questions:', qError.message);

    revalidatePath('/library');
    return { ok: true, data: { slug: story.slug as string } };
  });
}

// Only these columns may be written from the client. Anything else in the
// payload is ignored — no passing `id` or `created_at` through the wire.
const EDITABLE = [
  'title',
  'starts_on',
  'ends_on',
  'setting',
  'theme',
  'dedication',
  'epigraph',
  'description',
  'soundtrack',
] as const;

export type EditableField = (typeof EDITABLE)[number];

/**
 * Saves a single Prologue field. One field per call — inline editing saves on
 * blur, so batching would only add a dirty-state problem I don't want.
 *
 * Changing the title does NOT re-slug. Slugs are permanent once created — a
 * shared link should never rot because someone fixed a typo.
 */
export async function updateStory(
  storyId: string,
  field: EditableField,
  value: string
): Promise<Result<Story>> {
  return attempt(async () => {
    await requireAuthor();

    if (!EDITABLE.includes(field)) {
      return { ok: false, error: `"${field}" isn't an editable field.` };
    }

    const trimmed = value.trim();
    // <input type="date"> emits "" when cleared; Postgres rejects that for a
    // date column. Normalize empty -> null across the board.
    const next = trimmed === '' ? null : trimmed;

    if (field === 'title' && next === null) {
      return { ok: false, error: copy.validation.storyNeedsName };
    }

    const { data, error } = await supabaseAdmin()
      .from('stories')
      .update({ [field]: next, updated_at: new Date().toISOString() })
      .eq('id', storyId)
      .select('*')
      .single();

    if (error || !data) return { ok: false, error: error?.message ?? copy.validation.couldNotSave };

    const story = data as Story;
    revalidatePath(`/story/${story.slug}`);
    revalidatePath('/library');
    return { ok: true, data: story };
  });
}

/**
 * 1.2: upload a story cover directly (independent of any Frame). Deterministic
 * path per story with upsert — re-uploading overwrites in place, so we never
 * leak orphaned objects. A ?v= cache-bust makes the new pixels show at once.
 * Precedence lives in getCoverUrl: this URL beats the Keepsake's cover.
 */
export async function setStoryCover(
  storyId: string,
  slug: string,
  formData: FormData
): Promise<Result<{ cover_url: string }>> {
  return attempt(async () => {
    await requireAuthor();

    const file = formData.get('file') as File | null;
    if (!file || file.size === 0) return { ok: false, error: copy.validation.noPhotograph };
    if (!file.type.startsWith('image/')) return { ok: false, error: copy.frames.notAnImage };
    if (file.size > MAX_COVER_BYTES) return { ok: false, error: copy.frames.tooLarge };

    const db = supabaseAdmin();
    const path = `covers/${storyId}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await db.storage
      .from(COVER_BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: true });
    if (uploadError) return { ok: false, error: uploadError.message };

    const {
      data: { publicUrl },
    } = db.storage.from(COVER_BUCKET).getPublicUrl(path);
    const bustedUrl = `${publicUrl}?v=${Date.now()}`;

    const { error } = await db.from('stories').update({ cover_url: bustedUrl }).eq('id', storyId);
    if (error) return { ok: false, error: error.message };

    revalidatePath(`/story/${slug}`);
    revalidatePath('/library');
    return { ok: true, data: { cover_url: bustedUrl } };
  });
}

/**
 * Remove every Frame belonging to a story (rows + storage) — the frames reached
 * either through a Moment or directly via story_id. Rows first, objects second.
 */
async function purgeStoryFrames(db: ReturnType<typeof supabaseAdmin>, storyId: string): Promise<void> {
  const { data: chapters } = await db.from('chapters').select('id').eq('story_id', storyId);
  const ids = (chapters ?? []).map((c) => c.id as string);
  const orParts = [`story_id.eq.${storyId}`];
  if (ids.length > 0) orParts.push(`chapter_id.in.(${ids.join(',')})`);
  const filter = orParts.join(',');

  const { data: frames } = await db.from('frames').select('storage_path').or(filter);
  const paths = (frames ?? [])
    .map((f) => f.storage_path as string | null)
    .filter((p): p is string => Boolean(p));

  await db.from('frames').delete().or(filter);
  if (paths.length > 0) {
    const { error } = await db.storage.from(COVER_BUCKET).remove(paths);
    if (error) console.error('[purgeStoryFrames] orphaned objects:', error.message);
  }
}

/**
 * Clear a Fleeting Frames — empty every Frame, Moment, and Afterword answer (and
 * their images), and reset the cover/Keepsake — but keep the chapter itself, its
 * Prologue text, and its Afterword questions. A heavy, confirmed action.
 */
export async function clearStory(storyId: string, slug: string): Promise<Result> {
  return attempt(async () => {
    await requireAuthor();
    const db = supabaseAdmin();

    await purgeStoryFrames(db, storyId);
    await db.from('chapters').delete().eq('story_id', storyId);

    const { data: qs } = await db.from('afterword_questions').select('id').eq('story_id', storyId);
    const qids = (qs ?? []).map((q) => q.id as string);
    if (qids.length > 0) await db.from('afterword_entries').delete().in('question_id', qids);

    await db.storage.from(COVER_BUCKET).remove([`covers/${storyId}`]);
    const { error } = await db
      .from('stories')
      .update({ cover_frame_id: null, keepsake_frame_id: null, cover_url: null })
      .eq('id', storyId);
    if (error) return { ok: false, error: error.message };

    revalidatePath(`/story/${slug}`);
    revalidatePath('/library');
    return { ok: true, data: undefined };
  });
}

/**
 * Delete a Fleeting Frames entirely. Frame storage + cover object are removed
 * first (rows would otherwise orphan objects), then the story row — its Moments,
 * questions and answers cascade away with it.
 */
export async function deleteStory(storyId: string): Promise<Result> {
  return attempt(async () => {
    await requireAuthor();
    const db = supabaseAdmin();

    await purgeStoryFrames(db, storyId);
    await db.storage.from(COVER_BUCKET).remove([`covers/${storyId}`]);

    const { error } = await db.from('stories').delete().eq('id', storyId);
    if (error) return { ok: false, error: error.message };

    revalidatePath('/library');
    return { ok: true, data: undefined };
  });
}

/**
 * Remove the uploaded cover. Clears the column first (so the story stops
 * pointing at it), then the storage object — rows first, objects second, fail
 * toward invisible waste. With cover_url null, getCoverUrl falls back to the
 * Keepsake cover (if any), then the empty state.
 */
export async function removeStoryCover(storyId: string, slug: string): Promise<Result> {
  return attempt(async () => {
    await requireAuthor();

    const db = supabaseAdmin();
    const { error } = await db.from('stories').update({ cover_url: null }).eq('id', storyId);
    if (error) return { ok: false, error: error.message };

    const { error: storageError } = await db.storage.from(COVER_BUCKET).remove([`covers/${storyId}`]);
    if (storageError) console.error('[removeStoryCover] orphaned object:', storageError.message);

    revalidatePath(`/story/${slug}`);
    revalidatePath('/library');
    return { ok: true, data: undefined };
  });
}
