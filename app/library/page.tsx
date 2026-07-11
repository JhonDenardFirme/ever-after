// -----------------------------------------------------------------------------
// app/library/page.tsx — The Library (1.2).
//
// Server Component: awaits the session, the couple hero, the current author (for
// their avatar), and the stories directly. No client fetch — the whole shelf is
// rendered before the HTML leaves the server.
//
// 1.2 layout: a top bar (brand · Begin + profile, upper-right), the couple hero
// as the highlight, then the described shelf of stories, then a footer.
//
// force-dynamic because a newly created story — or an edited couple hero — must
// appear immediately.
// -----------------------------------------------------------------------------

import { auth, signOut } from '@/lib/auth';
import { copy } from '@/lib/copy';
import { getStories, getCoverUrl, getCouple, getCurrentAuthor } from '@/lib/queries';
import StoryTile from '@/components/library/StoryTile';
import BeginChapter from '@/components/library/BeginChapter';
import CoupleHero from '@/components/library/CoupleHero';
import ProfileMenu from '@/components/library/ProfileMenu';

export const dynamic = 'force-dynamic';

export default async function LibraryPage() {
  const session = await auth();
  const name = session?.user?.name ?? 'you';
  const email = session?.user?.email ?? '';
  const image = session?.user?.image ?? null;

  const [stories, couple, me] = await Promise.all([getStories(), getCouple(), getCurrentAuthor()]);
  // Cover lookups run in parallel — one round trip's worth of latency, not N.
  const covers = await Promise.all(stories.map((s) => getCoverUrl(s)));

  const hasStories = stories.length > 0;

  async function doSignOut() {
    'use server';
    await signOut({ redirectTo: '/signin' });
  }

  return (
    <main className="mx-auto min-h-dvh max-w-6xl px-6 py-8 sm:py-10">
      {/* ---- Top bar ---- */}
      <header className="mb-12 flex items-center justify-between gap-4">
        <p className="text-[11px] uppercase tracking-[0.28em] text-ink-soft">{copy.brand.name}</p>

        <div className="flex items-center gap-3">
          <BeginChapter />
          <ProfileMenu
            name={name}
            email={email}
            image={image}
            avatarUrl={me?.avatar_url ?? null}
            signOutAction={doSignOut}
          />
        </div>
      </header>

      {/* ---- The couple: the highlight of the page ---- */}
      <CoupleHero couple={couple} />

      {/* ---- The shelf ---- */}
      <section id="shelf" className="scroll-mt-8">
        <div className="mb-8">
          <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-ember">
            {copy.library.shelfEyebrow}
          </p>
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
            <p className="mx-auto mb-8 max-w-xs text-sm leading-relaxed text-ink-soft">
              {copy.library.firstVisit}
            </p>
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
    </main>
  );
}
