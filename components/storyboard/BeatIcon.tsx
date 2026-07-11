// -----------------------------------------------------------------------------
// components/storyboard/BeatIcon.tsx
//
// Six inline SVGs, one per beat_type. Deliberately not an icon library — the
// last time this project pulled one in, a renamed export broke the build, and
// six paths is not worth a dependency.
//
// beat_type drives icon selection ONLY. No behaviour branches on it anywhere,
// which is why adding a seventh type later is a schema check-constraint change
// plus one entry here, and nothing else.
// -----------------------------------------------------------------------------

import type { BeatType } from '@/lib/types';

const PATHS: Record<BeatType, React.ReactNode> = {
  // a car
  travel: (
    <>
      <path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13" />
      <path d="M4 13h16v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
      <circle cx="7.5" cy="15.5" r=".6" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="15.5" r=".6" fill="currentColor" stroke="none" />
    </>
  ),
  // a key
  arrival: (
    <>
      <circle cx="8" cy="12" r="3.2" />
      <path d="M11.2 12H20" />
      <path d="M17 12v3" />
      <path d="M20 12v2.2" />
    </>
  ),
  // a mountain / the view
  activity: (
    <>
      <path d="M3 18l5.5-9 3.5 5.5L14.5 11 21 18z" />
      <circle cx="16.5" cy="7" r="1.6" />
    </>
  ),
  // a bowl
  meal: (
    <>
      <path d="M4 11h16a8 8 0 0 1-8 8 8 8 0 0 1-8-8z" />
      <path d="M9 8c0-1 .8-1.4.8-2.4S9 4 9 4" />
      <path d="M13 8c0-1 .8-1.4.8-2.4S13 4 13 4" />
    </>
  ),
  // a moon
  rest: <path d="M19 13.5A7.5 7.5 0 0 1 10.5 5a7.5 7.5 0 1 0 8.5 8.5z" />,
  // a small star
  other: (
    <path d="M12 4.5l2.1 4.6 5 .6-3.7 3.4 1 4.9L12 15.6l-4.4 2.4 1-4.9L4.9 9.7l5-.6z" />
  ),
};

export default function BeatIcon({
  type,
  size = 16,
  className = '',
}: {
  type: BeatType;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[type]}
    </svg>
  );
}
