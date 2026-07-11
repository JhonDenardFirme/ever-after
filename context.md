# Ever After — Project Handoff for Claude Code

*This document preserves the mental model built across the conversation that
created this project. It is written so you can continue development with the
same understanding, reasoning, and constraints that shaped every decision so
far — not just the current file state.*

**A note on provenance before anything else:** this project was built
entirely inside a chat conversation with Claude (not Claude Code), phase by
phase, with every phase compiled and build-verified in a sandboxed
environment before being handed to the project owner (Denard) as a zip file
to unzip into his real repository. I do not have live access to his actual
repo. This document reflects the **last verified state I produced** — the
"Ever After 1.2 Foundation pass" zip. Between phases, the owner has twice
manually hand-edited or incompletely placed files instead of unzipping
wholesale, causing two real production bugs (documented in Part 7). **Treat
the actual repository as ground truth over this document wherever they
conflict** — but where they conflict, that conflict is itself important
signal (see Part 11).

---

## Part 1 — Executive Overview

**What this is.** Ever After is a private, two-person storybook web
application. It is not a photo album and not a trip planner — it is both of
those fused into one continuous act, told in one consistent brand language.
It was commissioned by Denard (a BS Computer Science student, frontend-
leaning) as an anniversary gift for his girlfriend Airhyl, timed to their
second anniversary (July 18) and a return trip to Tagaytay, Philippines
(July 19) — the same place they spent their first anniversary.

**The vision.** A couple's shared story — a trip, a season, a milestone —
becomes **a Fleeting Frames** (the product's core noun, doubling as its
name). Every Fleeting Frames opens with **The Prologue** (dedication,
epigraph, setting, theme), is planned and lived through **The Outline**
(a **Storyboard** of time-ordered beats, called **Moments** in the interface),
is documented one **Frame** (photo/video) at a time, and closes with
**The Afterword** — a signed, two-author reflection. The whole system is
built around one governing rule, stated in the project's brand bible and
enforced structurally, not just stylistically:

> **Ever After never speaks like software.**

**End goal.** A finished, deployed, mobile-responsive site the two of them
actually use — first for the July 19 trip, then indefinitely afterward as a
living archive. It is explicitly built for exactly two hardcoded users right
now, with the architecture (but not yet the implementation) aware that it
*could* generalize to other couples later.

**Current development stage.** Two work streams, sequentially:

1. **Phases 1–5 (complete, build-verified).** A working, deployable Next.js
   application: Google-only auth, The Library, The Prologue, The Storyboard,
   Frame Wall + Timeline views, The Afterword, and a print/PDF export route.
   This is real, tested, shippable code — not a prototype.
2. **"Ever After 1.2" (in progress).** After using the Phase-5 app, the owner
   requested a substantial visual and UX redesign across every surface, plus
   several missing technical features (video upload, multi-select, bulk
   delete) and one real bug (`media_type` column missing from the live
   database). This was broken into a **Foundation pass** (shipped, build-
   verified — fixes the bug, adds video/multi-select/bulk-delete, ships a new
   color palette, renames "beat" to "Moment" in copy) followed by **five
   planned passes** (Library hero/profile, Prologue rework + Spotify player,
   a new photo-feed "Story" section with masonry/lightbox/categories, The
   Outline folded into the main page as a section, and an Afterword rebuild
   with a new four-section question bank). **Only the Foundation pass is
   built. Passes 2–6 are planned in detail but not yet implemented** — this
   is very likely where your work picks up.

**Major systems that already exist:** Next.js 14 App Router app; NextAuth v5
Google-only authentication; Supabase Postgres (6 tables) + Storage (1
bucket); a Server Actions layer, every action guarded by a shared
`requireAuthor()` check; a centralized copy/string system (`lib/copy.ts`); a
named motion-variant system (`lib/motion.ts`) built on Framer Motion;
client-side image/video compression and dimension capture before upload; a
print stylesheet acting as the PDF export mechanism.

**Immediate objective:** most likely, executing 1.2 Pass 2 onward (see the
plan file referenced in Part 8), *or* diagnosing a state-mismatch bug of the
kind described in Part 7 if the owner's manual file placement has drifted
from what was actually delivered.

---

## Part 2 — Project Philosophy

### Why the brand vocabulary exists, and why it's enforced in code

The project began as a simple anniversary form and grew, through extensive
collaborative brainstorming, into a full product with its own dictionary:
*Fleeting Frames, Chapters/Moments, Frames, The Prologue, The Outline, The
Storyboard, Waiting Frames, develop, The Keepsake, The Afterword,
Signatures.* This is not decoration. The reasoning: a memory-keeping app for
two people competes emotionally with generic tools (Google Photos, a shared
folder) that are functionally identical. The differentiator is that using
Ever After should *feel* like writing and reading a book together, not like
operating software. Every copywriting decision — button labels, empty
states, error messages, deletion confirmations — was written to support that
feeling, and centralized into one file (`lib/copy.ts`) specifically so that
voice can never erode through a stray hardcoded string in a component.

### The DB-speaks-English, UI-speaks-brand split

A deliberate, load-bearing architectural decision: **database tables,
columns, and internal code identifiers use plain, boring engineering names**
(`stories`, `chapters`, `frames`, `status`) while **all user-facing text uses
the brand vocabulary**, sourced exclusively from `lib/copy.ts`. A `chapters`
row is called "a Chapter" in code comments and "a Moment" in the interface —
this is intentional, not drift (see Part 6 for why this specific pair is
worth extra caution). The reasoning: schema and logic must stay
maintainable and greppable for a developer; brand voice must stay editable,
swappable, and centrally auditable, without those two concerns ever fighting
each other in the same identifier.

### The "planner IS the album, unfilled" insight

This is the single most important structural decision in the whole data
model. Early in planning, there was a temptation to build two systems: a
trip planner and a photo album, syncing between them. Instead: **a Waiting
Frame is not a different kind of object — it is a `frames` row with
`status='waiting'` and no `media_url`.** Filling it in ("developing" it)
doesn't move it from one system to another; it just fills in columns that
were null. This means The Outline and the Frame Wall are *the same query,
filtered differently* — there is no synchronization problem, because there
was never a second system to synchronize with.

