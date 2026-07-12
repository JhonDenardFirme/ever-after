'use client';
// -----------------------------------------------------------------------------
// components/ui/StarsBackground.tsx (1.2)
//
// An immersive starfield for The Library: three parallax layers of box-shadow
// stars drifting slowly UPWARD, the whole field easing toward the cursor with a
// spring. Subtle, low-opacity, pointer-events-none, and still under reduced
// motion. Adapted from @animate-ui's StarsBackground (window-based cursor
// tracking so it responds even under the content).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion, type SpringOptions } from 'motion/react';

function generateStars(count: number, color: string): string {
  const shadows: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * 4000) - 2000;
    const y = Math.floor(Math.random() * 4000) - 2000;
    shadows.push(`${x}px ${y}px ${color}`);
  }
  return shadows.join(', ');
}

function StarLayer({
  count,
  size,
  duration,
  color,
  reduced,
}: {
  count: number;
  size: number;
  duration: number;
  color: string;
  reduced: boolean;
}) {
  const [shadow, setShadow] = useState('');
  useEffect(() => setShadow(generateStars(count, color)), [count, color]);

  const dot = { width: `${size}px`, height: `${size}px`, borderRadius: '9999px', boxShadow: shadow } as React.CSSProperties;

  return (
    <motion.div
      className="absolute left-0 top-0 h-[2000px] w-full"
      animate={reduced ? undefined : { y: [0, -2000] }}
      transition={reduced ? undefined : { repeat: Infinity, duration, ease: 'linear' }}
    >
      <div className="absolute" style={dot} />
      <div className="absolute top-[2000px]" style={dot} />
    </motion.div>
  );
}

export default function StarsBackground({
  className = '',
  starColor = '#FBF7EF',
  factor = 0.05,
  speed = 60,
  opacity = 0.5,
  transition = { stiffness: 50, damping: 20 },
}: {
  className?: string;
  starColor?: string;
  factor?: number;
  speed?: number;
  opacity?: number;
  transition?: SpringOptions;
}) {
  const reduced = useReducedMotion();
  const offsetX = useMotionValue(0);
  const offsetY = useMotionValue(0);
  const springX = useSpring(offsetX, transition);
  const springY = useSpring(offsetY, transition);

  useEffect(() => {
    if (reduced) return;
    const handle = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      offsetX.set(-(e.clientX - cx) * factor);
      offsetY.set(-(e.clientY - cy) * factor);
    };
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, [reduced, factor, offsetX, offsetY]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} style={{ opacity }} aria-hidden="true">
      <motion.div style={{ x: springX, y: springY }}>
        <StarLayer count={700} size={1} duration={speed} color={starColor} reduced={!!reduced} />
        <StarLayer count={250} size={2} duration={speed * 2} color={starColor} reduced={!!reduced} />
        <StarLayer count={120} size={3} duration={speed * 3} color={starColor} reduced={!!reduced} />
      </motion.div>
    </div>
  );
}
