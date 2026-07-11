'use server';
// -----------------------------------------------------------------------------
// app/actions/afterword.ts
//
// One action. It writes an answer, and — depending on the question's
// `answer_kind` — quietly does one more thing:
//
//   'frame' (Q1) -> the chosen Frame becomes The Keepsake.
//   'word'  (Q8) -> the word becomes the story's Theme, IF the story has none.
//
// Both side-effects are announced in the UI before they happen (see
// copy.afterword.keepsakeNote / themeNote). A side-effect nobody was told
// about is just a bug with good manners.
//
// The Theme one is conditional on purpose: if you already named the Theme in
// the Prologue, the Afterword must not silently overwrite it months later.
// The Keepsake one is unconditional, because Q1 literally asks "which Frame
// brings the whole day back" — that IS the Keepsake, by definition.
// -----------------------------------------------------------------------------

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { requireAuthor, attempt, type Result } from '@/lib/guard';
import { supabaseAdmin } from '@/lib/supabase';
import { copy } from '@/lib/copy';
import type { AfterwordEntry, AnswerKind } from '@/lib/types';

const BUCKET = 'frames';
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

function refresh(slug: string) {
  revalidatePath(`/story/${slug}/afterword`);
  revalidatePath(`/story/${slug}`);
  revalidatePath(`/story/${slug}/frames`);
  revalidatePath('/library'); // Theme + cover show on the shelf
}

/**
 * Write (or rewrite) this author's answer to one question.
 *
 * The upsert leans on `unique (question_id, author_id)` from the schema:
 * answering twice edits your answer, it never creates a second one — and it
 * never touches the other author's. Both answers live side by side.
 *
 * Passing an empty answer deletes it, which is how you un-answer a question
 * without a separate action.
 */
export async function answerQuestion(
  storyId: string,
  slug: string,
  questionId: string,
  kind: AnswerKind,
  value: string | null
): Promise<Result<AfterwordEntry | null>> {
  return attempt(async () => {
    const author = await requireAuthor();
    const db = supabaseAdmin();

    const clean = (value ?? '').trim();

    // --- Un-answering ---
    if (clean === '') {
      const { error } = await db
        .from('afterword_entries')
        .delete()
        .eq('question_id', questionId)
        .eq('author_id', author.id);

      if (error) return { ok: false, error: error.message };

      refresh(slug);
      return { ok: true, data: null };
    }

    // --- Answering ---
    const row = {
      question_id: questionId,
      author_id: author.id,
      answer_text: kind === 'frame' ? null : clean,
      answer_frame_id: kind === 'frame' ? clean : null,
      created_at: new Date().toISOString(), // the Signature date, refreshed on edit
    };

    const { data, error } = await db
      .from('afterword_entries')
      .upsert(row, { onConflict: 'question_id,author_id' })
      .select('*')
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? copy.afterword.saveError };
    }

    // --- The side-effects ---
    if (kind === 'frame') {
      // Q1's answer IS the Keepsake. Set it, and adopt it as the cover if the
      // story doesn't have one yet — same rule as the setKeepsake action.
      const { data: story } = await db
        .from('stories')
        .select('cover_frame_id')
        .eq('id', storyId)
        .maybeSingle();

      const patch: Record<string, string> = { keepsake_frame_id: clean };
      if (!story?.cover_frame_id) patch.cover_frame_id = clean;

      const { error: keepsakeError } = await db.from('stories').update(patch).eq('id', storyId);
      if (keepsakeError) console.error('[answerQuestion] keepsake:', keepsakeError.message);
    }

    if (kind === 'word') {
      // Only if the Prologue left it blank. Never overwrite a Theme someone
      // chose deliberately.
      const { data: story } = await db
        .from('stories')
        .select('theme')
        .eq('id', storyId)
        .maybeSingle();

      if (!story?.theme) {
        const { error: themeError } = await db
          .from('stories')
          .update({ theme: clean })
          .eq('id', storyId);
        if (themeError) console.error('[answerQuestion] theme:', themeError.message);
      }
    }

    refresh(slug);
    return { ok: true, data: data as AfterwordEntry };
  });
}

/** Find the story's Keepsake question (the new sectioned one preferred). */
async function keepsakeQuestionId(db: ReturnType<typeof supabaseAdmin>, storyId: string): Promise<string | null> {
  const { data } = await db
    .from('afterword_questions')
    .select('id, section')
    .eq('story_id', storyId)
    .eq('answer_kind', 'frame');
  const rows = (data ?? []) as { id: string; section: string | null }[];
  const chosen = rows.find((r) => r.section === 'keepsake') ?? rows[0];
  return chosen?.id ?? null;
}

/**
 * 1.2: mark an EXISTING Frame as *my* Keepsake (from the lightbox). Records it
 * as this author's answer to the Keepsake question, sets it as the story cover
 * if there isn't one, and keeps stories.keepsake_frame_id pointing at a real
 * Keepsake for the cover/legacy view. Two authors → two Keepsakes.
 */
