// -----------------------------------------------------------------------------
// components/ui/StarDivider.tsx (1.2)
//
// A hairline with a softly glowing four-point star at its centre — the recurring
// Ever After divider motif, meant to be reused across the app. `onDark` swaps the
// hairline tone for use over dark surfaces (the frontispiece hero).
// -----------------------------------------------------------------------------

import { SparkIcon } from './icons';

export default function StarDivider({ onDark = false, className = '' }: { onDark?: boolean; className?: string }) {
  const line = onDark
    ? 'bg-gradient-to-r from-transparent via-white/30 to-transparent'
    : 'bg-gradient-to-r from-transparent via-rule to-transparent';

  return (
    <div className={`flex items-center gap-4 ${className}`} aria-hidden="true">
      <span className={`h-px flex-1 ${line}`} />
      <SparkIcon size={16} className="ever-star-pulse text-ember" />
      <span className={`h-px flex-1 ${line}`} />
    </div>
  );
}
