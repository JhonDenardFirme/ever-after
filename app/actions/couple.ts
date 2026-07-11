'use server';
// -----------------------------------------------------------------------------
// app/actions/couple.ts (1.2)
//
// The couple hero on The Library, plus profile avatars. Both write to the
// single-row `couple` table (id = 1) and the `authors.avatar_url` column, and
// both store their images in the public `profiles` bucket.
//
// Photos use a DETERMINISTIC path per slot (couple/member-one, avatars/<id>)
// with upsert: true — re-uploading overwrites in place, so we never leak a
// trail of orphaned objects the way a random-UUID name would. A ?v= cache-bust
// on the stored URL makes the browser pick up the new pixels immediately.
//
// Same guard as every action. See lib/guard.ts.
// -----------------------------------------------------------------------------

import { revalidatePath } from 'next/cache';
import { requireAuthor, attempt, type Result } from '@/lib/guard';
import { supabaseAdmin } from '@/lib/supabase';
import { copy } from '@/lib/copy';
import type { Couple } from '@/lib/types';

const BUCKET = 'profiles';
const MAX_IMAGE_BYTES = 6 * 1024 * 1024; // post-compression sanity ceiling

// Only these columns may be written from the client.
const EDITABLE = [
  'headline',
  'story',
  'member_one_name',
  'member_one_note',
  'member_two_name',
  'member_two_note',
] as const;

export type CoupleField = (typeof EDITABLE)[number];
export type CoupleInput = Partial<Record<CoupleField, string>>;

/**
 * Save the couple hero's text. The form saves as a whole (edit → form → save →
 * view), so this takes the full set of fields and upserts the single row.
 * Empty strings normalize to null so the view mode can hide unfilled fields.
 */
export async function saveCouple(input: CoupleInput): Promise<Result<Couple>> {
  return attempt(async () => {
    await requireAuthor();

    const patch: Record<string, string | number | null> = {
      id: 1,
      updated_at: new Date().toISOString(),
    };
    for (const field of EDITABLE) {
      if (field in input) {
        const trimmed = (input[field] ?? '').trim();
        patch[field] = trimmed === '' ? null : trimmed;
      }
    }

    const { data, error } = await supabaseAdmin()
      .from('couple')
      .upsert(patch, { onConflict: 'id' })
      .select('*')
      .single();

    if (error || !data) return { ok: false, error: error?.message ?? copy.couple.saveError };

    revalidatePath('/library');
    return { ok: true, data: data as Couple };
  });
}

/** Upload one member's photo. `which` is 'one' | 'two'. */
export async function uploadCouplePhoto(which: 'one' | 'two', formData: FormData): Promise<Result<Couple>> {
  return attempt(async () => {
    await requireAuthor();

    const file = formData.get('file') as File | null;
    if (!file || file.size === 0) return { ok: false, error: copy.validation.noPhotograph };
    if (!file.type.startsWith('image/')) return { ok: false, error: copy.frames.notAnImage };
    if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: copy.frames.tooLarge };

    const db = supabaseAdmin();
    const path = `couple/member-${which}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await db.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: true });
    if (uploadError) return { ok: false, error: uploadError.message };

    const {
      data: { publicUrl },
    } = db.storage.from(BUCKET).getPublicUrl(path);
    const bustedUrl = `${publicUrl}?v=${Date.now()}`;

    const column = which === 'one' ? 'member_one_photo_url' : 'member_two_photo_url';
    const { data, error } = await db
      .from('couple')
      .upsert({ id: 1, [column]: bustedUrl, updated_at: new Date().toISOString() }, { onConflict: 'id' })
      .select('*')
      .single();

    if (error || !data) return { ok: false, error: error?.message ?? copy.couple.saveError };

    revalidatePath('/library');
    return { ok: true, data: data as Couple };
  });
}

/** Upload the signed-in author's own profile picture. */
export async function uploadAvatar(formData: FormData): Promise<Result<{ avatar_url: string }>> {
  return attempt(async () => {
    const author = await requireAuthor();

    const file = formData.get('file') as File | null;
    if (!file || file.size === 0) return { ok: false, error: copy.validation.noPhotograph };
    if (!file.type.startsWith('image/')) return { ok: false, error: copy.frames.notAnImage };
    if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: copy.frames.tooLarge };

    const db = supabaseAdmin();
    const path = `avatars/${author.id}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await db.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: true });
    if (uploadError) return { ok: false, error: uploadError.message };

    const {
      data: { publicUrl },
    } = db.storage.from(BUCKET).getPublicUrl(path);
    const bustedUrl = `${publicUrl}?v=${Date.now()}`;

    const { error } = await db.from('authors').update({ avatar_url: bustedUrl }).eq('id', author.id);
    if (error) return { ok: false, error: error.message };

    revalidatePath('/library');
    return { ok: true, data: { avatar_url: bustedUrl } };
  });
}
