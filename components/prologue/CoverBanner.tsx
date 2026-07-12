'use client';
// -----------------------------------------------------------------------------
// components/prologue/CoverBanner.tsx (1.2) — the cinematic cover hero.
//
// Only the cover hero of the Story page. The photo fills the frame and always
// stays visible; everything else is "printed on top of it" through a stack of
// soft, print-aesthetic overlays that adapt to ANY uploaded image (dark, bright,
// sunset, city…) so the hero stays readable and on-brand:
//
//   image (slow 100->103% scale) → violet multiply → violet↔ember radial glow →
//   soft warm bloom → vignette → star field → an almost-invisible dissolve into
//   paper → content.
//
// Content is centred, editorial: eyebrow, a gradient-ivory title with an ambient
// glow, a subtitle, a metadata row, the star divider, and a hairline stats strip.
// Reuses StarDivider, SparkIcon, StarField. Motion is restrained + reduced-motion
// aware. The cover is fully changeable (Edit cover → change / remove).
// -----------------------------------------------------------------------------

import { useState } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { copy } from '@/lib/copy';
import StarDivider from '@/components/ui/StarDivider';
import StarsBackground from '@/components/ui/StarsBackground';
import BackLink from '@/components/ui/BackLink';
import CoverControls from './CoverControls';
import { SparkIcon } from '@/components/ui/icons';

const SHADOW = '[text-shadow:0_2px_20px_rgba(0,0,0,0.28)]';

export default function CoverBanner({
  storyId,
  slug,
  coverUrl,
  title,
  subtitle,
  metaParts,
}: {
  storyId: string;
  slug: string;
  coverUrl: string | null;
  title: string;
  subtitle: string;
  metaParts: string[];
}) {
  const reduced = useReducedMotion();
  const [cover, setCover] = useState<string | null>(coverUrl);

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (v) => (reduced ? 0 : v * 0.12));

  return (
    <section className="relative h-[65vh] min-h-[520px] w-full overflow-hidden md:h-[72vh] lg:h-[90vh]">
      {/* ---- Image (parallax wrapper + slow scale) ---- */}
      <motion.div style={{ y }} className="absolute inset-0 -bottom-16">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="ever-kenburns h-full w-full object-cover object-center" />
        ) : (
          <div className="h-full w-full bg-violet-hero" />
        )}
      </motion.div>

      {/* ---- Overlay stack (adapts to any photo) ---- */}
      {/* strong violet multiply — grades any photo into the Ever After palette,
          heavier toward the foot where the text sits */}
      <div className="pointer-events-none absolute inset-0 mix-blend-multiply" style={{ background: 'linear-gradient(0deg, rgba(45,12,94,0.92) 0%, rgba(45,12,94,0.6) 42%, rgba(45,12,94,0.4) 100%)' }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(60% 55% at 50% 40%, rgba(124,58,237,0.35) 0%, rgba(124,58,237,0) 46%, rgba(249,115,22,0.12) 74%, rgba(249,115,22,0) 100%)' }} />
      <div className="pointer-events-none absolute left-1/2 top-[36%] h-[62vh] w-[62vh] -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-soft-light blur-[130px]" style={{ background: 'rgba(255,242,222,0.16)' }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(120% 120% at 50% 42%, rgba(0,0,0,0) 55%, rgba(15,6,30,0.55) 100%)' }} />
      <StarsBackground opacity={0.5} />
      {/* slow drifting bloom — the "moving" feel, over the 100->103% scale */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/4 top-1/3 h-72 w-72 rounded-full bg-violet-3/20 blur-3xl"
        animate={reduced ? undefined : { x: [0, 44, 0], y: [0, -26, 0], opacity: [0.35, 0.6, 0.35] }}
        transition={reduced ? undefined : { duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* the near-invisible dissolve into paper */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44" style={{ background: 'linear-gradient(to top, #F7F3EC 0%, rgba(247,243,236,0.82) 20%, rgba(247,243,236,0.35) 50%, rgba(247,243,236,0) 100%)' }} />

      {/* ---- Back (top-left) ---- */}
      <BackLink href="/library" label={copy.prologue.back} onDark className="absolute left-5 top-5 z-20" />

      {/* ---- Cover controls (top-right): Edit cover + the ⋯ menu ---- */}
      <div className="absolute right-5 top-5 z-20">
        <CoverControls storyId={storyId} slug={slug} cover={cover} onCoverChange={setCover} />
      </div>

      {/* ---- Content, seated low so it never crowds the centre of the photo ---- */}
      <div className="relative z-10 flex h-full flex-col items-center justify-end px-6 pb-[10vh] text-center sm:pb-[12vh]">
        <p className={`mb-4 text-[11px] uppercase tracking-[0.35em] text-ember ${SHADOW}`}>{copy.prologue.heroEyebrow}</p>

        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 blur-2xl"
            style={{ background: 'radial-gradient(60% 120% at 50% 50%, rgba(255,244,225,0.14) 0%, rgba(255,244,225,0) 70%)' }}
          />
          <h1
            style={{ backgroundImage: 'linear-gradient(180deg,#FBF6EE 0%,#FFFFFF 40%,#F7E7D8 72%,#EBE4F6 100%)' }}
            className="bg-clip-text font-serif text-5xl leading-[1.02] tracking-tight text-transparent [filter:drop-shadow(0_2px_20px_rgba(0,0,0,0.18))] sm:text-7xl lg:text-8xl"
          >
            {title}
          </h1>
        </div>

        <p className={`mt-4 font-serif text-xl italic text-paper/80 ${SHADOW} sm:text-2xl`}>{subtitle}</p>

        {metaParts.length > 0 && (
          <div className={`mt-5 flex flex-wrap items-center justify-center gap-x-3 text-[10px] uppercase tracking-[0.2em] text-paper/80 ${SHADOW}`}>
            {metaParts.map((p, i) => (
              <span key={i} className="flex items-center gap-3">
                {i > 0 && <SparkIcon size={7} className="text-ember/70" />}
                {p}
              </span>
            ))}
          </div>
        )}

        <StarDivider onDark className="mt-8 w-full max-w-xs" />
      </div>
    </section>
  );
}
