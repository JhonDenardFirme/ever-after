// -----------------------------------------------------------------------------
// app/story/[slug]/storyboard/page.tsx — The Outline.
//
// Server Component: fetches the story, its beats, its frames, and both
// authors, then hands everything to one client orchestrator. Selection state
// is the only thing that lives in the browser.
//
// force-dynamic: a beat added or reordered must show up immediately.
// -----------------------------------------------------------------------------

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getStoryBySlug, getChapters, getFramesForStory, getAuthorsById } from '@/lib/queries';
import { copy } from '@/lib/copy';
import StoryboardView from '@/components/storyboard/StoryboardView';

export const dynamic = 'force-dynamic';

export default async function StoryboardPage({ params }: { params: { slug: string } }) {
  const story = await getStoryBySlug(params.slug);
  if (!story) notFound();

  // Independent reads, so fire them together rather than waterfalling.
  const [beats, frames, authors] = await Promise.all([
    getChapters(story.id),
    getFramesForStory(story.id),
    getAuthorsById(),
  ]);

  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-6 py-12 sm:py-16">
      <header className="mb-12">
        <Link
          href={`/story/${story.slug}`}
          className="mb-8 inline-block text-[11px] uppercase tracking-[0.2em] text-ink-soft transition-colors hover:text-violet"
        >
          ← {story.title}
        </Link>

        <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-ember">
          {copy.storyboard.eyebrow}
        </p>
        <h1 className="mb-3 font-serif text-4xl text-ink sm:text-5xl">
          {copy.storyboard.title}
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-ink-soft">
          {copy.storyboard.lead}
        </p>
      </header>

      <StoryboardView
        storyId={story.id}
        slug={story.slug}
        beats={beats}
        frames={frames}
        authors={authors}
      />
    </main>
  );
}
