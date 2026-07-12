'use client';
// -----------------------------------------------------------------------------
// components/library/Frontispiece.tsx (1.2)
//
// The Story Frontispiece — a dedicated full-viewport opening spread for The
// Library. A hero photograph blended into Ever After's colour system carries the
// brand mark and profile menu at the top, the relationship title and live story
// statistics in the centre, the two authors, and "Begin a new chapter" at the
// foot. Calm, cinematic, editorial.
//
// The hero is layered so ANY photo still reads as Ever After (Ken Burns crop,
// dark multiply, violet radial, ember corner, vignette, a centred scrim for text
// legibility, grain). Every white text sits on that scrim with a soft shadow.
// Motion is gentle and reduced-motion aware.
//
// Editable: Story Settings (hero, title, statement, since, dedication) via the
// top-bar pencil; and each of you can edit your OWN author block inline —
// photo (linked to the account avatar), name, and nickname.
// -----------------------------------------------------------------------------

import { useState, useRef, useTransition, type ReactNode } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import imageCompression from 'browser-image-compression';
import {
  saveCouple,
  uploadCoupleHero,
  removeCoupleHero,
  setCoupleHeroFocus,
  uploadAvatar,
  updateAuthorProfile,
} from '@/app/actions/couple';
import { copy } from '@/lib/copy';
import StarDivider from '@/components/ui/StarDivider';
import StarsBackground from '@/components/ui/StarsBackground';
import StatsStrip from '@/components/ui/StatsStrip';
import type { Couple, Author, StoryStats } from '@/lib/types';

const COMPRESSION = { maxSizeMB: 0.9, maxWidthOrHeight: 2200, useWebWorker: true };
const AVATAR_COMPRESSION = { maxSizeMB: 0.5, maxWidthOrHeight: 512, useWebWorker: true };
const EASE = [0.22, 1, 0.36, 1] as const;
const TEXT_SHADOW = '[text-shadow:0_1px_14px_rgba(0,0,0,0.6)]';

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")";

// -----------------------------------------------------------------------------
// An author block — read-only, or editable when it's your own.
// -----------------------------------------------------------------------------
function AuthorBlock({ author, editable }: { author: Author; editable: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState(author.avatar_url);
  const [name, setName] = useState(author.name);
  const [nickname, setNickname] = useState(author.nickname ?? '');
  const [editing, setEditing] = useState(false);
  const [photoPending, setPhotoPending] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const initials = name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  async function pickAvatar(file: File) {
    setError(null);
    setPhotoPending(true);
    try {
      let upload: File | Blob = file;
      try {
        upload = await imageCompression(file, AVATAR_COMPRESSION);
      } catch {
        /* fall back to original */
      }
      const fd = new FormData();
      fd.set('file', upload, file.name);
      const result = await uploadAvatar(fd);
      if (result.ok) setAvatar(result.data.avatar_url);
      else setError(result.error);
    } finally {
      setPhotoPending(false);
    }
  }

  function saveProfile() {
    setError(null);
    startTransition(async () => {
      const result = await updateAuthorProfile(name, nickname);
      if (result.ok) {
        setName(result.data.name);
        setNickname(result.data.nickname ?? '');
        setEditing(false);
      } else {
        setError(result.error);
      }
    });
  }

  const subtitle = nickname || copy.frontispiece.authorRole;

  return (
    <div className="flex w-40 flex-col items-center gap-3 text-center">
      <div className="relative">
        <div className="h-16 w-16 overflow-hidden rounded-full bg-violet-deep ring-2 ring-white/25 sm:h-20 sm:w-20">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm tracking-wide text-violet-3">
              {initials}
            </span>
          )}
        </div>
        {editable && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) pickAvatar(f);
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={photoPending}
              aria-label={copy.frontispiece.changePhoto}
              title={copy.frontispiece.changePhoto}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-white/25 bg-violet-deep/80 text-paper backdrop-blur-sm transition-colors hover:bg-violet disabled:opacity-60"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <rect x="3" y="6" width="18" height="14" rx="2" />
                <circle cx="12" cy="13" r="3.2" />
                <path d="M8 6l1.5-2h5L16 6" />
              </svg>
            </button>
          </>
        )}
      </div>

      {editing ? (
        <div className="w-full space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={copy.frontispiece.namePlaceholder}
            className="w-full rounded-lg border border-white/15 bg-white/10 px-2 py-1.5 text-center font-serif text-base text-paper outline-none placeholder:text-violet-3/50 focus:border-violet-3"
          />
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder={copy.frontispiece.nicknamePlaceholder}
            className="w-full rounded-lg border border-white/15 bg-white/10 px-2 py-1.5 text-center text-xs text-paper outline-none placeholder:text-violet-3/50 focus:border-violet-3"
          />
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={isPending}
              className="text-[10px] uppercase tracking-[0.14em] text-violet-3 hover:text-paper"
            >
              {copy.frontispiece.cancel}
            </button>
            <button
              type="button"
              onClick={saveProfile}
              disabled={isPending}
              className="text-[10px] uppercase tracking-[0.14em] text-paper hover:underline"
            >
              {isPending ? copy.frontispiece.saving : copy.frontispiece.save}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className={`font-serif text-xl text-paper ${TEXT_SHADOW}`}>{name}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.24em] text-violet-3">{subtitle}</p>
          {editable && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="mt-1 text-[10px] uppercase tracking-[0.16em] text-violet-3/80 underline-offset-4 transition-colors hover:text-paper hover:underline"
            >
              {copy.frontispiece.editProfile}
            </button>
          )}
        </div>
      )}
      {error && <p role="alert" className="text-[11px] text-ember">{error}</p>}
    </div>
  );
}

