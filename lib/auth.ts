// -----------------------------------------------------------------------------
// lib/auth.ts
//
// NextAuth v5, Google only, JWT sessions, no database adapter.
//
// Why no adapter: with exactly two users, wiring NextAuth into Postgres buys
// nothing. The session lives in a signed cookie (that's what "JWT strategy"
// means here), and the ENTIRE authorization model is the ALLOWED_EMAILS
// allowlist below. Supabase identity (the authors table) is matched by email
// inside Server Actions when we need to know who did something.
//
// The password form on /signin is decorative — no Credentials provider here
// on purpose. When real password auth becomes a thing, it gets added as a
// provider without touching anything else in this file's shape.
// -----------------------------------------------------------------------------

import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

// Parse once at module load. Lowercased + trimmed so a stray space in
// .env.local can't silently lock one of us out.
const allowlist = (process.env.ALLOWED_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // Reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET from env automatically.
    Google,
  ],

  session: { strategy: 'jwt' },

  pages: {
    signIn: '/signin',
    error: '/signin', // access-denied lands back on /signin?error=AccessDenied
  },

  callbacks: {
    // The gate. Google authenticated them — this decides if they're one of us.
    signIn({ profile, user }) {
      const email = (profile?.email ?? user?.email ?? '').toLowerCase();
      return allowlist.includes(email);
    },

    // Used by middleware (we export `auth` as the middleware in middleware.ts).
    // No session -> NextAuth redirects to pages.signIn automatically.
    authorized({ auth: session }) {
      return Boolean(session?.user);
    },
  },
});
