// -----------------------------------------------------------------------------
// app/library/page.tsx — The Library (Phase 1 placeholder).
//
// This is a Server Component: it can `await auth()` directly, no useEffect,
// no loading spinner, no client fetch. The session is read on the server and
// the greeting renders in the first paint.
//
// Phase 2 replaces the empty state with real story tiles + shelfLift motion
// and wires "Begin a new chapter" to a createStory Server Action. The layout
// shell here (header, greeting, main region) is built to survive that —
// Phase 2 swaps the <section>, not the page.
// -----------------------------------------------------------------------------

import { auth, signOut } from '@/lib/auth';
import { copy } from '@/lib/copy';

export default async function LibraryPage() {
  const session = await auth();
  // Middleware guarantees a session exists here, but I never trust a
  // guarantee I can also check for free:
  const firstName = session?.user?.name?.split(' ')[0] ?? 'you';

  return (
    <main className="mx-auto min-h-dvh max-w-4xl px-6 py-12 sm:py-16">
      {/* ---- Header ---- */}
      <header className="mb-16 flex items-start justify-between">
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-ink-soft">
            {copy.brand.name}
          </p>
          <h1 className="font-serif text-4xl text-ink sm:text-5xl">
            {copy.library.title}
          </h1>
        </div>

        {/* Sign out — NextAuth signOut via inline Server Action, same
            form-action pattern as sign-in. */}
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/signin' });
          }}
        >
          <button
            type="submit"
            className="rounded-full border border-rule px-4 py-2 text-xs tracking-wide text-ink-soft transition-colors hover:border-violet-2 hover:text-violet"
          >
            {copy.nav.signOut}
          </button>
        </form>
      </header>

      {/* ---- Empty shelf (Phase 2 fills this) ---- */}
      <section className="flex flex-col items-center py-24 text-center">
        <p className="mb-3 text-sm text-ink-soft">
          {copy.library.greeting(firstName)}
        </p>
        <h2 className="mb-2 font-serif text-2xl italic text-ink">
          {copy.library.empty}
        </h2>
        <p className="mb-10 max-w-xs text-sm text-ink-soft">
          {copy.library.firstVisit}
        </p>

        {/* Real in Phase 2 — for now it's an honest preview of the primary
            action, disabled so nothing pretends to work before it does. */}
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-full bg-violet px-7 py-3.5 text-sm tracking-wide text-paper opacity-50"
        >
          {copy.library.begin}
        </button>
      </section>
    </main>
  );
}
