'use client';
// -----------------------------------------------------------------------------
// components/library/ProfileMenu.tsx (1.2)
//
// The profile circle in The Library's upper-right. Defaults to the Google
// account image, falls back to initials, and can be overridden by an uploaded
// avatar. Clicking opens a small popup: who you're signed in as, a way to change
// your photo, a jump to the shelf, and the way out.
//
// Sign-out is a server action passed down from the page (NextAuth's signOut must
// run on the server); the avatar upload calls the couple.ts action after
// compressing in the browser, same as every other image.
// -----------------------------------------------------------------------------

import { useState, useRef, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import { uploadAvatar } from '@/app/actions/couple';
import { copy } from '@/lib/copy';
import GlassPanel, { glassItem } from '@/components/ui/GlassPanel';

const COMPRESSION = { maxSizeMB: 0.5, maxWidthOrHeight: 512, useWebWorker: true };

export default function ProfileMenu({
  name,
  email,
  image,
  avatarUrl,
  signOutAction,
}: {
  name: string;
  email: string;
  image: string | null;
  avatarUrl: string | null;
  signOutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(avatarUrl ?? image);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on Escape for keyboard users.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const initials = name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  async function pickAvatar(file: File) {
    setError(null);
    setPending(true);
    try {
      let upload: File | Blob = file;
      try {
        upload = await imageCompression(file, COMPRESSION);
      } catch {
        /* fall back to the original */
      }
      const fd = new FormData();
      fd.set('file', upload, file.name);
      const result = await uploadAvatar(fd);
      if (result.ok) setAvatar(result.data.avatar_url);
      else setError(result.error);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative">
      {/* crystal-ringed avatar */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={copy.nav.profileEyebrow}
        className="relative z-50 rounded-full bg-gradient-to-br from-white/60 to-white/5 p-[2px] transition-transform hover:-translate-y-[1px]"
      >
        <span className="block h-10 w-10 overflow-hidden rounded-full bg-violet-deep text-paper">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm tracking-wide text-violet-3">
              {initials}
            </span>
          )}
        </span>
      </button>

      {open && (
        <>
          {/* click-away backdrop — a light blur so the menu reads as a modal */}
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-violet-deep/10 backdrop-blur-sm"
          />
          <GlassPanel className="absolute right-0 top-full z-50 mt-2 w-64">
            <div className="border-b border-white/15 px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">{copy.nav.profileEyebrow}</p>
              <p className="mt-1 truncate font-serif text-lg text-white/90">{name}</p>
              <p className="truncate text-xs text-white/60">{email}</p>
            </div>

            <div className="p-2">
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
              <button type="button" onClick={() => inputRef.current?.click()} disabled={pending} className={`${glassItem} disabled:opacity-60`}>
                {pending ? copy.nav.profileUploading : copy.nav.editProfile}
              </button>
              <a href="#shelf" onClick={() => setOpen(false)} className={glassItem}>
                {copy.nav.jumpToShelf}
              </a>
              <form action={signOutAction}>
                <button type="submit" className={`${glassItem} text-white/60 hover:text-ember`}>
                  {copy.nav.signOut}
                </button>
              </form>
            </div>

            {error && <p role="alert" className="border-t border-white/15 px-5 py-2 text-xs text-ember">{error}</p>}
          </GlassPanel>
        </>
      )}
    </div>
  );
}