### UX philosophy: silence as a feature

Two competing instincts exist in typical app UX: confirm every action
("Saved!", a toast, a checkmark), or stay silent and trust the interface.
Ever After chose deliberately and explicitly: **captions, field edits, and
most saves are silent.** No toast when a caption saves. The "confirmation"
for an Afterword answer is that your signature (name + date) appears beneath
it — the artifact itself is the receipt. Silence is reserved for low-stakes,
frequent actions; **loud, explicit, two-step confirmation is reserved
specifically for anything destructive** (deleting a Frame, deleting a
Moment/Chapter, bulk-deleting a selection). The copy for those moments is
deliberately heavy: *"This Frame will be gone for good — not just from this
story, from everywhere. Are you sure?"* This asymmetry (silent for routine,
loud for destructive) is a philosophy, not an inconsistency — it was chosen
so that the *rare* moment of real weight isn't diluted by routine noise.

### Technical philosophy: fail toward invisible waste

Established while building uploads and deletes, and treated as a standing
principle for any future feature that touches both a database row and an
external resource (a Storage object, in this case; potentially anything
else later): **when an operation can partially fail, always structure it so
the failure mode is invisible waste, never visible breakage.** Uploading
writes the Storage object *first*, then the database row — if the row insert
fails, the orphaned Storage object is deleted immediately, because a Frame
"existing" with no working image would be visible breakage. Deleting removes
the database row *first*, then the Storage object — if the Storage delete
fails, you've leaked a few hundred KB nobody will ever see, which is
categorically better than a row pointing at a URL that 404s.

### What should never be changed without a very deliberate, documented decision

- **`requireAuthor()` at the top of every Server Action, no exceptions.**
  Next.js middleware protects page routes; it does **not** protect Server
  Actions, which are public POST endpoints with generated IDs. This was
  discovered and fixed explicitly during development and is the single
  security boundary the entire app relies on.
- **The upload/delete ordering discipline** described above.
- **The "DB plain English / UI branded" split.**
- **Deny-all RLS + service-role-only access.** This is intentional for a
  two-user app, not a misconfiguration — see Part 4 and Part 7 for the full
  reasoning and the explicit migration path for if this ever needs to change.
- **`lib/beats.ts`'s ordering rule and its purity.** Timed items sort by
  clock; untimed items sort last by `sort_order`; timed items are
  deliberately *not* draggable in the UI, because a timed item's position
  is a function of its time — allowing a drag to override that would let
  visual order silently disagree with actual chronology.

### Tradeoffs intentionally chosen (and why)

| Chosen | Rejected | Why |
|---|---|---|
| NextAuth v5 JWT sessions, no DB adapter, flat email allowlist | Supabase Auth + RLS-based multi-tenancy | For exactly two known users, two identity systems is pure overhead. Documented migration path exists for if this changes. |
| Supabase Storage | Google Drive | Drive has no clean public URLs, no CDN, and OAuth-per-read overhead. Explicitly rejected early and never revisited. |
| Print stylesheet (Cmd/Ctrl+P → Save as PDF) | A PDF-generation library or headless-Chrome service | Gets ~90% of a photo book for zero new infrastructure and zero new dependencies. Explicitly scoped as "good enough for Day 3," with the heavier options named as a future path if ever needed. |
| Client-side image compression + dimension capture | Server-side processing (e.g. `sharp`) | The server never needs to hold a full-size image in memory; avoids a dependency just to read two integers. |
| Sequential (not parallel) multi-file upload | Parallel upload with progress bars per file | Keeps `sort_order` sane, avoids stranding in-flight requests on a mid-batch failure, and allows an honest "Uploading N of M" label instead of a fake aggregate progress bar. |
| Reusing `frames.prompt_text` as a de facto category/group label for "sets" | A new `frame_sets` table | Zero schema cost, ships in the Foundation pass instead of needing a migration. Explicitly a deliberate reuse, not an oversight. |

---

## Part 3 — Architecture

### 3.1 Application shell

- **`app/layout.tsx`** — root HTML shell. Loads two Google Fonts via
  `next/font` (self-hosted, no runtime request): **Instrument Serif** for
  anything the *story* says (titles, Prologue prose, Afterword answers) and
  **Jost** for anything the *interface* says (buttons, labels, nav). This
  typographic split is the visual expression of the DB/UI language split in
  Part 2. `robots: { index: false }` — this is a private site, deliberately
  unindexed.
- **`app/globals.css`** — Tailwind directives, a fixed SVG turbulence-noise
  texture overlay at ~3.5% opacity (a paper-grain effect, zero network
  requests), a global `:focus-visible` violet ring, custom text-selection
  color, and (added in Phase 5) a full `@media print` stylesheet.
- **`middleware.ts`** — re-exports `auth` from `lib/auth.ts` as Next
  middleware. Protects every route except `/signin` and `/api/auth/*`.
  **Does not and cannot protect Server Actions** — see 3.3.

### 3.2 Auth (`lib/auth.ts`)

NextAuth v5, Google provider only, JWT session strategy (no database
adapter — the session lives entirely in a signed cookie). Two-layer
authorization:

1. The `signIn` callback checks the authenticating email against
   `ALLOWED_EMAILS` (a comma-separated env var). Fails → redirected to
   `/signin?error=AccessDenied`.
2. Every Server Action independently calls `requireAuthor()`
   (`lib/guard.ts`), which re-checks the session **and** looks up a matching
   row in the `authors` table by email, returning the full `Author` record
   (used for attribution — e.g., `authored_by` on a Waiting Frame). Throws
   if either check fails.

`authors` is a two-row table, seeded by hand in `schema.sql`. There is no
signup flow. Emails must match in three places for a person to be able to
use the app at all: `ALLOWED_EMAILS`, the `authors` table, and — for local/
prod Google OAuth to even authenticate them — the Google Cloud Console
OAuth consent screen's **Test users** list (the app has never been submitted
for Google verification, so it stays in Testing mode indefinitely).

