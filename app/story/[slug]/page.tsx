// -----------------------------------------------------------------------------
// app/story/[slug]/page.tsx — The Prologue.
//
// A story's opening pages. Server Component: fetches the story by slug,
// 404s if it doesn't exist, hands the data to two client components (the
// parallax hero and the editable body).
//
// notFound() is Next's built-in — it renders the nearest not-found.tsx and
// returns a real 404 status, rather than us hand-rolling an "oops" page.
//
// Phase 3 adds the storyboard link to this page's footer; Phase 4 gives the
// hero a real cover. Neither requires touching this file's structure.
// -----------------------------------------------------------------------------

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getStoryBySlug, getCoverUrl } from '@/lib/queries';
import { copy } from '@/lib/copy';
import PrologueHero from '@/components/prologue/PrologueHero';
import PrologueBody from '@/components/prologue/PrologueBody';

export const dynamic = 'force-dynamic';

export default async function ProloguePage({ params }: { params: { slug: string } }) {
  const story = await getStoryBySlug(params.slug);
  if (!story) notFound();

  const coverUrl = await getCoverUrl(story);

  return (
    <main className="min-h-dvh">
      {/* Back link floats over the cover — no chrome bar, nothing between you
          and the image. */}
      <div className="absolute left-0 right-0 top-0 z-10 px-6 py-5">
        <Link
          href="/library"
          className="text-[11px] uppercase tracking-[0.2em] text-paper/70 transition-colors hover:text-paper"
        >
          ← {copy.prologue.back}
        </Link>
      </div>

      <PrologueHero coverUrl={coverUrl} theme={story.theme} />

      <p className="pt-10 text-center text-[10px] uppercase tracking-[0.3em] text-ink-soft">
        {copy.prologue.eyebrow}
      </p>

      <PrologueBody story={story} />
    </main>
  );
}
