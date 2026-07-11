'use client';
// -----------------------------------------------------------------------------
// components/library/CoupleHero.tsx (1.2)
//
// The highlight of The Library: who the two of you are. Rests in a view by
// default; a small edit icon opens the whole thing as a form, and saving drops
// it back into the view — the "edit → form → save → view" flow from the brief.
//
// The surface is deliberately NOT a flat block of violet (which reads cheap and
// tires the eye). It's layered: a deep, near-desaturated base, two soft glow
// blooms (one violet, one a whisper of ember) that breathe slowly, a fine grain
// texture, and a hairline inner ring. All the movement is gated behind
// prefers-reduced-motion. Photos upload to the profiles bucket, compressed in
// the browser first like every other image in the app.
// -----------------------------------------------------------------------------

import { useState, useRef, useTransition } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import imageCompression from 'browser-image-compression';
import { saveCouple, uploadCouplePhoto } from '@/app/actions/couple';
import { copy } from '@/lib/copy';
import type { Couple } from '@/lib/types';

const COMPRESSION = { maxSizeMB: 0.8, maxWidthOrHeight: 1200, useWebWorker: true };

// A faint film grain, scoped to this panel and blended so it reads as texture
// on the dark surface rather than a flat wash.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")";

// The layered base: a violet glow up-left, a warm ember whisper down-right, over
// a deep, dark violet. Depth without saturation.
const SURFACE =
  'radial-gradient(120% 120% at 12% 8%, rgba(108,43,217,0.42) 0%, rgba(108,43,217,0) 42%),' +
  'radial-gradient(120% 120% at 88% 96%, rgba(249,115,22,0.16) 0%, rgba(249,115,22,0) 48%),' +
  'linear-gradient(150deg, #2a0f57 0%, #1b0a34 56%, #140626 100%)';

type Member = 'one' | 'two';

/** One circular portrait. Click-to-upload while editing; static while viewing. */
function Portrait({
  url,
  editing,
  onPick,
  pending,
}: {
  url: string | null;
  editing: boolean;
  onPick: (file: File) => void;
  pending: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative">
      {/* halo behind the portrait */}
      <div className="pointer-events-none absolute -inset-2 rounded-full bg-violet-3/20 blur-xl" />
      <div className="relative h-24 w-24 overflow-hidden rounded-full ring-2 ring-white/15 sm:h-28 sm:w-28">
        <div className="absolute inset-0 bg-violet-deep" />
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="relative h-full w-full object-cover" />
        ) : (
          <div className="relative flex h-full w-full items-center justify-center text-violet-3/60">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
              <circle cx="12" cy="8.5" r="3.5" />
              <path d="M5 19c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5" />
            </svg>
          </div>
        )}
      </div>

      {editing && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) onPick(f);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            className="absolute inset-x-0 -bottom-2 mx-auto w-max rounded-full bg-paper px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-violet shadow-shelf transition-colors hover:bg-paper2 disabled:opacity-60"
          >
            {pending ? copy.couple.saving : url ? copy.couple.changePhoto : copy.couple.addPhoto}
          </button>
        </>
      )}
    </div>
  );
}