### 3.3 Data access layer

**Reads** (`lib/queries.ts`, marked `server-only`) — a set of `async`
functions Server Components call directly (`await getStories()`, etc.),
using a single shared Supabase client (`lib/supabase.ts`) instantiated with
the **service-role key**. This client bypasses RLS entirely. `server-only`
is imported specifically so that if any client component ever tries to
import `lib/supabase.ts` (even transitively), **the build fails on
purpose** — this is the mechanism that guarantees the service-role key can
never reach a browser.

**Writes** (`app/actions/*.ts`, each file starting with `'use server'`) —
Server Actions, one file per domain (`stories.ts`, `chapters.ts`,
`frames.ts`, `afterword.ts`). Every action follows the same shape:

```
export async function someAction(...): Promise<Result<T>> {
  return attempt(async () => {
    const author = await requireAuthor();   // the security boundary
    // ...validate, mutate via supabaseAdmin()...
    revalidatePath(...);                    // tell Next this data is stale
    return { ok: true, data: ... };
  });
}
```

`Result<T>` and `attempt()` (`lib/guard.ts`) standardize this: actions never
throw across the client boundary, they return `{ ok: true, data }` or
`{ ok: false, error }`, and components render `error` inline rather than
crashing.

### 3.4 Domain modules (pure logic, framework-agnostic)

- **`lib/beats.ts`** — the Moment-ordering rule (see Part 2), plus
  `toLocalInputValue` / `fromLocalInputValue`, which convert between
  Postgres's UTC `timestamptz` and `<input type="datetime-local">`'s
  local-time string format. This conversion was **unit-tested against
  Asia/Manila** during development specifically because a naive
  `.toISOString()` shift is the classic silent "my 4pm event shows as 8am"
  bug.
- **`lib/purge.ts`** — deletes every Frame (row + Storage object) belonging
  to a Chapter, called **before** the Chapter row is deleted. This exists
  because `frames.chapter_id` is `ON DELETE SET NULL`, and a Frame has
  **no other path** back to its story (no `story_id` column) — without this
  helper, deleting a Chapter would silently orphan its Frames into
  permanently unreachable rows plus leaked Storage objects. This was a real
  bug found and fixed during Phase 4; see Part 7.
- **`lib/slug.ts`** — pure string slugification for story URLs.
- **`lib/motion.ts`** — six named Framer Motion variants (`develop`,
  `pageTurn`, `shelfLift`, `unfold`/`unfoldContainer`/`unfoldItem`,
  `ribbon`, `parallaxCover`) plus `useEverMotion()`, a wrapper that
  collapses any variant to an instant, motionless state under
  `prefers-reduced-motion`. **Exception:** `ribbon` uses Framer's
  `layoutId` mechanism, which animates *outside* the variant system, so it
  required its own explicit `useReducedMotion()` check — easy to miss with
  any future `layoutId` usage.

### 3.5 Route map (App Router)

```
/                                  redirect -> /library
/signin                            Google button + a decorative, disabled
                                    password form ("Coming soon")
/library                           The Library — story tiles, "Begin a new
                                    chapter"
/story/[slug]                      The Prologue — cover, title, dates,
                                    setting, theme, dedication, epigraph,
                                    description, soundtrack (all inline-
                                    editable); links out to the three
                                    sub-pages below
/story/[slug]/storyboard           The Outline / Storyboard — beat timeline,
                                    beat editor, Frame List (Waiting Frames)
                                    *** planned to become a page SECTION
                                    in 1.2 Pass 5, with this route turning
                                    into a redirect ***
/story/[slug]/frames               Frame Wall / Timeline toggle — the
                                    developed Frame gallery, upload,
                                    selection + bulk delete
                                    *** planned to be substantially
                                    reworked/absorbed in 1.2 Pass 4 ***
/story/[slug]/afterword            The Afterword — 8 seeded questions
                                    (soon a 4-section bank per 1.2 Pass 6),
                                    two-author signed answers side by side
/story/[slug]/print                Print/PDF export — plain <img>, no
                                    next/font transforms, @media print CSS
/api/auth/[...nextauth]            NextAuth's handler
```

`app/story/[slug]/template.tsx` wraps every story sub-route (not
`layout.tsx` — a layout persists across sibling navigation and would only
fire its enter animation once, ever; a template remounts every navigation)
and applies the `pageTurn` motion — except on `/print`, which the template
explicitly detects via `pathname.endsWith('/print')` and renders raw,
because CSS transforms and print pagination conflict.

### 3.6 Data flow (typical read)

```
Server Component (e.g. app/library/page.tsx)
  -> await getStories()                [lib/queries.ts]
    -> supabaseAdmin().from('stories').select('*')   [service-role, bypasses RLS]
  -> renders <StoryTile> per row
```

### 3.7 Data flow (typical write)

```
Client Component (e.g. BeginChapter.tsx)
  -> user action -> calls Server Action directly (createStory(title))
    -> requireAuthor()                              [lib/guard.ts]
    -> supabaseAdmin().from('stories').insert(...)
    -> revalidatePath('/library')
  -> useTransition's isPending drives a loading state
  -> on success: router.push() to the new route, OR the revalidated
     Server Component re-renders with fresh data on next paint
```

### 3.8 State flow

