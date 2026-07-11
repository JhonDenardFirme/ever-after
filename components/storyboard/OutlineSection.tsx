'use client';
// -----------------------------------------------------------------------------
// components/storyboard/OutlineSection.tsx (1.2)
//
// The Outline, folded into the album as a section (it used to be the /storyboard
// page — that route now redirects here). A violet hero with a multiply cover and
// a gentle parallax; below it, the Moments.
//
//   View (default) — the numbered-circle timeline, auto-scrolling forever.
//   Edit           — the full Storyboard editor (StoryboardView), reused as-is.
//
// Plus a link to the shareable, read-only Invitation. An empty story shows the
// "Outline your Storyboard" invitation-to-plan instead of a blank strip.
// -----------------------------------------------------------------------------

import { useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { copy } from '@/lib/copy';
import type { Chapter, Frame, Author } from '@/lib/types';
import StoryboardView from './StoryboardView';
import MomentTimeline from './MomentTimeline';

export default function OutlineSection({
  storyId,
  slug,
  beats,
  frames,
  authors,
  coverUrl,
}: {
  storyId: string;
  slug: string;
  beats: Chapter[];
  frames: Frame[];
  authors: Record<string, Author>;
  coverUrl: string | null;
}) {
  const reduced = useReducedMotion();
  const [editing, setEditing] = useState(false);

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (v) => (reduced ? 0 : v * 0.08));

  const hasBeats = beats.length > 0;

  return (
    <section id="outline" className="mx-auto max-w-5xl scroll-mt-8 px-6 py-14">
      {/* Hero */}
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-violet-hero">
        <motion.div style={{ y }} className="absolute inset-0 -bottom-10">
          {coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="h-full w-full object-cover opacity-40 mix-blend-multiply" />
          )}
        </motion.div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-violet-deep/80 via-violet-deep/20 to-violet-deep/40" />

        <div className="relative flex flex-col items-center px-6 py-14 text-center sm:py-16">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px w-8 bg-ember/70" />
            <p className="text-[10px] uppercase tracking-[0.3em] text-ember">{copy.storyboard.eyebrow}</p>
            <span className="h-px w-8 bg-ember/70" />
          </div>
          <h2 className="font-serif text-4xl text-paper [text-shadow:0_2px_24px_rgba(0,0,0,0.4)] sm:text-6xl">
            {copy.storyboard.heroTitle}
          </h2>
          <p className="mt-3 max-w-md text-sm italic leading-relaxed text-violet-3">
            {copy.storyboard.tagline}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setEditing((e) => !e)}
              className="flex items-center gap-1.5 rounded-full border border-white/25 bg-violet-deep/40 px-4 py-2 text-[11px] tracking-wide text-paper/90 backdrop-blur-sm transition-colors hover:border-white/50 hover:text-paper"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
              </svg>
              {editing ? copy.storyboard.doneOutline : copy.storyboard.editOutline}
            </button>
            {hasBeats && (
              <Link
                href={`/story/${slug}/invitation`}
                className="flex items-center gap-1.5 rounded-full border border-white/25 bg-violet-deep/40 px-4 py-2 text-[11px] tracking-wide text-paper/90 backdrop-blur-sm transition-colors hover:border-white/50 hover:text-paper"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                  <path d="M4 12a8 8 0 0 1 16 0" />
                  <path d="M12 3v9l4 2" />
                </svg>
                {copy.storyboard.invite}
              </Link>
            )}
          </div>
        </div>
      </div>

      {editing ? (
        <StoryboardView storyId={storyId} slug={slug} beats={beats} frames={frames} authors={authors} />
      ) : hasBeats ? (
        <MomentTimeline beats={beats} autoscroll />
      ) : (
        <div className="rounded-2xl border border-dashed border-rule-strong bg-paper2/40 py-16 text-center">
          <p className="mb-6 font-serif text-2xl italic text-ink-soft">{copy.storyboard.emptyInvite}</p>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-full bg-violet px-6 py-3 text-sm tracking-wide text-paper shadow-glow-soft transition-colors hover:bg-violet-2"
          >
            {copy.storyboard.addBeat}
          </button>
        </div>
      )}
    </section>
  );
}