// -----------------------------------------------------------------------------
export default function Frontispiece({
  couple,
  authors,
  stats,
  meId,
  brand,
  profileSlot,
  beginSlot,
}: {
  couple: Couple | null;
  authors: Author[];
  stats: StoryStats;
  meId: string | null;
  brand: string;
  profileSlot: ReactNode;
  beginSlot: ReactNode;
}) {
  const reduced = useReducedMotion();
  const [row, setRow] = useState<Couple | null>(couple);
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [heroPending, setHeroPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const heroInput = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(couple?.headline ?? '');
  const [statement, setStatement] = useState(couple?.story ?? '');
  const [since, setSince] = useState(couple?.since ?? '');
  const [dedication, setDedication] = useState(couple?.dedication ?? '');

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (v) => (reduced ? 0 : v * 0.15));

  const heroUrl = row?.hero_image_url ?? null;
  const fx = row?.hero_focus_x ?? 50;
  const fy = row?.hero_focus_y ?? 50;

  function openEdit() {
    setTitle(row?.headline ?? '');
    setStatement(row?.story ?? '');
    setSince(row?.since ?? '');
    setDedication(row?.dedication ?? '');
    setError(null);
    setEditing(true);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveCouple({ headline: title, story: statement, since, dedication });
      if (result.ok) {
        setRow(result.data);
        setEditing(false);
      } else {
        setError(result.error || copy.frontispiece.saveError);
      }
    });
  }

  async function pickHero(file: File) {
    setError(null);
    setHeroPending(true);
    try {
      let upload: File | Blob = file;
      try {
        upload = await imageCompression(file, COMPRESSION);
      } catch {
        /* fall back to original */
      }
      const fd = new FormData();
      fd.set('file', upload, file.name);
      const result = await uploadCoupleHero(fd);
      if (result.ok) setRow(result.data);
      else setError(result.error);
    } finally {
      setHeroPending(false);
    }
  }

  function removeHero() {
    setError(null);
    startTransition(async () => {
      const result = await removeCoupleHero();
      if (result.ok) setRow(result.data);
      else setError(result.error);
    });
  }

  function setFocus(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 100;
    const ny = ((e.clientY - rect.top) / rect.height) * 100;
    setRow((r) => (r ? { ...r, hero_focus_x: Math.round(nx), hero_focus_y: Math.round(ny) } : r));
    startTransition(async () => {
      await setCoupleHeroFocus(nx, ny);
    });
  }

  const statItems = [
    // The year counts DOWN from the present to its origin, not up from 0.
    { label: copy.frontispiece.stats.since, value: stats.sinceYear ?? '—', from: new Date().getFullYear() },
    { label: copy.frontispiece.stats.chapters, value: stats.chapters },
    { label: copy.frontispiece.stats.frames, value: stats.frames },
    { label: copy.frontispiece.stats.keepsakes, value: stats.keepsakes },
  ];

  const rise = (delay: number) =>
    reduced
      ? {}
      : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, ease: EASE, delay } };

  return (
    <section className="relative min-h-dvh w-full overflow-hidden">
      {/* ---- Hero image stack ---- */}
      <motion.div style={{ y }} className="absolute inset-0 -bottom-16">
        {heroUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroUrl}
            alt=""
            style={{ objectPosition: `${fx}% ${fy}%` }}
            className="ever-kenburns h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-violet-hero" />
        )}
      </motion.div>

      {/* layered overlays */}
      <div className="pointer-events-none absolute inset-0 bg-violet-deep/70 mix-blend-multiply" />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 18% 12%, rgba(108,43,217,0.55) 0%, rgba(108,43,217,0) 55%)' }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(90% 80% at 88% 96%, rgba(249,115,22,0.28) 0%, rgba(249,115,22,0) 50%)' }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(120% 120% at 50% 45%, rgba(0,0,0,0) 45%, rgba(20,6,38,0.7) 100%)' }} />
      {/* centred scrim — the readability layer behind the text */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(72% 58% at 50% 50%, rgba(20,6,38,0.55) 0%, rgba(20,6,38,0) 78%)' }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-soft-light" style={{ backgroundImage: GRAIN }} />
      <StarsBackground opacity={0.5} />
      {/* soft fade into the page at the very bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-paper/90 to-transparent" />
      {/* slow drifting bloom */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/3 top-1/4 h-72 w-72 rounded-full bg-violet-3/20 blur-3xl"
        animate={reduced ? undefined : { x: [0, 40, 0], y: [0, -30, 0], opacity: [0.4, 0.65, 0.4] }}
        transition={reduced ? undefined : { duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ---- Top bar: brand + edit + profile ---- */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-5">
        <span className={`text-sm uppercase tracking-[0.32em] text-paper/90 ${TEXT_SHADOW}`}>{brand}</span>
        <div className="flex items-center gap-2">
          {!editing && (
            <button
              type="button"
              onClick={openEdit}
              className="flex items-center gap-1.5 rounded-full border border-white/25 bg-violet-deep/40 px-4 py-2 text-[11px] tracking-wide text-paper/90 backdrop-blur-sm transition-colors hover:border-white/50 hover:text-paper"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
              </svg>
              {copy.frontispiece.edit}
            </button>
          )}
          {profileSlot}
        </div>
      </div>

      {/* ---- Centre content ---- */}
      <div className="relative z-10 flex min-h-dvh items-center justify-center px-6 py-24">
        {editing ? (
          <div className="w-full max-w-lg">
            <div className="max-h-[82vh] overflow-y-auto rounded-2xl border border-white/15 bg-violet-deep/75 p-6 backdrop-blur-xl sm:p-8">
              <p className="mb-6 text-center text-[11px] uppercase tracking-[0.3em] text-violet-3">
                {copy.frontispiece.settingsTitle}
              </p>

              <input
                ref={heroInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) pickHero(f);
                }}
              />
              <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-violet-3">{copy.frontispiece.heroLabel}</p>
              {heroUrl ? (
                <div>
                  <button
                    type="button"
                    onClick={setFocus}
                    title={copy.frontispiece.focusHint}
                    className="relative block aspect-[21/9] w-full overflow-hidden rounded-xl ring-1 ring-white/15"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={heroUrl} alt="" style={{ objectPosition: `${fx}% ${fy}%` }} className="h-full w-full object-cover" />
                    <span className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper shadow" style={{ left: `${fx}%`, top: `${fy}%` }} />
                  </button>
                  <p className="mt-1.5 text-[11px] italic text-violet-3">{copy.frontispiece.focusHint}</p>
                  <div className="mt-2 flex gap-3">
                    <button type="button" onClick={() => heroInput.current?.click()} disabled={heroPending} className="text-[11px] uppercase tracking-[0.14em] text-paper/80 underline-offset-4 hover:text-paper hover:underline disabled:opacity-60">
                      {heroPending ? copy.frontispiece.saving : copy.frontispiece.changeHero}
                    </button>
                    <button type="button" onClick={removeHero} className="text-[11px] uppercase tracking-[0.14em] text-violet-3 underline-offset-4 hover:text-ember hover:underline">
                      {copy.frontispiece.removeHero}
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => heroInput.current?.click()} disabled={heroPending} className="flex aspect-[21/9] w-full items-center justify-center rounded-xl border border-dashed border-white/25 text-sm text-violet-3 transition-colors hover:border-white/50 hover:text-paper disabled:opacity-60">
                  {heroPending ? copy.frontispiece.saving : copy.frontispiece.addHero}
                </button>
              )}

              <div className="mt-5 space-y-4">
                <Field label={copy.frontispiece.titleLabel}>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={copy.frontispiece.titlePlaceholder} className={inputClass} />
                </Field>
                <Field label={copy.frontispiece.statementLabel}>
                  <textarea rows={2} value={statement} onChange={(e) => setStatement(e.target.value)} placeholder={copy.frontispiece.statementPlaceholder} className={`${inputClass} resize-none`} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label={copy.frontispiece.sinceLabel}>
                    <input type="date" value={since ?? ''} onChange={(e) => setSince(e.target.value)} className={inputClass} />
                  </Field>
                  <Field label={copy.frontispiece.dedicationLabel}>
                    <input value={dedication} onChange={(e) => setDedication(e.target.value)} placeholder={copy.frontispiece.dedicationPlaceholder} className={inputClass} />
                  </Field>
                </div>
              </div>

              <div className="mt-6 flex justify-center gap-2">
                <button type="button" onClick={() => setEditing(false)} disabled={isPending} className="rounded-full border border-white/25 px-5 py-2 text-xs tracking-wide text-paper/80 hover:text-paper disabled:opacity-60">
                  {copy.frontispiece.cancel}
                </button>
                <button type="button" onClick={save} disabled={isPending} className="rounded-full bg-paper px-6 py-2 text-xs tracking-wide text-violet transition-colors hover:bg-paper2 disabled:opacity-60">
                  {isPending ? copy.frontispiece.saving : copy.frontispiece.save}
                </button>
              </div>
              {error && <p role="alert" className="mt-4 text-center text-xs text-paper">{error}</p>}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-3xl text-center">
            <motion.p {...rise(0)} className={`mb-6 text-[11px] uppercase tracking-[0.34em] text-violet-3 ${TEXT_SHADOW}`}>
              {copy.frontispiece.eyebrow}
            </motion.p>

            <motion.div {...rise(0.05)} className="relative">
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 blur-2xl"
                style={{ background: 'radial-gradient(60% 120% at 50% 50%, rgba(255,244,225,0.14) 0%, rgba(255,244,225,0) 70%)' }}
              />
              <h2
                style={{ backgroundImage: 'linear-gradient(180deg,#FBF6EE 0%,#FFFFFF 40%,#F7E7D8 72%,#EBE4F6 100%)' }}
                className="bg-clip-text font-serif text-5xl leading-[1.05] tracking-tight text-transparent [filter:drop-shadow(0_2px_26px_rgba(0,0,0,0.4))] sm:text-7xl"
              >
                {row?.headline || copy.frontispiece.titlePlaceholder}
              </h2>
            </motion.div>

            <motion.p {...rise(0.12)} className={`mx-auto mt-6 max-w-xl font-serif text-xl italic leading-relaxed text-paper/85 ${TEXT_SHADOW} sm:text-2xl`}>
              {row?.story || copy.frontispiece.statement}
            </motion.p>

            {row?.dedication && (
              <motion.p {...rise(0.16)} className={`mx-auto mt-4 max-w-md text-sm italic text-violet-3 ${TEXT_SHADOW}`}>
                {row.dedication}
              </motion.p>
            )}

            <StarDivider onDark className="my-10" />

            <motion.div {...rise(0.2)}>
              <StatsStrip items={statItems} onDark />
            </motion.div>

            <StarDivider onDark className="my-10" />

            <motion.div {...rise(0.5)} className="flex flex-wrap items-start justify-center gap-12 sm:gap-20">
              {authors.slice(0, 2).map((a) => (
                <AuthorBlock key={a.id} author={a} editable={a.id === meId} />
              ))}
            </motion.div>
          </div>
        )}
      </div>

      {/* ---- Bottom: Begin a new chapter ---- */}
      {!editing && (
        <div className="absolute inset-x-0 bottom-0 z-30 flex justify-center pb-8">{beginSlot}</div>
      )}
    </section>
  );
}

const inputClass =
  'w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-paper outline-none transition-colors placeholder:text-violet-3/50 focus:border-violet-3';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] uppercase tracking-[0.2em] text-violet-3">{label}</p>
      {children}
    </div>
  );
}
