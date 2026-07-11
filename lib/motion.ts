'use client';
// -----------------------------------------------------------------------------
// lib/motion.ts
//
// The six named motion variants from the masterplan. Each one is a storybook
// metaphor, not a generic fade — the animation language IS the brand language:
//
//   develop        a photo surfacing like a darkroom print (blur -> sharp)
//   pageTurn       route changes between story sub-pages
//   shelfLift      a story tile rising off the shelf on hover
//   unfold         Prologue sections staggering open
//   ribbon         the Storyboard's active-beat dot sliding along the line
//   parallaxCover  the story cover drifting at 0.4x scroll speed
//
// Accessibility is non-negotiable: wrap variants with useEverMotion() and
// they collapse to instant opacity swaps when the OS asks for reduced motion.
// -----------------------------------------------------------------------------

import { useReducedMotion } from 'motion/react';
import type { Variants, Transition } from 'motion/react';

// One easing for the whole app — a gentle settle, like a page coming to rest.
// Typed as a plain cubic-bezier tuple (motion's Transition type is a union,
// so it can't be index-accessed for the ease field).
export const settle: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** A Frame appearing — the darkroom develop. Use: initial="hidden" animate="shown". */
export const develop: Variants = {
  hidden: { opacity: 0, filter: 'blur(8px)', scale: 0.985 },
  shown: {
    opacity: 1,
    filter: 'blur(0px)',
    scale: 1,
    transition: { duration: 0.7, ease: settle },
  },
};

/** Route transitions between a story's sub-pages. Pair with AnimatePresence. */
export const pageTurn: Variants = {
  hidden: { opacity: 0, x: 24 },
  shown: { opacity: 1, x: 0, transition: { duration: 0.4, ease: settle } },
  exit: { opacity: 0, x: -24, transition: { duration: 0.3, ease: settle } },
};

/** A Library tile on hover. Use: initial="rest" whileHover="hover". */
export const shelfLift: Variants = {
  rest: { y: 0, boxShadow: '0 1px 2px rgba(42, 34, 49, 0.08)' },
  hover: {
    y: -8,
    // 1.2: the lift now carries a violet glow instead of a plain grey shadow.
    boxShadow: '0 18px 40px rgba(53, 14, 112, 0.28)',
    transition: { duration: 0.2, ease: settle },
  },
};

/** Parent + child pair for Prologue sections opening one after another. */
export const unfoldContainer: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.06 } },
};
export const unfoldItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.45, ease: settle } },
};

/**
 * ribbon isn't a Variants object — it's the spring for the Storyboard's
 * active-beat indicator. Give the moving dot a layoutId (e.g. "ribbon-dot")
 * and pass this as its transition; Framer handles the slide between beats.
 */
export const ribbon: Transition = { type: 'spring', stiffness: 400, damping: 32 };

/**
 * parallaxCover factor. Phase 2 usage with motion's scroll hooks:
 *   const { scrollY } = useScroll();
 *   const y = useTransform(scrollY, (v) => v * PARALLAX_FACTOR);
 * The cover moves slower than the page — the image lingers as you leave it.
 */
export const PARALLAX_FACTOR = 0.4;

/**
 * Reduced-motion wrapper. If the OS prefers reduced motion, every state in
 * the variant collapses to an instant opacity change — no movement, no blur,
 * no delay. Use this instead of raw variants everywhere:
 *
 *   const v = useEverMotion(develop);
 *   <motion.div variants={v} initial="hidden" animate="shown" />
 */
export function useEverMotion(variants: Variants): Variants {
  const reduced = useReducedMotion();
  if (!reduced) return variants;

  const still: Variants = {};
  for (const key of Object.keys(variants)) {
    const state = variants[key] as Record<string, unknown>;
    still[key] = {
      opacity: (state?.opacity as number | undefined) ?? 1,
      transition: { duration: 0 },
    };
  }
  return still;
}
