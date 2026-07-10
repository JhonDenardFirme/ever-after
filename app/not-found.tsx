// A missing story isn't a 404 in Ever After's voice — it's a page that was
// never written. Same HTTP status, different feeling.

import Link from 'next/link';
import { copy } from '@/lib/copy';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <h1 className="mb-3 font-serif text-3xl italic text-ink">
        This page was never written.
      </h1>
      <p className="mb-8 max-w-xs text-sm text-ink-soft">
        Whatever you were looking for isn&apos;t in the library.
      </p>
      <Link
        href="/library"
        className="rounded-full border border-rule px-5 py-2.5 text-xs tracking-wide text-ink-soft transition-colors hover:border-violet-2 hover:text-violet"
      >
        {copy.prologue.back}
      </Link>
    </main>
  );
}
