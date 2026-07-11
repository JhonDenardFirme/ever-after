'use client';
// -----------------------------------------------------------------------------
// components/story/PhotoFeed.tsx (1.2) — "The Story".
//
// The photo feed on the main album page. Internally PhotoFeed; the label reads
// "The Story" (copy.frames.eyebrow). storyId keeps meaning "a Fleeting Frames"
// everywhere — this section deliberately does NOT reuse that word in code.
//
// Layout: CSS-column masonry, so portrait and landscape Frames both keep their
// natural shape with even gutters and nothing over/under-scaled. Hover zooms the
// image inside its clipped frame ("magnifying glass"); a violet bleed sits at
// each Frame's base; corners are rounded throughout. Click a Frame → lightbox.
//
// Sets: developed Frames are grouped by their prompt_text label (the "sub-album"
// from the Frame List) with a styled header. Frames with no label render LAST,
// with no header — never the word "Uncategorized". Each set gets its own upload
// button; the section has a general one. New Frames need a Moment to attach to
// (frames reach their story only through a chapter until 1.2-D), so uploads land
// on the last Moment — or, with no Moments yet, we point at the Storyboard.
// -----------------------------------------------------------------------------

import { useState } from 'react';
import Link from 'next/link';
import { orderBeats } from '@/lib/beats';
import { copy } from '@/lib/copy';
import type { Chapter, Frame, Author } from '@/lib/types';
import UploadFrame from '@/components/frames/UploadFrame';
import SectionHeading from '@/components/ui/SectionHeading';
import { StarBadge } from '@/components/ui/icons';
import PhotoLightbox from './PhotoLightbox';

type Group = { label: string | null; frames: Frame[] };

/** An answered Afterword reflection, woven between the photos. */
export type Reflection = { id: string; question: string; answers: { name: string; text: string }[] };

type FeedItem = { kind: 'frame'; frame: Frame } | { kind: 'reflection'; reflection: Reflection };

const REFLECTION_STRIDE = 4; // drop a reflection card after every N photos

/**
 * Orientation buckets: portrait / square / landscape. Frames keep their
 * orientation but snap to one of three tidy ratios, so sizing stays consistent
 * across the whole feed with only a tiny object-cover zoom to fill.
 */
function bucketRatio(f: Frame): number {
  const r = f.width && f.height ? f.width / f.height : 1;
  if (r <= 0.9) return 4 / 5; // portrait
  if (r >= 1.15) return 4 / 3; // landscape
  return 1; // square-ish
}

/** "Denard's Keepsake" / "Denard's & Airhyl's Keepsake". */
function keepsakeLabel(names: string[]): string {
  const valid = names.filter(Boolean);
  if (valid.length === 0) return copy.frames.keepsake;
  if (valid.length === 1) return copy.frames.keepsakeOf(valid[0]);
  return `${valid.map((n) => `${n}’s`).join(' & ')} ${copy.frames.keepsake}`;
}

