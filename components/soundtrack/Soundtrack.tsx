'use client';
// -----------------------------------------------------------------------------
// components/soundtrack/Soundtrack.tsx (1.2)
//
// A custom, editorial Spotify card — not Spotify's dark/green embed as the main
// visual. Album art (from oEmbed, fetched server-side) and title sit on a matte
// card in our own type; a "Play on Spotify" button opens the track; a spinning
// vinyl is a quiet accent. Spotify's compact embed is kept below as the minimal
// in-page player (its iframe can't be restyled — see lib/spotify.ts). If oEmbed
// returned nothing, the card degrades to the embed alone. A non-Spotify link is
// kept honestly as a note.
// -----------------------------------------------------------------------------

import { useState, useRef, useEffect, useTransition } from 'react';
import { updateStory } from '@/app/actions/stories';
import { parseSpotify, type SpotifyMeta } from '@/lib/spotify';
import { copy } from '@/lib/copy';
import SectionHeading from '@/components/ui/SectionHeading';
import SpotifyPlayer from './SpotifyPlayer';

export default function Soundtrack({
  storyId,
  slug,
  soundtrack,
  meta,
}: {
  storyId: string;
  slug: string;
  soundtrack: string | null;
  meta: SpotifyMeta | null;
}) {
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

  function startEdit() {
    setDraft(value ?? '');
    setEditing(true);
  }

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

  const addOrEdit = (
    <button
      type="button"
      onClick={startEdit}
      className="text-[11px] uppercase tracking-[0.16em] text-ink-soft underline-offset-4 transition-colors hover:text-violet hover:underline"
    >
      {value ? copy.soundtrack.edit : copy.soundtrack.add}
    </button>
  );

  return (
    <section className="mx-auto max-w-5xl px-6 py-14">
      <SectionHeading eyebrow={copy.soundtrack.eyebrow} title={copy.soundtrack.sectionTitle} tagline={copy.soundtrack.tagline} />

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
            <button type="button" onClick={() => setEditing(false)} disabled={isPending} className="rounded-full border border-rule px-5 py-2 text-xs tracking-wide text-ink-soft hover:border-violet-2 hover:text-violet">
              {copy.soundtrack.cancel}
            </button>
            <button type="button" onClick={save} disabled={isPending} className="rounded-full bg-violet px-6 py-2 text-xs tracking-wide text-paper hover:bg-violet-2 disabled:opacity-60">
              {isPending ? copy.soundtrack.saving : copy.soundtrack.save}
            </button>
          </div>
          {error && <p role="alert" className="mt-2 text-xs text-ember">{error}</p>}
        </div>
      ) : parsed ? (
        <SpotifyPlayer
          type={parsed.type}
          id={parsed.id}
          title={meta?.title || copy.soundtrack.untitledTrack}
          thumbnail={meta?.thumbnail ?? null}
          editControl={addOrEdit}
        />
      ) : value ? (
        <div className="text-center">
          {/^https?:\/\//.test(value) ? (
            <a href={value} target="_blank" rel="noreferrer" className="font-serif text-lg italic text-violet underline-offset-4 hover:underline">
              {value}
            </a>
          ) : (
            <p className="font-serif text-lg italic text-ink">{value}</p>
          )}
          <p className="mt-2 text-[11px] italic text-ink-soft">{copy.soundtrack.asNote}</p>
          <div className="mt-3">{addOrEdit}</div>
        </div>
      ) : (
        <div className="text-center">{addOrEdit}</div>
      )}
    </section>
  );
}
