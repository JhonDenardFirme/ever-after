'use server';
// -----------------------------------------------------------------------------
// app/actions/frames.ts
//
// Everything that happens to a Frame.
//
// A Waiting Frame is not a separate table. It's a `frames` row with
// status='waiting' and no media_url. Developing it flips the status and fills
// in the media — the planner and the album are the same object, one just
// hasn't been filled yet. That's the masterfile's core structural claim, and
// this file is where it becomes literally true.
//
// Two orderings I had to get right:
//
//  1. UPLOAD: storage first, then the DB row. If the row write fails we delete
//     the orphaned object before returning. The reverse would leave a row
//     pointing at a file that doesn't exist — a broken image, forever.
//
//  2. DELETE: DB row first, then the storage object. If the object delete
//     fails we've leaked a file: invisible, a few hundred KB, nobody sees it.
//     The reverse would leave a row pointing at nothing.
//
// Rule: always fail toward invisible waste, never toward visible breakage.
// -----------------------------------------------------------------------------

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { requireAuthor, attempt, type Result } from '@/lib/guard';
import { supabaseAdmin } from '@/lib/supabase';
import { copy } from '@/lib/copy';
import type { Frame } from '@/lib/types';

const BUCKET = 'frames';
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;  // post-compression sanity ceiling
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 1.2: videos allowed, capped hard

/** The storyboard and the frames page both read this data. So does the cover. */
function refresh(slug: string) {
  revalidatePath(`/story/${slug}/frames`);
  revalidatePath(`/story/${slug}/storyboard`);
  revalidatePath(`/story/${slug}`);
  revalidatePath('/library');
}

// -----------------------------------------------------------------------------
// Waiting Frames
// -----------------------------------------------------------------------------

/**
 * Leave a Waiting Frame on a beat. `authored_by` records WHO left it, which is
 * the entire gamified mechanic — "Denard left you a Waiting Frame" is the
 * game, and it needs no points system to work.
 */
export async function createWaitingFrame(
  slug: string,
  chapterId: string | null,
  promptText: string
): Promise<Result<Frame>> {
  return attempt(async () => {
    const author = await requireAuthor();

    const clean = promptText.trim();
    if (!clean) return { ok: false, error: copy.validation.waitingFrameNeedsPrompt };

    const db = supabaseAdmin();

    const { data: last } = await db
      .from('frames')
      .select('sort_order')
      .eq('chapter_id', chapterId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = ((last?.sort_order as number | undefined) ?? -1) + 1;

    const { data, error } = await db
      .from('frames')
      .insert({
        chapter_id: chapterId,
        status: 'waiting',
        prompt_text: clean,
        authored_by: author.id,
        sort_order: nextOrder,
      })
      .select('*')
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? copy.frames.developError };
    }

    refresh(slug);
    return { ok: true, data: data as Frame };
  });
}

/**
 * Removes a Waiting Frame. Safe by construction: the `.eq('status','waiting')`
 * clause makes this action structurally incapable of destroying a real photo.
 * Deleting a developed Frame is `deleteFrame` below — harder, and it asks.
 */
export async function deleteWaitingFrame(frameId: string, slug: string): Promise<Result> {
  return attempt(async () => {
    await requireAuthor();

    const { error } = await supabaseAdmin()
      .from('frames')
      .delete()
      .eq('id', frameId)
      .eq('status', 'waiting');

    if (error) return { ok: false, error: error.message };

    refresh(slug);
    return { ok: true, data: undefined };
  });
}

// -----------------------------------------------------------------------------
// Developing
// -----------------------------------------------------------------------------

/**
 * Develop a Frame: put the photo in storage, then point a row at it.
 *
 * `frameId` present  -> filling an existing Waiting Frame (flip status, stamp
 *                       developed_by + developed_at, keep prompt_text).
 * `frameId` absent   -> a brand new Frame straight onto a chapter.
 *
 * The file arrives already compressed by the browser (see UploadFrame), so we
 * never hold a 12MB phone photo in server memory. width/height come from the
 * client too — the server has no DOM to measure with, and pulling in `sharp`
 * for two integers would be absurd.
 */
