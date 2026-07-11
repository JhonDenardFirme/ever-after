// -----------------------------------------------------------------------------
// app/story/[slug]/frames/page.tsx — the story itself.
//
// Server Component. Fetches once, hands everything to one client orchestrator
// whose only state is which view is showing.
//
// force-dynamic: a Frame developed on a phone should appear on a laptop's next
// refresh without a cache fight.
// -----------------------------------------------------------------------------

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getStoryBySlug, getChapters, getFramesForStory, getAuthorsById } from '@/lib/queries';
import { copy } from '@/lib/copy';
import FramesView from '@/components/frames/FramesView';

export const dynamic = 'force-dynamic';

export default async function FramesPage({ params }: { params: { slug: string } }) {
  const story = await getStoryBySlug(params.slug);
  if (!story) notFound();

  const [chapters, frames, authors] = await Promise.all([
    getChapters(story.id),
    getFramesForStory(story.id),
    getAuthorsById(),
  ]);

  return (
    <main className="mx-auto min-h-dvh max-w-4xl px-6 py-12 sm:py-16">
      <header className="mb-10">
        <Link
          href={`/story/${story.slug}`}
          className="mb-8 inline-block text-[11px] uppercase tracking-[0.2em] text-ink-soft transition-colors hover:text-violet"
        >
          ← {story.title}
        </Link>

        <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-ember">
          {copy.frames.eyebrow}
        </p>
        <h1 className="font-serif text-4xl text-ink sm:text-5xl">{story.title}</h1>
        {story.setting && (
          <p className="mt-2 text-sm text-ink-soft">{story.setting}</p>
        )}
      </header>

      <FramesView
        storyId={story.id}
        slug={story.slug}
        chapters={chapters}
        frames={frames}
        keepsakeId={story.keepsake_frame_id}
        authors={authors}
      />
    </main>
  );
}
