# Phase 1 — Setup & Verification Guide

*My working notes for the Foundation phase. Read top to bottom once, then use
§3 as the checklist.*

---

## 1. Getting it running

Unzip the project, then from inside the folder:

```bash
npm install
cp .env.example .env.local
# fill .env.local with the real values from Phase 0
npm run dev
```

Open http://localhost:3000 — you should be bounced straight to `/signin`.

If starting a fresh git repo at the same time:

```bash
git init
git add -A
git commit -m "Phase 1: foundation — design system, auth, schema"
```

Then push to a **private** GitHub repo and add the two keep-alive secrets
(`SUPABASE_URL`, `SUPABASE_ANON_KEY`) under Settings → Secrets → Actions.

---

## 2. The file tree, and why each file exists

```
ever-after/
├── app/
│   ├── layout.tsx            fonts (Instrument Serif + Jost), texture, metadata
│   ├── globals.css           Tailwind + the paper-grain texture + focus styles
│   ├── page.tsx              / → redirect to /library
│   ├── signin/page.tsx       the front door — Google button + decorative password
│   ├── library/page.tsx      empty Library placeholder (Phase 2 fills it)
│   └── api/auth/[...nextauth]/route.ts   NextAuth's catch-all endpoint
├── lib/
│   ├── auth.ts               NextAuth config: Google, JWT, email allowlist
│   ├── supabase.ts           the ONLY Supabase client — service role, server-only
│   ├── copy.ts               every user-facing sentence in the app
│   ├── motion.ts             the six named variants + reduced-motion wrapper
│   └── types.ts              TS mirrors of every schema table
├── middleware.ts             protects everything except /signin + /api/auth
├── supabase/schema.sql       the migration (already ran in Phase 0 — kept in
│                             the repo as the source of truth for the DB shape)
├── .github/workflows/keep-alive.yml   anti-pause ping every 3 days
├── tailwind.config.ts        the full token set (paper/violet/ember + fonts)
├── next.config.mjs           *.supabase.co allowed for next/image (Phase 4)
├── .env.example              template — copy to .env.local, never commit that
└── package.json, tsconfig.json, postcss.config.mjs, .gitignore
```

**The three files phases 2–5 will touch constantly:** `copy.ts` (new strings),
`types.ts` (only if schema changes), `motion.ts` (never — it's complete).

---

## 3. Success criteria — check every box before Phase 2

| # | Check | How to verify |
|---|---|---|
| 1 | Project builds | `npm run build` finishes with no errors (the jose/DecompressionStream *warning* is expected and harmless) |
| 2 | Route protection | Visit `/library` logged out → redirected to `/signin` |
| 3 | Root redirect | Visit `/` → end up at `/signin` (logged out) or `/library` (logged in) |
| 4 | Google sign-in works | Click "Continue with Google" with an **allowlisted** email → land on `/library`, greeted by first name |
| 5 | Allowlist bounces strangers | Sign in with a NON-allowlisted Google account → back on `/signin` with the "two authors" message |
| 6 | Sign out works | "Close the book for now" → back to `/signin`, and `/library` is protected again |
| 7 | Decorative password form | Email/password fields visible but not interactive; "Coming soon" note shows |
| 8 | Fonts load | Big "Ever After" title renders in a serif; buttons/labels in Jost. View source: no request to fonts.googleapis.com (next/font self-hosts) |
| 9 | Texture present | Zoom into any empty area — faint grain, not flat color |
| 10 | Tokens live | Background is warm paper (#F7F3EC), not white; button violet, eyebrow line ember orange |
| 11 | Focus visible | Tab through /signin — every focusable element gets a violet ring |
| 12 | Supabase client guarded | Try `import { supabaseAdmin } from '@/lib/supabase'` in signin/page.tsx temporarily and add `'use client'` at top → build FAILS with "server-only". Remove the experiment. (Optional but educational.) |

Testing check #5 needs a second Google account — an old one, or Airhyl's before
adding her to `ALLOWED_EMAILS`, or temporarily remove your own email from the
list and restart the dev server (env changes need a restart).

---

## 4. What I learned / refreshed building this (NextAuth v5 + App Router notes)

**Server Components are the default.** `app/library/page.tsx` is `async` and
calls `await auth()` directly — no `useEffect`, no loading state, no client
fetch. The session is resolved on the server before the first byte of HTML.

**Server Actions replace API routes for mutations.** The Google button isn't an
`onClick` — it's a `<form action={...}>` where the action has `'use server'` at
the top. Next.js turns that into a POST behind the scenes. Sign-in and sign-out
both work this way, with zero client JavaScript of our own.

**Middleware is the bouncer, `authorized` is its brain.** `middleware.ts` just
re-exports `auth` from lib/auth.ts; the `authorized` callback returns whether a
session exists. False → NextAuth redirects to `pages.signIn` automatically. The
matcher regex excludes `/signin` itself, or we'd loop forever.

**The allowlist runs in the `signIn` callback**, which fires *after* Google
authenticates but *before* a session is created. Returning `false` there is what
produces `?error=AccessDenied` back on `/signin`.

**`import 'server-only'` is a build-time tripwire.** It makes leaking the
service-role key into the browser a compile error instead of a security incident.

**`next/font` self-hosts.** Fonts download at build time and serve from our own
domain — no runtime Google request, no flash of unstyled text, and the CSS
variables (`--font-serif`, `--font-sans`) are what Tailwind's `font-serif` /
`font-sans` utilities resolve to.

---

## 5. Bridging to Phase 2

Phase 2 (The Library & The Prologue) builds on top of this without modifying
any Phase 1 file except **adding keys to `copy.ts`**. It will add:

- `app/actions/stories.ts` — `createStory` (slugify + seed the 8 Afterword
  questions) and `updateStory` Server Actions, both using `supabaseAdmin()`
- `components/library/StoryTile.tsx` — with `shelfLift` from motion.ts
- `app/story/[slug]/page.tsx` — The Prologue, with `unfold` + `parallaxCover`
- The Library's empty `<section>` gets replaced with real tiles; the disabled
  "Begin a new chapter" button becomes a real form action

Nothing in auth, middleware, tokens, or the schema changes. If Phase 2 ever
asks you to edit `lib/auth.ts` or `schema.sql`, something's wrong — stop and ask.

---

## 6. If something breaks

| Symptom | Cause |
|---|---|
| `redirect_uri_mismatch` | Google Console redirect URI ≠ `http://localhost:3000/api/auth/callback/google` exactly |
| Signed in then instantly bounced | Email not in `ALLOWED_EMAILS`, or a space snuck into the list, or dev server wasn't restarted after editing .env.local |
| `MissingSecret` error | `AUTH_SECRET` empty in .env.local |
| Fonts fail to download during `npm run build` | No internet, or a proxy blocking fonts.googleapis.com — build machines need network for next/font |
| `Module not found: server-only` | Something client-side imported lib/supabase.ts — move that call into a Server Action; never delete the tripwire |
| Env changes not taking effect | Restart `npm run dev` — env is read at boot |
