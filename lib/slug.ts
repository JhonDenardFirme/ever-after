// -----------------------------------------------------------------------------
// lib/slug.ts
//
// "Tagaytay II" -> "tagaytay-ii". No dependency needed for this; a regex does
// it. Uniqueness is NOT handled here — createStory checks the DB and appends
// -2, -3 etc. if the slug is taken. Kept pure so it's trivially testable.
// -----------------------------------------------------------------------------

export function slugify(input: string): string {
  const base = input
    .normalize('NFKD')            // "é" -> "e" + combining accent
    .replace(/[\u0300-\u036f]/g, '') // strip the accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // drop punctuation
    .replace(/\s+/g, '-')         // spaces -> hyphens
    .replace(/-+/g, '-')          // collapse runs
    .replace(/^-|-$/g, '');       // trim stray hyphens

  // A title of pure punctuation ("???") would slugify to "" and break the
  // unique constraint on the second try. Fall back to something valid.
  return base || 'untitled';
}
