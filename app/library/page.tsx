// -----------------------------------------------------------------------------
// app/library/page.tsx — The Library (1.2).
//
// Server Component. The Story Frontispiece is a dedicated full-viewport hero at
// the very top, with the brand mark + profile menu overlaid on it and "Begin a
// new chapter" at its foot (all passed in as slots). Below it, in the normal
// content column, sits the shelf of stories, then the footer.
//
// force-dynamic: a new story, an edited frontispiece, or a changed avatar must
// appear immediately.
// -----------------------------------------------------------------------------

import { auth, signOut } from '@/lib/auth';
import { copy } from '@/lib/copy';
import { getStories, getCoverUrl, getCouple, getCurrentAuthor, getAuthorsById, getStoryStats } from '@/lib/queries';
import StoryTile from '@/components/library/StoryTile';
import BeginChapter from '@/components/library/BeginChapter';
import Frontispiece from '@/components/library/Frontispiece';
import ProfileMenu from '@/components/library/ProfileMenu';

export const dynamic = 'force-dynamic';

export default async function LibraryPage() {
  const session = await auth();
  const name = session?.user?.name ?? 'you';
  const email = session?.user?.email ?? '';
  const image = session?.user?.image ?? null;

  const [stories, couple, me, authorsById] = await Promise.all([
    getStories(),
    getCouple(),
    getCurrentAuthor(),
    getAuthorsById(),
  ]);
  const stats = await getStoryStats(couple?.since ?? null);
  const covers = await Promise.all(stories.map((s) => getCoverUrl(s)));

  const authorsList = Object.values(authorsById).sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  const hasStories = stories.length > 0;

  async function doSignOut() {
    'use server';
    await signOut({ redirectTo: '/signin' });
  }

  return (
    <main className="min-h-dvh">
      {/* ---- The Story Frontispiece: a dedicated full-viewport hero ---- */}
      <Frontispiece
        couple={couple}
        authors={authorsList}
        stats={stats}
        meId={me?.id ?? null}
        brand={copy.brand.name}
        profileSlot={
          <ProfileMenu
            name={name}
            email={email}
            image={image}
            avatarUrl={me?.avatar_url ?? null}
            signOutAction={doSignOut}
          />
        }
        beginSlot={<BeginChapter openUp />}
      />

      {/* ---- The shelf ---- */}
      <div className="mx-auto max-w-6xl px-6 pb-16">
        <section id="shelf" className="scroll-mt-8 pt-20">
          <div className="mb-8">
            <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-ember">{copy.library.shelfEyebrow}</p>
            <h1 className="mb-3 bg-ever-gradient bg-clip-text font-serif text-4xl text-transparent sm:text-5xl">
              {hasStories ? copy.library.shelfTitle : copy.library.empty}
            </h1>
            <p className="max-w-lg text-sm leading-relaxed text-ink-soft">
              {hasStories ? copy.library.shelfDescription : copy.library.firstVisit}
            </p>
          </div>

          {hasStories ? (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 sm:gap-6">
              {stories.map((story, i) => (
                <StoryTile key={story.id} story={story} coverUrl={covers[i]} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-rule-strong bg-paper2/50 px-6 py-20 text-center">
              <p className="mx-auto mb-8 max-w-xs text-sm leading-relaxed text-ink-soft">{copy.library.firstVisit}</p>
              <div className="flex justify-center">
                <BeginChapter />
              </div>
            </div>
          )}
        </section>

        {/* ---- Footer ---- */}
        <footer className="mt-20 border-t border-rule pt-8 text-center">
          <p className="font-serif text-sm italic text-ink-soft">{copy.library.footer}</p>
        </footer>
      </div>
    </main>
  );
}
