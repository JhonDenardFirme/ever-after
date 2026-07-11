# Ever After 1.2 — Implementation Plan
*The architect document. Read once, then use §5's prompts one at a time.*

---

## 0. What already shipped (this zip — the Foundation pass)

Verified with a clean production build:

- **The `media_type` bug, fixed at the root.** `supabase/migration-1.2.sql` adds
  the column Phase 4's code always wrote but Phase 1's schema never created.
  **Run it in the Supabase SQL Editor before anything else.** `schema.sql` is
  synced so fresh installs never drift from live again.
- **Video support.** Upload accepts video, capped at 50MB client-side (fails in
  0 seconds, not 60) and server-side. Videos render with controls in both
  views, and are excluded from print (paper can't play them).
- **Multi-select upload.** Sequential, ordered, honest progress ("Uploading 2
  of 5…"). One bad file skips; one server failure stops the batch.
- **Sets, quietly.** Filling a Waiting Frame with several files: the first
  fills it, the rest inherit its `prompt_text`. The prompt IS the group label.
  No new table — this is the data model Pass 4's categorized Story section
  reads from.
- **Delete-selection mode.** Select → tap Frames → bottom bar → confirm modal
  with the heavy voice, scaled to N → one bulk action (rows first, storage
  second, fail toward invisible waste).
- **The 1.2 palette.** `violet #5115AB`, `violet-deep #350E70`, ember
  brightened to `#F97316` to hold its own, `shadow-glow` tokens for dark
  violet surfaces. Focus rings and text selection follow.
- **"Moment," not "beat"** — every user-facing string (keys untouched, so
  nothing broke). The dash `—` replaces "Whenever it happens."
- **"Upload pictures"** as the button label, per your instruction. Noting for
  the record: this contradicts the brand bible's own "never say upload" rule.
  Your call stands; revisit whenever.

## 1. Dependency graph (what touches what)

```
lib/copy.ts ──────────────► every component (strings)
lib/types.ts ─────────────► queries, actions, all frame components
tailwind.config.ts ───────► everything visual (safe: additive tokens only)
app/actions/frames.ts ────► UploadFrame, FrameCard, FramesView, FrameList
frames.prompt_text ───────► the set/category system (Pass 4 reads it)
stories.* (Prologue cols) ► PrologueBody, print, Library tiles
afterword_questions ──────► QuestionCard, print  ← Pass 6 restructures this
/storyboard route ────────► folds into main page in Pass 5 (redirect kept)
```

The high-blast-radius items are `copy.ts` (already handled — additive),
the afterword schema (Pass 6, has a real migration), and the route
consolidation (Pass 5, breaking — mitigated with a redirect).

## 2. Migration ledger

| ID | When | What |
|---|---|---|
| **1.2-A** | **NOW — in this zip** | `frames.media_type` |
| 1.2-B | Pass 2 | `authors.avatar_url text`; new single-row `couple` table (headline, story, photo paths) for the editable hero |
| 1.2-C | Pass 6 | `afterword_questions`: add `section text`, extend `answer_kind` check with `'rating'`; **`frames.story_id uuid`** — the migration Phase 4's guide predicted "for whenever thematic stories arrive." The Keepsake-as-upload needs a Frame that belongs to a story without a Moment; this is that day. |

## 3. Breaking changes, named before they happen

1. **`/storyboard` folds into the main story page** (Pass 5). The route
   becomes a redirect so nothing bookmarked dies.
2. **Afterword question bank is replaced** (Pass 6). Existing answers are
   preserved — old question rows stay, the new bank is added per-story; the
   page renders answered-old + all-new. No data loss.
3. **Keepsake changes from picker to upload form** (Pass 6). The
   `answer_frame_id` column survives; only the acquisition path changes.
4. **Develop button relocates** from Afterword to the main page's foot (Pass 3).

## 4. Design directives, captured verbatim so they don't get lost

- Gradients encouraged; glows (`shadow-glow`) on dark violet surfaces.
- Hero sections: Library (couple), Outline, Afterword — violet with multiply
  imagery and parallax (reuse `parallaxCover`).
- Prologue: view-mode by default, small edit icon returns the form; only
  filled fields display. Epigraph centered on a banner image (multiply),
  Dedication as subtext beneath, section at ~80% content width. Gradient
  (violet→orange) reserved for the main title and section headers.
- Soundtrack: Spotify link → themed player; spinning half-disc below a
  hairline, autoplay attempt (browsers may require a tap — flagging now),
  pausable, song + artist + optional line.
- Story section: orientation-aware masonry with even gutters, hover zoom
  clipped by the frame, click → lightbox modal (X or outside closes),
  categorized by set labels with uncategorized last (unlabeled), details
  panel on click (uploader, date — schema fields only), violet gradient
  multiply at photo bottoms, rounded corners throughout.
- Outline: section not page; violet accents; horizontal scroller in edit
  when long, infinite autoscroll in view; icon delete button; shareable
  read-only invitation page.
- Afterword: four sections (Keepsake / Looking Back / Looking Within /
  Looking Ahead) with your question bank; ratings and light-touch inputs;
  own page; photo carousel; answers interleaved into the main page as
  photo-sized cards, answered-only, dynamically placed; the one-word pair
  above the Develop button at the page foot.
- Library: couple hero (editable, CRUD, edit-icon → form → save → view),
  profile menu upper-right (Google avatar default, uploadable), bigger
  tiles, section descriptions, footer ("Developed by Denard, with love.").

## 5. The passes — paste one prompt per message, same as the phases

**PASS 2 — The Library 1.2** *(migration 1.2-B first)*
```
Ever After 1.2, Pass 2: The Library.
Foundation pass is committed and migration-1.2.sql has been run. Apply
migration 1.2-B (authors.avatar_url + couple table) per the plan's ledger.
Build: the couple hero (editable presentation with photos, edit-icon → form →
save → view, CRUD via a new app/actions/couple.ts); profile menu upper-right
(Google image default, uploadable avatar, section links, sign out); "Begin a
new chapter" moved beside it; larger, more luxurious story tiles with the glow
token; short romantic section descriptions from copy.ts; a footer. Preserve
all existing behavior; build-verify before packaging.
```

**PASS 3 — The Fleeting Frames page: structure, Prologue, Soundtrack**
```
Ever After 1.2, Pass 3: the main story page.
Passes through 2 committed. Rework /story/[slug] into the consolidated album:
Prologue in view-mode by default (only filled fields, small edit icon restores
the full form); Epigraph centered on a multiply banner image with Dedication
beneath, ~80% width; gradient title treatment; cover-photo upload button with
violet gradient multiply; the Spotify soundtrack player (link in, themed
spinning half-disc player, autoplay attempt with graceful fallback, pause);
move the Develop button to the page foot. Keep every existing route working.
```

**PASS 4 — The Story section**
```
Ever After 1.2, Pass 4: The Story.
Orientation-aware masonry with even spacing; hover zoom clipped in-frame;
click → lightbox modal with details (uploader, date — existing schema only)
and a violet gradient multiply at the photo's base; grouped by set label
(frames.prompt_text) with beautiful category headers, unlabeled frames last
with no header; upload button per set; rounded corners everywhere. Integrate
into the main page below the Prologue.
```

**PASS 5 — The Outline as a section + the Invitation**
```
Ever After 1.2, Pass 5: The Outline.
Fold the Storyboard into the main page as a section with a violet multiply
hero (parallax); /story/[slug]/storyboard becomes a redirect. Edit mode gets
a horizontal scroller when long; view mode auto-scrolls infinitely; delete is
an icon button. Build the read-only shareable invitation view. Empty story →
"Outline your Storyboard" invitation state.
```

**PASS 6 — The Afterword 1.2** *(migration 1.2-C first)*
```
Ever After 1.2, Pass 6: The Afterword.
Apply migration 1.2-C (question sections, rating kind, frames.story_id).
Replace the question bank with the four-section set from the plan (old
answers preserved); add rating inputs; Keepsake becomes an independent upload
form writing a story-level Frame; own page with hero + photo carousel;
answers save per-author independently. On the main page: interleave answered
reflections as photo-sized cards, and render the one-word pair above the
Develop button.
```

## 6. Why not one shot

Your own acceptance test — *"everything must work exactly as intended"* — is
the reason. The passes above touch ~35 files and three migrations. Every pass
here ships build-verified, the way all five phases did; a single blind
regeneration ships hope. Foundation is done; say "Pass 2" and it begins.
