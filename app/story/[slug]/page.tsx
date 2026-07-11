// -----------------------------------------------------------------------------
// app/story/[slug]/page.tsx — The Fleeting Frames (the album). (1.2)
//
// The consolidated album page. Server Component: fetches the story, its cover,
// its Moments, its Frames, and both authors, then composes the sections:
//
//   Cover banner → Prologue (view by default) → Soundtrack → The Story feed
//   → a way through to the Outline + Afterword → Develop, at the foot.
//
// The Outline still lives at /storyboard and the Afterword at /afterword for
// now (they fold in / get their rebuild in Batch 3); the links below keep them
// reachable. The Develop button has moved here from the Afterword, per the brief.
//
// force-dynamic: an edited field, a new cover, or a freshly developed Frame must
// appear immediately.
// -----------------------------------------------------------------------------

import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getStoryBySlug,
  getCoverUrl,
  getChapters,
  getFramesForStory,
  getAuthorsById,
} from '@/lib/queries';
import { copy } from '@/lib/copy';
import CoverBanner from '@/components/prologue/CoverBanner';
import PrologueSection from '@/components/prologue/PrologueSection';
import Soundtrack from '@/components/soundtrack/Soundtrack';
import PhotoFeed from '@/components/story/PhotoFeed';

export const dynamic = 'force-dynamic';

export default async function StoryPage({ params }: { params: { slug: string } }) {
  const story = await getStoryBySlug(params.slug);
  if (!story) notFound();

  const [coverUrl, chapters, frames, authors] = await Promise.all([
    getCoverUrl(story),
    getChapters(story.id),
    getFramesForStory(story.id),
    getAuthorsById(),
  ]);

  return (
    <main className="min-h-dvh">
      {/* Back link floats over the cover. The strip itself is click-through
          (pointer-events-none) so it never obstructs the cover menu; only the
          link is interactive. */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 px-6 py-5">
        <Link
          href="/library"
          className="pointer-events-auto text-[11px] uppercase tracking-[0.2em] text-paper/70 transition-colors hover:text-paper"
        >
          ← {copy.prologue.back}
        </Link>
      </div>

      <CoverBanner
        storyId={story.id}
        slug={story.slug}
        coverUrl={coverUrl}
        title={story.title || copy.library.untitled}
        theme={story.theme}
      />

      <PrologueSection story={story} coverUrl={coverUrl} />

      <Soundtrack storyId={story.id} slug={story.slug} soundtrack={story.soundtrack} />

      <PhotoFeed
        storyId={story.id}
        slug={story.slug}
        chapters={chapters}
        frames={frames}
        keepsakeId={story.keepsake_frame_id}
        authors={authors}
      />

      {/* Onward — the Outline and the Afterword (fold in during Batch 3) */}
      <div className="mx-auto grid max-w-2xl gap-3 px-6 pb-6 sm:grid-cols-2">
        <Link
          href={`/story/${story.slug}/storyboard`}
          className="block rounded-2xl border border-rule bg-paper2 px-6 py-5 text-center transition-colors hover:border-violet-2"
        >
          <p className="mb-1 text-[10px] uppercase tracking-[0.24em] text-ink-soft">
            {copy.storyboard.eyebrow}
          </p>
          <p className="font-serif text-xl text-ink">{copy.prologue.toStoryboard}</p>
        </Link>

        <Link
          href={`/story/${story.slug}/afterword`}
          className="block rounded-2xl border border-rule bg-paper2 px-6 py-5 text-center transition-colors hover:border-violet-2"
        >
          <p className="mb-1 text-[10px] uppercase tracking-[0.24em] text-ember">
            {copy.afterword.eyebrow}
          </p>
          <p className="font-serif text-xl text-ink">{copy.afterword.toAfterword}</p>
        </Link>
      </div>

      {/* Develop — the whole thing, for paper. Now lives at the album's foot. */}
      <div className="mx-auto max-w-2xl px-6 pb-24 pt-6 text-center">
        <div className="border-t border-rule pt-10">
          <Link
            href={`/story/${story.slug}/print`}
            className="inline-block rounded-full bg-violet px-8 py-4 text-sm tracking-wide text-paper shadow-glow-soft transition-colors hover:bg-violet-2"
          >
            {copy.print.action}
          </Link>
          <p className="mt-3 text-xs italic text-ink-soft">{copy.print.hint}</p>
        </div>
      </div>
    </main>
  );
}
