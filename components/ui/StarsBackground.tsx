'use client';
// -----------------------------------------------------------------------------
// components/ui/StarsBackground.tsx (1.2)
//
// An interactive-feeling starry background: many small dots of varying sizes and
// speeds drifting and twinkling on a canvas — a calm, immersive "space" effect.
// Used on The Library only (the album keeps our hand-placed StarField). Kept
// subtle: low opacity, pointer-events none, and fully still under reduced motion.
// Inspired by @animate-ui's StarsBackground.
// -----------------------------------------------------------------------------

import { useEffect, useRef } from 'react';

type Star = { x: number; y: number; r: number; vx: number; vy: number; tw: number; phase: number };

export default function StarsBackground({
  className = '',
  starColor = '#FBF7EF',
  count = 150,
  opacity = 0.5,
}: {
  className?: string;
  starColor?: string;
  count?: number;
  opacity?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let stars: Star[] = [];
    let raf = 0;
    let t = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.5 + 0.4,
        vx: (Math.random() - 0.5) * 0.05,
        vy: (Math.random() - 0.5) * 0.05 - 0.02, // a faint upward drift
        tw: Math.random() * 0.5 + 0.5,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      t += 0.016;
      for (const s of stars) {
        if (!reduced) {
          s.x += s.vx;
          s.y += s.vy;
          if (s.x < -2) s.x = w + 2;
          if (s.x > w + 2) s.x = -2;
          if (s.y < -2) s.y = h + 2;
          if (s.y > h + 2) s.y = -2;
        }
        const twinkle = reduced ? s.tw : (0.5 + 0.5 * Math.sin(t * 0.8 + s.phase)) * s.tw;
        ctx.globalAlpha = twinkle;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = starColor;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!reduced) raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [count, starColor]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{ opacity }}
    />
  );
}
