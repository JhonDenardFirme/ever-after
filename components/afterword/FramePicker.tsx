'use client';
// -----------------------------------------------------------------------------
// components/afterword/FramePicker.tsx
//
// Question 1 doesn't answer with words. It answers with a photograph — "the
// one Frame that brings the whole day back" — and that Frame becomes The
// Keepsake. This is the picker.
//
// Only developed Frames appear. A Waiting Frame is a prompt, not a memory;
// it can't be the thing that brings the day back because it hasn't happened.
// -----------------------------------------------------------------------------

import { useState } from 'react';
import Image from 'next/image';
import { copy } from '@/lib/copy';
import type { Frame } from '@/lib/types';

export default function FramePicker({
  frames,
  selectedId,
  disabled,
  onSelect,
}: {
  frames: Frame[];
  selectedId: string | null;
  disabled?: boolean;
  onSelect: (frameId: string) => void;
}) {
  const developed = frames.filter((f) => f.status === 'developed' && f.media_url);
  const [open, setOpen] = useState(false);

  if (developed.length === 0) {
    return <p className="font-serif italic text-ink-soft">{copy.afterword.noFramesYet}</p>;
  }

  const selected = developed.find((f) => f.id === selectedId) ?? null;

  // Collapsed: show the chosen Frame, offer to change it.
  if (selected && !open) {
    return (
      <div>
        <div className="relative mb-3 aspect-[3/2] w-full max-w-xs overflow-hidden rounded-xl border border-rule">
          <Image
            src={selected.media_url as string}
            alt={selected.caption ?? 'The Keepsake'}
            fill
            sizes="320px"
            className="object-cover"
          />
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={disabled}
          className="text-xs text-ink-soft underline-offset-4 transition-colors hover:text-violet hover:underline disabled:opacity-50"
        >
          {copy.afterword.changeFrame}
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-ember">
        {copy.afterword.keepsakeNote}
      </p>

      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {developed.map((frame) => {
          const isSelected = frame.id === selectedId;
          return (
            <button
              key={frame.id}
              type="button"
              disabled={disabled}
              onClick={() => {
                onSelect(frame.id);
                setOpen(false);
              }}
              aria-pressed={isSelected}
              className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-colors disabled:opacity-50 ${
                isSelected ? 'border-ember' : 'border-transparent hover:border-violet-2'
              }`}
            >
              <Image
                src={frame.media_url as string}
                alt={frame.caption ?? 'A Frame'}
                fill
                sizes="(max-width: 640px) 33vw, 160px"
                className="object-cover"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
