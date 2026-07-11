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

import { revalidatePath } from 'next/cache';
import { requireAuthor, attempt, type Result } from '@/lib/guard';
import { supabaseAdmin } from '@/lib/supabase';
import { copy } from '@/lib/copy';
import type { AfterwordEntry, AnswerKind } from '@/lib/types';

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