export default function CoupleHero({ couple }: { couple: Couple | null }) {
  const reduced = useReducedMotion();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [photoPending, setPhotoPending] = useState<Member | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The live view of the row (updated as photos upload / fields save).
  const [row, setRow] = useState<Couple | null>(couple);

  // Draft text fields while editing.
  const [headline, setHeadline] = useState(couple?.headline ?? '');
  const [story, setStory] = useState(couple?.story ?? '');
  const [m1name, setM1name] = useState(couple?.member_one_name ?? '');
  const [m1note, setM1note] = useState(couple?.member_one_note ?? '');
  const [m2name, setM2name] = useState(couple?.member_two_name ?? '');
  const [m2note, setM2note] = useState(couple?.member_two_note ?? '');

  function openEdit() {
    setHeadline(row?.headline ?? '');
    setStory(row?.story ?? '');
    setM1name(row?.member_one_name ?? '');
    setM1note(row?.member_one_note ?? '');
    setM2name(row?.member_two_name ?? '');
    setM2note(row?.member_two_note ?? '');
    setError(null);
    setEditing(true);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveCouple({
        headline,
        story,
        member_one_name: m1name,
        member_one_note: m1note,
        member_two_name: m2name,
        member_two_note: m2note,
      });
      if (result.ok) {
        setRow(result.data);
        setEditing(false);
      } else {
        setError(result.error || copy.couple.saveError);
      }
    });
  }

  async function pickPhoto(which: Member, file: File) {
    setError(null);
    setPhotoPending(which);
    try {
      let upload: File | Blob = file;
      try {
        upload = await imageCompression(file, COMPRESSION);
      } catch {
        /* fall back to the original file */
      }
      const fd = new FormData();
      fd.set('file', upload, file.name);
      const result = await uploadCouplePhoto(which, fd);
      if (result.ok) setRow(result.data);
      else setError(result.error || copy.couple.saveError);
    } finally {
      setPhotoPending(null);
    }
  }

  const hasContent =
    row &&
    (row.headline || row.story || row.member_one_name || row.member_two_name ||
      row.member_one_photo_url || row.member_two_photo_url);

  const inputClass =
    'w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-paper outline-none transition-colors placeholder:text-violet-3/50 focus:border-violet-3';

  const members = [
    {
      m: 'one' as Member,
      name: editing ? m1name : row?.member_one_name,
      note: editing ? m1note : row?.member_one_note,
      url: row?.member_one_photo_url ?? null,
      setName: setM1name,
      setNote: setM1note,
      ph: copy.couple.memberOne,
    },
    {
      m: 'two' as Member,
      name: editing ? m2name : row?.member_two_name,
      note: editing ? m2note : row?.member_two_note,
      url: row?.member_two_photo_url ?? null,
      setName: setM2name,
      setNote: setM2note,
      ph: copy.couple.memberTwo,
    },
  ];

  function renderMember(member: (typeof members)[number]) {
    return (
      <div className="flex w-40 flex-col items-center text-center">
        <div className="mb-4">
          <Portrait
            url={member.url}
            editing={editing}
            pending={photoPending === member.m}
            onPick={(file) => pickPhoto(member.m, file)}
          />
        </div>

        {editing ? (
          <div className="w-full space-y-2">
            <input
              value={member.name ?? ''}
              onChange={(e) => member.setName(e.target.value)}
              placeholder={member.ph.namePlaceholder}
              className={`${inputClass} text-center font-serif`}
            />
            <input
              value={member.note ?? ''}
              onChange={(e) => member.setNote(e.target.value)}
              placeholder={member.ph.notePlaceholder}
              className={`${inputClass} text-center`}
            />
          </div>
        ) : (
          <>
            {member.name && <p className="font-serif text-xl text-paper">{member.name}</p>}
            <p className="mt-1 text-sm text-violet-3">
              {member.note || (member.name ? copy.couple.greet(member.name) : '')}
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <motion.section
      initial={reduced ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{ backgroundImage: SURFACE }}
      className="relative mb-16 overflow-hidden rounded-[1.75rem] px-6 py-11 shadow-glow ring-1 ring-inset ring-white/10 sm:px-12 sm:py-16"
    >
      {/* grain texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.15] mix-blend-soft-light"
        style={{ backgroundImage: GRAIN }}
      />
      {/* top sheen — a thin light fall from the upper edge */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/10 to-transparent" />

      {/* breathing glow blooms */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violet-2/30 blur-3xl"
        animate={reduced ? undefined : { scale: [1, 1.14, 1], opacity: [0.45, 0.75, 0.45] }}
        transition={reduced ? undefined : { duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-ember/15 blur-3xl"
        animate={reduced ? undefined : { scale: [1.08, 1, 1.08], opacity: [0.4, 0.6, 0.4] }}
        transition={reduced ? undefined : { duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.3em] text-violet-3">{copy.couple.eyebrow}</p>
          {!editing ? (
            <button
              type="button"
              onClick={openEdit}
              className="flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-[11px] tracking-wide text-paper/80 backdrop-blur-sm transition-colors hover:border-white/40 hover:text-paper"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
              </svg>
              {copy.couple.edit}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={isPending}
                className="rounded-full border border-white/20 px-4 py-1.5 text-[11px] tracking-wide text-paper/80 hover:text-paper disabled:opacity-60"
              >
                {copy.couple.cancel}
              </button>
              <button
                type="button"
                onClick={save}
                disabled={isPending}
                className="rounded-full bg-paper px-5 py-1.5 text-[11px] tracking-wide text-violet transition-colors hover:bg-paper2 disabled:opacity-60"
              >
                {isPending ? copy.couple.saving : copy.couple.save}
              </button>
            </div>
          )}
        </div>

        {/* Headline */}
        {editing ? (
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder={copy.couple.headlinePlaceholder}
            className="mb-4 w-full bg-transparent text-center font-serif text-4xl text-paper outline-none placeholder:text-violet-3/50 sm:text-5xl"
          />
        ) : (
          (row?.headline || !hasContent) && (
            <h2 className="mb-4 text-center font-serif text-4xl leading-tight text-paper [text-shadow:0_1px_24px_rgba(108,43,217,0.45)] sm:text-6xl">
              {row?.headline || copy.couple.headlinePlaceholder}
            </h2>
          )
        )}

        {/* Story */}
        {editing ? (
          <textarea
            rows={2}
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder={copy.couple.storyPlaceholder}
            className="mx-auto mb-10 block w-full max-w-xl resize-none rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-center font-serif text-lg italic text-paper/90 outline-none placeholder:text-violet-3/50 focus:border-violet-3"
          />
        ) : (
          row?.story && (
            <p className="mx-auto mb-10 max-w-xl text-center font-serif text-lg italic leading-relaxed text-paper/85">
              {row.story}
            </p>
          )
        )}

        {/* The two of you, with a gradient ampersand seated between */}
        <div className="flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-14">
          {renderMember(members[0])}

          <div className="flex flex-col items-center" aria-hidden="true">
            <span className="hidden h-10 w-px bg-gradient-to-b from-transparent via-violet-3/50 to-transparent sm:block" />
            <span className="bg-ever-gradient bg-clip-text py-1 font-serif text-3xl text-transparent sm:text-4xl">&amp;</span>
            <span className="hidden h-10 w-px bg-gradient-to-b from-transparent via-violet-3/50 to-transparent sm:block" />
          </div>

          {renderMember(members[1])}
        </div>

        {!editing && !hasContent && (
          <p className="mt-8 text-center text-sm italic text-violet-3/80">{copy.couple.empty}</p>
        )}

        {error && (
          <p role="alert" className="mt-6 text-center text-xs text-paper">
            {error}
          </p>
        )}
      </div>
    </motion.section>
  );
}