The app is overwhelmingly **server state** — most pages are
`force-dynamic` Server Components with no client-side cache. Client-side
`useState` is used narrowly and consistently for: view toggles (Frame Wall
vs. Timeline), selection sets (`Set<string>` of selected Frame IDs during
bulk delete), local drafts of editable fields (saved on blur via a Server
Action, then reconciled against the server's confirmed value), and upload
progress labels. There is no global client state manager (no Redux/Zustand/
Context store) — this was never needed given how little client state exists.

---

## Part 4 — Major Decisions

*(Condensed from Part 2/3's fuller reasoning — this section is the quick
reference; read Part 2 for the "why" in full.)*

| Decision | Alternatives considered | Why this won |
|---|---|---|
| Deny-all RLS + service-role-only writes, authorization via a flat email allowlist | Full Supabase Auth + per-couple RLS policies | Two users, known in advance, hardcoded. RLS-based multi-tenancy is real engineering effort with zero payoff at this scale. Explicit migration path documented for later. |
| A Waiting Frame is a `frames` row (`status='waiting'`), not a separate table/type | A separate `planned_frames` or `prompts` table, synced into `frames` on fulfillment | Eliminates an entire sync-bug category. "The planner IS the album, unfilled" is the product's core mechanic, not just an implementation shortcut. |
| No `frames.story_id`; a Frame reaches its story only via `chapter_id` | Add `story_id` from the start, allow "loose" Frames unattached to any beat | Simplicity for the 5-phase build. **This decision is now being reversed** — 1.2's planned migration 1.2-C adds `frames.story_id`, specifically because the Afterword rebuild needs a Keepsake-via-independent-upload flow that doesn't fit through a Chapter. |
| Print stylesheet instead of a PDF library | `@react-pdf/renderer`, headless Chrome | Zero new dependencies, "good enough" bar explicitly set for a 3-day build; heavier options named as a future path if ever needed, not rejected outright. |
| `requireAuthor()` called independently inside every Server Action | Relying on middleware alone | **Middleware does not protect Server Actions.** This was identified as the single most important security fact of the whole project and repeated in every phase's guide. |
| Sequential multi-file upload (1.2) | `Promise.all()` parallel upload | Keeps `sort_order` coherent, survives partial failure gracefully, allows honest progress copy. |
| `frames.prompt_text` reused as a category/set label (1.2) | A new `frame_sets` or `categories` table | Zero-migration feature delivery; the existing column already meant "what this Frame is/was about." |
| Video support added via a `media_type` column + a hard 50MB client+server size cap | Full media-type-specific pipelines (thumbnailing, transcoding) | Scale-appropriate: "I will manually instruct my girlfriend to reduce uploading videos... sooner we will implement actual rate limiting" (the owner's own words) — a hard cap now, a real solution deferred deliberately. |
| New violet palette (`#5115AB` primary / `#350E70` deep) with brightened ember (`#F97316`) and `shadow-glow` tokens | Keeping the original softer violet/beige ratio | Owner-directed aesthetic revision after seeing the built product; ember was brightened specifically because the original hue couldn't hold visual weight against the new, more saturated violet. |

---

## Part 5 — Features

### Shipped, Phases 1–5 (stable, build-verified)

| Feature | Status | Notes |
|---|---|---|
| Google-only auth, allowlisted | Done | See Part 3.2 for the three places an email must match |
| The Library | Done | Story tiles, empty state, "Begin a new chapter" |
| The Prologue | Done | All fields inline-editable, saves on blur, no confirmation |
| The Storyboard | Done | Beat timeline, ordering rule, timed beats non-draggable, drag-reorder for untimed beats only |
| Frame List (Waiting Frames) | Done | Attribution (`authored_by`), safe deletion (`.eq('status','waiting')` guard) |
| Frame Wall | Done | Bento grid, uniform tile aspect ratio, Keepsake gets a larger tile |
| Timeline view | Done | Grouped by Chapter, Frames keep natural aspect ratio |
| Frame upload | Done (1.2 extended) | Client compression + dimension capture; 1.2 added video + multi-select |
| Captions | Done | Silent save, no confirmation |
| The Keepsake | Done | One per story; settable manually or via Afterword Q1; adopts as cover if none set |
| Frame deletion | Done (1.2 extended) | Two-step confirm, heavy copy; 1.2 added bulk multi-select delete |
| The Afterword | Done (1.2 will replace the question bank) | 8 seeded questions, two-author signed answers side by side, `unique(question_id, author_id)` prevents collision |
| Print / "Develop this Fleeting Frames" | Done | `@media print`, plain `<img>`, excludes videos, no nav |
| pageTurn / motion system | Done | Six named variants, reduced-motion aware (with the `ribbon` caveat) |

### Shipped, "1.2 Foundation pass" (built, build-verified)

| Feature | Status | Notes |
|---|---|---|
| `media_type` column | Fixed | `supabase/migration-1.2.sql` — **must be run on the live DB before uploads work** |
| Video upload | Done | 50MB hard cap, client + server enforced |
| Multi-select upload | Done | Sequential, ordered, per-file progress label |
| Sets via `prompt_text` inheritance | Done | First file fills the Waiting Frame; subsequent files inherit its prompt as a group label |
| Bulk selection + delete | Done | Selection mode toggle, fixed bottom bar, confirm modal scaled to N |
| New palette | Done | `#5115AB` / `#350E70` / brightened ember `#F97316` / `shadow-glow` tokens |
| "Moment" renaming | Done | UI copy only — DB/code still says `chapters`/`beat` |
| "Upload pictures" label | Done | Explicit owner override of the brand bible's "never say upload" rule |

### Planned, NOT YET built — "1.2 Passes 2–6"

Full detail lives in `EVERAFTER-1.2-PLAN.md` inside the delivered zip. Each
pass has its own copy-paste prompt in that file, mirroring how Phases 1–5
were originally built and verified one at a time.

| Pass | Feature | Requirements/constraints from the owner | Migration |
|---|---|---|---|
| 2 | Library redesign | Couple hero (editable, CRUD, edit-icon → form → save → view-mode), profile menu upper-right (Google avatar default, uploadable), bigger/"luxurious" story tiles, section descriptions, footer | 1.2-B: `authors.avatar_url`, new single-row `couple` table |
| 3 | Prologue rework | View-mode by default (only filled fields show), small edit icon restores the full form; Epigraph centered on a multiply-blended banner image with Dedication as subtext, ~80% content width; gradient title treatment; cover upload; Spotify soundtrack player (link-in, themed spinning half-disc, autoplay attempt with graceful fallback, pausable); relocate the Develop/print button from Afterword to the page foot | none |
| 4 | "The Story" section (photo feed) | Orientation-aware masonry, even spacing, no photo too big/small; hover zoom clipped to frame ("magnifying glass" effect); click → lightbox modal (X or click-outside closes); grouped by set (`prompt_text`) with styled category headers; **unlabeled Frames render last, with no header** (explicitly not labeled "Uncategorized"); per-set upload; violet gradient multiply at photo bottoms; rounded corners throughout; click → details panel (uploader, date — existing schema fields only, explicitly "don't overengineer this") | none |
| 5 | The Outline as a page section + shareable Invitation | Folds `/storyboard` into the main page as a section with a violet/parallax hero; `/storyboard` route becomes a redirect (**named breaking change**, mitigated); horizontal scroller in edit mode when long, infinite auto-scroll in view mode; delete becomes an icon button; new read-only shareable "invitation" view of the Storyboard | none |
| 6 | Afterword rebuild | Four-section question bank (Keepsake / Looking Back / Looking Within / Looking Ahead — full text in the plan file and in the owner's original request, reproduced in Part 6); rating/multiple-choice-style answers alongside free text; Keepsake becomes an **independent upload form** (not a picker from existing Frames) that writes a story-level Frame; own page with a hero + photo carousel; answers save independently per author, visible to the other on refresh; on the main page, answered reflections interleave between photos as photo-sized cards (answered-only, dynamically placed); the one-word question's two answers display together just above the Develop button, at the page's foot | 1.2-C: `afterword_questions.section text`, extend `answer_kind` check to include `'rating'`, **`frames.story_id uuid`** (reverses the Part 4 decision, specifically to let a Keepsake-upload Frame exist without belonging to a Chapter) |

### Explicitly considered, explicitly NOT part of any current plan

These appear in **early planning documents** (`ever-after-masterfile.md`,
`ever-after-dev-guide.md` — written before implementation began) as
aspirational vision, but were cut from the actual 5-phase scope and have
**not** been re-added to the 1.2 plan either. Treat these as background
context, not a to-do list, unless the owner explicitly asks for them again:

- Thematic (non-chronological) Fleeting Frames and a `story_frames`
  many-to-many join table (one Frame belonging to multiple stories)
- **Rediscover** ("on this day" resurfacing)
- **Milestones** (aggregate stat counters — "42 Frames Preserved" etc.)
- **Invite to Read** (public read-only share links via a `share_token`)
- Full multi-couple account support (see the migration path in Part 7)
- **"The Spine"** — a shelf-browsing metaphor for The Library, explicitly
  parked in the original brand bible as "noted so it isn't reinvented under
  a different name later"

---

## Part 6 — Domain Knowledge

No prior knowledge assumed. Every term below is either the brand vocabulary
or a technical concept specific to this project.

### Brand vocabulary → implementation mapping

| Term (UI copy) | Means | Backing implementation |
|---|---|---|
| **Ever After** | The brand/product itself | — |
| **The Library** | The home page, listing every story | `/library` |
| **a Fleeting Frames** | One story (grammatically singular despite the plural word — "start a Fleeting Frames") | One row in the `stories` table |
| **The Prologue** | A story's opening/metadata section | Columns on `stories`: `title`, `starts_on`, `ends_on`, `setting`, `theme`, `dedication`, `epigraph`, `description`, `soundtrack`, `cover_frame_id` |
| **The Outline** | The planning mode as a whole concept | Not a table — a UI concept encompassing the Storyboard + Frame List |
| **The Storyboard** | The time-ordered sequence of beats within a story | Rows in `chapters`, rendered via `lib/beats.ts`'s ordering rule |
| **a Chapter** / **a Moment** | One beat/section of a story (a day, a place, an event) | ⚠️ **One row in the `chapters` table.** Code/DB says "Chapter"; as of 1.2, ALL user-facing copy says "Moment." Same object, two names by design — see the callout below. |
| **the Frame List** | The Waiting Frames attached to a story's beats | Rows in `frames` where `status = 'waiting'` |
| **a Frame** | One photograph or (as of 1.2) video | One row in the `frames` table |
| **a Waiting Frame** | An unfilled prompt — a Frame that hasn't happened yet | A `frames` row with `status='waiting'` and `media_url` null |
| **to develop** | (a) filling a Waiting Frame with real media, or (b) exporting a whole story to print | Same darkroom-film metaphor, two scales. (a) = `developFrame` action; (b) = the `/print` route, labeled "Develop this Fleeting Frames" |
| **The Keepsake** | The one Frame that represents a whole story | `stories.keepsake_frame_id` |
| **The Afterword** | The post-story reflection questionnaire | `afterword_questions` + `afterword_entries` |
| **a Signature** | An Afterword answer's attribution — author name + date | `afterword_entries.author_id` + `.created_at`, rendered as "— Denard, 19 July 2026" |
| **Frame Wall** | The bento-grid photo view | A rendering mode within `/story/[slug]/frames` |
| **Timeline** (as a view name) | The chronological, Chapter-grouped photo view | The other rendering mode on the same route |
| **Setting** | A location tag | `text` column on both `stories` and `chapters` (and optionally overridden per-Frame) |
| **Theme** | A single evocative word/phrase describing a story's feeling | `stories.theme` — settable in the Prologue, or by the Afterword's one-word question **only if it was previously unset** |

> **⚠️ Naming collision to know about, and a second one actively forming.**
> 1. **"Chapter" vs. "Moment"** is an intentional DB/UI split (Part 2), but
>    it means grepping the codebase for "Moment" will find nothing — you
>    have to know to look for "Chapter" or "beat" in code, and "Moment" only
>    in `lib/copy.ts` string values and rendered UI text.
> 2. **"Story" is becoming genuinely overloaded.** The original brand
>    vocabulary uses "a Fleeting Frames" as the noun for one story — "Story"
>    was never meant to be a primary noun. But the owner's 1.2 feedback
>    introduces **"The Story"** as the name for a specific *section* within a
>    Fleeting Frames page (the photo feed, built in Pass 4). Meanwhile the
>    codebase already uses "story" pervasively as a variable/parameter name
>    (`storyId`, `getStoryBySlug`, the `stories` table itself) to mean "a
>    Fleeting Frames." **This is a real ambiguity, not yet resolved.**
>    Recommend surfacing this to the owner before or during Pass 4 — e.g.,
>    should the new photo-feed section be internally named something else
>    (`StorySection`, `PhotoFeed`) even if its UI label reads "The Story," to
>    keep `storyId` unambiguous in code? Do not silently invent a resolution;
>    ask.

### The Afterword's planned four-section question bank (Pass 6, verbatim from the owner)

Preserved in full since it is real content, not a paraphrase:

**1. The Keepsake** — "The chapter begins by choosing the one Frame that best
represents the story." Prompt: *Which Frame tells this chapter best?*
Becomes The Keepsake.

**2. Looking Back** — "These prompts revisit the events themselves. They ask,
'What happened?'" Prompts: *What surprised you the most? What made you laugh
the hardest? What almost didn't happen? What small moment became
unexpectedly meaningful? What moment almost didn't become a Frame?*

**3. Looking Within** — "The emotional heart of Ever After. Rather than
remembering places, it remembers people." Prompts: *When did you feel
closest to me? What's one thing you noticed that I might have missed? What
made this chapter feel like us? What's one thing you're grateful for from
this chapter? What's a moment no camera could have captured? What's
something you wish we'd said out loud?*

**4. Looking Ahead** — "Memories become more meaningful when they're written
for the future." Prompts: *What should our future selves remember from
today? Years from now, what do you hope this chapter reminds you of? What
would you never want to change about this chapter? What's one tradition
from this chapter you'd love to repeat?*

Plus: lighter-weight answer formats alongside free text (ratings, easy
multiple-choice-style questions) — "make sure everything is laid out
beautifully" was the owner's explicit design bar for this, not just a
functional requirement.

### Technical concepts specific to this project

- **Server Action guard pattern**: `requireAuthor()` + `attempt()` +
  `Result<T>` (`lib/guard.ts`). Every mutation follows this shape. See
  Part 3.3.
- **The ordering rule** (`lib/beats.ts`): timed Chapters sort chronologically;
  untimed Chapters sort last, among themselves by `sort_order`; only untimed
  Chapters are drag-reorderable in the UI.
- **The purge pattern** (`lib/purge.ts`): deleting a parent that a child
  reaches its grandparent *only through* must explicitly cascade-delete the
  child first, including any external resources (Storage objects) — because
  `ON DELETE SET NULL` alone silently orphans rather than cleanly removing.
- **The upload/delete ordering discipline**: "fail toward invisible waste."
  See Part 2.
- **`useEverMotion()`**: the reduced-motion-aware wrapper around every
  Framer Motion variant except `layoutId`-based ones (`ribbon`), which need
  a manual `useReducedMotion()` check because `layoutId` operates outside
  the variant system entirely.
- **`template.tsx` vs. `layout.tsx`**: a Next.js App Router distinction —
  layouts persist across sibling-route navigation (children never remount);
  templates remount on every navigation. `pageTurn` motion requires a
  template specifically because it needs to *replay* on every story
  sub-route change.

---

## Part 7 — Existing Problems

### Blocking, must fix before anything else works

1. **`media_type` column may still be missing from the live database.**
   The Foundation-pass code writes to `frames.media_type`; the *original*
   `schema.sql` never created it. `supabase/migration-1.2.sql` fixes this,
   and `schema.sql` has been updated in sync so fresh installs won't drift
   again — **but this only takes effect once the migration is actually run
   against the live Supabase project.** If uploads are failing with
   `"Could not find the 'media_type' column,"` this is why. Verify first.

### Process risk (not a code bug, but has caused real code bugs twice)

2. **The owner has, at least twice, manually hand-placed or hand-edited
   generated files instead of unzipping delivered zips wholesale.** Both
   incidents caused real production failures: (a) a hand-shaped `lib/copy.ts`
   missing the `DEFAULT_AFTERWORD_QUESTIONS` export and several `prologue.*`
   keys the components actually imported, which failed the TypeScript build
   silently enough in dev mode that a button appeared present but never
   hydrated (looked like "the button is disabled" — it was actually "the JS
   bundle never finished compiling so no `onClick` ever attached"); (b) an
   entirely unreplaced Phase-1 placeholder `app/library/page.tsx` (complete
   with a hardcoded, permanently-`disabled` button) sitting underneath an
   otherwise-current `copy.ts`. **If you observe behavior that contradicts
   this document or contradicts what a given phase's guide says should be
   true, suspect a stale/partially-replaced file before suspecting a logic
   bug.** Diff the actual file against what the relevant `PHASE*-GUIDE.md`
   or `EVERAFTER-1.2-PLAN.md` describes before making a code change.

### Known gaps / deferred work

3. **No way to move a Frame between Chapters/Moments once uploaded.** New
   Frames land on the last beat in Storyboard order; there's no "reassign"
   action. Flagged repeatedly as a "ten-line action whenever it starts to
   hurt," never built.
4. **`frames` has no `story_id`; a Frame is unreachable except through a
   Chapter.** This is *why* "loose"/multi-story Frames don't work — noted
   as impossible in Phase 3/4, and it's exactly what migration 1.2-C exists
   to fix, driven by the Afterword rebuild's independent-upload Keepsake
   requirement.
5. **`reorderChapters` issues one `UPDATE` per row** (no bulk upsert-by-id
   via PostgREST). Fine at a handful of beats per story; would need a
   Postgres RPC function if a story ever has dozens.
6. **No `loading.tsx` anywhere.** Every story route is `force-dynamic`.
   Acceptable at two-user scale; flagged as trivial to add later.
7. **Spotify autoplay (planned, Pass 3) will very likely be blocked by
   browser autoplay policies** requiring a user gesture first. This was
   flagged *before* the feature was built, not discovered after.
8. **"Upload pictures" as a button label directly contradicts the brand
   bible's own stated copywriting rule** ("never say upload — say develop,
   preserve, keep"). This was an explicit owner instruction that overrode
   the rule; it was implemented as asked, and flagged rather than silently
   complied with or silently overridden.

### Structural facts that look like bugs but are deliberate — do not "fix" without discussion

9. **RLS is enabled on every table with zero policies.** This means the
   `anon` key can read and write *nothing* — by design. All access goes
   through the service-role key server-side. Do not add permissive RLS
   policies to "make the anon key work" without understanding this replaces
   the entire security model with a different one (see the migration path
   below).
10. **Authorization is a flat two-email allowlist**, cross-checked against a
    hand-seeded `authors` table with no signup flow. This is intentional
    for the current two-user scope.

### The documented migration path, if multi-couple support is ever requested

(Preserved from earlier planning, for context — **not currently planned
work**, see Part 5's "explicitly not part of any current plan" list.) Add
`couples` and `couple_members` tables; add `couple_id` to `stories` and
`frames`; switch NextAuth to use a database adapter so `auth.uid()` exists
in Postgres; replace deny-all RLS with real per-`couple_id` policies; switch
every query from the service-role key to the anon key + user JWT; namespace
Storage paths by `couple_id`. Roughly two days of real work, explicitly
scoped as "everything else in this codebase survives unchanged, provided you
never let brand copy leak out of `lib/copy.ts` and never let a query assume
there's exactly one story."

---

## Part 8 — Future Roadmap

### Immediate (blocking)

1. Confirm `supabase/migration-1.2.sql` has been run against the live
   database. If unsure, re-run it — it's written to be idempotent.
2. Confirm the actual repository matches the Foundation-pass file list in
   this document (Part 9 gives you the exact list). Diff before assuming.

### Short-term (the committed, planned work)

Execute `EVERAFTER-1.2-PLAN.md`'s Passes 2 through 6, **in order**, each
build-verified before moving to the next — this is explicitly how every
prior phase of this project was built, and the owner's own acceptance
criterion ("everything must work exactly as intended") is the reasoning for
staying sequential rather than attempting a single large regeneration:

1. Pass 2 — Library redesign (+ migration 1.2-B)
2. Pass 3 — Prologue rework + Spotify player
3. Pass 4 — The Story section (masonry/lightbox/categories) — **resolve the
   "Story" naming collision (Part 6) before or during this pass**
4. Pass 5 — Outline-as-section + shareable Invitation (breaking:
   `/storyboard` becomes a redirect)
5. Pass 6 — Afterword rebuild (+ migration 1.2-C, including `frames.story_id`)

### Medium-term (opportunistic, not currently scheduled)

- Move-Frame-between-Moments action
- `reorderChapters` bulk RPC, if beat counts ever grow large
- `loading.tsx` states, if pages ever feel slow at real usage
- A real fallback UX for blocked Spotify autoplay

### Long-term (directional only, not committed)

- Multi-couple support per the documented migration path (Part 7)
- Rediscover, Milestones, Invite to Read, richer Signatures, "The Spine" —
  all previously-scoped-out ideas from the original brand bible, revivable
  if the owner asks

**Reasoning behind this ordering:** short-term work is the owner's own
explicit, detailed, already-planned request — it takes priority over
anything self-directed. Medium-term items are debt that's known and
tolerable at current scale; fix opportunistically, don't go looking for
reasons to prioritize them. Long-term items are vision-stage and should
only be picked up if the owner raises them again — resist the temptation to
"complete the original vision" unprompted, since the vision documents
themselves (`ever-after-masterfile.md`, `ever-after-dev-guide.md`) predate
implementation and were deliberately narrowed during the actual build.

---

## Part 9 — Repository Reading Instructions

Read hierarchically, in this order, before forming any opinion about the
codebase:

1. **`EVERAFTER-1.2-PLAN.md`** first, if present — it tells you what's
   already shipped vs. planned, more precisely than inference from file
   dates could.
2. **`supabase/schema.sql`**, then **`supabase/migration-1.2.sql`** — the
   real, ground-truth data model. Cross-check against Part 3's schema
   description above; if they disagree, the live files win, but treat the
   disagreement as a signal worth flagging back to the owner.
3. **`lib/types.ts`** — should mirror the schema column-for-column. A
   mismatch here is a strong signal of drift (see Part 7, problem #2).
4. **`lib/copy.ts`** — read the whole file. This is the single richest
   source of "what does this app actually say and do," often more current
   and complete than any planning document, since every phase's real
   feature additions landed here.
5. **`lib/guard.ts`, `lib/beats.ts`, `lib/purge.ts`, `lib/motion.ts`** — the
   pure/shared logic layer. Small, dense, load-bearing. Read in full.
6. **`app/actions/*.ts`** — the mutation surface. Each file corresponds to
   one domain; read them in dependency order (`stories.ts` →
   `chapters.ts` → `frames.ts` → `afterword.ts`, matching build order).
7. **`app/story/[slug]/*`** and **`components/*`** — the presentation
   layer, last. By the time you read these, you should already understand
   *why* they're shaped the way they are from steps 1–6.
8. **`PHASE1-GUIDE.md` through `PHASE5-GUIDE.md`** — each is a "what
   changed, why, how to verify, what could break" document written
   immediately after that phase's code, during the same work session. These
   are unusually reliable — treat them as close to first-party
   documentation, not as stale notes.

**Classification, so you don't waste time:** there is no prototype code, no
experiments, no deprecated code, and no generated code (beyond
`next-env.d.ts`, which is genuinely auto-generated and untouched) anywhere
in this repository. Every file that exists was deliberately built,
build-verified, and is currently either in active use or awaiting the next
planned pass. The only exception is that `ever-after-masterfile.md` and
`ever-after-dev-guide.md`, **if you find them in the repo**, are pre-
implementation planning documents that describe a broader vision than what
was actually built — treat them as historical/aspirational context, not as
a spec to reconcile the code against (see Part 4 and Part 7).

**Entry points:** `middleware.ts` (auth gate) → `app/layout.tsx` (shell) →
`app/page.tsx` (redirect to `/library`). Routing is the standard Next.js App
Router file-system convention — no custom router. Application lifecycle is
almost entirely server-rendered-per-request (`force-dynamic` throughout);
there is no build-time static generation of story content, deliberately,
since content changes constantly and the app is used by exactly two people
where a cache-invalidation bug is worse than a slightly slower page.

---

## Part 10 — Repository Mapping Tasks

### Directory map

```
app/
  actions/         Server Actions (writes). One file per domain.
  api/auth/         NextAuth's catch-all route handler.
  story/[slug]/     Every page scoped to one Fleeting Frames, plus the
                    template.tsx that drives pageTurn.
  library/, signin/ Top-level pages outside any story.
  layout.tsx, globals.css, error.tsx, not-found.tsx, page.tsx
                    App shell, global styles, boundaries, root redirect.
components/
  library/          The Library's story tiles + "Begin a new chapter."
  prologue/          Inline-editable Prologue fields + parallax hero.
  storyboard/       The beat timeline, editor, Frame List, icons.
  frames/           Upload, Frame Wall, Timeline, individual Frame card,
                    Waiting Frame card, the view-toggle orchestrator.
  afterword/        Question card, Frame picker for Q1.
lib/
  auth.ts, guard.ts  Identity and the security boundary.
  supabase.ts        The one privileged DB client.
  queries.ts          All reads.
  types.ts            Schema mirror.
  copy.ts             All user-facing strings + the seeded question bank.
  motion.ts           Named animation variants.
  beats.ts, purge.ts, slug.ts
                       Pure domain logic.
supabase/
  schema.sql           The full, current data model.
  migration-1.2.sql     The one pending fix.
*.md (root)              Phase guides + the 1.2 plan — process documentation,
                          written alongside the code, not after it.
```

### Architecture map

Presentation (`app/`, `components/`) depends on the domain layer (`lib/`)
and the action layer (`app/actions/`); the domain layer depends on nothing
in `app/` or `components/` (no circular dependencies); `lib/supabase.ts` is
the single choke point every DB access — read or write — passes through.

### Data flow map

See Part 3.6/3.7. In one line: **Server Component reads via
`lib/queries.ts` → renders. Client Component writes via `app/actions/*.ts`
→ `revalidatePath()` → the next Server Component render picks up the
change.** There is no client-side cache to invalidate manually and no REST/
GraphQL API layer — Server Actions *are* the API.

### State flow map

See Part 3.8. State is server-authoritative by default; the only durable
client state is UI-local (view toggles, selection sets, in-progress edit
drafts, upload progress) and never needs to survive a navigation.

### Dependency map (critical, not exhaustive)

`next-auth` (v5 beta) is the highest-risk external dependency — it's a beta
release, and its Edge Runtime compatibility warnings (`jose`,
`CompressionStream`/`DecompressionStream`) are known, harmless, and
explicitly documented as such in `PHASE1-GUIDE.md`; do not attempt to
"fix" them. `browser-image-compression`, `motion` (Framer Motion),
`@supabase/supabase-js` are the other load-bearing dependencies. No CSS
framework beyond Tailwind; no component library.

### Extension points

- New Server Actions follow the exact `requireAuthor()` + `attempt()` +
  `revalidatePath()` shape — copy an existing action in the relevant file
  as a template.
- New brand vocabulary or copy: add to `lib/copy.ts` only, grouped under
  the relevant existing key (`frames`, `afterword`, etc.) or a new
  top-level key if it's a genuinely new domain.
- New motion: add a named variant to `lib/motion.ts`, wrap usage in
  `useEverMotion()` unless it's `layoutId`-based (then add a manual
  `useReducedMotion()` check, per the `ribbon` precedent).
- New schema: write a numbered migration file
  (`supabase/migration-1.3.sql`, etc.) rather than editing `schema.sql`
  destructively — but **also** update `schema.sql` in the same change so
  fresh installs never drift from live, matching how migration-1.2 was
  handled.

### Risks

- Any change to `frames.chapter_id`'s cascade behavior, or to
  `lib/purge.ts`, without re-verifying against Part 2's "fail toward
  invisible waste" principle — this is the exact area a prior bug lived in.
- Any change to `lib/auth.ts` or `middleware.ts` — re-read Part 3.2 and
  confirm `requireAuthor()` is still independently called everywhere before
  touching either.
- Renaming or removing any `copy.ts` key without grepping every component
  that imports it first — this exact mistake (by the owner, hand-editing)
  has caused two production failures already.

### Unknowns — do not invent answers to these

- **The exact current state of the live repository** relative to this
  document, given the owner's history of manual file placement. Verify
  before trusting.
- **Whether `supabase/migration-1.2.sql` has actually been run** against
  the live Supabase project.
- **Which Gmail addresses are actually seeded** in the live `authors`
  table and listed in `ALLOWED_EMAILS` / Google Cloud Console Test users —
  the schema ships with placeholder emails (`denard@example.com`,
  `airhyl@example.com`) that must have been replaced with real ones for
  auth to work at all; this document cannot confirm they were.
- **The resolution to the "Story" naming collision** (Part 6) — flagged,
  not decided. Surface it rather than guessing.

---

## Part 11 — Validation

Before making any code changes, reconcile this document against the actual
repository and state your findings explicitly, in this shape:

- **Agreements** — what you found that matches this document.
- **Differences** — anything that contradicts it (file missing, extra file
  present, schema mismatch, copy.ts key mismatch). For each: is this
  expected drift (an already-planned change from Part 5/8) or unexpected
  drift (Part 7's process risk)?
- **Questions** — anything you need the owner (Denard) to answer before
  proceeding, especially: has `migration-1.2.sql` been run; are the real
  Gmail addresses seeded; which 1.2 pass (if any) is currently in progress
  or half-done.
- **Ambiguities** — the "Story" naming collision at minimum; anything else
  you find where the brand vocabulary and the code identifiers could be
  read two ways.

**Where the repository and this document disagree, the repository is the
source of truth for *current state*** — but the *reasoning and intent*
documented here (Parts 2 and 4 especially) should still govern how you
resolve that disagreement, unless the owner tells you otherwise. Do not
begin implementation until this validation is complete and, ideally,
confirmed with the owner.