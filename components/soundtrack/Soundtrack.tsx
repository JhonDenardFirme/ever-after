'use client';
// -----------------------------------------------------------------------------
// components/soundtrack/Soundtrack.tsx (1.2)
//
// Paste a Spotify link; we keep it in stories.soundtrack and render Spotify's
// own embed for real playback (album art, title, artist, a play button). Beside
// it spins a vinyl disc — our own violet flourish, honest about what it is: the
// disc is decorative, because cross-origin autoplay and transport control of a
// Spotify iframe simply aren't ours to drive. A non-Spotify string is kept as a
// plain note rather than pretending to be a player.
//
// Editing the link reuses the existing updateStory('soundtrack', …) action.
// -----------------------------------------------------------------------------

import { useState, useRef, useEffect, useTransition } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { updateStory } from '@/app/actions/stories';
import { copy } from '@/lib/copy';
import SectionHeading from '@/components/ui/SectionHeading';

/** Pull the {type, id} out of a Spotify link, tolerating /intl-xx/ and ?si=… */
function parseSpotify(link: string | null): { type: string; id: string } | null {
  if (!link) return null;
  const m = link.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist|episode|show)\/([A-Za-z0-9]+)/i);
  return m ? { type: m[1].toLowerCase(), id: m[2] } : null;
}

/** A little spinning record. Decorative; slows to stillness under reduced motion. */
function Vinyl({ spinning }: { spinning: boolean }) {
  return (
    <motion.svg
      width="72"
      height="72"
      viewBox="0 0 100 100"
      aria-hidden="true"
      className="shrink-0 drop-shadow"
      animate={spinning ? { rotate: 360 } : undefined}
      transition={spinning ? { duration: 8, repeat: Infinity, ease: 'linear' } : undefined}
    >
      <circle cx="50" cy="50" r="48" fill="#1b0a34" />
      <circle cx="50" cy="50" r="48" fill="none" stroke="#6C2BD9" strokeOpacity="0.5" strokeWidth="1" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="#B99CF5" strokeOpacity="0.25" strokeWidth="1" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="#B99CF5" strokeOpacity="0.2" strokeWidth="1" />
      <circle cx="50" cy="50" r="22" fill="none" stroke="#B99CF5" strokeOpacity="0.15" strokeWidth="1" />
      <circle cx="50" cy="50" r="14" fill="#5115AB" />
      <circle cx="50" cy="50" r="4" fill="#F97316" />
      {/* a highlight sweep so the spin reads */}
      <path d="M50 2 A48 48 0 0 1 98 50 L88 50 A38 38 0 0 0 50 12 Z" fill="#B99CF5" fillOpacity="0.12" />
    </motion.svg>
  );
}

export default function Soundtrack({
  storyId,
  slug,
  soundtrack,
}: {
  storyId: string;
  slug: string;
  soundtrack: string | null;
}) {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(soundtrack);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(soundtrack ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const parsed = parseSpotify(value);

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateStory(storyId, 'soundtrack', draft);
      if (result.ok) {
        setValue(result.data.soundtrack);
        setEditing(false);
      } else {
        setError(result.error || copy.soundtrack.saveError);
      }
    });
  }

  const editControl = (
    <button
      type="button"
      onClick={() => {
        setDraft(value ?? '');
        setEditing(true);
      }}
      className="text-[11px] uppercase tracking-[0.16em] text-ink-soft underline-offset-4 transition-colors hover:text-violet hover:underline"
    >
      {value ? copy.soundtrack.edit : copy.soundtrack.add}
    </button>
  );

  return (
    <section className="mx-auto max-w-5xl px-6 py-14">
      <SectionHeading
        eyebrow={copy.soundtrack.eyebrow}
        title={copy.soundtrack.sectionTitle}
        tagline={copy.soundtrack.tagline}
      />

      {editing ? (
        <div className="mx-auto max-w-md text-center">
          <input
            ref={inputRef}
            value={draft}
            disabled={isPending}
            placeholder={copy.soundtrack.placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
              if (e.key === 'Escape') setEditing(false);
            }}
            className="mb-3 w-full rounded-lg border border-rule bg-paper2 px-4 py-2.5 text-center text-sm text-ink outline-none focus:border-violet-2"
          />
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={isPending}
              className="rounded-full border border-rule px-5 py-2 text-xs tracking-wide text-ink-soft hover:border-violet-2 hover:text-violet"
            >
              {copy.soundtrack.cancel}
            </button>
            <button
              type="button"
              onClick={save}
              disabled={isPending}
              className="rounded-full bg-violet px-6 py-2 text-xs tracking-wide text-paper hover:bg-violet-2 disabled:opacity-60"
            >
              {isPending ? copy.soundtrack.saving : copy.soundtrack.save}
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-2 text-xs text-ember">
              {error}
            </p>
          )}
        </div>
      ) : parsed ? (
        <div className="overflow-hidden rounded-2xl border border-rule bg-violet-hero p-4 shadow-glow-soft">
          <div className="flex items-center gap-4">
            <Vinyl spinning={!reduced} />
            <div className="min-w-0 flex-1">
              <iframe
                title={copy.soundtrack.eyebrow}
                src={`https://open.spotify.com/embed/${parsed.type}/${parsed.id}`}
                width="100%"
                height="152"
                frameBorder="0"
                loading="lazy"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[11px] italic text-paper/70">{copy.soundtrack.hint}</p>
            <button
              type="button"
              onClick={() => {
                setDraft(value ?? '');
                setEditing(true);
              }}
              className="text-[11px] uppercase tracking-[0.16em] text-violet-3 underline-offset-4 transition-colors hover:text-paper hover:underline"
            >
              {copy.soundtrack.edit}
            </button>
          </div>
        </div>
      ) : value ? (
        // A non-Spotify string — keep it honest as a note/link.
        <div className="text-center">
          {/^https?:\/\//.test(value) ? (
            <a href={value} target="_blank" rel="noreferrer" className="font-serif text-lg italic text-violet underline-offset-4 hover:underline">
              {value}
            </a>
          ) : (
            <p className="font-serif text-lg italic text-ink">{value}</p>
          )}
          <p className="mt-2 text-[11px] italic text-ink-soft">{copy.soundtrack.asNote}</p>
          <div className="mt-3">{editControl}</div>
        </div>
      ) : (
        <div className="text-center">{editControl}</div>
      )}
    </section>
  );
}
