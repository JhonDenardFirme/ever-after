'use client';
// -----------------------------------------------------------------------------
// components/storyboard/MomentTimeline.tsx (1.2)
//
// The read-only Outline as a numbered, star-linked timeline. Each Moment is a
// card with its number seated on the top edge; a small star links one to the
// next. On the album it auto-scrolls forever; on the Invitation it's a static
// horizontal scroller. Both edges fade (a mask) so the row never ends on a hard
// cut. Duplicating the cards under autoscroll makes the -50% marquee seamless.
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
  // Fixed height + centred content, so full and sparse Moments read the same.
  return (
    <div className="relative mt-5 flex h-[196px] w-56 shrink-0 flex-col items-center justify-center overflow-hidden rounded-2xl border border-rule bg-paper2 px-5 text-center transition-colors hover:border-violet-2">
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

function buildRow(beats: Chapter[], keyPrefix: string, ariaHidden = false) {
  const nodes: React.ReactNode[] = [<Connector key={`${keyPrefix}-lead`} id={`${keyPrefix}-lead`} />];
  beats.forEach((b, i) => {
    if (i > 0) nodes.push(<Connector key={`${keyPrefix}-c-${b.id}`} id={`${keyPrefix}-c-${b.id}`} />);
    nodes.push(<MomentCard key={`${keyPrefix}-${b.id}`} beat={b} n={i + 1} />);
  });
  nodes.push(<Connector key={`${keyPrefix}-trail`} id={`${keyPrefix}-trail`} />);
  return (
    <div className="flex items-center gap-1" aria-hidden={ariaHidden || undefined}>
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
        <div className="w-max pb-2">{buildRow(ordered, 'inv')}</div>
      </div>
    );
  }

  return (
    <div className="ever-marquee-wrap -mx-6" style={EDGE_FADE}>
      <div className="ever-marquee flex w-max gap-1 px-6">
        {buildRow(ordered, 'a')}
        {buildRow(ordered, 'b', true)}
      </div>
    </div>
  );
}
