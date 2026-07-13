'use client';
// -----------------------------------------------------------------------------
// components/prologue/CoverControls.tsx (1.2)
//
// The cover controls on a Fleeting Frames hero: "Edit cover" and a "⋯" menu, as
// a stationary button row with ONE shared popup. Only one menu is open at a
// time; clicking the other button swaps the popup's contents in place; the popup
// always sits flush-right, directly under the row (so the buttons never move);
// clicking outside closes it. Frosted glass, gently animated.
//
//   Edit cover → change / remove the cover photo.
//   ⋯          → Clear (empty the chapter) / Delete (remove it), each confirmed.
// -----------------------------------------------------------------------------

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import imageCompression from 'browser-image-compression';
import { setStoryCover, removeStoryCover, clearStory, deleteStory } from '@/app/actions/stories';
import { copy } from '@/lib/copy';
import GlassPanel, { glassItem } from '@/components/ui/GlassPanel';

const COMPRESSION = { maxSizeMB: 0.9, maxWidthOrHeight: 2200, useWebWorker: true };
const EASE = [0.22, 1, 0.36, 1] as const;

type Menu = 'cover' | 'story' | null;
type Confirm = 'clear' | 'delete' | null;

const triggerClass =
  'relative z-10 flex h-9 items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.08] px-4 text-[11px] tracking-wide text-paper/90 backdrop-blur-xl transition-all duration-300 hover:-translate-y-[1px] hover:border-white/30 hover:bg-white/[0.14] disabled:opacity-60';
const dotsClass =
  'relative z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/[0.08] text-paper backdrop-blur-xl transition-all duration-300 hover:-translate-y-[1px] hover:border-white/30 hover:bg-white/[0.14]';

export default function CoverControls({
  storyId,
  slug,
  cover,
  onCoverChange,
}: {
  storyId: string;
  slug: string;
  cover: string | null;
  onCoverChange: (url: string | null) => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [menu, setMenu] = useState<Menu>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [coverPending, setCoverPending] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function close() {
    setMenu(null);
    setConfirm(null);
    setError(null);
  }
  function openMenu(which: Menu) {
    setConfirm(null);
    setError(null);
    setMenu((m) => (m === which ? null : which));
  }

  async function pick(file: File) {
    setError(null);
    setMenu(null);
    setCoverPending(true);
    try {
      let upload: File | Blob = file;
      try {
        upload = await imageCompression(file, COMPRESSION);
      } catch {
        /* fall back to the original */
      }
      const fd = new FormData();
      fd.set('file', upload, file.name);
      const result = await setStoryCover(storyId, slug, fd);
      if (result.ok) onCoverChange(result.data.cover_url);
      else setError(result.error);
    } finally {
      setCoverPending(false);
    }
  }

  function removeCover() {
    setError(null);
    startTransition(async () => {
      const result = await removeStoryCover(storyId, slug);
      if (result.ok) {
        onCoverChange(null);
        close();
      } else setError(result.error);
    });
  }

  function runClear() {
    setError(null);
    startTransition(async () => {
      const result = await clearStory(storyId, slug);
      if (result.ok) {
        onCoverChange(null);
        close();
      } else setError(result.error);
    });
  }

  function runDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteStory(storyId);
      if (result.ok) router.push('/library');
      else setError(result.error);
    });
  }

  const busy = coverPending || isPending;

  return (
    <div className="relative flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) pick(f);
        }}
      />

      <button type="button" onClick={() => openMenu('cover')} disabled={busy} aria-haspopup="menu" aria-expanded={menu === 'cover'} className={triggerClass}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
        </svg>
        {coverPending ? copy.prologue.coverUploading : copy.prologue.editCover}
      </button>

      <button type="button" onClick={() => openMenu('story')} aria-haspopup="menu" aria-expanded={menu === 'story'} aria-label={copy.storyMenu.more} className={dotsClass}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="19" cy="12" r="1.6" />
        </svg>
      </button>

      {menu && (
        <>
          <button type="button" aria-hidden="true" tabIndex={-1} onClick={close} className="fixed inset-0 z-0 cursor-default bg-violet-deep/10 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.16, ease: EASE }}
            className="absolute right-0 top-full z-10 mt-2 w-64 origin-top-right"
          >
            <GlassPanel className="w-full p-1">
              {menu === 'cover' ? (
                <>
                  <button type="button" onClick={() => inputRef.current?.click()} className={glassItem}>
                    {cover ? copy.prologue.changeCover : copy.prologue.addCover}
                  </button>
                  {cover && (
                    <button type="button" onClick={removeCover} disabled={isPending} className={`${glassItem} text-white/70 hover:text-ember`}>
                      {copy.prologue.removeCover}
                    </button>
                  )}
                </>
              ) : confirm ? (
                <div className="p-2 text-center">
                  <p className="mb-4 font-serif text-sm leading-relaxed text-white/90">
                    {confirm === 'clear' ? copy.storyMenu.clearConfirm : copy.storyMenu.deleteConfirm}
                  </p>
                  <div className="flex justify-center gap-2">
                    <button type="button" onClick={() => setConfirm(null)} disabled={isPending} className="rounded-full border border-white/20 px-4 py-2 text-xs text-white/80 hover:text-white disabled:opacity-60">
                      {copy.storyMenu.confirmNo}
                    </button>
                    <button type="button" onClick={confirm === 'clear' ? runClear : runDelete} disabled={isPending} className="rounded-full bg-ember px-4 py-2 text-xs text-paper disabled:opacity-60">
                      {isPending ? (confirm === 'clear' ? copy.storyMenu.clearing : copy.storyMenu.deleting) : copy.storyMenu.confirmYes}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button type="button" onClick={() => setConfirm('clear')} className={glassItem}>
                    {copy.storyMenu.clear}
                  </button>
                  <button type="button" onClick={() => setConfirm('delete')} className={`${glassItem} text-white/70 hover:text-ember`}>
                    {copy.storyMenu.delete}
                  </button>
                </>
              )}
              {error && <p role="alert" className="px-3 py-1.5 text-xs text-ember">{error}</p>}
            </GlassPanel>
          </motion.div>
        </>
      )}
    </div>
  );
}
