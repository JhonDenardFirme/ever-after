// -----------------------------------------------------------------------------
// components/ui/GlassPanel.tsx (1.2)
//
// A piece of frosted crystal floating above the memories — the Ever After glass
// surface for menus and modals that sit over a cover photo. Layered for a
// believable read (VisionOS / Arc / Linear, not Windows-Vista): a violet-tinted
// glass fill, heavy backdrop blur + saturation, a soft top reflection, a corner
// highlight, an inner edge glow, a whisper of grain, and — our signature — a few
// tiny stars blurred behind the glass, like a night sky seen through frost.
//
// Purple is a TINT here, never the background. Pass paper/white-toned content.
// -----------------------------------------------------------------------------

import type { ReactNode } from 'react';

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E\")";

export default function GlassPanel({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/20 backdrop-blur-2xl backdrop-saturate-150 ${className}`}
      style={{
        background:
          'linear-gradient(135deg, rgba(118,74,188,0.32), rgba(80,42,160,0.16)), rgba(255,255,255,0.06)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.18), 0 35px 80px rgba(0,0,0,0.30)',
      }}
    >
      {/* corner highlight */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(circle at top left, rgba(255,255,255,0.16), transparent 55%)' }}
      />
      {/* top reflection */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/20 to-transparent opacity-60" />
      {/* inner edge glow */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_0_0_1px_rgba(255,255,255,0.06)]" />
      {/* grain */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-soft-light" style={{ backgroundImage: NOISE }} />
      {/* tiny stars behind the frost */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <span className="absolute left-8 top-6 h-1 w-1 rounded-full bg-white/80 blur-[0.5px]" />
        <span className="absolute right-10 top-16 h-1.5 w-1.5 rounded-full bg-white/60 blur-[1px]" />
        <span className="absolute bottom-8 left-20 h-1 w-1 rounded-full bg-white/70 blur-[0.5px]" />
      </div>

      <div className="relative">{children}</div>
    </div>
  );
}

// Shared glass control classes, for menu items + secondary buttons over cover.
export const glassItem =
  'block w-full rounded-lg px-3 py-2.5 text-left text-sm text-white/90 transition-colors hover:bg-white/10';
export const glassButton =
  'inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.08] px-4 py-2 text-[11px] tracking-wide text-white/90 backdrop-blur-xl transition-all duration-300 hover:-translate-y-[1px] hover:border-white/30 hover:bg-white/[0.14]';
