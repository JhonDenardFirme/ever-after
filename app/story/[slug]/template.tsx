'use client';
// -----------------------------------------------------------------------------
// app/story/[slug]/template.tsx
//
// `pageTurn` lives here rather than in layout.tsx, and that distinction is the
// whole reason this file exists: a layout persists across navigation between
// sibling routes, so its children never re-mount and an enter animation would
// fire exactly once, ever. A template re-mounts on every navigation. That's
// what makes Prologue → Storyboard → Frames → Afterword feel like turning
// pages instead of swapping panes.
//
// The print route opts out. A motion transform on a page destined for a
// printer is at best pointless and at worst a clipped first page — and
// `position` / `transform` interact badly with print pagination.
// -----------------------------------------------------------------------------

import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { pageTurn, useEverMotion } from '@/lib/motion';

export default function StoryTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const variants = useEverMotion(pageTurn);

  // No transforms on anything headed for a printer.
  if (pathname?.endsWith('/print')) return <>{children}</>;

  return (
    <motion.div variants={variants} initial="hidden" animate="shown">
      {children}
    </motion.div>
  );
}
