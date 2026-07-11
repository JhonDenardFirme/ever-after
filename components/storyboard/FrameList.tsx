'use client';
// -----------------------------------------------------------------------------
// components/storyboard/FrameList.tsx
//
// The Waiting Frames on the selected beat. Each one is a prompt somebody left
// — and the "somebody" is the point. "Denard left this" turns an empty tile
// into a small act of attention. That's the whole gamification; there are no
// points anywhere in this app and there never will be.
//
// Phase 4 turns these dashed tiles into real upload targets. Until then they
// say so honestly rather than pretending to be clickable.
// -----------------------------------------------------------------------------

import { useState, useTransition, useRef, useEffect } from 'react';
import { createWaitingFrame, deleteWaitingFrame } from '@/app/actions/frames';
import UploadFrame from '@/components/frames/UploadFrame';
import { copy } from '@/lib/copy';
import type { Frame, Author } from '@/lib/types';

export default function FrameList({
  slug,
  chapterId,
  frames,
  authors,
}: {
  slug: string;
  chapterId: string;
  frames: Frame[];
  authors: Record<string, Author>;
}) {
  const [adding, setAdding] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const waiting = frames.filter((f) => f.status === 'waiting');

  function submit() {
    if (!prompt.trim() || isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await createWaitingFrame(slug, chapterId, prompt);
      if (result.ok) {
        setPrompt('');
        setAdding(false);
      } else {
        setError(result.error || copy.frameList.createError);
      }
    });
  }

  function remove(frameId: string) {
    startTransition(async () => {
      const result = await deleteWaitingFrame(frameId, slug);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <section className="mt-8">
      <div className="mb-1 flex items-baseline justify-between">
        <h3 className="font-serif text-xl text-ink">{copy.frameList.title}</h3>
        {waiting.length > 0 && (
          <p className="text-[10px] uppercase tracking-[0.18em] text-ember">
            {copy.frameList.waitingCount(waiting.length)}
          </p>
        )}
      </div>
      <p className="mb-5 text-sm text-ink-soft">{copy.frameList.lead}</p>

      {waiting.length === 0 && !adding && (
        <p className="mb-5 font-serif italic text-ink-soft">{copy.frameList.empty}</p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {waiting.map((frame) => {
          const author = frame.authored_by ? authors[frame.authored_by] : undefined;
          return (
            <div key={frame.id} className="group relative">
              <UploadFrame
                slug={slug}
                chapterId={chapterId}
                frameId={frame.id}
                promptText={frame.prompt_text ?? undefined}
                render={({ pending, label, open }) => (
                  <button
                    type="button"
                    onClick={open}
                    disabled={pending}
                    className="flex min-h-[110px] w-full flex-col justify-between rounded-xl border-[1.5px] border-dashed border-rule-strong bg-paper2 p-3.5 text-left transition-colors hover:border-violet-2 disabled:opacity-60"
                  >
                    <p className="font-serif text-sm leading-snug text-ink">
                      {pending ? (label ?? copy.frames.developing) : frame.prompt_text}
                    </p>

                    {author && !pending && (
                      <p className="text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                        {copy.frameList.leftBy(author.name)}
                      </p>
                    )}
                  </button>
                )}
              />

              {/* Removing the prompt itself, not developing it. Sits above the
                  upload target so a stray click can't nuke a Waiting Frame. */}
              <button
                type="button"
                onClick={() => remove(frame.id)}
                aria-label={`Remove: ${frame.prompt_text}`}
                className="absolute right-2 top-2 rounded-full bg-paper/90 px-2 py-1 text-xs text-ink-soft opacity-0 transition-opacity hover:text-ember focus-visible:opacity-100 group-hover:opacity-100"
              >
                ×
              </button>
            </div>
          );
        })}

        {/* Add a Waiting Frame — the tile itself becomes the form */}
        {adding ? (
          <div className="flex min-h-[110px] flex-col justify-between rounded-xl border-[1.5px] border-dashed border-violet-2 bg-paper2 p-3.5">
            <input
              ref={inputRef}
              value={prompt}
              disabled={isPending}
              placeholder={copy.frameList.promptPlaceholder}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
                if (e.key === 'Escape') {
                  setAdding(false);
                  setPrompt('');
                }
              }}
              className="w-full bg-transparent font-serif text-sm text-ink outline-none placeholder:text-ink-soft/40"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setPrompt('');
                }}
                className="text-[10px] uppercase tracking-[0.14em] text-ink-soft"
              >
                {copy.frameList.promptCancel}
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!prompt.trim() || isPending}
                className="text-[10px] uppercase tracking-[0.14em] text-violet disabled:opacity-40"
              >
                {copy.frameList.promptConfirm}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex min-h-[110px] items-center justify-center rounded-xl border-[1.5px] border-dashed border-rule bg-paper2/50 p-3.5 text-xs text-ink-soft transition-colors hover:border-violet-2 hover:text-violet"
          >
            + {copy.frameList.addWaiting}
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs text-ember">
          {error}
        </p>
      )}
    </section>
  );
}