export async function setMyKeepsake(storyId: string, slug: string, frameId: string): Promise<Result> {
  return attempt(async () => {
    const author = await requireAuthor();
    const db = supabaseAdmin();

    const questionId = await keepsakeQuestionId(db, storyId);
    if (!questionId) return { ok: false, error: copy.validation.generic };

    const { error: entryError } = await db.from('afterword_entries').upsert(
      {
        question_id: questionId,
        author_id: author.id,
        answer_text: null,
        answer_frame_id: frameId,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'question_id,author_id' }
    );
    if (entryError) return { ok: false, error: entryError.message };

    const { data: story } = await db.from('stories').select('cover_frame_id').eq('id', storyId).maybeSingle();
    const patch: Record<string, string> = { keepsake_frame_id: frameId };
    if (!story?.cover_frame_id) patch.cover_frame_id = frameId;
    await db.from('stories').update(patch).eq('id', storyId);

    refresh(slug);
    return { ok: true, data: undefined };
  });
}

/** Remove *my* Keepsake. Deletes my entry and re-points the legacy single
 *  keepsake_frame_id at whatever Keepsake remains (the other author's), or null. */
export async function removeMyKeepsake(storyId: string, slug: string): Promise<Result> {
  return attempt(async () => {
    const author = await requireAuthor();
    const db = supabaseAdmin();

    const questionId = await keepsakeQuestionId(db, storyId);
    if (!questionId) return { ok: true, data: undefined };

    await db
      .from('afterword_entries')
      .delete()
      .eq('question_id', questionId)
      .eq('author_id', author.id);

    const { data: remaining } = await db
      .from('afterword_entries')
      .select('answer_frame_id')
      .eq('question_id', questionId)
      .not('answer_frame_id', 'is', null)
      .limit(1)
      .maybeSingle();

    await db
      .from('stories')
      .update({ keepsake_frame_id: (remaining?.answer_frame_id as string | undefined) ?? null })
      .eq('id', storyId);

    refresh(slug);
    return { ok: true, data: undefined };
  });
}

/**
 * 1.2: The Keepsake is now an INDEPENDENT upload, not a picker over existing
 * Frames. This uploads a photograph, writes it as a story-level Frame (story_id
 * set, no Moment — that's what migration 1.2-D's frames.story_id is for), makes
 * it The Keepsake (and the cover, if there isn't one), and records it as this
 * author's answer to the Keepsake question.
 *
 * Storage-first, then the row — same discipline as developFrame; on a row
 * failure the orphaned object is removed.
 */
export async function developKeepsake(
  storyId: string,
  slug: string,
  questionId: string,
  formData: FormData
): Promise<Result<{ frameId: string }>> {
  return attempt(async () => {
    const author = await requireAuthor();

    const file = formData.get('file') as File | null;
    const width = Number(formData.get('width')) || null;
    const height = Number(formData.get('height')) || null;
    if (!file || file.size === 0) return { ok: false, error: copy.validation.noPhotograph };
    if (!file.type.startsWith('image/')) return { ok: false, error: copy.frames.notAnImage };
    if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: copy.frames.tooLarge };

    const db = supabaseAdmin();

    // --- storage first ---
    const rawExt = (file.name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${randomUUID()}.${rawExt || 'jpg'}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await db.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: false });
    if (uploadError) return { ok: false, error: uploadError.message };

    const {
      data: { publicUrl },
    } = db.storage.from(BUCKET).getPublicUrl(path);

    // --- then the story-level Frame ---
    const { data: frame, error: frameError } = await db
      .from('frames')
      .insert({
        story_id: storyId,
        chapter_id: null,
        media_url: publicUrl,
        storage_path: path,
        media_type: 'image',
        status: 'developed',
        developed_by: author.id,
        authored_by: author.id,
        developed_at: new Date().toISOString(),
        width,
        height,
      })
      .select('id')
      .single();

    if (frameError || !frame) {
      await db.storage.from(BUCKET).remove([path]);
      return { ok: false, error: frameError?.message ?? copy.frames.developError };
    }

    const frameId = frame.id as string;

    // The Keepsake (+ cover if none yet).
    const { data: story } = await db
      .from('stories')
      .select('cover_frame_id')
      .eq('id', storyId)
      .maybeSingle();
    const patch: Record<string, string> = { keepsake_frame_id: frameId };
    if (!story?.cover_frame_id) patch.cover_frame_id = frameId;
    await db.from('stories').update(patch).eq('id', storyId);

    // Record it as this author's answer to the Keepsake question.
    await db.from('afterword_entries').upsert(
      {
        question_id: questionId,
        author_id: author.id,
        answer_text: null,
        answer_frame_id: frameId,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'question_id,author_id' }
    );

    refresh(slug);
    return { ok: true, data: { frameId } };
  });
}
