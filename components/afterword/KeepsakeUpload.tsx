'use client';
// -----------------------------------------------------------------------------
// components/afterword/KeepsakeUpload.tsx (1.2)
//
// The Keepsake is now chosen by UPLOADING a photograph, not picking from the
// gallery. This is that form: compress in the browser, send to developKeepsake,
// which writes a story-level Frame, makes it The Keepsake, and records it as the
// answer. Shows the current Keepsake with a "choose a different one" once set.
// -----------------------------------------------------------------------------

import { useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';
import { developKeepsake } from '@/app/actions/afterword';
import { copy } from '@/lib/copy';
import type { Frame } from '@/lib/types';

const COMPRESSION = { maxSizeMB: 0.8, maxWidthOrHeight: 1920, useWebWorker: true };

async function measure(file: Blob): Promise<{ width: number; height: number }> {
  try {
    const bmp = await createImageBitmap(file);
    const size = { width: bmp.width, height: bmp.height };
    bmp.close();
    return size;
  } catch {
    return { width: 1500, height: 1000 };
  }
}

export default function KeepsakeUpload({
  storyId,
  slug,
  questionId,
  current,
}: {
  storyId: string;
  slug: string;
  questionId: string;
  current: Frame | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(current?.media_url ?? null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File) {
    setError(null);
    setPending(true);
    try {
      let upload: File | Blob = file;
      try {
        upload = await imageCompression(file, COMPRESSION);
      } catch {
        /* fall back to the original */
      }
      const { width, height } = await measure(upload);
      const fd = new FormData();
      fd.set('file', upload, file.name);
      fd.set('width', String(width));
      fd.set('height', String(height));
      const result = await developKeepsake(storyId, slug, questionId, fd);
      if (result.ok) {
        // reflect the new image immediately with a cache-bust
        setUrl(URL.createObjectURL(upload));
      } else {
        setError(result.error || copy.frames.developError);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
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

      {url ? (
        <div>
          <div className="relative mb-3 aspect-[3/2] w-full max-w-xs overflow-hidden rounded-2xl border border-rule">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={copy.frames.keepsake} className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-violet-bleed" />
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            className="text-xs text-ink-soft underline-offset-4 transition-colors hover:text-violet hover:underline disabled:opacity-60"
          >
            {pending ? copy.afterword.keepsakeUploading : copy.afterword.changeKeepsake}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="flex aspect-[3/2] w-full max-w-xs flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-rule-strong bg-paper2/50 text-center transition-colors hover:border-violet-2 disabled:opacity-60"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="text-violet" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="8.5" cy="10" r="1.5" />
            <path d="M21 16l-5-5-6 6" />
          </svg>
          <span className="text-sm text-ink-soft">
            {pending ? copy.afterword.keepsakeUploading : copy.afterword.uploadKeepsake}
          </span>
        </button>
      )}

      <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-ember">{copy.afterword.keepsakeCaption}</p>
      {error && (
        <p role="alert" className="mt-2 text-xs text-ember">
          {error}
        </p>
      )}
    </div>
  );
}
