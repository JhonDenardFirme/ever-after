// -----------------------------------------------------------------------------
// components/ui/icons.tsx (1.2)
//
// A few shared inline SVGs. Inline, not a library — the same reasoning as
// BeatIcon: a renamed export from an icon package once broke this build, and a
// handful of paths isn't worth a dependency.
// -----------------------------------------------------------------------------

export function StarIcon({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 2.5l2.6 5.7 6.2.7-4.6 4.2 1.2 6.1L12 16.9 6.6 19.2l1.2-6.1L3.2 8.9l6.2-.7z" />
    </svg>
  );
}

export function TrashIcon({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

/** The Keepsake badge — a shining star in an ember disc with a soft glow. */
export function StarBadge({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-ember px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-paper shadow-[0_0_14px_rgba(249,115,22,0.6)]">
      <StarIcon size={11} />
      {label}
    </span>
  );
}
