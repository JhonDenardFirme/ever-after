# Phase 2 — The Library & The Prologue

*Working notes. §2 is the checklist.*

---

## 1. What changed since Phase 1

**New files**
```
app/actions/stories.ts              createStory, updateStory
app/story/[slug]/page.tsx           The Prologue
app/not-found.tsx                   "This page was never written."
components/library/StoryTile.tsx    a book on the shelf (shelfLift)
components/library/BeginChapter.tsx the primary action + inline title prompt
components/prologue/PrologueHero.tsx   parallaxCover
components/prologue/PrologueBody.tsx   unfold stagger
components/prologue/EditableField.tsx  click-to-edit primitive
lib/queries.ts                      typed read helpers (server-only)
lib/slug.ts                         "Tagaytay II" -> "tagaytay-ii"
```

**Modified**
```
lib/copy.ts          + library dialog copy, + prologue copy,
                     + DEFAULT_AFTERWORD_QUESTIONS (the 8, seeded per story)
app/library/page.tsx placeholder -> real shelf
```

**Untouched, as promised:** `lib/auth.ts`, `middleware.ts`, `lib/motion.ts`,
`lib/types.ts`, `lib/supabase.ts`, `supabase/schema.sql`, `tailwind.config.ts`.

Drop the new folders in, overwrite the two modified files, `npm run dev`. No
new dependencies, no schema migration.

---

## 2. Success criteria

| # | Check | How |
|---|---|---|
| 1 | Builds clean | `npm run build` — routes `/library` and `/story/[slug]` both listed |
| 2 | Empty state | Fresh DB → "Your story is waiting to begin." + Begin button |
| 3 | Create a story | Click Begin → type "Tagaytay II" → Enter → redirected to `/story/tagaytay-ii` |
| 4 | Questions seeded | Supabase → Table Editor → `afterword_questions` → **8 rows** for that story, Q1 `answer_kind='frame'`, Q8 `='word'` |
| 5 | Shelf renders | Back to `/library` → one tile, title + "Somewhere, someday" |
| 6 | shelfLift | Hover the tile → rises 6px, shadow deepens. Tab to it → same lift |
| 7 | Inline edit | Click the Prologue title → becomes an input → change it → click away → persists on reload |
| 8 | Dedication + epigraph | Fill both → they render centered-italic and ember-ruled respectively |
| 9 | Dates | Pick a start date → displays as "July 19, 2026", stores as `2026-07-19` |
| 10 | Empty a field | Clear the setting → saves as `null`, placeholder returns (not an empty box) |
| 11 | Escape reverts | Edit a field, press Escape → old value returns, nothing saved |
| 12 | parallaxCover | Scroll the Prologue → the violet cover area drifts slower than the text |
| 13 | unfold | Reload the Prologue → sections arrive staggered, not all at once |
| 14 | Reduced motion | OS → reduce motion → reload: no drift, no stagger, instant |
| 15 | 404 | Visit `/story/nonsense` → "This page was never written." |
| 16 | Mobile | 375px wide: tiles 2-up, Prologue single column, nothing clipped |
| 17 | Slug collision | Create a second story also called "Tagaytay II" → slug becomes `tagaytay-ii-2` |
| 18 | Action is guarded | Sign out, then POST to the action directly (or just trust the code) → `requireAuthor()` throws |

**Check #4 is the one people skip and regret.** If the 8 questions aren't there,
Phase 5 has nothing to render. Look at the table.

---

## 3. Things worth understanding

**Server Actions are public endpoints.** This is the single most important
thing in this phase. Middleware protects *routes* — it does nothing for a
Server Action, which compiles to a POST endpoint with a generated ID. Anyone
who extracts that ID from the page source can call it. That's why
`requireAuthor()` runs at the top of both actions and re-checks the session
against the `authors` table. Never write an action without it.

**`requireAuthor()` returns the author id, though Phase 2 ignores it.** Phase 3
needs it — a Waiting Frame records who left it. Built now so the pattern is
already in place.

**Slugs are permanent.** `updateStory('title', …)` deliberately does *not*
re-slug. If it did, editing a typo would break any link already shared. This is
a real product decision hiding in three lines of code.

**`revalidatePath` is why the screen updates.** Write to Supabase without it and
the database changes while the page keeps showing stale data. Both actions call
it. When something saves but doesn't appear, this is the first thing to check.

**`useTransition` beats a manual loading flag.** `isPending` covers the action
*and* the subsequent navigation, so the Begin button stays disabled until the
new Prologue is actually on screen.

**Empty string vs null.** `<input type="date">` emits `""` when cleared, and
Postgres rejects that for a `date` column. `updateStory` normalizes `""` → `null`
for every field, which also makes `value ?? placeholder` work everywhere.

**`useScroll` + `useTransform` don't re-render.** The parallax value is applied
on the compositor thread — no scroll listener, no state, no jank. Reduced motion
short-circuits it to `0` rather than unmounting the component.

---

## 4. Two things I'd flag

**The cover is always empty right now.** `getCoverUrl` returns `null` until
Frames exist, so the hero shows its violet empty state. That's correct, not
broken — Phase 4 gives it a real image and this component doesn't change.

**No error boundary yet.** `lib/queries.ts` logs and returns `null`/`[]` on
failure rather than throwing, because an uncaught throw in a Server Component
takes the whole route down. Phase 5's polish pass adds a proper `error.tsx`.

---

## 5. Bridging to Phase 3

Phase 3 (Chapters & The Storyboard) adds:
- `app/actions/chapters.ts` — CRUD + reorder, using the same `requireAuthor()`
  pattern (I'd export it from a shared `lib/guard.ts` at that point rather than
  duplicating it)
- `app/story/[slug]/storyboard/page.tsx`
- `components/storyboard/*` — the horizontal beat timeline, using `ribbon`
- `createWaitingFrame` — the first write that actually needs the author id

It will also add a link from the Prologue to the Storyboard. Nothing in Phase 2
gets restructured. `EditableField` is reused as-is for beat titles and notes —
it was built generic on purpose.

**If Phase 3 asks you to change `lib/auth.ts`, `schema.sql`, or
`tailwind.config.ts`, stop and ask me.** It shouldn't need to.

---

## 6. If something breaks

| Symptom | Cause |
|---|---|
| `No author row for <email>` | The seed emails in `schema.sql` don't match your real Gmail. Fix the `authors` table directly in Supabase. |
| Created a story, shelf still empty | Missing `export const dynamic = 'force-dynamic'` in `library/page.tsx`, or `revalidatePath` didn't fire |
| Date field saves then shows "Invalid Date" | The column got `""` instead of `null` — check `updateStory`'s normalization |
| Parallax doesn't move | `prefers-reduced-motion` is on at the OS level (that's the feature working) |
| Tile hover does nothing | `motion` variants need `initial="rest"` — check StoryTile |
| `Module not found: server-only` | Something client-side imported `lib/queries.ts`. Reads belong in Server Components only. |
