'use client';
// -----------------------------------------------------------------------------
// components/afterword/AfterwordClear.tsx (1.2)
//
// A single "Clear the Afterword" control at the foot of the Afterword page. It
// opens a centred confirmation over a blurred backdrop (the same feeling as the
// album's cover menu) and, on confirm, erases every answer + the Keepsake choice.
// -----------------------------------------------------------------------------

import { useState, useEffect, useTransition } from 'react';
import { clearAfterword } from '@/app/actions/afterword';
import { copy } from '@/lib/copy';
import { TrashIcon } from '@/components/ui/icons';

export default function AfterwordClear({ storyId, slug }: { storyId: string; slug: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function run() {
    setError(null);
    startTransition(async () => {
      const result = await clearAfterword(storyId, slug);
      if (result.ok) setOpen(false);
      else setError(result.error);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-rule px-5 py-2.5 text-xs tracking-wide text-ink-soft transition-colors hover:border-ember hover:text-ember"
      >
        <TrashIcon size={13} />
        {copy.afterword.clear}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-violet-deep/30 p-6 backdrop-blur-md"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-rule bg-paper p-7 text-center shadow-glow"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-6 font-serif text-lg leading-relaxed text-ink">{copy.afterword.clearConfirm}</p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="rounded-full border border-rule px-5 py-2.5 text-xs tracking-wide text-ink-soft hover:border-violet-2 hover:text-violet disabled:opacity-60"
              >
                {copy.afterword.clearNo}
              </button>
              <button
                type="button"
                onClick={run}
                disabled={isPending}
                className="rounded-full bg-ember px-5 py-2.5 text-xs tracking-wide text-paper disabled:opacity-60"
              >
                {isPending ? copy.afterword.clearing : copy.afterword.clearYes}
              </button>
            </div>
            {error && <p role="alert" className="mt-3 text-xs text-ember">{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}
