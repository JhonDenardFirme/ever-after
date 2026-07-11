'use client';
// -----------------------------------------------------------------------------
// components/frames/FrameCard.tsx
//
// One developed Frame. Image, caption, and the two actions that matter.
//
// `develop` motion on mount: the image arrives blurred and resolves sharp,
// like a print surfacing in a darkroom tray. It's the animation the variant
// was named for and this is the first place it's actually used.
//
// The caption saves on blur, silently — no toast, no checkmark. Masterfile's
// "when to say nothing at all". Deleting is the opposite: two steps, and the
// exact heavy copy from §7, because losing a photograph by accident is the
// single worst thing this app could do to us.
// -----------------------------------------------------------------------------

import { useState, useTransition, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { updateCaption, setKeepsake, deleteFrame } from '@/app/actions/frames';
import { develop, useEverMotion } from '@/lib/motion';
import { copy } from '@/lib/copy';
import type { Frame, Author } from '@/lib/types';

export default function FrameCard({
  frame,
  storyId,
  slug,
  isKeepsake,
  authors,
  priority = false,
  className = '',
  aspect,
  selectable = false,
  selected = false,
  onToggleSelect,
}: {
  frame: Frame;
  storyId: string;
  slug: string;
  isKeepsake: boolean;
  authors: Record<string, Author>;
  priority?: boolean;
  className?: string;
  /** Override the tile's shape. The Frame Wall forces a uniform grid; the
   *  Timeline lets each Frame keep its natural proportions. */
  aspect?: number;
  /** 1.2 selection mode: the whole card becomes a toggle, actions hide. */
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const variants = useEverMotion(develop);
  const [caption, setCaption] = useState(frame.caption ?? '');
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setCaption(frame.caption ?? '');
  }, [frame.caption]);

  const developer = frame.developed_by ? authors[frame.developed_by] : undefined;

  function saveCaption() {
    if (caption.trim() === (frame.caption ?? '')) return; // nothing changed
    startTransition(async () => {
      const result = await updateCaption(frame.id, slug, caption);
      if (!result.ok) {
        setCaption(frame.caption ?? '');
        setError(result.error);
      }
    });
  }

  function markKeepsake() {
    startTransition(async () => {
      const result = await setKeepsake(storyId, slug, frame.id);
      if (!result.ok) setError(result.error);
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteFrame(frame.id, slug);
      if (!result.ok) setError(result.error || copy.frames.deleteError);
    });
  }

  const natural = frame.width && frame.height ? frame.width / frame.height : 3 / 2;
  const ratio = aspect ?? natural;

  return (
    <motion.figure
      variants={variants}
      initial="hidden"
      animate="shown"
      className={`group relative overflow-hidden rounded-xl border border-rule bg-paper2 ${className}`}
    >
      <div className="relative w-full overflow-hidden bg-violet-deep" style={{ aspectRatio: ratio }}>
        {frame.media_url &&
          (frame.media_type === 'video' ? (
            <video
              src={frame.media_url}
              controls={!selectable}
              playsInline
              preload="metadata"
              className={`absolute inset-0 h-full w-full object-cover ${selectable ? 'pointer-events-none' : ''}`}
            />
          ) : (
            <Image
              src={frame.media_url}
              alt={frame.caption ?? frame.prompt_text ?? 'A Frame'}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              priority={priority}
              className="object-cover"
            />
          ))}

        {isKeepsake && (
          <span className="absolute left-3 top-3 rounded-full bg-ember px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-paper">
            {copy.frames.keepsake}
          </span>
        )}

        {/* Actions live on hover / focus-within, so the photo is never cluttered */}
        {!selectable && (
          <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          {!isKeepsake && (
            <button
              type="button"
              onClick={markKeepsake}
              disabled={isPending}
              title={copy.frames.markKeepsake}
              aria-label={copy.frames.markKeepsake}
              className="rounded-full bg-paper/90 px-2.5 py-1.5 text-[10px] text-ink transition-colors hover:bg-paper"
            >
              ★
            </button>
          )}
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={isPending}
            title={copy.frames.deleteAction}
            aria-label={copy.frames.deleteAction}
            className="rounded-full bg-paper/90 px-2.5 py-1.5 text-[10px] text-ink transition-colors hover:bg-paper hover:text-ember"
          >
            ×
          </button>
          </div>
        )}

        {/* 1.2 selection overlay — the whole image becomes the toggle */}
        {selectable && (
          <button
            type="button"
            onClick={onToggleSelect}
            aria-pressed={selected}
            aria-label={frame.caption ?? frame.prompt_text ?? 'Select this Frame'}
            className={`absolute inset-0 rounded-t-xl transition-shadow ${
              selected ? 'ring-[3px] ring-inset ring-ember' : 'ring-1 ring-inset ring-transparent hover:ring-violet-2'
            }`}
          >
            <span
              className={`absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border text-[11px] transition-colors ${
                selected ? 'border-ember bg-ember text-paper' : 'border-paper/70 bg-violet-deep/40 text-paper/70'
              }`}
            >
              ✓
            </span>
          </button>
        )}

        {/* Two-step delete. Covers the image so it can't be dismissed by accident. */}
        {confirming && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-violet-deep/95 p-5 text-center">
            <p className="font-serif text-sm leading-relaxed text-paper">
              {copy.frames.deleteForever}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-full border border-violet-3/40 px-4 py-2 text-xs text-paper"
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
        )}
      </div>

      <figcaption className="px-3.5 py-3">
        <textarea
          rows={1}
          value={caption}
          readOnly={selectable}
          onChange={(e) => setCaption(e.target.value)}
          onBlur={saveCaption}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          placeholder={copy.frames.captionPlaceholder}
          aria-label="Caption"
          className="w-full resize-none bg-transparent font-serif text-sm leading-snug text-ink outline-none placeholder:text-ink-soft/40"
        />

        {developer && (
          <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-ink-soft">
            {copy.frames.developedBy(developer.name)}
          </p>
        )}

        {error && (
          <p role="alert" className="mt-1 text-xs text-ember">
            {error}
          </p>
        )}
      </figcaption>
    </motion.figure>
  );
}