export async function developFrame(formData: FormData): Promise<Result<Frame>> {
  return attempt(async () => {
    const author = await requireAuthor();

    const slug = formData.get('slug') as string | null;
    const frameId = (formData.get('frameId') as string | null) || null;
    const chapterId = (formData.get('chapterId') as string | null) || null;
    const file = formData.get('file') as File | null;
    const width = Number(formData.get('width')) || null;
    const height = Number(formData.get('height')) || null;
    // 1.2: prompt_text doubles as a set label. Files uploaded alongside a
    // Waiting Frame inherit its prompt, so they read as one collection later.
    const promptText = ((formData.get('promptText') as string | null) || '').trim() || null;

    if (!slug) return { ok: false, error: copy.validation.missingStory };
    if (!file || file.size === 0) return { ok: false, error: copy.validation.noPhotograph };

    const isVideo = file.type.startsWith('video/');
    if (!isVideo && !file.type.startsWith('image/')) {
      return { ok: false, error: copy.frames.notAnImage };
    }
    if (isVideo && file.size > MAX_VIDEO_BYTES) {
      return { ok: false, error: copy.frames.videoTooLarge };
    }
    if (!isVideo && file.size > MAX_IMAGE_BYTES) {
      return { ok: false, error: copy.frames.tooLarge };
    }

    const db = supabaseAdmin();

    // --- 1. Storage first ---
    // storage_path is the path WITHIN the bucket. No "frames/" prefix, or
    // we'd nest a frames folder inside the frames bucket.
    const rawExt = (file.name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${randomUUID()}.${rawExt || 'jpg'}`;

    // The Node client is happiest with an ArrayBuffer + an explicit contentType.
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await db.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: false });

    if (uploadError) return { ok: false, error: uploadError.message };

    const {
      data: { publicUrl },
    } = db.storage.from(BUCKET).getPublicUrl(path);

    // --- 2. Then the row ---
    const media = {
      media_url: publicUrl,
      storage_path: path,
      media_type: isVideo ? ('video' as const) : ('image' as const),
      status: 'developed' as const,
      developed_by: author.id,
      developed_at: new Date().toISOString(),
      width,
      height,
    };

    let result;

    if (frameId) {
      // Keep prompt_text. It's a record of what was asked for, and it reads
      // beautifully next to what actually arrived.
      result = await db.from('frames').update(media).eq('id', frameId).select('*').single();
    } else {
      const { data: last } = await db
        .from('frames')
        .select('sort_order')
        .eq('chapter_id', chapterId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle();

      result = await db
        .from('frames')
        .insert({
          ...media,
          chapter_id: chapterId,
          prompt_text: promptText,
          authored_by: author.id,
          sort_order: ((last?.sort_order as number | undefined) ?? -1) + 1,
        })
        .select('*')
        .single();
    }

    if (result.error || !result.data) {
      // The row failed — don't leave the object orphaned in the bucket.
      await db.storage.from(BUCKET).remove([path]);
      return { ok: false, error: result.error?.message ?? copy.frames.developError };
    }

    refresh(slug);
    return { ok: true, data: result.data as Frame };
  });
}

/**
 * Captions save silently — no toast, no confirmation. Masterfile's "when to
 * say nothing at all": the interface trusts you. Only errors speak up.
 */
export async function updateCaption(
  frameId: string,
  slug: string,
  caption: string
): Promise<Result<Frame>> {
  return attempt(async () => {
    await requireAuthor();

    const trimmed = caption.trim();
    const { data, error } = await supabaseAdmin()
      .from('frames')
      .update({ caption: trimmed === '' ? null : trimmed })
      .eq('id', frameId)
      .select('*')
      .single();

    if (error || !data) return { ok: false, error: error?.message ?? copy.validation.couldNotSave };

    refresh(slug);
    return { ok: true, data: data as Frame };
  });
}

/**
 * One Keepsake per story — the single Frame that represents the whole thing.
 * Setting a new one silently replaces the old, because "one" is the point.
 *
 * If the story has no cover yet, the Keepsake becomes it. The masterfile says
 * the Keepsake is the default cover; this is that sentence, in code.
 */
export async function setKeepsake(
  storyId: string,
  slug: string,
  frameId: string
): Promise<Result> {
  return attempt(async () => {
    await requireAuthor();

    const db = supabaseAdmin();

    const { data: story } = await db
      .from('stories')
      .select('cover_frame_id')
      .eq('id', storyId)
      .maybeSingle();

    const patch: Record<string, string> = { keepsake_frame_id: frameId };
    if (!story?.cover_frame_id) patch.cover_frame_id = frameId;

    const { error } = await db.from('stories').update(patch).eq('id', storyId);
    if (error) return { ok: false, error: error.message };

    refresh(slug);
    return { ok: true, data: undefined };
  });
}

/**
 * Un-set The Keepsake. Only clears keepsake_frame_id — the cover it may have
 * adopted stays put (that's a separate choice), so nothing visually breaks.
 * Lets you re-choose freely.
 */
export async function removeKeepsake(storyId: string, slug: string): Promise<Result> {
  return attempt(async () => {
    await requireAuthor();

    const { error } = await supabaseAdmin()
      .from('stories')
      .update({ keepsake_frame_id: null })
      .eq('id', storyId);
    if (error) return { ok: false, error: error.message };

    refresh(slug);
    return { ok: true, data: undefined };
  });
}

/**
 * Delete a Frame permanently — the row AND the file.
 *
 * The most destructive action in the app. The UI asks first, with the exact
 * copy from masterfile §7, and never on a single click.
 *
 * stories.keepsake_frame_id and cover_frame_id are ON DELETE SET NULL in the
 * schema, so deleting the Keepsake cleanly un-sets it instead of leaving a
 * dangling reference. That's why this is three lines and not thirty.
 */
export async function deleteFrame(frameId: string, slug: string): Promise<Result> {
  return attempt(async () => {
    await requireAuthor();

    const db = supabaseAdmin();

    const { data: frame } = await db
      .from('frames')
      .select('storage_path')
      .eq('id', frameId)
      .maybeSingle();

    const { error } = await db.from('frames').delete().eq('id', frameId);
    if (error) return { ok: false, error: error.message };

    const path = frame?.storage_path as string | undefined;
    if (path) {
      const { error: storageError } = await db.storage.from(BUCKET).remove([path]);
      // Logged, not returned. The Frame is gone from the story either way, and
      // failing the whole action here would be a lie.
      if (storageError) {
        console.error('[deleteFrame] orphaned object:', path, storageError.message);
      }
    }

    refresh(slug);
    return { ok: true, data: undefined };
  });
}


/**
 * 1.2: delete several Frames in one confirmed act. Same ordering discipline as
 * deleteFrame — rows first, storage objects second, fail toward invisible
 * waste. One action instead of a client loop, so a mid-loop failure can't
 * leave the selection half-deleted with no explanation.
 */
export async function deleteFrames(frameIds: string[], slug: string): Promise<Result<{ deleted: number }>> {
  return attempt(async () => {
    await requireAuthor();
    if (frameIds.length === 0) return { ok: true, data: { deleted: 0 } };

    const db = supabaseAdmin();

    const { data: rows } = await db
      .from('frames')
      .select('id, storage_path')
      .in('id', frameIds);

    const { error } = await db.from('frames').delete().in('id', frameIds);
    if (error) return { ok: false, error: error.message };

    const paths = (rows ?? [])
      .map((r) => r.storage_path as string | null)
      .filter((p): p is string => Boolean(p));

    if (paths.length > 0) {
      const { error: storageError } = await db.storage.from(BUCKET).remove(paths);
      if (storageError) {
        console.error('[deleteFrames] orphaned objects:', paths.join(', '), storageError.message);
      }
    }

    refresh(slug);
    return { ok: true, data: { deleted: frameIds.length } };
  });
}
