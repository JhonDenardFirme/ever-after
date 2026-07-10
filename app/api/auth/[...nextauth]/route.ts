// -----------------------------------------------------------------------------
// The NextAuth catch-all route. Everything under /api/auth/* (Google's
// callback, session endpoint, sign-out) lands here. All the real config
// lives in lib/auth.ts — this file just exposes the handlers.
// -----------------------------------------------------------------------------

import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
