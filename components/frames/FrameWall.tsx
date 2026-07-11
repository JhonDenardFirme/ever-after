'use client';
// -----------------------------------------------------------------------------
// components/frames/FrameWall.tsx
//
// Every Frame at once. Hierarchy by tile size, not by chrome.
//
// The Keepsake spans two columns and two rows — it's the one Frame that
// represents the whole story, so it gets the space to say so. Everything else
// is uniform. No badges, no ranking, no "featured" ribbon.
//
// 2 columns below 640px, 3 above. Waiting Frames sit inline with developed
// ones rather than in a separate section, because a story that isn't finished
// yet should look like a story that isn't finished yet.
// -----------------------------------------------------------------------------

import { copy } from '@/lib/copy';
import type { Frame, Author } from '@/lib/types';
import FrameCard from './FrameCard';
import WaitingFrameCard from './WaitingFrameCard';

export default function FrameWall({
  frames,
  storyId,
  slug,
  keepsakeId,
  authors,
  selectable = false,
  selectedIds,
  onToggleSelect,
}: {
  frames: Frame[];
  storyId: string;
  slug: string;
  keepsakeId: string | null;
  authors: Record<string, Author>;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}) {
  if (frames.length === 0) {
    return (
      <p className="py-24 text-center font-serif text-xl italic text-ink-soft">
        {copy.frames.emptyStory}
      </p>
    );
  }

  // The Keepsake first — a book's frontispiece comes before its plates.
  const ordered = [...frames].sort((a, b) => {
    if (a.id === keepsakeId) return -1;
    if (b.id === keepsakeId) return 1;
    return 0;
  });

  // Tiles are a uniform 4:5 so the grid never goes ragged; the Keepsake is a
  // wide 3:2 across two columns. Deriving each tile's height from its natural
  // aspect ratio looks clever and produces gaps. The Timeline is where a Frame
  // gets to keep its own proportions.
  return (
    <div className="grid auto-rows-min grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      {ordered.map((frame, i) => {
        const isKeepsake = frame.id === keepsakeId;

        return frame.status === 'waiting' ? (
          <WaitingFrameCard key={frame.id} frame={frame} slug={slug} authors={authors} />
        ) : (
          <FrameCard
            key={frame.id}
            frame={frame}
            storyId={storyId}
            slug={slug}
            isKeepsake={isKeepsake}
            authors={authors}
            priority={i < 2} // above the fold — don't lazy-load these
            aspect={isKeepsake ? 3 / 2 : 4 / 5}
            className={isKeepsake ? 'col-span-2' : ''}
            selectable={selectable}
            selected={selectedIds?.has(frame.id) ?? false}
            onToggleSelect={onToggleSelect ? () => onToggleSelect(frame.id) : undefined}
          />
        );
      })}
    </div>
  );
}
