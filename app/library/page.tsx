// -----------------------------------------------------------------------------
// app/library/page.tsx — The Library.
//
// Server Component: it awaits the session and the stories directly. No
// useEffect, no spinner, no client fetch — the shelf is rendered before the
// HTML leaves the server.
//
// force-dynamic because a newly created story must appear immediately.
// Without it, Next.js would happily serve a cached empty shelf.
// -----------------------------------------------------------------------------

import { auth, signOut } from '@/lib/auth';
import { copy } from '@/lib/copy';
import { getStories, getCoverUrl } from '@/lib/queries';
import StoryTile from '@/components/library/StoryTile';
import BeginChapter from '@/components/library/BeginChapter';

export const dynamic = 'force-dynamic';

export default async function LibraryPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(' ')[0] ?? 'you';

  const stories = await getStories();
  const covers = await Promise.all(stories.map((s) => getCoverUrl(s)));

  const hasStories = stories.length > 0;

  return (
    <main className="mx-auto min-h-dvh max-w-5xl px-6 py-12 sm:py-16">
      <header className="mb-16 flex items-start justify-between gap-6">
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-ink-soft">
            {copy.brand.name}
          </p>
          <h1 className="font-serif text-4xl text-ink sm:text-5xl">{copy.library.title}</h1>
          <p className="mt-3 text-sm text-ink-soft">{copy.library.greeting(firstName)}</p>
        </div>

        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/signin' });
          }}
        >
          <button
            type="submit"
            className="shrink-0 rounded-full border border-rule px-4 py-2 text-xs tracking-wide text-ink-soft transition-colors hover:border-violet-2 hover:text-violet"
          >
            {copy.nav.signOut}
          </button>
        </form>
      </header>

      {hasStories ? (
        <>
          <section className="mb-16 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {stories.map((story, i) => (
              <StoryTile key={story.id} story={story} coverUrl={covers[i]} />
            ))}
          </section>

          <div className="flex justify-center border-t border-rule pt-12">
            <BeginChapter />
          </div>
        </>
      ) : (
        <section className="flex flex-col items-center py-20 text-center sm:py-28">
          <h2 className="mb-3 font-serif text-3xl italic text-ink">{copy.library.empty}</h2>
          <p className="mb-12 max-w-xs text-sm leading-relaxed text-ink-soft">
            {copy.library.firstVisit}
          </p>
          <BeginChapter />
        </section>
      )}
    </main>
  );
}