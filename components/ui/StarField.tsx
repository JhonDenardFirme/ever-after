// -----------------------------------------------------------------------------
// components/ui/StarField.tsx (1.2)
//
// A sparse, luxury-book star field for the cover hero — not glitter, not
// sparkles. ~26 fixed stars (deterministic, so no hydration mismatch), sizes
// 1–3px, warm-white / pale-gold, gathered toward the upper area and edges so
// they never sit over the title. A few breathe almost imperceptibly (~9s).
// -----------------------------------------------------------------------------

import { SparkIcon } from './icons';

type Star = { x: number; y: number; s: number; o: number; gold?: boolean; spark?: boolean; tw?: boolean; d?: number };

// Positions in %, deliberately clustered up top and along the edges, avoiding
// the central title band (roughly x 28–72 / y 34–70).
const STARS: Star[] = [
  { x: 6, y: 10, s: 2, o: 0.5, spark: true, tw: true, d: 0 },
  { x: 12, y: 20, s: 1, o: 0.35 },
  { x: 18, y: 8, s: 1, o: 0.3, gold: true },
  { x: 22, y: 26, s: 2, o: 0.4, tw: true, d: 2 },
  { x: 9, y: 34, s: 1, o: 0.3 },
  { x: 27, y: 14, s: 1, o: 0.45, gold: true, tw: true, d: 5 },
  { x: 4, y: 48, s: 1, o: 0.25 },
  { x: 33, y: 6, s: 2, o: 0.4, spark: true, tw: true, d: 3 },
  { x: 40, y: 16, s: 1, o: 0.3 },
  { x: 48, y: 9, s: 1, o: 0.35, gold: true },
  { x: 56, y: 14, s: 1, o: 0.3, tw: true, d: 6 },
  { x: 63, y: 7, s: 2, o: 0.45, spark: true },
  { x: 70, y: 15, s: 1, o: 0.3, gold: true, tw: true, d: 1 },
  { x: 78, y: 9, s: 1, o: 0.35 },
  { x: 84, y: 20, s: 2, o: 0.4, tw: true, d: 4 },
  { x: 91, y: 12, s: 1, o: 0.3, gold: true },
  { x: 94, y: 30, s: 1, o: 0.28 },
  { x: 88, y: 40, s: 1, o: 0.3, tw: true, d: 7 },
  { x: 96, y: 52, s: 2, o: 0.38, spark: true, tw: true, d: 2 },
  { x: 82, y: 62, s: 1, o: 0.28, gold: true },
  { x: 90, y: 76, s: 1, o: 0.3 },
  { x: 7, y: 66, s: 1, o: 0.3, tw: true, d: 3 },
  { x: 14, y: 78, s: 2, o: 0.36, spark: true },
  { x: 5, y: 84, s: 1, o: 0.28, gold: true, tw: true, d: 5 },
  { x: 24, y: 88, s: 1, o: 0.26 },
  { x: 76, y: 86, s: 1, o: 0.3, tw: true, d: 6 },
];

function color(gold?: boolean) {
  return gold ? '#F3E4C3' : '#FBF7EF';
}

export default function StarField({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 ${className}`}>
      {STARS.map((st, i) => {
        const common = {
          left: `${st.x}%`,
          top: `${st.y}%`,
          opacity: st.o,
          ['--star-o' as string]: String(st.o),
          animationDelay: st.d ? `${st.d}s` : undefined,
        } as React.CSSProperties;

        if (st.spark) {
          return (
            <span key={i} className={`absolute -translate-x-1/2 -translate-y-1/2 ${st.tw ? 'ever-twinkle' : ''}`} style={{ ...common, color: color(st.gold) }}>
              <SparkIcon size={st.s * 5} />
            </span>
          );
        }
        return (
          <span
            key={i}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full ${st.tw ? 'ever-twinkle' : ''}`}
            style={{ ...common, width: `${st.s}px`, height: `${st.s}px`, background: color(st.gold) }}
          />
        );
      })}
    </div>
  );
}
