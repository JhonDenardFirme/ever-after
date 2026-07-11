'use client';
// -----------------------------------------------------------------------------
// components/frames/WaitingFrameCard.tsx
//
// A Waiting Frame, rendered where developed Frames live. Same dashed tile as
// the Storyboard's Frame List, except here it's a real upload target — click
// it and it becomes the photograph it was asking for.
//
// The prompt text stays on the row after developing (`developFrame` doesn't
// clear it), so months later you can read "something unplanned" next to the
// thing that actually happened. That's not an accident.
// -----------------------------------------------------------------------------

import { copy } from '@/lib/copy';
import type { Frame, Author } from '@/lib/types';
import UploadFrame from './UploadFrame';

export default function WaitingFrameCard({
  frame,
  slug,
  authors,
  className = '',
}: {
  frame: Frame;
  slug: string;
  authors: Record<string, Author>;
  className?: string;
}) {
  const author = frame.authored_by ? authors[frame.authored_by] : undefined;

  return (
    <div className={className}>
      <UploadFrame
        slug={slug}
        chapterId={frame.chapter_id ?? ''}
        frameId={frame.id}
        promptText={frame.prompt_text ?? undefined}
        render={({ pending, label, open }) => (
          <button
            type="button"
            onClick={open}
            disabled={pending}
            className="flex min-h-[160px] w-full flex-col justify-between rounded-xl border-[1.5px] border-dashed border-rule-strong bg-paper2/60 p-4 text-left transition-colors hover:border-violet-2 disabled:opacity-60"
          >
            <p className="font-serif text-sm leading-snug text-ink">
              {pending ? (label ?? copy.frames.developing) : frame.prompt_text}
            </p>

            {author && !pending && (
              <p className="text-[9px] uppercase tracking-[0.14em] text-ink-soft">
                {copy.frames.waitingFor(author.name)}
              </p>
            )}
          </button>
        )}
      />
    </div>
  );
}
