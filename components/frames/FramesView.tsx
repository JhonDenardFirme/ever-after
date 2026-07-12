'use client';
// -----------------------------------------------------------------------------
// components/frames/FramesView.tsx
//
// Frame Wall ⇄ Timeline. Same data, same query, one state variable — which is
// exactly why building both was cheap enough to be obvious.
//
// The "Develop a Frame" button needs a Chapter to attach to, because a Frame
// with a null chapter_id can never be found again (frames has no story_id; it
// reaches its story only through a beat). So new Frames land on the last beat
// of the day, and if there are no beats yet we say so and point at the
// Storyboard rather than silently dropping the photo somewhere unreachable.
// -----------------------------------------------------------------------------

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { orderBeats } from '@/lib/beats';
import { copy } from '@/lib/copy';
import type { Chapter, Frame, Author } from '@/lib/types';
import { deleteFrames } from '@/app/actions/frames';
import UploadFrame from './UploadFrame';
import FrameWall from './FrameWall';
import FrameTimeline from './FrameTimeline';

type View = 'wall' | 'timeline';

export default function FramesView({
  storyId,
  slug,
  chapters,
  frames,
  keepsakeId,
  authors,
}: {
  storyId: string;
  slug: string;
  chapters: Chapter[];
  frames: Frame[];
  keepsakeId: string | null;
  authors: Record<string, Author>;
}) {
  const [view, setView] = useState<View>('wall');

  // 1.2 selection mode — one Set, one modal, one bulk action.
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const developedCount = frames.filter((f) => f.status === 'developed').length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelection() {
    setSelecting(false);
    setSelected(new Set());
    setConfirming(false);
    setDeleteError(null);
  }

  function confirmDelete() {
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteFrames(Array.from(selected), slug);
      if (result.ok) exitSelection();
      else setDeleteError(result.error);
    });
  }

  const ordered = orderBeats(chapters);
  const lastChapter = ordered[ordered.length - 1] ?? null;

  const tab = (v: View, label: string) => (
    <button
      key={v}
      type="button"
      onClick={() => setView(v)}
      aria-pressed={view === v}
      className={`relative px-4 py-2 text-xs tracking-wide transition-colors ${
        view === v ? 'text-ink' : 'text-ink-soft hover:text-violet'
      }`}
    >
      {label}
      {/* the one ember highlight on this page: a 2px underline */}
      {view === v && <span className="absolute inset-x-3 -bottom-px h-0.5 bg-ember" />}
    </button>
  );

  return (
    <>
      <div className="mb-10 flex items-center justify-between border-b border-rule">
        <div className="flex">
          {tab('wall', copy.frames.wall)}
          {tab('timeline', copy.frames.timeline)}
        </div>

        {lastChapter ? (
          <div className="mb-2 flex items-center gap-2">
            {developedCount > 0 && (
              <button
                type="button"
                onClick={() => (selecting ? exitSelection() : setSelecting(true))}
                className="rounded-full border border-rule px-4 py-2.5 text-xs tracking-wide text-ink-soft transition-colors hover:border-violet-2 hover:text-violet"
              >
                {selecting ? copy.frames.selectDone : copy.frames.select}
              </button>
            )}
            {!selecting && (
              <UploadFrame
                slug={slug}
                chapterId={lastChapter.id}
                render={({ pending, label, open }) => (
                  <button
                    type="button"
                    onClick={open}
                    disabled={pending}
                    className="rounded-full bg-ever-gradient px-5 py-2.5 text-xs tracking-wide text-paper shadow-glow-soft transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {pending ? (label ?? copy.frames.developing) : copy.frames.develop}
                  </button>
                )}
              />
            )}
          </div>
        ) : (
          <Link
            href={`/story/${slug}/storyboard`}
            className="mb-2 rounded-full border border-rule px-5 py-2.5 text-xs tracking-wide text-ink-soft hover:border-violet-2 hover:text-violet"
          >
            {copy.prologue.toStoryboard}
          </Link>
        )}
      </div>

      {view === 'wall' ? (
        <FrameWall
          frames={frames}
          storyId={storyId}
          slug={slug}
          keepsakeId={keepsakeId}
          authors={authors}
          selectable={selecting}
          selectedIds={selected}
          onToggleSelect={toggle}
        />
      ) : (
        <FrameTimeline
          chapters={chapters}
          frames={frames}
          storyId={storyId}
          slug={slug}
          keepsakeId={keepsakeId}
          authors={authors}
          selectable={selecting}
          selectedIds={selected}
          onToggleSelect={toggle}
        />
      )}
      {/* 1.2: the selection bar. Fixed, quiet, impossible to lose. */}
      {selecting && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper2/95 px-6 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <p className="text-xs tracking-wide text-ink-soft">
              {copy.frames.chosen(selected.size)}
            </p>
            <button
              type="button"
              disabled={selected.size === 0 || isPending}
              onClick={() => setConfirming(true)}
              className="rounded-full bg-ember px-5 py-2.5 text-xs tracking-wide text-paper transition-opacity disabled:opacity-40"
            >
              {copy.frames.deleteSelected(selected.size)}
            </button>
          </div>
          {deleteError && (
            <p role="alert" className="mx-auto mt-2 max-w-4xl text-xs text-ember">
              {deleteError}
            </p>
          )}
        </div>
      )}

      {/* The confirm modal — the exact heavy voice, scaled to N. */}
      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-violet-deep/80 px-6"
          onClick={() => setConfirming(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-rule bg-paper p-7 text-center shadow-glow"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-6 font-serif text-lg leading-relaxed text-ink">
              {copy.frames.deleteManyConfirm(selected.size)}
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-full border border-rule px-5 py-2.5 text-xs tracking-wide text-ink-soft"
              >
                {copy.frames.confirmNo}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isPending}
                className="rounded-full bg-ember px-5 py-2.5 text-xs tracking-wide text-paper disabled:opacity-60"
              >
                {copy.frames.confirmYes}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
