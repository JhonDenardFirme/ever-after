# Phase 4 — Frames, Frame Wall & Timeline

*Working notes. §2 is the checklist. §3 is the bug I found in my own Phase 3 code.*

---

## 1. What changed

**New files**
```
lib/purge.ts                              deletes a chapter's Frames + storage objects
app/story/[slug]/frames/page.tsx          the story itself
components/frames/UploadFrame.tsx         compression + dimension capture
components/frames/FrameCard.tsx           develop motion, caption, keepsake, delete
components/frames/WaitingFrameCard.tsx    a dashed tile that's now a real upload target
components/frames/FrameWall.tsx           bento grid
components/frames/FrameTimeline.tsx       grouped by Chapter, ordered by the clock
components/frames/FramesView.tsx          the Wall ⇄ Timeline toggle
```

**Modified**
```
package.json                    + browser-image-compression (the one new dependency)
app/actions/frames.ts           + developFrame, updateCaption, setKeepsake, deleteFrame
app/actions/chapters.ts         deleteChapter now purges its Frames (see §3)
lib/copy.ts                     + the frames block; removed the dead `developSoon` key
app/story/[slug]/page.tsx       Prologue now links to both Storyboard and Frames
components/storyboard/FrameList.tsx   dashed tiles are now upload targets
supabase/schema.sql             comment fix only: storage_path is a path WITHIN the bucket
```

**Untouched:** `lib/auth.ts`, `middleware.ts`, `lib/motion.ts`, `lib/types.ts`,
`lib/beats.ts`, `lib/guard.ts`, `tailwind.config.ts`. No migration to run —
the schema comment change is cosmetic.

---

## 2. Success criteria

| # | Check | How |
|---|---|---|
| 1 | Builds clean | `npm run build` — `/story/[slug]/frames` listed |
| 2 | Reachable | Prologue → "Read the story" card |
| 3 | Empty story | No Frames → "Every story begins with a single Frame." |
| 4 | No beats yet | A story with zero chapters → the upload button becomes a link to the Storyboard (see §4) |
| 5 | **Develop a Waiting Frame** | Storyboard → click a dashed tile → pick a photo → it becomes the photo |
| 6 | Status flipped | Supabase → `frames` → that row: `status='developed'`, `media_url` set, `developed_by` = you, `developed_at` stamped |
| 7 | **prompt_text survived** | Same row still has its original `prompt_text`. That's deliberate. |
| 8 | Compression worked | The file in Storage is well under 1MB even from a 12MP phone photo |
| 9 | Dimensions captured | `width` and `height` are populated, not null |
| 10 | New Frame, no prompt | Frames page → "Develop a Frame" → lands on the last beat of the day |
| 11 | `develop` motion | Reload → Frames arrive blurred and resolve sharp |
| 12 | Reduced motion | OS reduce-motion → they just appear. No blur, no scale. |
| 13 | Caption saves silently | Type, click away, reload → persisted. **No toast, no checkmark.** |
| 14 | Keepsake | Hover a Frame → ★ → orange badge appears, tile goes wide |
| 15 | Keepsake became cover | Library tile + Prologue hero now show that photo |
| 16 | Only one Keepsake | Mark another → the first quietly loses its badge |
| 17 | **Delete asks first** | × → overlay with *"This Frame will be gone for good — not just from this story, from everywhere."* |
| 18 | Delete is real | Confirm → row gone from `frames`, **object gone from the Storage bucket** |
| 19 | Deleting the Keepsake | It un-sets cleanly — no broken cover, no dangling reference |
| 20 | Timeline view | Toggle → Frames grouped under their beats, in clock order |
| 21 | Empty beat | A beat with no Frames → "This chapter is waiting for its first Frame." |
| 22 | Mobile | 375px: Wall is **2 columns**, Keepsake spans both. Timeline rail intact. |
| 23 | **Delete a beat with Frames** | Storyboard → delete a beat that has photos → the Frames AND their storage objects are gone (see §3) |

**#18 and #23 are the ones to actually verify in the Supabase dashboard.** Both
involve storage objects, and both would fail silently and invisibly.

---

## 3. A real bug I found in my own Phase 3 code

`frames.chapter_id` is `ON DELETE SET NULL`. And `frames` has **no `story_id`
column** — a Frame reaches its story *only* through its chapter.

So Phase 3's `deleteChapter` didn't orphan Frames in a recoverable way. It made
them **permanently unreachable**: invisible rows, plus photographs sitting in
the bucket that nothing would ever render or clean up. Silent, invisible data
loss.

Worse: the confirmation copy already said *"This beat and everything in it will
be gone for good."* The interface was lying.

`lib/purge.ts` fixes it. `deleteChapter` now deletes the chapter's Frames and
their storage objects before deleting the chapter row. The sentence is true now.