export default function PhotoFeed({
  storyId,
  slug,
  chapters,
  frames,
  keepsakes,
  myKeepsakeFrameId,
  authors,
  reflections = [],
}: {
  storyId: string;
  slug: string;
  chapters: Chapter[];
  frames: Frame[];
  /** frameId → the author name(s) whose Keepsake it is. */
  keepsakes: Record<string, string[]>;
  myKeepsakeFrameId: string | null;
  authors: Record<string, Author>;
  reflections?: Reflection[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  const developed = frames.filter((f) => f.status === 'developed' && f.media_url);

  // New Frames attach to the last Moment of the day (see header note).
  const ordered = orderBeats(chapters);
  const lastChapter = ordered[ordered.length - 1] ?? null;

  // Group by prompt_text. Labeled sets first (in first-appearance order); the
  // unlabeled group always sorts last.
  const groups: Group[] = [];
  const indexByLabel = new Map<string, number>();
  let unlabeled: Frame[] | null = null;

  for (const f of developed) {
    const label = f.prompt_text?.trim() || null;
    if (label === null) {
      if (!unlabeled) unlabeled = [];
      unlabeled.push(f);
      continue;
    }
    let gi = indexByLabel.get(label);
    if (gi === undefined) {
      gi = groups.length;
      indexByLabel.set(label, gi);
      groups.push({ label, frames: [] });
    }
    groups[gi].frames.push(f);
  }
  if (unlabeled && unlabeled.length > 0) groups.push({ label: null, frames: unlabeled });

  const open = openId ? developed.find((f) => f.id === openId) ?? null : null;

  function Tile({ frame }: { frame: Frame }) {
    const keepsakeNames = keepsakes[frame.id];
    const isKeepsake = !!keepsakeNames?.length;
    return (
      <button
        type="button"
        onClick={() => setOpenId(frame.id)}
        style={{ aspectRatio: bucketRatio(frame) }}
        className="group relative mb-4 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-rule bg-violet-deep"
      >
        {frame.media_type === 'video' ? (
          <>
            <video
              src={frame.media_url as string}
              preload="metadata"
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            />
            <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-paper/85 text-violet">
              ▶
            </span>
          </>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={frame.media_url as string}
            alt={frame.caption ?? frame.prompt_text ?? ''}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          />
        )}

        {/* violet bleed so photos never read too sharply */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-violet-bleed opacity-80" />

        {isKeepsake && (
          <span className="absolute left-3 top-3">
            <StarBadge label={keepsakeLabel(keepsakeNames)} />
          </span>
        )}

        {/* caption shows only when present — otherwise the photo stands alone */}
        {frame.caption && (
          <span className="absolute inset-x-0 bottom-0 truncate px-4 pb-3 text-left font-serif text-sm text-paper drop-shadow">
            {frame.caption}
          </span>
        )}
      </button>
    );
  }

  // Weave answered reflections through the feed: one after every few photos,
  // drawn from a shared queue so they spread across the sets. Leftovers land in
  // the final group.
  const queue = reflections.slice(0, 8);
  let qi = 0;
  const groupsRender = groups.map((g) => {
    const items: FeedItem[] = [];
    g.frames.forEach((f, i) => {
      items.push({ kind: 'frame', frame: f });
      if ((i + 1) % REFLECTION_STRIDE === 0 && qi < queue.length) {
        items.push({ kind: 'reflection', reflection: queue[qi++] });
      }
    });
    return { label: g.label, items };
  });
  if (groupsRender.length > 0) {
    while (qi < queue.length) {
      groupsRender[groupsRender.length - 1].items.push({ kind: 'reflection', reflection: queue[qi++] });
    }
  }

  function ReflectionCard({ r }: { r: Reflection }) {
    return (
      <div className="mb-4 break-inside-avoid rounded-2xl bg-violet-hero p-5 text-paper shadow-glow-soft ring-1 ring-inset ring-white/10">
        <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-violet-3">
          {copy.afterword.reflectionEyebrow}
        </p>
        <p className="font-serif text-lg italic leading-snug text-paper/90">{r.question}</p>
        <div className="mt-3 space-y-3">
          {r.answers.map((a, i) => (
            <div key={i}>
              <p className="font-serif text-base leading-snug">{a.text}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-violet-3">— {a.name}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const headerAction = lastChapter ? (
    <UploadFrame
      slug={slug}
      chapterId={lastChapter.id}
      render={({ pending, label, open: openPicker }) => (
        <button
          type="button"
          onClick={openPicker}
          disabled={pending}
          className="rounded-full bg-violet px-5 py-2.5 text-xs tracking-wide text-paper shadow-glow-soft transition-colors hover:bg-violet-2 disabled:opacity-60"
        >
          {pending ? label ?? copy.frames.developing : copy.frames.develop}
        </button>
      )}
    />
  ) : (
    <Link
      href={`/story/${slug}/storyboard`}
      className="rounded-full border border-rule px-5 py-2.5 text-xs tracking-wide text-ink-soft hover:border-violet-2 hover:text-violet"
    >
      {copy.prologue.toStoryboard}
    </Link>
  );

  return (
    <section id="story" className="mx-auto max-w-5xl scroll-mt-8 px-6 py-14">
      <SectionHeading
        eyebrow={copy.frames.eyebrow}
        title={copy.frames.lead}
        tagline={copy.frames.tagline}
        action={headerAction}
      />

      {developed.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-rule-strong bg-paper2/40 py-20 text-center font-serif text-xl italic text-ink-soft">
          {copy.frames.emptyStory}
        </p>
      ) : (
        <div className="space-y-14">
          {groupsRender.map((group, gi) => (
            <div key={group.label ?? `__unlabeled-${gi}`}>
              {/* A labeled set gets a header + its own upload button. The
                  unlabeled group renders with neither. */}
              {group.label && (
                <div className="mb-5 flex items-center gap-4">
                  <h3 className="font-serif text-2xl text-ink">{group.label}</h3>
                  <span className="h-px flex-1 bg-rule" />
                  {lastChapter && (
                    <UploadFrame
                      slug={slug}
                      chapterId={lastChapter.id}
                      promptText={group.label}
                      render={({ pending, label, open: openPicker }) => (
                        <button
                          type="button"
                          onClick={openPicker}
                          disabled={pending}
                          className="shrink-0 rounded-full border border-rule px-3.5 py-1.5 text-[11px] tracking-wide text-ink-soft transition-colors hover:border-violet-2 hover:text-violet disabled:opacity-60"
                        >
                          {pending ? label ?? copy.frames.developing : copy.frames.uploadToSet(group.label as string)}
                        </button>
                      )}
                    />
                  )}
                </div>
              )}

              <div className="columns-2 gap-4 sm:columns-3">
                {group.items.map((item) =>
                  item.kind === 'frame' ? (
                    <Tile key={item.frame.id} frame={item.frame} />
                  ) : (
                    <ReflectionCard key={`r-${item.reflection.id}`} r={item.reflection} />
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <PhotoLightbox
          frame={open}
          authors={authors}
          keepsakeNames={keepsakes[open.id] ?? []}
          mine={open.id === myKeepsakeFrameId}
          storyId={storyId}
          slug={slug}
          onClose={() => setOpenId(null)}
        />
      )}
    </section>
  );
}
