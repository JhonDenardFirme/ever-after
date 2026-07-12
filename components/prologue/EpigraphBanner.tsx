'use client';
// -----------------------------------------------------------------------------
// components/prologue/EpigraphBanner.tsx (1.2)
//
// The Epigraph, seated on the glowing Ever After gradient rather than a flat
// field, cross-fading slowly through a few of the story's photographs (passed
// in — at most three, so we never fetch the whole gallery). The Epigraph sits
// centred with the Dedication beneath, split by a star. Still under reduced
// motion (it simply shows the first photo).
// -----------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { useReducedMotion } from 'motion/react';
import { glowGradient } from '@/lib/gradients';
import StarDivider from '@/components/ui/StarDivider';
import StarField from '@/components/ui/StarField';

export default function EpigraphBanner({
  epigraph,
  dedication,
  photos,
}: {
  epigraph: string | null;
  dedication: string | null;
  photos: string[];
}) {
  const reduced = useReducedMotion();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (reduced || photos.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % photos.length), 3000);
    return () => clearInterval(t);
  }, [reduced, photos.length]);

  return (
    <figure className="mb-14 overflow-hidden rounded-3xl shadow-glow ring-1 ring-inset ring-white/10">
      <div className="relative flex min-h-[240px] items-center justify-center px-8 py-16 sm:min-h-[320px]">
        <div className="absolute inset-0" style={{ backgroundImage: glowGradient(0) }} />
        {photos.map((p, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={p}
            src={p}
            alt=""
            className={`ever-kenburns absolute inset-0 h-full w-full object-cover mix-blend-multiply transition-opacity duration-1000 ${i === idx ? 'opacity-60' : 'opacity-0'}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-violet-deep/75 via-transparent to-violet-deep/30" />
        <StarField className="opacity-50" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-ember/15 blur-3xl" />

        <figcaption className="relative mx-auto max-w-2xl text-center">
          {epigraph && (
            <p className="font-serif text-2xl italic leading-relaxed text-paper [text-shadow:0_1px_20px_rgba(53,14,112,0.7)] sm:text-3xl">
              {epigraph}
            </p>
          )}
          {epigraph && dedication && <StarDivider onDark className="mx-auto my-5 max-w-[8rem]" />}
          {dedication && (
            <p className="mx-auto max-w-md text-sm italic leading-relaxed text-violet-3">{dedication}</p>
          )}
        </figcaption>

        {photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
            {photos.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-4 bg-ember' : 'w-1.5 bg-white/40'}`} />
            ))}
          </div>
        )}
      </div>
    </figure>
  );
}
