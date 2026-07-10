'use client';
// -----------------------------------------------------------------------------
// components/prologue/PrologueHero.tsx
//
// The cover, at 0.4x scroll speed. The image lingers as you scroll past it —
// which is exactly what a memory does, and exactly what parallaxCover was
// named for.
//
// useScroll + useTransform is motion's way of driving a value from scroll
// position without a single re-render: the transform is applied on the
// compositor. No scroll listener, no state, no jank.
//
// Phase 2 has no Frames yet, so coverUrl is always null and the hero renders
// its violet-deep empty state. Phase 4 passes a real URL and nothing else
// about this component changes.
// -----------------------------------------------------------------------------

import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { PARALLAX_FACTOR } from '@/lib/motion';
import { copy } from '@/lib/copy';

export default function PrologueHero({
  coverUrl,
  theme,
}: {
  coverUrl: string | null;
  theme: string | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollY } = useScroll();
  // Multiply, don't offset: at scroll 0 the image sits flush. As the page
  // moves up, the cover trails behind by 60% of the distance.
  const y = useTransform(scrollY, (v) => (reduced ? 0 : v * PARALLAX_FACTOR));

  return (
    <div ref={ref} className="relative h-[45vh] overflow-hidden bg-violet-deep sm:h-[60vh]">
      <motion.div style={{ y }} className="absolute inset-0 -bottom-24">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="max-w-xs px-6 text-center font-serif text-lg italic text-violet-3/50">
              {copy.prologue.coverEmpty}
            </p>
          </div>
        )}
      </motion.div>

      {/* The bleed. A Frame never sits in a hard-edged box — it dissolves into
          the paper below it. This gradient IS the "fleeting" in Fleeting Frames. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-paper to-transparent" />

      {theme && (
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-ember">
          {theme}
        </p>
      )}
    </div>
  );
}
