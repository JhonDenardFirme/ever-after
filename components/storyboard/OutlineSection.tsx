'use client';
// -----------------------------------------------------------------------------
// components/storyboard/OutlineSection.tsx (1.2)
//
// The Outline, folded into the album as a section. It now uses the standard
// SectionHeading (like every other section) for consistency, with the edit
// toggle and the Invitation link as its heading actions.
//
//   View (default) — the numbered, star-linked Moment timeline, auto-scrolling.
//   Edit           — the full Storyboard editor (StoryboardView), reused as-is.
//
// /storyboard redirects here; empty stories show the "Outline your Storyboard"
// invitation-to-plan.
// -----------------------------------------------------------------------------

import { useState } from 'react';
import Link from 'next/link';
import { copy } from '@/lib/copy';
import type { Chapter, Frame, Author } from '@/lib/types';
import SectionHeading from '@/components/ui/SectionHeading';
import StoryboardView from './StoryboardView';
import MomentTimeline from './MomentTimeline';

export default function OutlineSection({
  storyId,
  slug,
  beats,
  frames,
  authors,
}: {
  storyId: string;
  slug: string;
  beats: Chapter[];
  frames: Frame[];
  authors: Record<string, Author>;
}) {
  const [editing, setEditing] = useState(false);
  const hasBeats = beats.length > 0;

  const pill =
    'flex items-center gap-1.5 rounded-full border border-rule px-4 py-2 text-[11px] tracking-wide text-ink-soft transition-colors hover:border-violet-2 hover:text-violet';

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => setEditing((e) => !e)} className={pill}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
        </svg>
        {editing ? copy.storyboard.doneOutline : copy.storyboard.editOutline}
      </button>
      {hasBeats && (
        <Link href={`/story/${slug}/invitation`} className={pill}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="M4 12a8 8 0 0 1 16 0" />
            <path d="M12 3v9l4 2" />
          </svg>
          {copy.storyboard.invite}
        </Link>
      )}
    </div>
  );

  return (
    <section id="outline" className="mx-auto max-w-5xl scroll-mt-8 px-6 py-14">
      <SectionHeading
        eyebrow={copy.storyboard.eyebrow}
        title={copy.storyboard.sectionTitle}
        tagline={copy.storyboard.tagline}
        action={actions}
      />

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
            className="rounded-full bg-ever-gradient px-6 py-3 text-sm tracking-wide text-paper shadow-glow-soft transition-opacity hover:opacity-90"
          >
            {copy.storyboard.addBeat}
          </button>
        </div>
      )}
    </section>
  );
}
