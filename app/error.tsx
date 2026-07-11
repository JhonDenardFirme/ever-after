'use client';
// -----------------------------------------------------------------------------
// app/error.tsx — the error boundary.
//
// lib/queries.ts fails soft (logs, returns null/[]) because a Server Component
// that throws takes the whole route down. This catches everything else —
// mostly a Server Action rejecting, or a render-time bug.
//
// Even the failure speaks in Ever After's voice. "Something came loose" is a
// bookbinding word, not a stack trace. Masterfile Rule 5: an error is a pause
// in the story, not a system failure.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';
import { copy } from '@/lib/copy';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[boundary]', error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <h1 className="mb-3 font-serif text-3xl italic text-ink">{copy.errors.title}</h1>
      <p className="mb-8 max-w-xs text-sm text-ink-soft">{copy.errors.lead}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-violet px-6 py-3 text-xs tracking-wide text-paper transition-colors hover:bg-violet-2"
      >
        {copy.errors.retry}
      </button>
    </main>
  );
}