**The lesson worth keeping:** `ON DELETE SET NULL` on a column that is the
*only* path to a parent record is a data-loss bug wearing a safety vest. If
Ever After ever wants genuinely loose Frames — belonging to a story but no beat
— that needs a `story_id` column on `frames`, which is a real migration, not a
patch. Noted in `lib/purge.ts` for whenever thematic stories arrive.

This is also why I dropped the `getLooseFrames()` I promised in the Phase 3
bridge. It can't exist. Nothing can find a Frame with a null `chapter_id`.

---

## 4. Things worth understanding

**Compression happens in the browser, before anything leaves the device.** A
12MB photo becomes ~800KB with no visible quality loss. That's why 1GB of free
storage holds well over a thousand Frames, and why the server never has to hold
a huge buffer in memory.

**Dimensions are captured client-side too**, with `createImageBitmap`. The
server has no DOM, and adding `sharp` to read two integers would be absurd.
Without `width`/`height` the Frame Wall can't reserve space and every image
pops the layout as it loads.

**Upload order: storage first, then the row.** If the row write fails,
`developFrame` deletes the orphaned object before returning.

**Delete order: row first, then the object.** If the object delete fails we've
leaked an invisible file worth a few hundred KB. The reverse would leave a row
pointing at nothing — a broken image, forever.

> The rule underneath both: **always fail toward invisible waste, never toward
> visible breakage.**

**A `File` crosses the Server Action boundary inside `FormData`.** Next.js
serializes it for you. On the server it's a real `File` (Node 18+), and
`await file.arrayBuffer()` is what Supabase's Node client wants alongside an
explicit `contentType`.

**`deleteWaitingFrame` still has `.eq('status','waiting')` on it.** That clause
makes it structurally incapable of destroying a photograph. `deleteFrame` is the
separate, harder action — and it's the one with the two-step overlay.

**Uniform tiles beat natural aspect ratios in a bento grid.** Deriving each
tile's height from its image looks clever and produces ragged gaps under
`auto-rows-min`. The Wall forces 4:5 (Keepsake 3:2, spanning two columns); the
Timeline lets each Frame keep its own proportions. That's what the `aspect`
prop on `FrameCard` is for.

**The Keepsake becomes the cover if there isn't one.** Masterfile says so;
`setKeepsake` implements exactly that sentence and nothing more.

---

## 5. One thing I'd flag

**New Frames land on the last beat of the day.** There's no "which beat?" picker
— because a Frame with no chapter can never be found again (§3), and asking
would be a modal in the middle of an upload.

If a photo lands on the wrong beat, there's currently no way to move it. That's
a real gap. `updateFrame(frameId, 'chapter_id', …)` is a ten-line action
whenever it starts to hurt. It isn't Day 3 work.

---

## 6. Bridging to Phase 5

Phase 5 (The Afterword, Polish & Print) adds:
- `app/story/[slug]/afterword/page.tsx` + `app/actions/afterword.ts`
- Q1 (`answer_kind='frame'`) uses a Frame picker → sets `keepsake_frame_id`,
  which means it calls the `setKeepsake` action already built here
- Q8 (`answer_kind='word'`) → sets `stories.theme` if unset
- Signatures: author name + `created_at` on every entry
- `pageTurn` between story sub-routes
- `/story/[slug]/print` — print stylesheet, Cmd+P → PDF
- `error.tsx`, and the final copy audit

Nothing in Phase 4 restructures. `FrameCard` is reusable as the picker's tile.

**If Phase 5 asks you to change `schema.sql`, `lib/auth.ts`, or
`middleware.ts`, stop and ask me.** The 8 questions are already seeded.

---

## 7. If something breaks

| Symptom | Cause |
|---|---|
| Image 404s | The `frames` bucket isn't public, or `next.config.mjs` lost the `*.supabase.co` remotePattern |
| `Invalid src prop` | Same — `next/image` needs the host allow-listed |
| Upload hangs, no error | Compression failed on a huge file and `useWebWorker` blew up. Check the console; it falls back to the original. |
| Upload rejected as too big | Post-compression file still >5MB. It's a raw/HEIC edge case; convert first. |
| `new row violates row-level security` | You're somehow using the anon key. Check `lib/supabase.ts`. |
| Frame appears, image is broken | Row written but storage upload silently failed. Shouldn't be possible — check the ordering in `developFrame`. |
| Deleted a Frame, file still in bucket | `storage_path` was null. Only affects rows created before this phase. |
| Layout jumps as images load | `width`/`height` are null on those rows — they predate dimension capture. |
| Keepsake badge on two Frames | Impossible via UI; `keepsake_frame_id` is a single column. Check you're not looking at a stale tab. |
