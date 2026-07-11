// -----------------------------------------------------------------------------
// components/afterword/AfterwordCarousel.tsx (1.2)
//
// A quiet auto-scrolling band of the story's photographs, so the Afterword
// carries the images along with the words. Pure CSS marquee (see globals.css) —
// duplicated row for a seamless loop, pauses on hover, still under reduced
// motion. Photos only (paper, and this band, can't play video).
// -----------------------------------------------------------------------------

import type { Frame } from '@/lib/types';
import { copy } from '@/lib/copy';

export default function AfterwordCarousel({ frames }: { frames: Frame[] }) {
  const photos = frames
    .filter((f) => f.status === 'developed' && f.media_url && f.media_type !== 'video')
    .slice(0, 20);

  if (photos.length < 3) return null; // not enough to be a carousel

  const row = (dupe: boolean) =>
    photos.map((f) => (
      <div key={(dupe ? 'd-' : '') + f.id} className="h-40 w-56 shrink-0 overflow-hidden rounded-xl border border-rule">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={f.media_url as string} alt="" className="h-full w-full object-cover" />
      </div>
    ));

  return (
    <div className="mb-14">
      <p className="mb-3 text-center text-[10px] uppercase tracking-[0.3em] text-ink-soft">
        {copy.afterword.carouselEyebrow}
      </p>
      <div className="ever-marquee-wrap -mx-6">
        <div className="ever-marquee flex w-max gap-4 px-6">
          {row(false)}
          <div className="flex gap-4" aria-hidden="true">
            {row(true)}
          </div>
        </div>
      </div>
    </div>
  );
}
