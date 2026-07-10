// -----------------------------------------------------------------------------
// lib/copy.ts
//
// Every user-facing sentence in Ever After lives in this one file. This is the
// whole brand voice, centralized — if I ever hardcode English inside a
// component, that's a bug, not a shortcut. (Masterfile Rule 1: Ever After
// never speaks like software.)
//
// Phases 2-5 will keep adding keys here. Components only ever import `copy`.
// -----------------------------------------------------------------------------

export const copy = {
  brand: {
    name: 'Ever After',
    tagline: 'Every journey deserves an Ever After.',
  },

  signin: {
    eyebrow: 'Written one frame at a time',
    title: 'Ever After',
    lead: 'A storybook we write together.',
    google: 'Continue with Google',
    divider: 'or, someday',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    // The password form is decorative for now — real credentials auth is a
    // future phase. This note keeps Airhyl from being confused by a dead form.
    passwordSoon: 'Coming soon — use Google for now.',
    denied: "This story has two authors, and that account isn't one of them.",
  },

  library: {
    title: 'The Library',
    greeting: (name: string) => `Good to see you, ${name}.`,
    firstVisit: 'This is where every story you write together will live.',
    empty: 'Your story is waiting to begin.',
    begin: 'Begin a new chapter',
  },

  nav: {
    signOut: 'Close the book for now',
  },
} as const;

export type Copy = typeof copy;
