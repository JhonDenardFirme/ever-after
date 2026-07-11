// -----------------------------------------------------------------------------
// components/ui/SectionHeading.tsx (1.2)
//
// One heading treatment for every major section of the album — Prologue,
// Soundtrack, The Story, and (Batch 3) the Outline and Afterword. A small
// hairline-flanked eyebrow, a large violet→ember gradient title, and an optional
// tagline. Using it everywhere is what makes each block read as its own complete
// section rather than a loose stack of text at the same level.
// -----------------------------------------------------------------------------

import type { ReactNode } from 'react';

export default function SectionHeading({
  eyebrow,
  title,
  tagline,
  align = 'left',
  action,
}: {
  eyebrow?: string;
  title: string;
  tagline?: string;
  align?: 'left' | 'center';
  /** Optional control shown at the end of the heading row (e.g. an upload button). */
  action?: ReactNode;
}) {
  const centered = align === 'center';

  return (
    <div className={`mb-8 flex flex-wrap items-end gap-4 ${centered ? 'justify-center text-center' : 'justify-between'}`}>
      <div className={centered ? 'mx-auto' : ''}>
        {/* eyebrow with hairline detail (optional) */}
        {eyebrow && (
          <div className={`mb-3 flex items-center gap-3 ${centered ? 'justify-center' : ''}`}>
            <span className="h-px w-8 bg-ember/60" />
            <p className="text-[10px] uppercase tracking-[0.3em] text-ember">{eyebrow}</p>
            {centered && <span className="h-px w-8 bg-ember/60" />}
          </div>
        )}

        <h2 className="bg-ever-gradient bg-clip-text font-serif text-4xl leading-tight text-transparent sm:text-5xl">
          {title}
        </h2>

        {tagline && (
          <p className={`mt-3 font-serif text-lg italic text-ink-soft ${centered ? 'mx-auto max-w-xl' : 'max-w-xl'}`}>
            {tagline}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
