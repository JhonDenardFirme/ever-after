// -----------------------------------------------------------------------------
// app/layout.tsx — the root shell.
//
// Fonts: Instrument Serif carries anything the STORY says (titles, prologue,
// afterword). Jost carries anything the INTERFACE says (buttons, labels).
// next/font self-hosts both at build time — no runtime request to Google,
// no layout shift. The CSS variables here are what tailwind.config.ts's
// fontFamily entries point at.
//
// robots noindex: this is a private site for two people. Search engines are
// not invited.
// -----------------------------------------------------------------------------

import type { Metadata } from 'next';
import { Instrument_Serif, Jost } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { copy } from '@/lib/copy';
import './globals.css';

const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400', // Instrument Serif ships only 400 — italics do the expressive work
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const sans = Jost({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: copy.brand.name,
  description: copy.brand.tagline,
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
