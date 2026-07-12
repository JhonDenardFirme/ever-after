'use client';
// -----------------------------------------------------------------------------
// components/storyboard/MomentTimeline.tsx (1.2)
//
// The read-only Outline as a numbered, star-linked timeline. Each Moment is a
// fixed-height card with its number seated on the top edge; a single star links
// one to the next (a star before every card, so the first and last are linked
// too, and the loop never doubles up). Top padding keeps the number circles from
// being clipped. Both edges fade (a mask). On the album it auto-scrolls; the
// duplicated row makes the -50% marquee seamless.
// -----------------------------------------------------------------------------

import { orderBeats, formatBeatTime } from '@/lib/beats';
import { copy } from '@/lib/copy';
import type { Chapter } from '@/lib/types';
import { SparkIcon } from '@/components/ui/icons';
import BeatIcon from './BeatIcon';

const EDGE_FADE = {
  maskImage: 'linear-gradient(to right, transparent, #000 7%, #000 93%, transparent)',
  WebkitMaskImage: 'linear-gradient(to right, transparent, #000 7%, #000 93%, transparent)',
} as React.CSSProperties;

function MomentCard({ beat, n }: { beat: Chapter; n: number }) {
  return (
    <div className="relative flex h-[196px] w-56 shrink-0 flex-col items-center justify-center rounded-2xl border border-rule bg-paper2 px-5 text-center transition-colors hover:border-violet-2">
      <span className="absolute -top-4 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-ever-gradient text-sm text-paper shadow-glow-soft">
        {n}
      </span>
      <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-full border border-rule text-violet">
        <BeatIcon type={beat.beat_type} size={15} />
      </span>
      <p className="text-[10px] uppercase tracking-[0.18em] text-ember">
        {formatBeatTime(beat.scheduled_at, copy.storyboard.untimed)}
        {beat.setting ? ` · ${beat.setting}` : ''}
      </p>
      <p className="mt-1 font-serif text-lg leading-snug text-ink">{beat.title}</p>
      {beat.notes && <p className="mt-1 line-clamp-2 text-sm italic text-ink-soft">{beat.notes}</p>}
    </div>
  );
}

function Connector({ id }: { id: string }) {
  return (
    <span key={id} className="flex shrink-0 items-center px-1 text-ember/60" aria-hidden="true">
      <SparkIcon size={12} className="ever-star-pulse" />
    </span>
  );
}

/** A row = a star before every card (+ an optional trailing star for a static row). */
function buildRow(beats: Chapter[], keyPrefix: string, opts: { ariaHidden?: boolean; trailing?: boolean } = {}) {
  const nodes: React.ReactNode[] = [];
  beats.forEach((b) => {
    nodes.push(<Connector key={`${keyPrefix}-c-${b.id}`} id={`${keyPrefix}-c-${b.id}`} />);
    nodes.push(<MomentCard key={`${keyPrefix}-${b.id}`} beat={b} n={beats.indexOf(b) + 1} />);
  });
  if (opts.trailing) nodes.push(<Connector key={`${keyPrefix}-trail`} id={`${keyPrefix}-trail`} />);
  return (
    <div className="flex items-center gap-1" aria-hidden={opts.ariaHidden || undefined}>
      {nodes}
    </div>
  );
}

export default function MomentTimeline({ beats, autoscroll = false }: { beats: Chapter[]; autoscroll?: boolean }) {
  const ordered = orderBeats(beats);
  if (ordered.length === 0) return null;

  if (!autoscroll) {
    return (
      <div className="-mx-6 overflow-x-auto px-6" style={EDGE_FADE}>
        <div className="w-max pb-2 pt-8">{buildRow(ordered, 'inv', { trailing: true })}</div>
      </div>
    );
  }

  return (
    <div className="ever-marquee-wrap -mx-6" style={EDGE_FADE}>
      <div className="ever-marquee flex w-max px-6 pb-2 pt-8">
        {buildRow(ordered, 'a')}
        {buildRow(ordered, 'b', { ariaHidden: true })}
      </div>
    </div>
  );
}
