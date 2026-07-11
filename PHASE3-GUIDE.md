# Phase 3 — Chapters & The Storyboard

*Working notes. §2 is the checklist.*

---

## 1. What changed since Phase 2

**New files**
```
lib/guard.ts                            requireAuthor() + attempt() + Result type
lib/beats.ts                            the ordering rule, isolated and pure
app/actions/chapters.ts                 create / update / delete / reorder
app/actions/frames.ts                   createWaitingFrame, deleteWaitingFrame
app/story/[slug]/storyboard/page.tsx    The Outline
components/storyboard/Timeline.tsx      the beat timeline (ribbon, drag)
components/storyboard/BeatEditor.tsx    inline beat editing + delete confirm
components/storyboard/FrameList.tsx     Waiting Frames with attribution
components/storyboard/StoryboardView.tsx  selection state, add-beat
components/storyboard/BeatIcon.tsx      six inline SVGs, zero dependency
```

**Modified**
```
lib/copy.ts               + storyboard, frameList, beatTypes, prologue.toStoryboard
lib/queries.ts            + getChapters, getFramesForStory, getAuthorsById
app/actions/stories.ts    requireAuthor extracted -> now imports lib/guard.ts
app/story/[slug]/page.tsx + link to the storyboard at the foot of the Prologue
tailwind.config.ts        + one token: `rule-strong` (#D3C4B8)
```

**I said Phase 3 wouldn't touch `tailwind.config.ts`.** It did — one additive
line. Waiting Frames use a dashed border that needed more contrast than `rule`,
and the alternative was an inline `style={{ borderColor }}` hack, which is
exactly the thing that rots a design system. Additive token, nothing
overridden. `lib/auth.ts`, `middleware.ts`, `lib/motion.ts`, `lib/types.ts` and
`supabase/schema.sql` are untouched as promised.

**No new dependencies.** Drag-and-drop is the native HTML5 API. Icons are
inline SVG.

---

## 2. Success criteria

| # | Check | How |
|---|---|---|
| 1 | Builds clean | `npm run build` — `/story/[slug]/storyboard` listed |
| 2 | Reachable | Prologue → the card at the bottom → the Storyboard |
| 3 | Empty state | New story → "Nothing's been sketched yet." |
| 4 | Add a beat | "+ Add a beat" → type "The scenery" → Enter → appears, auto-selected |
| 5 | Editor saves | Change title / notes / setting → click away → reload → persisted |
| 6 | Beat type | Click "A meal" → icon changes on the timeline immediately |
| 7 | **Set a time** | Set 4:00 PM → the beat's label reads "4:00 PM", **not 8:00 AM** |
| 8 | Timezone survives reload | Reload → still 4:00 PM. *(This is the classic bug. See §3.)* |
| 9 | Timed sorts first | One timed beat + one untimed → timed is left/top, untimed after |
| 10 | Two timed beats sort by clock | Add 9:00 AM after 4:00 PM → 9:00 AM jumps ahead |
| 11 | Untimed drag | Two untimed beats → drag one past the other → order sticks after reload |
| 12 | Timed beats don't drag | Try dragging a timed beat → nothing. Editor says "change the time to move it" |
| 13 | Clearing a time | Delete a beat's time → it drops to the end of the untimed group |
| 14 | `ribbon` | Click between beats → the orange dot springs across, doesn't teleport |
| 15 | Reduced motion | OS reduce-motion → the dot jumps instantly, no spring |
| 16 | Waiting Frame | "+ Leave a Waiting Frame" → "Something unplanned" → tile appears, says "Denard left this" |
| 17 | Attribution is real | Check Supabase → `frames` → `authored_by` = your author id, `status` = `waiting` |
| 18 | Remove a Waiting Frame | Hover a tile → × → gone. It never touches a developed Frame (`.eq('status','waiting')` guard) |
| 19 | Delete a beat | "Remove this beat" → confirm copy appears → "Yes, let it go" → gone, selection falls back |
| 20 | Mobile | 375px: timeline is **vertical**, left rail, beats stack. Nothing clipped |

**#7 and #8 are the ones that matter.** If a 4pm beat displays as 8am, the
timezone conversion in `lib/beats.ts` broke. I unit-tested that round-trip in
Asia/Manila before shipping, but verify it on your machine.

**Done when:** you can sketch the whole July 19 itinerary — leave, check in,
the view, sopas, dinner, the balcony — and leave Airhyl three Waiting Frames.

---

## 3. Things worth understanding

**The ordering rule lives in exactly one file.** `lib/beats.ts` is pure — no
React, no Supabase, no side effects. Timed beats sort by clock; untimed sort
after them by `sort_order`. Every view calls `orderBeats()`. Nothing re-derives it.

