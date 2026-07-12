'use client';
// -----------------------------------------------------------------------------
// components/ui/CountingNumber.tsx (1.2)
//
// A number that springs up from 0 to its value the first time it scrolls into
// view — for the Library statistics. Adapted from @animate-ui's CountingNumber.
// Goes straight to the value under reduced motion.
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';
import { useInView, useMotionValue, useSpring, useReducedMotion } from 'motion/react';

export default function CountingNumber({
  number,
  fromNumber = 0,
  className = '',
}: {
  number: number;
  /** Where the count starts. Stats count up from 0; the "Since" year counts
   *  DOWN from the present year to its origin. */
  fromNumber?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(fromNumber);
  const spring = useSpring(mv, { stiffness: 90, damping: 50 });
  const [display, setDisplay] = useState(fromNumber);

  useEffect(() => {
    if (!inView) return;
    if (reduced) setDisplay(number);
    else mv.set(number);
  }, [inView, number, reduced, mv]);

  useEffect(() => {
    const unsub = spring.on('change', (v) => setDisplay(Math.round(v)));
    return () => unsub();
  }, [spring]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
