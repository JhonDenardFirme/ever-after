'use client';
// -----------------------------------------------------------------------------
// components/prologue/PrologueSection.tsx (1.2)
//
// The Prologue, resting in a VIEW by default — only filled fields show — with a
// small edit icon that flips to the existing inline form (PrologueBody, reused
// as-is). It now carries the shared SectionHeading (big gradient title +
// tagline) so it reads as a complete section, and spans the same content width
// as The Story feed so the Epigraph banner lines up with the photos below.
//
// The Epigraph is the centrepiece: centred on a banner (the cover, dimmed under
// a violet multiply), Dedication as a subtext beneath.
// -----------------------------------------------------------------------------

import { useState } from 'react';
import { copy } from '@/lib/copy';
import type { Story } from '@/lib/types';
import SectionHeading from '@/components/ui/SectionHeading';
import PrologueBody from './PrologueBody';

function longDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-PH', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function PrologueSection({
  story,
  coverUrl,
}: {
  story: Story;
  coverUrl: string | null;
}) {
  const [editing, setEditing] = useState(false);

  const from = longDate(story.starts_on);
  const to = longDate(story.ends_on);
  const dateLine = from && to && from !== to ? `${from} – ${to}` : from;

  const hasAnything =
    story.setting || story.theme || story.dedication || story.epigraph || story.description || dateLine;

  const editIcon = (
    <button
      type="button"
      onClick={() => setEditing(true)}
      aria-label={copy.prologue.edit}
      title={copy.prologue.edit}
      className="flex items-center gap-1.5 rounded-full border border-rule px-3 py-1.5 text-[11px] tracking-wide text-ink-soft transition-colors hover:border-violet-2 hover:text-violet"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
      </svg>
      {copy.couple.edit}
    </button>
  );

  if (editing) {
    return (
      <section className="mx-auto max-w-5xl px-6 py-14">
        <SectionHeading
          eyebrow={copy.prologue.sectionEyebrow}
          title={copy.prologue.sectionTitle}
          tagline={copy.prologue.tagline}
          action={
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full bg-violet px-5 py-2 text-xs tracking-wide text-paper shadow-glow-soft transition-colors hover:bg-violet-2"
            >
              {copy.prologue.done}
            </button>
          }
        />
        <PrologueBody story={story} />
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-14">
      <SectionHeading
        eyebrow={copy.prologue.sectionEyebrow}
        title={copy.prologue.sectionTitle}
        tagline={copy.prologue.tagline}
        action={editIcon}
      />

      {!hasAnything ? (
        <p className="py-14 text-center font-serif text-xl italic text-ink-soft">{copy.prologue.empty}</p>
      ) : (
        <div>
          {/* When & where */}
          {(dateLine || story.setting) && (
            <p className="mb-10 text-center text-[11px] uppercase tracking-[0.24em] text-ink-soft">
              {[story.setting, dateLine].filter(Boolean).join('  ·  ')}
            </p>
          )}

          {/* Epigraph banner — full content width, centred on the cover under a
              violet multiply, Dedication beneath. */}
          {(story.epigraph || story.dedication) && (
            <figure className="mb-14 overflow-hidden rounded-3xl">
              <div className="relative flex min-h-[240px] items-center justify-center px-8 py-16 sm:min-h-[300px]">
                <div className="absolute inset-0 bg-violet-hero" />
                {coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-55 mix-blend-multiply"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-violet-deep/75 via-transparent to-violet-deep/30" />

                <figcaption className="relative mx-auto max-w-2xl text-center">
                  {story.epigraph && (
                    <p className="font-serif text-2xl italic leading-relaxed text-paper [text-shadow:0_1px_20px_rgba(53,14,112,0.7)] sm:text-3xl">
                      {story.epigraph}
                    </p>
                  )}
                  {story.dedication && (
                    <p className="mx-auto mt-6 max-w-md text-sm italic leading-relaxed text-violet-3">
                      {story.dedication}
                    </p>
                  )}
                </figcaption>
              </div>
            </figure>
          )}

          {/* Description */}
          {story.description && (
            <div className="mx-auto max-w-2xl border-t border-rule pt-8 text-center">
              <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                {copy.prologue.labels.description}
              </p>
              <p className="font-serif text-lg leading-relaxed text-ink">{story.description}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
