'use client';
// -----------------------------------------------------------------------------
// components/storyboard/MomentTimeline.tsx (1.2)
//
// The read-only Outline: the Moments as a numbered-circle timeline. On the album
// it auto-scrolls forever (autoscroll); on the Invitation page it's a static,
// scrollable timeline. Duplicating the cards under autoscroll is what lets the
// -50% marquee loop seamlessly (see .ever-marquee in globals.css).
// -----------------------------------------------------------------------------

import { orderBeats, formatBeatTime } from '@/lib/beats';
import { copy } from '@/lib/copy';
import type { Chapter } from '@/lib/types';
import BeatIcon from './BeatIcon';

function MomentCard({ beat, n }: { beat: Chapter; n: number }) {
  return (
    <div className="relative w-56 shrink-0 rounded-2xl border border-rule bg-paper2 p-5">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet text-sm text-paper shadow-glow-soft">
          {n}
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-rule text-violet">
          <BeatIcon type={beat.beat_type} size={15} />
        </span>
      </div>
      <p className="text-[10px] uppercase tracking-[0.18em] text-ember">
        {formatBeatTime(beat.scheduled_at, copy.storyboard.untimed)}
        {beat.setting ? ` · ${beat.setting}` : ''}
      </p>
      <p className="mt-1 font-serif text-lg leading-snug text-ink">{beat.title}</p>
      {beat.notes && <p className="mt-1 line-clamp-2 text-sm italic text-ink-soft">{beat.notes}</p>}
    </div>
  );
}

export default function MomentTimeline({
  beats,
  autoscroll = false,
}: {
  beats: Chapter[];
  autoscroll?: boolean;
}) {
  const ordered = orderBeats(beats);
  if (ordered.length === 0) return null;

  const cards = ordered.map((b, i) => <MomentCard key={b.id} beat={b} n={i + 1} />);

  if (!autoscroll) {
    return (
      <div className="ever-marquee-wrap -mx-6 px-6" style={{ overflowX: 'auto' }}>
        <div className="flex gap-4 pb-2">{cards}</div>
      </div>
    );
  }

  // Autoscroll: duplicate the row so translateX(-50%) loops without a seam.
  return (
    <div className="ever-marquee-wrap -mx-6">
      <div className="ever-marquee flex w-max gap-4 px-6">
        {cards}
        {/* aria-hidden duplicate purely for the seamless loop */}
        <div className="flex gap-4" aria-hidden="true">
          {ordered.map((b, i) => (
            <MomentCard key={`dup-${b.id}`} beat={b} n={i + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}
