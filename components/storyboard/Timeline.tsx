'use client';
// -----------------------------------------------------------------------------
// components/storyboard/Timeline.tsx
//
// The beat timeline. Horizontal on desktop, vertical below 640px — same
// component, driven by Tailwind's flex-col / sm:flex-row, not by JS measuring
// the viewport. One less thing to hydrate wrong.
//
// Two things doing real work here:
//
//  1. `ribbon` — the active-beat indicator is a single motion.div with a
//     layoutId. Framer sees the same layoutId unmount in one beat and mount in
//     another, and springs it across. No manual position math.
//
//  2. Drag-to-reorder, untimed beats only. Native HTML5 DnD, no library. A
//     timed beat is positioned by its clock, so dragging it would desync
//     visual order from actual time (dev guide §4.2). Timed beats simply
//     aren't draggable, and the hint text in BeatEditor says why.
// -----------------------------------------------------------------------------

import { useState, useTransition } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { reorderChapters } from '@/app/actions/chapters';
import { orderBeats, isTimed, reindexUntimed, formatBeatTime } from '@/lib/beats';
import { ribbon } from '@/lib/motion';
import { copy } from '@/lib/copy';
import type { Chapter } from '@/lib/types';
import BeatIcon from './BeatIcon';

export default function Timeline({
  beats,
  slug,
  activeId,
  onSelect,
}: {
  beats: Chapter[];
  slug: string;
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  // layoutId animates regardless of the variant system, so ribbon needs its
  // own reduced-motion check — otherwise the dot still springs for someone
  // who asked the OS for stillness.
  const reduced = useReducedMotion();

  const ordered = orderBeats(beats);
  const untimed = ordered.filter((b) => !isTimed(b));

  /** Index within the UNTIMED subset — that's the space reindexUntimed works in. */
  function untimedIndexOf(beat: Chapter): number {
    return untimed.findIndex((b) => b.id === beat.id);
  }

  function handleDrop(targetUntimedIndex: number) {
    if (dragIndex === null || dragIndex === targetUntimedIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }

    const next = reindexUntimed(untimed, dragIndex, targetUntimedIndex);
    setDragIndex(null);
    setOverIndex(null);

    startTransition(async () => {
      await reorderChapters(slug, next);
    });
  }

  return (
    <div className="relative">
      {/* The line. Vertical on mobile (left rail), horizontal on desktop. */}
      <div className="absolute left-[19px] top-2 bottom-2 w-px bg-rule sm:left-0 sm:right-0 sm:top-[19px] sm:bottom-auto sm:h-px sm:w-auto" />

      <ol className="relative flex flex-col gap-6 sm:flex-row sm:justify-between sm:gap-2">
        {ordered.map((beat) => {
          const timed = isTimed(beat);
          const uIndex = timed ? -1 : untimedIndexOf(beat);
          const active = beat.id === activeId;
          const isDropTarget = !timed && overIndex === uIndex && dragIndex !== uIndex;

          return (
            <li
              key={beat.id}
              draggable={!timed}
              onDragStart={() => !timed && setDragIndex(uIndex)}
              onDragOver={(e) => {
                if (timed || dragIndex === null) return;
                e.preventDefault(); // required, or onDrop never fires
                setOverIndex(uIndex);
              }}
              onDragLeave={() => setOverIndex(null)}
              onDrop={(e) => {
                if (timed) return;
                e.preventDefault();
                handleDrop(uIndex);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              className={`flex items-center gap-4 sm:flex-col sm:items-center sm:gap-2 ${
                !timed ? 'cursor-grab active:cursor-grabbing' : ''
              } ${isDropTarget ? 'opacity-60' : ''}`}
            >
              <button
                type="button"
                onClick={() => onSelect(beat.id)}
                aria-current={active ? 'step' : undefined}
                aria-label={beat.title}
                className="group relative flex shrink-0 items-center justify-center transition-transform hover:-translate-y-1 focus-visible:-translate-y-1"
              >
                {/* ribbon: one element, one layoutId, spring between beats */}
                {active && (
                  <motion.span
                    layoutId="ribbon-dot"
                    transition={reduced ? { duration: 0 } : ribbon}
                    className="absolute inset-0 rounded-full bg-ember"
                  />
                )}
                <span
                  className={`relative flex h-[38px] w-[38px] items-center justify-center rounded-full border transition-colors ${
                    active
                      ? 'border-ember text-paper'
                      : 'border-rule bg-paper2 text-ink-soft group-hover:border-violet-2 group-hover:text-violet'
                  }`}
                >
                  <BeatIcon type={beat.beat_type} size={16} />
                </span>
              </button>

              <div className="min-w-0 sm:text-center">
                <p className="truncate text-[10px] uppercase tracking-[0.16em] text-ink-soft">
                  {formatBeatTime(beat.scheduled_at, copy.storyboard.untimed)}
                </p>
                <p
                  className={`truncate font-serif text-sm sm:max-w-[7rem] ${
                    active ? 'text-ink' : 'text-ink-soft'
                  }`}
                >
                  {beat.title}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
