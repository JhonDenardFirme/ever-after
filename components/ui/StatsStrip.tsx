// -----------------------------------------------------------------------------
// components/ui/StatsStrip.tsx (1.2)
//
// The luxury-invitation statistics strip: elegant hairline columns separated by
// a vertical hairline + a small gold star. Shared between the Library
// frontispiece and anywhere else that wants understated milestones. `onDark`
// tunes the tones for use over a hero image.
// -----------------------------------------------------------------------------

import { SparkIcon } from './icons';

export default function StatsStrip({
  items,
  onDark = false,
  className = '',
}: {
  items: { label: string; value: string | number }[];
  onDark?: boolean;
  className?: string;
}) {
  const labelTone = onDark ? 'text-violet-3' : 'text-ink-soft';
  const valueTone = onDark ? 'text-paper' : 'text-ink';
  const lineTo = onDark ? 'to-white/30' : 'to-rule';
  const shadow = onDark ? '[text-shadow:0_2px_20px_rgba(0,0,0,0.28)]' : '';

  return (
    <div className={`flex items-stretch justify-center ${className}`}>
      {items.map((s, i) => (
        <div key={s.label} className="flex items-stretch">
          {i > 0 && (
            <div className="flex flex-col items-center justify-center gap-1 opacity-70">
              <span className={`w-px flex-1 bg-gradient-to-b from-transparent ${lineTo}`} />
              <SparkIcon size={9} className="text-ember" />
              <span className={`w-px flex-1 bg-gradient-to-t from-transparent ${lineTo}`} />
            </div>
          )}
          <div className="px-4 py-1 text-center sm:px-7">
            <p className={`text-[9px] uppercase tracking-[0.22em] ${labelTone} ${shadow}`}>{s.label}</p>
            <p className={`mt-1 font-serif text-xl ${valueTone} ${shadow} sm:text-2xl`}>{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
