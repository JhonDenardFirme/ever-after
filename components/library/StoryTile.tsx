'use client';
// -----------------------------------------------------------------------------
// components/library/StoryTile.tsx
//
// One book on the shelf. Client component purely because shelfLift needs
// whileHover — everything else about it is static.
//
// The tile is deliberately tall (3:4) rather than square. Square reads as
// Instagram; a portrait rectangle reads as a book cover. That single ratio
// choice does most of the work of not looking like a photo app.
// -----------------------------------------------------------------------------

import Link from 'next/link';
import { motion } from 'motion/react';
import { shelfLift, useEverMotion } from '@/lib/motion';
import { copy } from '@/lib/copy';
import { SparkIcon } from '@/components/ui/icons';
import type { Story } from '@/lib/types';

function years(story: Story): string | null {
  if (!story.starts_on) return null;
  const start = new Date(story.starts_on);
  return start.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
}

export default function StoryTile({ story, coverUrl }: { story: Story; coverUrl: string | null }) {
  const lift = useEverMotion(shelfLift);
  const when = years(story);

  return (
    <motion.div variants={lift} initial="rest" whileHover="hover" whileFocus="hover" className="rounded-2xl">
      <Link
        href={`/story/${story.slug}`}
        className="block overflow-hidden rounded-2xl border border-rule bg-paper2"
      >
        {/* Cover. A real Frame once one is developed; until then a rich violet
            field with the theme — absence, not a broken image icon. A violet
            bleed at the base grounds the image and carries the title label. */}
        <div className="relative aspect-[3/4] overflow-hidden bg-violet-hero">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            // Empty cover — a piece of frosted glass over the violet field.
            <div className="relative flex h-full items-end p-5">
              <div className="pointer-events-none absolute inset-0 bg-white/[0.06]" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/25 to-transparent opacity-50" />
              <div className="pointer-events-none absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_0_0_1px_rgba(255,255,255,0.06)]" />
              <SparkIcon size={12} className="absolute right-4 top-4 text-white/50" />
              <span className="relative font-serif text-xl italic leading-tight text-paper/85">
                {story.theme ?? ''}
              </span>
            </div>
          )}

          {/* the violet bleed — softens the photo and seats the caption */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-violet-bleed" />

          <div className="absolute inset-x-0 bottom-0 p-5">
            <h3 className="font-serif text-2xl leading-snug text-paper drop-shadow-sm">
              {story.title || copy.library.untitled}
            </h3>
            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-paper/70">
              {story.setting ?? copy.library.noSetting}
              {when ? ` · ${when}` : ''}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