**Why timed beats can't be dragged.** A timed beat's position is a *function of
its time*. If dragging moved it, you'd have a 4pm beat sitting visually before
a 9am one, and no way to tell which is lying. So drag only reorders the untimed
group, and the editor's hint text explains it in place rather than in a tooltip
nobody reads. This is dev guide §4.2, made real.

**The `datetime-local` timezone trap.** Postgres hands back a UTC ISO string.
`<input type="datetime-local">` wants local time. Converting with a naive
`.toISOString()` shifts the clock by your UTC offset — in Manila, a 4pm beat
renders as 8am. `toLocalInputValue()` subtracts `getTimezoneOffset()` first.
I wrote a test for this before writing any UI, because it's the kind of bug you
ship and then don't notice for three days.

**`layoutId` is how `ribbon` works.** One `motion.span` with
`layoutId="ribbon-dot"`. When it unmounts in one beat and mounts in another,
Framer springs it between the two positions — no coordinates, no refs, no
`getBoundingClientRect`. But `layoutId` animates *outside* the variant system,
so it ignores `useEverMotion()`. It needed its own `useReducedMotion()` check,
which I nearly missed.

**`e.preventDefault()` in `onDragOver` is not optional.** Without it, `onDrop`
never fires. This is the single most common HTML5 drag-and-drop bug and it has
no error message.

**`reindexUntimed` rewrites every index, not just the moved one.** Fractional
ordering (insert at 1.5) is clever and eventually drifts into float precision
problems. With six beats, rewriting all of them costs one round trip and
removes a whole bug class.

**`requireAuthor()` now returns the full `Author`.** Phase 2 discarded it.
`createWaitingFrame` uses `author.id` for `authored_by` — the first write in
this app that records *who*, which is the entire Waiting Frame mechanic.

**`deleteWaitingFrame` has `.eq('status', 'waiting')` on it.** That clause makes
the action structurally incapable of deleting a real photo. Phase 4's
`deleteFrame` is a different, deliberately harder action that also removes the
storage object and asks twice.

---

## 4. Two things I'd flag

**Frames with a null `chapter_id` are invisible right now.**
`createWaitingFrame` allows a null chapter (a prompt belonging to no particular
beat), but `getFramesForStory` filters by `.in('chapter_id', ids)`, which
excludes nulls. Phase 3's UI always passes a chapter, so nothing is broken —
but Phase 4's Frame Wall wants loose Frames and will need a separate query.
Documented in `lib/queries.ts` rather than left as a surprise.

**`reorderChapters` fires one UPDATE per row.** PostgREST has no bulk
update-by-id. Fine for six beats; if a story ever has fifty, move it to a
Postgres function. Noted, not solved — solving it now would be
over-engineering.

---

## 5. Bridging to Phase 4

Phase 4 (Frames, Frame Wall & Timeline) adds:
- `browser-image-compression` — **the first new dependency**
- `developFrame` in `app/actions/frames.ts` — upload to the `frames` bucket,
  flip `status` to `developed`, stamp `developed_at` + `developed_by`
- `deleteFrame` (the hard one: removes the storage object *and* the row)
- `setKeepsake`
- `app/story/[slug]/frames/page.tsx` with a Frame Wall ⇄ Timeline toggle
- `getLooseFrames()` in queries (see §4)
- `develop` motion, finally used for what it was named for

`FrameList`'s dashed tiles become real upload targets. Nothing in the
Storyboard restructures — `BeatEditor`, `Timeline`, and `lib/beats.ts` are done.

**If Phase 4 asks you to change `lib/auth.ts`, `middleware.ts`, or
`schema.sql`, stop and ask me.** It genuinely shouldn't need to.

---

## 6. If something breaks

| Symptom | Cause |
|---|---|
| Beat shows the wrong hour | Timezone conversion — check `toLocalInputValue` / `fromLocalInputValue` |
| Drop does nothing | `e.preventDefault()` missing from `onDragOver` |
| Dragged, then it snapped back | `reorderChapters` failed — check the console; RLS shouldn't be it (service role bypasses) |
| Ribbon teleports instead of springing | Two elements share `layoutId="ribbon-dot"`, or OS reduce-motion is on |
| "A beat needs a name" on a beat that has one | You cleared the title and blurred; it refuses to save empty. Type something. |
| New beat doesn't appear | `revalidatePath` didn't fire, or `force-dynamic` missing from the page |
| `No author row for <email>` | Seed emails in `schema.sql` ≠ your real Gmail. Fix the `authors` table directly. |
| Waiting Frame shows no "left this" | `authored_by` is null — the action ran without a session somehow. Check `requireAuthor`. |
