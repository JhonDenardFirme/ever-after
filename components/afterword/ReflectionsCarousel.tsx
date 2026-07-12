'use client';
// -----------------------------------------------------------------------------
// components/afterword/ReflectionsCarousel.tsx (1.2)
//
// The answered Afterword reflections, on the album — modernised into a single
// story-style card that auto-cycles (dots below mark progress and the current
// one). Each card shows one question, then BOTH authors' answers in two centred
// columns split by a star divider. Click it to open a modal and step through
// everything by hand (Previous / Next). The card wears the Library's glowing
// gradient, varied per index so consecutive cards don't read the same. Long
// answers scroll within the card; the size stays put.
// -----------------------------------------------------------------------------

import { useState, useEffect, useCallback } from 'react';
import { copy } from '@/lib/copy';
import { glowGradient } from '@/lib/gradients';
import StarDivider from '@/components/ui/StarDivider';
import StarField from '@/components/ui/StarField';
import SectionHeading from '@/components/ui/SectionHeading';
import { ArrowLeftIcon, SparkIcon } from '@/components/ui/icons';

export type Reflection = {
  id: string;
  question: string;
  section: string | null; // the category title, e.g. "Looking Back"
  answers: { name: string; text: string | null }[];
};

const INTERVAL = 6500;

function Answers({ reflection, tall = false }: { reflection: Reflection; tall?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-10">
      {reflection.answers.slice(0, 2).map((a, i) => (
        <div key={i} className={i === 1 ? 'border-t border-white/15 pt-4 sm:border-t-0 sm:pt-0' : ''}>
          <p className="mb-1.5 text-[10px] uppercase tracking-[0.2em] text-violet-3">{a.name}</p>
          <p className={`font-serif leading-relaxed text-paper/90 ${tall ? 'line-clamp-[12] text-lg' : 'line-clamp-4 text-base'} ${a.text ? '' : 'italic text-violet-3/60'}`}>
            {a.text || copy.afterword.unanswered}
          </p>
        </div>
      ))}
    </div>
  );
}

/** Card body shared by the inline carousel and the modal. Both keep a steady
 *  height so cycling / paging never makes the box jump. */
function Card({ reflection, index, tall = false }: { reflection: Reflection; index: number; tall?: boolean }) {
  return (
    <div
      className={`relative flex flex-col justify-center overflow-hidden rounded-3xl p-6 text-center text-paper shadow-glow ring-1 ring-inset ring-white/10 sm:p-8 ${tall ? 'min-h-[68vh]' : 'min-h-[340px]'}`}
      style={{ backgroundImage: glowGradient(index) }}
    >
      <StarField className="opacity-40" />
      <div className="relative z-10 w-full">
        <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-ember">
          {reflection.section || copy.afterword.reflectionEyebrow}
        </p>
        <p className="mx-auto max-w-lg font-serif text-xl italic leading-snug text-paper sm:text-2xl">
          {reflection.question}
        </p>
        <StarDivider onDark className="mx-auto my-6 max-w-[10rem]" />
        <div className="relative">
          {/* the star divider between the two answer columns */}
          <div className="absolute inset-y-0 left-1/2 hidden -translate-x-1/2 flex-col items-center justify-center gap-1 sm:flex" aria-hidden="true">
            <span className="w-px flex-1 bg-gradient-to-b from-transparent to-white/25" />
            <SparkIcon size={12} className="text-ember" />
            <span className="w-px flex-1 bg-gradient-to-t from-transparent to-white/25" />
          </div>
          <Answers reflection={reflection} tall={tall} />
        </div>
      </div>
    </div>
  );
}

function Dots({ count, index, onPick }: { count: number; index: number; onPick?: (i: number) => void }) {
  return (
    <div className="mt-6 flex items-center justify-center gap-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`${i + 1}`}
          onClick={onPick ? (e) => { e.stopPropagation(); onPick(i); } : undefined}
          className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-ember' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
        />
      ))}
    </div>
  );
}

export default function ReflectionsCarousel({ reflections }: { reflections: Reflection[] }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [paused, setPaused] = useState(false);

  const count = reflections.length;
  const go = useCallback((n: number) => setIndex((i) => ((n % count) + count) % count), [count]);

  // auto-advance the inline carousel while it's not paused / open
  useEffect(() => {
    if (open || paused || count < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL);
    return () => clearInterval(t);
  }, [open, paused, count]);

  // modal keyboard nav
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowRight') go(index + 1);
      if (e.key === 'ArrowLeft') go(index - 1);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, index, go]);

  if (count === 0) return null;
  const current = reflections[index];

  return (
    <section className="mx-auto max-w-5xl px-6 py-14">
      <SectionHeading
        eyebrow={copy.afterword.eyebrow}
        title={copy.afterword.reflectionsTitle}
        tagline={copy.afterword.reflectionsTagline}
      />

      <div
        className="mx-auto max-w-2xl cursor-pointer"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOpen(true)}
      >
        <Card reflection={current} index={index} />
        <Dots count={count} index={index} onPick={(i) => go(i)} />
      </div>

      {/* Manual modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4 backdrop-blur-md sm:p-8"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <Card reflection={current} index={index} tall />
            <Dots count={count} index={index} onPick={(i) => go(i)} />

            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label={copy.afterword.prev}
              className="absolute -left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-violet-deep/70 text-paper backdrop-blur-md transition-colors hover:bg-violet sm:-left-14"
            >
              <ArrowLeftIcon size={16} />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label={copy.afterword.next}
              className="absolute -right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-violet-deep/70 text-paper backdrop-blur-md transition-colors hover:bg-violet sm:-right-14"
            >
              <ArrowLeftIcon size={16} className="rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={copy.frames.close}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-paper/90 text-lg text-ink shadow-shelf transition-colors hover:bg-paper"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
