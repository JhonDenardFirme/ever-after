'use client';
// -----------------------------------------------------------------------------
// components/story/PhotoLightbox.tsx (1.2)
//
// The full-screen view of one Frame. Opens from The Story feed; closes on X, on
// a click outside the panel, or on Escape. The scrim is light and blurred (not a
// heavy violet wash), so the photo — not the chrome — carries the colour.
//
// Details, in a clear hierarchy: the caption (add / edit / remove it right here),
// then a "By …" badge and the date, then the set it belongs to. The two Frame
// actions sit centred at the foot in one equal-width row, each with an icon:
// toggle The Keepsake (mark / remove), and the two-step permanent delete.
// -----------------------------------------------------------------------------

import { useState, useEffect, useTransition } from 'react';
import { deleteFrame, updateCaption } from '@/app/actions/frames';
import { setMyKeepsake, removeMyKeepsake } from '@/app/actions/afterword';
import { copy } from '@/lib/copy';
import { glowGradient } from '@/lib/gradients';
import { StarIcon, TrashIcon, PlusIcon } from '@/components/ui/icons';
import type { Frame, Author } from '@/lib/types';

/** "Denard's Keepsake" / "Denard's & Airhyl's Keepsake". */
function keepsakeLabel(names: string[]): string {
  const valid = names.filter(Boolean);
  if (valid.length === 0) return copy.frames.keepsake;
  if (valid.length === 1) return copy.frames.keepsakeOf(valid[0]);
  return `${valid.map((n) => `${n}’s`).join(' & ')} ${copy.frames.keepsake}`;
}

function longDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-PH', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function PhotoLightbox({
  frame,
  authors,
  keepsakeNames,
  mine,
  storyId,
  slug,
  onClose,
}: {
  frame: Frame;
  authors: Record<string, Author>;
  /** The author name(s) whose Keepsake this Frame is. */
  keepsakeNames: string[];
  /** Whether it is the signed-in author's own Keepsake. */
  mine: boolean;
  storyId: string;
  slug: string;
  onClose: () => void;
}) {
  const [isMine, setIsMine] = useState(mine);
  const [caption, setCaption] = useState(frame.caption ?? '');
  const [savedCaption, setSavedCaption] = useState(frame.caption ?? '');
  const [editingCaption, setEditingCaption] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const developer = frame.developed_by ? authors[frame.developed_by] : undefined;
  const when = longDate(frame.developed_at ?? frame.created_at);

  function saveCaption(next: string) {
    setError(null);
    startTransition(async () => {
      const result = await updateCaption(frame.id, slug, next);
      if (result.ok) {
        setSavedCaption(next.trim());
        setCaption(next.trim());
        setEditingCaption(false);
      } else {
        setError(result.error);
      }
    });
  }

  function toggleKeepsake() {
    setError(null);
    startTransition(async () => {
      const result = isMine
        ? await removeMyKeepsake(storyId, slug)
        : await setMyKeepsake(storyId, slug, frame.id);
      if (result.ok) setIsMine((m) => !m);
      else setError(result.error);
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await deleteFrame(frame.id, slug);
      if (result.ok) onClose();
      else setError(result.error || copy.frames.deleteError);
    });
  }

  const actionBtn =
    'flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-xs tracking-wide transition-colors disabled:opacity-60';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-4 backdrop-blur-md sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="group relative flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl shadow-glow ring-1 ring-inset ring-white/10 sm:flex-row"
        style={{ backgroundImage: glowGradient(0) }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media */}
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
          {frame.media_url &&
            (frame.media_type === 'video' ? (
              <video src={frame.media_url} controls playsInline className="max-h-[70vh] w-full object-contain" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={frame.media_url}
                alt={savedCaption || ''}
                className="max-h-[70vh] w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              />
            ))}
          {/* a whisper of violet at the base, not a wash */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-violet-bleed opacity-50" />

          {keepsakeNames.length > 0 && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-ember px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-paper shadow-[0_0_14px_rgba(249,115,22,0.6)]">
              <StarIcon size={11} />
              {keepsakeLabel(keepsakeNames)}
            </span>
          )}
        </div>

        {/* Details — the neutral white panel (the image side carries the glow) */}
        <aside className="flex w-full shrink-0 flex-col justify-between gap-5 border-t border-rule bg-paper p-6 sm:w-80 sm:border-l sm:border-t-0">
          <div>
            <p className="mb-4 text-[10px] uppercase tracking-[0.24em] text-ember">{copy.frames.details}</p>

            {/* Caption — add / edit / remove */}
            <div className="mb-5">
              {editingCaption ? (
                <div>
                  <textarea
                    autoFocus
                    rows={3}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder={copy.frames.captionPlaceholder}
                    className="w-full resize-none rounded-lg border border-rule bg-paper2 px-3 py-2 font-serif text-base leading-snug text-ink outline-none focus:border-violet-2"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCaption(savedCaption);
                        setEditingCaption(false);
                      }}
                      className="rounded-full border border-rule px-4 py-1.5 text-[11px] tracking-wide text-ink-soft hover:border-violet-2 hover:text-violet"
                    >
                      {copy.frames.confirmNo}
                    </button>
                    <button
                      type="button"
                      onClick={() => saveCaption(caption)}
                      disabled={isPending}
                      className="rounded-full bg-violet px-5 py-1.5 text-[11px] tracking-wide text-paper hover:bg-violet-2 disabled:opacity-60"
                    >
                      {copy.frames.saveCaption}
                    </button>
                  </div>
                </div>
              ) : savedCaption ? (
                <div>
                  <p className="font-serif text-lg italic leading-snug text-ink">{savedCaption}</p>
                  <div className="mt-1.5 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingCaption(true)}
                      className="text-[11px] uppercase tracking-[0.14em] text-ink-soft underline-offset-4 hover:text-violet hover:underline"
                    >
                      {copy.couple.edit}
                    </button>
                    <button
                      type="button"
                      onClick={() => saveCaption('')}
                      disabled={isPending}
                      className="text-[11px] uppercase tracking-[0.14em] text-ink-soft underline-offset-4 hover:text-ember hover:underline disabled:opacity-60"
                    >
                      {copy.frames.removeCaption}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setCaption('');
                    setEditingCaption(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-sm text-ink-soft underline-offset-4 hover:text-violet hover:underline"
                >
                  <PlusIcon size={13} /> {copy.frames.addCaption}
                </button>
              )}
            </div>

            {/* By … + date */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {developer && (
                <span className="rounded-full bg-paper2 px-3 py-1 text-xs text-violet">
                  {copy.frames.by(developer.name)}
                </span>
              )}
              {when && <span className="text-ink-soft">{when}</span>}
            </div>

            {frame.prompt_text && (
              <p className="mt-3">
                <span className="inline-block rounded-full border border-rule px-3 py-1 text-xs text-ink-soft">
                  {frame.prompt_text}
                </span>
              </p>
            )}
          </div>

          {/* Actions — centred, equal width, one row */}
          <div>
            {confirming ? (
              <div className="rounded-xl border border-rule bg-paper2 p-4 text-center">
                <p className="mb-3 font-serif text-sm leading-relaxed text-ink">{copy.frames.deleteForever}</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="rounded-full border border-rule px-4 py-2 text-xs text-ink-soft"
                  >
                    {copy.frames.confirmNo}
                  </button>
                  <button
                    type="button"
                    onClick={remove}
                    disabled={isPending}
                    className="rounded-full bg-ember px-4 py-2 text-xs text-paper disabled:opacity-60"
                  >
                    {copy.frames.confirmYes}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={toggleKeepsake}
                  disabled={isPending}
                  className={`${actionBtn} ${
                    isMine
                      ? 'border-ember/50 bg-ember/10 text-ember hover:bg-ember/15'
                      : 'border-rule text-ink-soft hover:border-violet-2 hover:text-violet'
                  }`}
                >
                  <StarIcon size={13} />
                  {isMine ? copy.frames.removeMyKeepsake : copy.frames.markMyKeepsake}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  disabled={isPending}
                  className={`${actionBtn} border-rule text-ink-soft hover:border-ember hover:text-ember`}
                >
                  <TrashIcon size={13} />
                  {copy.frames.deleteAction}
                </button>
              </div>
            )}
            {error && (
              <p role="alert" className="mt-2 text-xs text-ember">
                {error}
              </p>
            )}
          </div>
        </aside>

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label={copy.frames.close}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-paper/90 text-lg text-ink shadow-shelf transition-colors hover:bg-paper"
        >
          ×
        </button>
      </div>
    </div>
  );
}
