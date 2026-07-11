'use client';
// -----------------------------------------------------------------------------
// components/soundtrack/SpotifyPlayer.tsx (1.2)
//
// Our editorial player card, wired to Spotify's iFrame API so OUR Play / Pause
// button controls playback in place — no redirect off the page. The API script
// (loaded once) turns the target div into the real embed; we hold its controller
// and call togglePlay(), and mirror its playback state onto the button + the
// spinning record. The embed stays visible as the minimal engine; if the API
// can't load, the embed's own controls still work.
//
// Layout: a big spinning record, a hairline, the album art, then title + our
// transport button.
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { copy } from '@/lib/copy';
import StarDivider from '@/components/ui/StarDivider';
import { PlayIcon, PauseIcon } from '@/components/ui/icons';

type SpotifyController = {
  togglePlay: () => void;
  addListener: (event: string, cb: (e: { data?: { isPaused?: boolean } }) => void) => void;
  destroy?: () => void;
};
type SpotifyApi = {
  createController: (
    el: HTMLElement,
    opts: { uri: string; width?: string | number; height?: string | number },
    cb: (controller: SpotifyController) => void
  ) => void;
};

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyApi) => void;
    __everSpotifyApi?: SpotifyApi;
  }
}

function Vinyl({ spinning, size = 116 }: { spinning: boolean; size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      className="hidden shrink-0 drop-shadow sm:block"
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
      <path d="M50 2 A48 48 0 0 1 98 50 L88 50 A38 38 0 0 0 50 12 Z" fill="#B99CF5" fillOpacity="0.12" />
    </motion.svg>
  );
}

export default function SpotifyPlayer({
  type,
  id,
  title,
  thumbnail,
  editControl,
}: {
  type: string;
  id: string;
  title: string;
  thumbnail: string | null;
  editControl: ReactNode;
}) {
  const reduced = useReducedMotion();
  const embedRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SpotifyController | null>(null);
  const [paused, setPaused] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function init(api: SpotifyApi) {
      if (cancelled || !embedRef.current) return;
      api.createController(
        embedRef.current,
        { uri: `spotify:${type}:${id}`, width: '100%', height: type === 'track' ? 80 : 152 },
        (controller) => {
          if (cancelled) {
            controller.destroy?.();
            return;
          }
          controllerRef.current = controller;
          setReady(true);
          controller.addListener('playback_update', (e) => setPaused(Boolean(e?.data?.isPaused)));
        }
      );
    }

    if (window.__everSpotifyApi) {
      init(window.__everSpotifyApi);
    } else {
      const prev = window.onSpotifyIframeApiReady;
      window.onSpotifyIframeApiReady = (api) => {
        window.__everSpotifyApi = api;
        prev?.(api);
        init(api);
      };
      if (!document.getElementById('spotify-iframe-api')) {
        const s = document.createElement('script');
        s.id = 'spotify-iframe-api';
        s.src = 'https://open.spotify.com/embed/iframe-api/v1';
        s.async = true;
        document.body.appendChild(s);
      }
    }

    return () => {
      cancelled = true;
      controllerRef.current?.destroy?.();
      controllerRef.current = null;
    };
  }, [type, id]);

  return (
    <div className="w-full rounded-[26px] border border-rule bg-paper2 p-5 shadow-shelf sm:p-7">
      <div className="flex items-center gap-4 sm:gap-6">
        <Vinyl spinning={ready && !paused && !reduced} size={116} />
        {/* hairline between the record and the sleeve */}
        <span className="hidden h-24 w-px bg-rule sm:block" />

        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-violet-deep shadow sm:h-28 sm:w-28">
          {thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbnail} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-violet-3">♪</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-xl text-ink sm:text-2xl">{title}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-ink-soft">{copy.soundtrack.via}</p>

          <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-rule">
            <div className="h-full w-1/3 rounded-full bg-ever-gradient" />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => controllerRef.current?.togglePlay()}
              disabled={!ready}
              className="inline-flex items-center gap-2 rounded-full bg-ever-gradient px-5 py-2 text-xs tracking-wide text-paper shadow-glow-soft transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {!ready ? (
                copy.soundtrack.loading
              ) : paused ? (
                <>
                  <PlayIcon size={13} /> {copy.soundtrack.play}
                </>
              ) : (
                <>
                  <PauseIcon size={13} /> {copy.soundtrack.pause}
                </>
              )}
            </button>
            {editControl}
          </div>
        </div>
      </div>

      <StarDivider className="my-5" />

      {/* the API turns this into the real (minimal) embed */}
      <div ref={embedRef} className="min-h-[80px] overflow-hidden rounded-xl" />
    </div>
  );
}
