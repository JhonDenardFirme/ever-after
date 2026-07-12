'use client';
// -----------------------------------------------------------------------------
// components/library/BeginChapter.tsx
//
// "Begin a new chapter" — the single primary action in The Library.
//
// Rather than a modal (heavy, needs focus trapping, feels like software), the
// button swaps itself for a small inline field. Press Enter or Begin, and the
// createStory action runs and redirects into the new Prologue.
//
// useTransition is the App Router way to get a pending state out of a Server
// Action without wiring up your own loading boolean. isPending is true from
// the moment the action starts until the router finishes navigating.
// -----------------------------------------------------------------------------

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createStory } from '@/app/actions/stories';
import { copy } from '@/lib/copy';

export default function BeginChapter({ openUp = false }: { openUp?: boolean }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the field the moment it appears — the click that opened it was
  // already an intent to type.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function submit() {
    if (!title.trim() || isPending) return;
    setError(null);

    startTransition(async () => {
      const result = await createStory(title);
      if (result.ok) {
        router.push(`/story/${result.data.slug}`);
      } else {
        setError(result.error || copy.library.beginError);
      }
    });
  }

  // 1.2: a compact pill that lives in the header's upper-right; the form opens
  // as a popover beneath it (right-aligned) instead of a big centered block, so
  // it can sit beside the profile circle without disrupting the layout.
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full bg-ever-gradient px-5 py-3 text-sm tracking-wide text-paper shadow-glow-soft transition-opacity hover:opacity-90"
      >
        <span className="text-base leading-none">+</span>
        <span className="hidden sm:inline">{copy.library.begin}</span>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            className={`absolute z-50 w-72 rounded-2xl border border-rule bg-paper2 p-5 shadow-glow ${
              openUp ? 'bottom-full left-1/2 mb-3 -translate-x-1/2' : 'right-0 top-full mt-3'
            }`}
          >
            <label htmlFor="story-title" className="mb-2 block text-center font-serif text-lg italic text-ink">
              {copy.library.beginPrompt}
            </label>

            <input
              ref={inputRef}
              id="story-title"
              value={title}
              disabled={isPending}
              placeholder={copy.library.beginPlaceholder}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
                if (e.key === 'Escape') setOpen(false);
              }}
              className="mb-3 w-full rounded-lg border border-rule bg-paper px-4 py-3 text-center font-serif text-lg text-ink outline-none placeholder:text-ink-soft/50 focus:border-violet-2 disabled:opacity-60"
            />

            {error && (
              <p role="alert" className="mb-3 text-center text-xs text-ember">
                {error}
              </p>
            )}

            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="rounded-full border border-rule px-5 py-2.5 text-xs tracking-wide text-ink-soft transition-colors hover:border-violet-2 hover:text-violet"
              >
                {copy.library.beginCancel}
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={isPending || !title.trim()}
                className="rounded-full bg-ever-gradient px-6 py-2.5 text-xs tracking-wide text-paper shadow-glow-soft transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? copy.prologue.saving : copy.library.beginConfirm}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
