// -----------------------------------------------------------------------------
// middleware.ts
//
// Protects everything except /signin and NextAuth's own /api/auth routes.
// The `authorized` callback in lib/auth.ts does the actual check; if it
// returns false, NextAuth redirects to /signin for me — no manual redirect
// logic needed here.
//
// Runs on the Edge runtime, which is fine because lib/auth.ts imports nothing
// heavy (no DB adapter). If a database adapter ever gets added, this file is
// the first thing that breaks — split the config if that day comes.
// -----------------------------------------------------------------------------

export { auth as middleware } from '@/lib/auth';

export const config = {
  // Match everything EXCEPT: NextAuth internals, Next static assets, image
  // optimizer, favicon, the signin page itself (or we'd loop), and any
  // Invitation page — those are deliberately PUBLIC (shareable, read-only).
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|signin|.*/invitation).*)'],
};
