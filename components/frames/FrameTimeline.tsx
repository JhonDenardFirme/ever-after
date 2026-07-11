'use client';
// -----------------------------------------------------------------------------
// components/frames/FrameTimeline.tsx
//
// The same Frames, read as the day happened. Grouped by Chapter, ordered by
// the clock — reusing `orderBeats` from lib/beats.ts so the Storyboard and the
// Timeline can never disagree about what order the day was in.
//
// Named FrameTimeline, not Timeline, because components/storyboard/Timeline
// already exists and is a different thing (beats, not Frames). Two files named
// Timeline.tsx in one codebase is a future afternoon lost.
//
// Every Chapter shows, even empty ones. An empty Chapter is not an error — it
// is a beat you planned and haven't photographed yet, and it says so.
// -----------------------------------------------------------------------------

import { orderBeats, formatBeatTime } from '@/lib/beats';
import { copy } from '@/lib/copy';
import type { Chapter, Frame, Author } from '@/lib/types';
import BeatIcon from '@/components/storyboard/BeatIcon';
import FrameCard from './FrameCard';
import WaitingFrameCard from './WaitingFrameCard';

export default function FrameTimeline({
  chapters,
  frames,
  storyId,
  slug,
  keepsakeId,
  authors,
  selectable = false,
  selectedIds,
  onToggleSelect,
}: {
  chapters: Chapter[];
  frames: Frame[];
  storyId: string;
  slug: string;
  keepsakeId: string | null;
  authors: Record<string, Author>;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}) {
  const ordered = orderBeats(chapters);

  return (
    <div className="relative pl-8 sm:pl-10">
      {/* The thread running through the day */}
      <div className="absolute bottom-2 left-[11px] top-2 w-px bg-rule sm:left-[15px]" />

      {ordered.map((chapter) => {
        const own = frames.filter((f) => f.chapter_id === chapter.id);

        return (
          <section key={chapter.id} className="relative mb-14">
            {/* The node */}
            <span className="absolute -left-8 top-1 flex h-[23px] w-[23px] items-center justify-center rounded-full border border-rule bg-paper text-ink-soft sm:-left-10 sm:h-[31px] sm:w-[31px]">
              <BeatIcon type={chapter.beat_type} size={13} />
            </span>

            <header className="mb-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                {formatBeatTime(chapter.scheduled_at, copy.storyboard.untimed)}
                {chapter.setting ? ` · ${chapter.setting}` : ''}
              </p>
              <h2 className="font-serif text-2xl text-ink">{chapter.title}</h2>
              {chapter.notes && (
                <p className="mt-1 font-serif text-sm italic text-ink-soft">{chapter.notes}</p>
              )}
            </header>

            {own.length === 0 ? (
              <p className="font-serif italic text-ink-soft">{copy.frames.emptyChapter}</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                {own.map((frame) =>
                  frame.status === 'waiting' ? (
                    <WaitingFrameCard key={frame.id} frame={frame} slug={slug} authors={authors} />
                  ) : (
                    <FrameCard
                      key={frame.id}
                      frame={frame}
                      storyId={storyId}
                      slug={slug}
                      isKeepsake={frame.id === keepsakeId}
                      authors={authors}
                      selectable={selectable}
                      selected={selectedIds?.has(frame.id) ?? false}
                      onToggleSelect={onToggleSelect ? () => onToggleSelect(frame.id) : undefined}
                    />
                  )
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
