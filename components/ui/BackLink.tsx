// -----------------------------------------------------------------------------
// components/ui/BackLink.tsx (1.2)
//
// The one back-link treatment, with an arrow icon. `onDark` for use over a hero
// image; otherwise the on-paper tone.
// -----------------------------------------------------------------------------

import Link from 'next/link';
import { ArrowLeftIcon } from './icons';

export default function BackLink({
  href,
  label,
  onDark = false,
  className = '',
}: {
  href: string;
  label: string;
  onDark?: boolean;
  className?: string;
}) {
  const tone = onDark
    ? 'text-paper/70 hover:text-paper [text-shadow:0_2px_16px_rgba(0,0,0,0.4)]'
    : 'text-ink-soft hover:text-violet';
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] transition-colors ${tone} ${className}`}
    >
      <ArrowLeftIcon size={13} />
      {label}
    </Link>
  );
}
