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
    <motion.div variants={lift} initial="rest" whileHover="hover" whileFocus="hover">
      <Link
        href={`/story/${story.slug}`}
        className="block overflow-hidden rounded-xl border border-rule bg-paper2"
      >
        {/* Cover. Phase 4 fills this with a real Frame; until then it's a
            quiet violet field — absence, not a broken image icon. */}
        <div className="relative aspect-[3/4] overflow-hidden bg-violet-deep">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-end p-4">
              <span className="font-serif text-lg italic leading-tight text-violet-3/70">
                {story.theme ?? ''}
              </span>
            </div>
          )}
        </div>

        <div className="px-4 py-3.5">
          <h3 className="mb-1 font-serif text-lg leading-snug text-ink">
            {story.title || copy.library.untitled}
          </h3>
          <p className="text-[11px] uppercase tracking-[0.16em] text-ink-soft">
            {story.setting ?? copy.library.noSetting}
            {when ? ` · ${when}` : ''}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
