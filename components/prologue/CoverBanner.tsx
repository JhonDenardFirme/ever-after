'use client';
// -----------------------------------------------------------------------------
// components/prologue/CoverBanner.tsx (1.2)
//
// The story's cover, at the top of the album. Parallax lingering, a violet
// multiply gradient laid over the photo (so it reads as ours, not just a raw
// image), a dark scrim so the gradient title stays legible, and gentle hover
// life. The cover control is a small menu (top-right, above the page's back-link
// strip so it's actually clickable): Change cover, and — when one is set —
// Remove cover photo.
//
// The cover URL is resolved server-side (uploaded cover_url beats the Keepsake
// cover); uploading writes stories.cover_url, removing clears it.
// -----------------------------------------------------------------------------

import { useRef, useState, useTransition } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import imageCompression from 'browser-image-compression';
import { setStoryCover, removeStoryCover } from '@/app/actions/stories';
import { PARALLAX_FACTOR } from '@/lib/motion';
import { copy } from '@/lib/copy';

const COMPRESSION = { maxSizeMB: 0.9, maxWidthOrHeight: 2000, useWebWorker: true };

export default function CoverBanner({
  storyId,
  slug,
  coverUrl,
  title,
  theme,
}: {
  storyId: string;
  slug: string;
  coverUrl: string | null;
  title: string;
  theme: string | null;
}) {
  const reduced = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [cover, setCover] = useState<string | null>(coverUrl);
  const [pending, setPending] = useState(false);
  const [isRemoving, startRemove] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (v) => (reduced ? 0 : v * PARALLAX_FACTOR));

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
    <div className="group relative h-[46vh] overflow-hidden bg-violet-hero sm:h-[56vh]">
      <motion.div style={{ y }} className="absolute inset-0 -bottom-16">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="max-w-xs px-6 text-center font-serif text-lg italic text-paper/70">
              {copy.prologue.coverEmpty}
            </p>
          </div>
        )}
      </motion.div>

      {/* violet MULTIPLY gradient — the "ours, not just a photo" tint */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-violet-deep/85 via-violet/25 to-transparent mix-blend-multiply" />
      {/* readability scrim behind the title */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-violet-deep/85 via-violet-deep/25 to-transparent" />
      {/* fade into the page */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-paper to-transparent" />

      {/* Title */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-6 pb-16 text-center transition-transform duration-500 group-hover:-translate-y-1 sm:pb-20">
        {theme && (
          <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-ember drop-shadow-[0_1px_10px_rgba(0,0,0,0.5)]">
            {theme}
          </p>
        )}
        <h1 className="mx-auto max-w-3xl bg-ever-gradient bg-clip-text font-serif text-5xl leading-tight text-transparent [text-shadow:0_2px_36px_rgba(0,0,0,0.55)] sm:text-7xl">
          {title}
        </h1>
      </div>

      {/* Cover menu — above the page's z-10 back-link strip so it's clickable */}
      <div className="absolute right-4 top-4 z-20">
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
          className="flex items-center gap-2 rounded-full border border-white/25 bg-violet-deep/50 px-3.5 py-2 text-[11px] tracking-wide text-paper/90 backdrop-blur-sm transition-colors hover:border-white/60 hover:text-paper disabled:opacity-60"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="8.5" cy="10" r="1.5" />
            <path d="M21 16l-5-5-6 6" />
          </svg>
          {busy ? copy.prologue.coverUploading : cover ? copy.prologue.cover : copy.prologue.addCover}
        </button>

        {menuOpen && (
          <>
            <button
              type="button"
              aria-hidden="true"
              tabIndex={-1}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-0 cursor-default"
            />
            <div role="menu" className="absolute right-0 z-10 mt-2 w-48 overflow-hidden rounded-xl border border-rule bg-paper2 py-1 shadow-glow">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="block w-full px-4 py-2.5 text-left text-sm text-ink transition-colors hover:bg-paper"
              >
                {cover ? copy.prologue.changeCover : copy.prologue.addCover}
              </button>
              {cover && (
                <button
                  type="button"
                  onClick={remove}
                  className="block w-full px-4 py-2.5 text-left text-sm text-ink-soft transition-colors hover:bg-paper hover:text-ember"
                >
                  {copy.prologue.removeCover}
                </button>
              )}
            </div>
          </>
        )}

        {error && (
          <p role="alert" className="mt-1 max-w-[12rem] text-right text-[11px] text-paper">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
