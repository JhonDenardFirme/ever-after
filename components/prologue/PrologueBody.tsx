'use client';
// -----------------------------------------------------------------------------
// components/prologue/PrologueBody.tsx
//
// Everything below the cover. Wrapped in the `unfold` stagger so the sections
// arrive one after another, 60ms apart — a book opening, not a page loading.
//
// Field order is not arbitrary. It reads the way a real book's front matter
// reads: title, then when and where, then the dedication and epigraph (the
// emotional opening), then the description. Theme is last because it's usually
// written afterwards, by the Afterword.
// -----------------------------------------------------------------------------

import { motion } from 'motion/react';
import { unfoldContainer, unfoldItem, useEverMotion } from '@/lib/motion';
import { copy } from '@/lib/copy';
import EditableField from './EditableField';
import type { Story } from '@/lib/types';

export default function PrologueBody({ story }: { story: Story }) {
  const container = useEverMotion(unfoldContainer);
  const item = useEverMotion(unfoldItem);
  const { labels, placeholders } = copy.prologue;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="shown"
      className="mx-auto max-w-2xl px-6 pb-24"
    >
      {/* Title */}
      <motion.div variants={item} className="mb-10">
        <EditableField
          storyId={story.id}
          field="title"
          value={story.title}
          placeholder={placeholders.title}
          variant="title"
        />
      </motion.div>

      {/* When & where — interface voice, sans, side by side on wider screens */}
      <motion.div variants={item} className="mb-12 grid gap-6 border-y border-rule py-6 sm:grid-cols-3">
        <div>
          <p className="mb-1.5 text-[10px] uppercase tracking-[0.22em] text-ink-soft">
            {labels.dates}
          </p>
          <EditableField
            storyId={story.id}
            field="starts_on"
            value={story.starts_on}
            placeholder={copy.prologue.startsOn}
            variant="date"
          />
          <EditableField
            storyId={story.id}
            field="ends_on"
            value={story.ends_on}
            placeholder={copy.prologue.endsOn}
            variant="date"
          />
        </div>

        <EditableField
          storyId={story.id}
          field="setting"
          value={story.setting}
          placeholder={placeholders.setting}
          variant="sans"
          label={labels.setting}
        />

        <EditableField
          storyId={story.id}
          field="theme"
          value={story.theme}
          placeholder={placeholders.theme}
          variant="sans"
          label={labels.theme}
        />
      </motion.div>

      {/* Dedication — the most emotionally loaded field in the app. Centered,
          italic, given room to breathe. It gets the page to itself. */}
      <motion.div variants={item} className="mb-14 text-center">
        <p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-ink-soft">
          {labels.dedication}
        </p>
        <EditableField
          storyId={story.id}
          field="dedication"
          value={story.dedication}
          placeholder={placeholders.dedication}
          variant="serif-italic"
          multiline
        />
      </motion.div>

      {/* Epigraph — marked with an ember rule, the one highlight on this page */}
      <motion.div variants={item} className="mb-14 border-l-2 border-ember pl-5">
        <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-ink-soft">
          {labels.epigraph}
        </p>
        <EditableField
          storyId={story.id}
          field="epigraph"
          value={story.epigraph}
          placeholder={placeholders.epigraph}
          variant="serif"
          multiline
        />
      </motion.div>

      {/* Description */}
      <motion.div variants={item} className="mb-14">
        <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-ink-soft">
          {labels.description}
        </p>
        <EditableField
          storyId={story.id}
          field="description"
          value={story.description}
          placeholder={placeholders.description}
          variant="serif"
          multiline
        />
      </motion.div>

      {/* Soundtrack — plain sans, it's metadata, not poetry */}
      <motion.div variants={item} className="border-t border-rule pt-8">
        <EditableField
          storyId={story.id}
          field="soundtrack"
          value={story.soundtrack}
          placeholder={placeholders.soundtrack}
          variant="sans"
          label={labels.soundtrack}
        />
      </motion.div>
    </motion.div>
  );
}
