'use server';
// -----------------------------------------------------------------------------
// app/actions/stories.ts
//
// Every write to the `stories` table goes through here. Two things worth
// remembering about Server Actions:
//
//  1. They are PUBLIC HTTP ENDPOINTS. Middleware protects routes, not actions.
//     Anyone who knows the action ID can POST to it. So every action
//     re-checks the session itself. `requireAuthor()` below is not paranoia,
//     it's the actual security boundary.
//
//  2. After a write, revalidatePath() tells Next.js "this route's data is
//     stale, re-render it." Forget it and the DB updates while the screen
//     doesn't, which is a genuinely maddening twenty minutes of debugging.
// -----------------------------------------------------------------------------

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { slugify } from '@/lib/slug';
import { DEFAULT_AFTERWORD_QUESTIONS } from '@/lib/copy';
import type { Story } from '@/lib/types';

type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Confirms there's a signed-in session AND that the email maps to a row in
 * `authors`. Returns the author id so writes can be attributed later
 * (Phase 3's Waiting Frames need this; Phase 2 only needs the guard).
 */
async function requireAuthor(): Promise<{ id: string; email: string }> {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) throw new Error('Not signed in.');

  const { data, error } = await supabaseAdmin()
    .from('authors')
    .select('id, email')
    .eq('email', email)
    .maybeSingle();

  if (error || !data) {
    // Signed in with Google + on the allowlist, but no row in `authors`.
    // Means the seed emails in schema.sql don't match the real Gmail address.
    throw new Error(`No author row for ${email} — check the seed in schema.sql.`);
  }
  return data as { id: string; email: string };
}

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
  // Fifty stories with the same name is not a real scenario, but never loop
  // forever on a hunch.
  return `${base}-${Date.now()}`;
}

/**
 * Begin a new chapter. Creates the story, then seeds its eight Afterword
 * questions so /afterword works from day one without a "generate questions"
 * step the reader would have to think about.
 *
 * The question seed is per-story on purpose: editing the defaults in copy.ts
 * later must not silently rewrite the questions of stories already written.
 */
export async function createStory(title: string): Promise<Result<{ slug: string }>> {
  try {
    await requireAuthor();

    const clean = title.trim();
    if (!clean) return { ok: false, error: 'A story needs a name.' };

    const db = supabaseAdmin();
    const slug = await uniqueSlug(clean);

    const { data: story, error: storyError } = await db
      .from('stories')
      .insert({ title: clean, slug })
      .select('id, slug')
      .single();

    if (storyError || !story) {
      console.error('[createStory] insert:', storyError?.message);
      return { ok: false, error: storyError?.message ?? 'Could not create the story.' };
    }

    const { error: qError } = await db.from('afterword_questions').insert(
      DEFAULT_AFTERWORD_QUESTIONS.map((q, i) => ({
        story_id: story.id,
        question: q.question,
        answer_kind: q.answer_kind,
        sort_order: i + 1,
      }))
    );

    // A story without its questions is recoverable (Phase 5 can backfill), so
    // don't roll back and lose the story over it. Just make the failure loud.
    if (qError) console.error('[createStory] seeding afterword questions:', qError.message);

    revalidatePath('/library');
    return { ok: true, data: { slug: story.slug as string } };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    console.error('[createStory]', message);
    return { ok: false, error: message };
  }
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
 * blur, so batching would only add a "dirty state" problem I don't want.
 *
 * Empty string is normalized to null, so an emptied field reads as absent
 * rather than as an empty string (matters for `field ?? placeholder` checks).
 *
 * Note: changing the title does NOT re-slug the story. Slugs are permanent
 * once created — a shared link should never rot because someone fixed a typo.
 */
export async function updateStory(
  storyId: string,
  field: EditableField,
  value: string
): Promise<Result<Story>> {
  try {
    await requireAuthor();

    if (!EDITABLE.includes(field)) {
      return { ok: false, error: `"${field}" isn't an editable field.` };
    }

    const trimmed = value.trim();

    // Dates come from <input type="date"> as "" or "YYYY-MM-DD". Postgres
    // rejects "" for a date column, so null it out explicitly.
    const next = trimmed === '' ? null : trimmed;

    if (field === 'title' && next === null) {
      return { ok: false, error: 'A story needs a name.' };
    }

    const { data, error } = await supabaseAdmin()
      .from('stories')
      .update({ [field]: next, updated_at: new Date().toISOString() })
      .eq('id', storyId)
      .select('*')
      .single();

    if (error || !data) {
      console.error('[updateStory]', error?.message);
      return { ok: false, error: error?.message ?? 'Could not save.' };
    }

    const story = data as Story;
    revalidatePath(`/story/${story.slug}`);
    revalidatePath('/library');
    return { ok: true, data: story };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    console.error('[updateStory]', message);
    return { ok: false, error: message };
  }
}
