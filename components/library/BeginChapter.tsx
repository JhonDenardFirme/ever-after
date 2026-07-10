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

export default function BeginChapter() {
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

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-violet px-7 py-3.5 text-sm tracking-wide text-paper transition-colors hover:bg-violet-2"
      >
        {copy.library.begin}
      </button>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <label
        htmlFor="story-title"
        className="mb-2 block text-center font-serif text-lg italic text-ink"
      >
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
        className="mb-3 w-full rounded-lg border border-rule bg-paper2 px-4 py-3 text-center font-serif text-lg text-ink placeholder:text-ink-soft/50 disabled:opacity-60"
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
          className="rounded-full bg-violet px-6 py-2.5 text-xs tracking-wide text-paper transition-colors hover:bg-violet-2 disabled:opacity-50"
        >
          {isPending ? copy.prologue.saving : copy.library.beginConfirm}
        </button>
      </div>
    </div>
  );
}
