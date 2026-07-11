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

import { useRef, useState, useTransition } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import imageCompression from 'browser-image-compression';
import { setStoryCover, removeStoryCover } from '@/app/actions/stories';
import { copy } from '@/lib/copy';
import StarDivider from '@/components/ui/StarDivider';
import StarField from '@/components/ui/StarField';
import BackLink from '@/components/ui/BackLink';
import { SparkIcon } from '@/components/ui/icons';

const COMPRESSION = { maxSizeMB: 0.9, maxWidthOrHeight: 2200, useWebWorker: true };
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [cover, setCover] = useState<string | null>(coverUrl);
  const [pending, setPending] = useState(false);
  const [isRemoving, startRemove] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (v) => (reduced ? 0 : v * 0.12));

  async function pick(file: File) {
    setError(null);
    setMenuOpen(false);
    setPending(true);
    try {
      let upload: File | Blob = file;
      try {
        upload = await imageCompression(file, COMPRESSION);
      } catch {
        /* fall back to the original */
      }
      const fd = new FormData();
      fd.set('file', upload, file.name);
      const result = await setStoryCover(storyId, slug, fd);
      if (result.ok) setCover(result.data.cover_url);
      else setError(result.error);
    } finally {
      setPending(false);
    }
  }

  function remove() {
    setError(null);
    setMenuOpen(false);
    startRemove(async () => {
      const result = await removeStoryCover(storyId, slug);
      if (result.ok) setCover(null);
      else setError(result.error);
    });
  }

  const busy = pending || isRemoving;

  return (
    <section className="relative h-[65vh] min-h-[520px] w-full overflow-hidden md:h-[72vh] lg:h-[90vh]">
      {/* ---- Image (parallax wrapper + slow scale) ---- */}
      <motion.div style={{ y }} className="absolute inset-0 -bottom-16">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="ever-hero-scale h-full w-full object-cover object-center" />
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
      <StarField />
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

      {/* ---- Edit cover (top-right) ---- */}
      <div className="absolute right-5 top-5 z-20">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) pick(f);
          }}
        />
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          disabled={busy}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="flex items-center gap-1.5 rounded-full border border-white/25 bg-white/[0.12] px-4 py-2 text-[11px] tracking-wide text-paper/90 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-paper disabled:opacity-60"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
          </svg>
          {busy ? copy.prologue.coverUploading : copy.prologue.editCover}
        </button>

        {menuOpen && (
          <>
            <button type="button" aria-hidden="true" tabIndex={-1} onClick={() => setMenuOpen(false)} className="fixed inset-0 z-0 cursor-default" />
            <div role="menu" className="absolute right-0 z-10 mt-2 w-48 overflow-hidden rounded-xl border border-white/15 bg-violet-deep/80 py-1 text-paper shadow-glow backdrop-blur-xl">
              <button type="button" onClick={() => inputRef.current?.click()} className="block w-full px-4 py-2.5 text-left text-sm text-paper/90 transition-colors hover:bg-white/10">
                {cover ? copy.prologue.changeCover : copy.prologue.addCover}
              </button>
              {cover && (
                <button type="button" onClick={remove} className="block w-full px-4 py-2.5 text-left text-sm text-violet-3 transition-colors hover:bg-white/10 hover:text-ember">
                  {copy.prologue.removeCover}
                </button>
              )}
            </div>
          </>
        )}
        {error && <p role="alert" className={`mt-1 max-w-[12rem] text-right text-[11px] text-paper ${SHADOW}`}>{error}</p>}
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
