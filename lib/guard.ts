import 'server-only';
// -----------------------------------------------------------------------------
// lib/guard.ts
//
// The security boundary for every Server Action in the app.
//
// Worth restating, because it's the thing that's easy to forget: middleware
// protects ROUTES. It does nothing for a Server Action, which compiles down to
// a public POST endpoint with a generated ID sitting in the page source.
// Anyone who finds that ID can call it. So every action calls requireAuthor()
// first — no exceptions, not even for reads-that-look-harmless.
//
// Lifted out of app/actions/stories.ts in Phase 3, when chapters.ts and
// frames.ts needed the same thing. One copy, one place to get it right.
// -----------------------------------------------------------------------------

import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { copy } from '@/lib/copy';
import type { Author } from '@/lib/types';

/**
 * Confirms there's a signed-in session AND that its email maps to a row in
 * `authors`. Returns the full author so actions can attribute writes
 * (a Waiting Frame records who left it — that's `authored_by`).
 *
 * Throws rather than returning null: an action that forgets to check the
 * result should fail loudly, not write anonymously.
 */
export async function requireAuthor(): Promise<Author> {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) throw new Error(copy.validation.notSignedIn);

  const { data, error } = await supabaseAdmin()
    .from('authors')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error || !data) {
    // Signed in with Google + passed the allowlist, but no row in `authors`.
    // Means the seed emails in schema.sql don't match the real Gmail address.
    throw new Error(`No author row for ${email} — check the seed in schema.sql.`);
  }

  return data as Author;
}

/** The shape every action returns. Never throw across the network boundary. */
export type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };

/** Wraps an action body so thrown errors become { ok: false } instead of a 500. */
export async function attempt<T>(fn: () => Promise<Result<T>>): Promise<Result<T>> {
  try {
    return await fn();
  } catch (err) {
    const error = err instanceof Error ? err.message : copy.validation.generic;
    console.error('[action]', error);
    return { ok: false, error };
  }
}
