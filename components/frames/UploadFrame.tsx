'use client';
// -----------------------------------------------------------------------------
// components/frames/UploadFrame.tsx (1.2)
//
// The only way media gets into Ever After. Now plural, and now video-aware.
//
// Photos: compressed in the browser (~800KB, 1920px) before anything leaves
// the device, dimensions read with createImageBitmap.
// Videos: never compressed (the browser can't, meaningfully), capped at 50MB
// client-side so a doomed upload fails in 0 seconds instead of 60, dimensions
// read from the metadata of an off-screen <video>.
//
// Multi-select: files go up ONE AT A TIME, in order. Sequential beats parallel
// here — sort_order stays sane, one failure doesn't strand five in-flight
// requests, and the progress label ("Uploading 2 of 5…") can be honest.
//
// If this trigger is filling a Waiting Frame, the FIRST file fills it and
// every additional file joins its set (inherits prompt_text). That's the
// whole "sub-album" mechanic: the prompt is the label, the label is the group.
// -----------------------------------------------------------------------------

import { useRef, useState, useTransition } from 'react';
import imageCompression from 'browser-image-compression';
import { developFrame } from '@/app/actions/frames';
import { copy } from '@/lib/copy';

const COMPRESSION = { maxSizeMB: 0.8, maxWidthOrHeight: 1920, useWebWorker: true };
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

async function measureImage(file: Blob): Promise<{ width: number; height: number }> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return { width: 1500, height: 1000 };
  }
}

function measureVideo(file: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    const done = (w: number, h: number) => {
      URL.revokeObjectURL(url);
      resolve({ width: w || 1600, height: h || 900 });
    };
    video.onloadedmetadata = () => done(video.videoWidth, video.videoHeight);
    video.onerror = () => done(1600, 900);
    video.src = url;
  });
}

export default function UploadFrame({
  slug,
  chapterId,
  frameId,
  promptText,
  render,
}: {
  slug: string;
  chapterId: string;
  /** Present when filling a Waiting Frame. First file fills it; the rest join its set. */
  frameId?: string;
  /** The set label extra files inherit — usually the Waiting Frame's prompt. */
  promptText?: string;
  render: (state: { pending: boolean; label: string | null; open: () => void }) => React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [label, setLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function prepare(file: File): Promise<FormData | { error: string }> {
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) return { error: copy.frames.notAnImage };
    if (isVideo && file.size > MAX_VIDEO_BYTES) return { error: copy.frames.videoTooLarge };

    let upload: File | Blob = file;
    if (isImage) {
      try {
        upload = await imageCompression(file, COMPRESSION);
      } catch (err) {
        console.error('[UploadFrame] compression failed, sending original:', err);
      }
    }

    const { width, height } = isVideo ? await measureVideo(upload) : await measureImage(upload);

    const formData = new FormData();
    formData.set('slug', slug);
    formData.set('chapterId', chapterId);
    formData.set('width', String(width));
    formData.set('height', String(height));
    if (promptText) formData.set('promptText', promptText);
    formData.set('file', upload, file.name);
    return formData;
  }

  function handleFiles(files: File[]) {
    if (files.length === 0) return;
    setError(null);

    startTransition(async () => {
      for (let i = 0; i < files.length; i++) {
        setLabel(
          files.length === 1
            ? copy.frames.developing
            : copy.frames.uploadingCount(i + 1, files.length)
        );

        const prepared = await prepare(files[i]);
        if ('error' in prepared) {
          setError(prepared.error);
          continue; // one bad file shouldn't sink the rest
        }

        // Only the first file fills the Waiting Frame; the rest join its set.
        if (frameId && i === 0) prepared.set('frameId', frameId);

        const result = await developFrame(prepared);
        if (!result.ok) {
          setError(result.error || copy.frames.developError);
          break; // a server failure probably repeats — stop, don't spam
        }
      }
      setLabel(null);
    });
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = ''; // same file twice in a row should still fire
          handleFiles(files);
        }}
      />

      {render({ pending: isPending, label, open: () => inputRef.current?.click() })}

      {error && (
        <p role="alert" className="mt-2 text-xs text-ember">
          {error}
        </p>
      )}
    </>
  );
}
