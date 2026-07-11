'use client';
// -----------------------------------------------------------------------------
// components/storyboard/StoryboardView.tsx
//
// Holds the one piece of state the Storyboard actually has: which beat is
// selected. Everything else lives on the server.
//
// Selection defaults to the first beat in canonical order, and follows a newly
// created beat so you can name it and immediately keep typing. Small thing;
// it's the difference between sketching a day and fighting a form.
// -----------------------------------------------------------------------------

import { useState, useEffect, useTransition, useRef } from 'react';
import { createChapter } from '@/app/actions/chapters';
import { orderBeats } from '@/lib/beats';
import { copy } from '@/lib/copy';
import type { Chapter, Frame, Author } from '@/lib/types';
import Timeline from './Timeline';
import BeatEditor from './BeatEditor';
import FrameList from './FrameList';

export default function StoryboardView({
  storyId,
  slug,
  beats,
  frames,
  authors,
}: {
  storyId: string;
  slug: string;
  beats: Chapter[];
  frames: Frame[];
  authors: Record<string, Author>;
}) {
  const ordered = orderBeats(beats);
  const [activeId, setActiveId] = useState<string | null>(ordered[0]?.id ?? null);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // If the active beat was deleted (or none was ever set), fall back to first.
  useEffect(() => {
    if (!activeId || !beats.some((b) => b.id === activeId)) {
      setActiveId(orderBeats(beats)[0]?.id ?? null);
    }
  }, [beats, activeId]);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  function addBeat() {
    if (!title.trim() || isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await createChapter(storyId, slug, title);
      if (result.ok) {
        setActiveId(result.data.id); // jump to what you just made
        setTitle('');
        setAdding(false);
      } else {
        setError(result.error || copy.storyboard.saveError);
      }
    });
  }

  const active = beats.find((b) => b.id === activeId) ?? null;
  const activeFrames = active ? frames.filter((f) => f.chapter_id === active.id) : [];

  return (
    <>
      {beats.length === 0 ? (
        <p className="mb-10 py-12 text-center font-serif text-xl italic text-ink-soft">
          {copy.storyboard.empty}
        </p>
      ) : (
        <div className="mb-12 rounded-2xl border border-rule bg-paper2/40 px-6 py-8 sm:px-10">
          <Timeline beats={beats} slug={slug} activeId={activeId} onSelect={setActiveId} />
        </div>
      )}

      {/* Add a beat */}
      <div className="mb-12 flex justify-center">
        {adding ? (
          <div className="w-full max-w-sm text-center">
            <input
              ref={inputRef}
              value={title}
              disabled={isPending}
              placeholder={copy.storyboard.newBeatPlaceholder}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addBeat();
                if (e.key === 'Escape') {
                  setAdding(false);
                  setTitle('');
                }
              }}
              className="mb-3 w-full rounded-lg border border-rule bg-paper2 px-4 py-3 text-center font-serif text-lg text-ink outline-none placeholder:text-ink-soft/40"
            />
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setTitle('');
                }}
                className="rounded-full border border-rule px-5 py-2.5 text-xs tracking-wide text-ink-soft hover:border-violet-2 hover:text-violet"
              >
                {copy.storyboard.newBeatCancel}
              </button>
              <button
                type="button"
                onClick={addBeat}
                disabled={!title.trim() || isPending}
                className="rounded-full bg-violet px-6 py-2.5 text-xs tracking-wide text-paper hover:bg-violet-2 disabled:opacity-50"
              >
                {copy.storyboard.newBeatConfirm}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-full border border-rule px-6 py-3 text-sm tracking-wide text-ink-soft transition-colors hover:border-violet-2 hover:text-violet"
          >
            + {copy.storyboard.addBeat}
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mb-6 text-center text-xs text-ember">
          {error}
        </p>
      )}

      {active && (
        <>
          <BeatEditor beat={active} slug={slug} />
          <FrameList slug={slug} chapterId={active.id} frames={activeFrames} authors={authors} />
        </>
      )}
    </>
  );
}
