# Phase 5 — The Afterword, Polish & Print

*The last one. §2 is the checklist. §6 is what to do on July 18.*

---

## 1. What changed

**New files**
```
app/actions/afterword.ts                  answerQuestion (+ Keepsake / Theme side-effects)
app/story/[slug]/afterword/page.tsx       the eight questions
app/story/[slug]/print/page.tsx           Develop this Fleeting Frames
app/story/[slug]/template.tsx             pageTurn between sub-routes
app/error.tsx                             the error boundary
components/afterword/QuestionCard.tsx     one question, two signed answers
components/afterword/FramePicker.tsx      Q1's answer is a photograph
```

**Modified**
```
lib/copy.ts               + afterword, print, errors, validation, notFound blocks
lib/queries.ts            + getAfterwordQuestions, getAfterwordEntries, getCurrentAuthor
app/globals.css           + the @media print stylesheet
app/story/[slug]/page.tsx three cards now: Storyboard, Frames, Afterword
app/not-found.tsx         strings moved into copy.ts
app/actions/*.ts          every user-facing error string moved into copy.ts
lib/guard.ts              same
```

**Untouched:** `schema.sql` (the 8 questions were seeded back in Phase 2),
`lib/auth.ts`, `middleware.ts`, `lib/motion.ts`, `lib/types.ts`, `lib/beats.ts`,
`tailwind.config.ts`. **No new dependencies.**

---

## 2. Success criteria

| # | Check | How |
|---|---|---|
| 1 | Builds clean | `npm run build` — 6 routes incl. `/afterword` and `/print` |
| 2 | Eight questions | `/story/[slug]/afterword` renders all 8, numbered 01–08 |
| 3 | Text answer saves | Type in Q2, click away, reload → still there |
| 4 | **Signature appears** | Under your answer: "— Denard, 19 July 2026" |
| 5 | Signature is the confirmation | No toast, no checkmark. The signature *is* the receipt. |
| 6 | **Q1 is a Frame picker** | Not a textarea. Shows only developed Frames. |
| 7 | Q1 sets the Keepsake | Pick a Frame → `stories.keepsake_frame_id` updates → orange badge on Frames page |
| 8 | Q1 adopts the cover | If the story had no cover, that Frame becomes it (Library tile + Prologue hero) |
| 9 | **Q8 sets the Theme — only if blank** | Blank Theme + answer "Home" → Theme becomes Home. **Pre-set Theme is NOT overwritten.** |
| 10 | Side-effects are announced | Q1 says "This Frame becomes The Keepsake." Q8 says "This word becomes the story's Theme." |
| 11 | Both authors, side by side | Sign in as Airhyl, answer Q2 → both answers render, each signed |
| 12 | Answers can't collide | Editing yours never touches hers (`unique(question_id, author_id)`) |
| 13 | Un-answering | Clear a text answer → the row is deleted, "Unanswered" returns |
| 14 | `pageTurn` | Prologue → Storyboard → Frames → Afterword: each slides + fades in |
| 15 | pageTurn skips print | `/print` has no transform, no slide |
| 16 | Reduced motion | OS reduce-motion → everything instant, everywhere |
| 17 | **Print preview** | `/print` → Cmd/Ctrl+P → Prologue, Chapters with Frames + Captions, Afterword. **No nav, no buttons, no paper grain.** |
| 18 | Print doesn't split figures | No photo separated from its caption across a page break |
| 19 | Print colors survive | Backgrounds render (`print-color-adjust: exact`) |
| 20 | Error boundary | Throw something → "Something came loose." + Try again |
| 21 | 404 | `/story/nonsense` → "This page was never written." |
| 22 | Focus rings | Tab through every page — violet ring, always visible |
| 23 | **Mobile end to end** | 375px: Library → Prologue → Storyboard → Frames → Afterword. Nothing clipped. |
| 24 | Copy audit | `grep -rn "error: '" app/actions` → **nothing**. Every string is in `copy.ts`. |

**#9 is the one to test deliberately.** Set a Theme in the Prologue *first*,
then answer Q8 with a different word. The Prologue must win. I unit-tested that
rule before wiring it up.

---

## 3. Things worth understanding

**`template.tsx`, not `layout.tsx`.** A layout *persists* across navigation
between sibling routes — its children never re-mount, so an enter animation
fires exactly once, ever. A template re-mounts every time. That single
distinction is what makes Prologue → Storyboard → Frames feel like turning
pages instead of swapping panes.

**The print route opts out of the template.** A `transform` on a page headed
for a printer interacts badly with pagination, and can clip page one. The
template checks `pathname.endsWith('/print')` and renders children raw.

**Three things quietly break printing**, all handled in `globals.css`:
1. The paper-grain overlay is `position: fixed` — it would stamp itself on page
   one and vanish from the rest. Killed.
2. Browsers strip background colours by default. `print-color-adjust: exact`
   forces paper and violet through.
3. A figure split across a page break looks broken. `break-inside: avoid`.

**The print page uses plain `<img>`, not `next/image`.** The optimizer serves
WebP through a proxy that print engines handle inconsistently, and
lazy-loading famously prints blank rectangles.

**The Keepsake side-effect is unconditional. The Theme side-effect isn't.**
Q1 literally asks "which Frame brings the whole day back" — that *is* the
Keepsake, by definition, so answering it always sets it. But if you named the
Theme in the Prologue deliberately, the Afterword must never silently overwrite
it months later. Both rules are stated in the UI before they fire, because a
side-effect nobody was told about is just a bug with good manners.

**`unique (question_id, author_id)` does all the concurrency work.** You can
only ever write your own row. No locking, no merge, no last-write-wins. Two
people can answer the same question at the same moment and nothing collides.
That constraint, added in Phase 1, is why this page is 200 lines instead of 600.

**Empty answer = delete.** Clearing a textarea un-answers the question rather
than storing `""`. One action, two behaviours, no separate `deleteAnswer`.

**The signature is the confirmation.** Watching your name and today's date
appear under what you wrote says "kept" better than a toast. Masterfile's
"when to say nothing at all," applied to the most emotional page in the app.

---

## 4. What I'd flag

**Print is a stylesheet, not a PDF library.** Cmd+P → Save as PDF gets you 90%
of a photo book for zero dependencies. If you ever want true pixel control —
bleed, precise gutters, a real spine — that's `@react-pdf/renderer` or headless
Chrome, and it's a project, not an afternoon.

**No `loading.tsx`.** Every story route is `force-dynamic` and the queries are
fast at two-people scale. If a page ever feels slow, a `loading.tsx` with
`copy.frames.developing` is a five-minute addition.

**Still no way to move a Frame between beats.** Same gap I flagged in Phase 4.
Ten-line action, whenever it starts to hurt.

---

## 5. The whole app, in one paragraph

Sign in with Google (allowlist of two). **The Library** shows every *Fleeting
Frames*. Each one opens on **The Prologue** — cover, dedication, epigraph, all
inline-editable. **The Outline** holds **The Storyboard** (beats on a timeline,
timed ones sorted by clock, untimed draggable) and the **Frame List**, where
either of you leaves a **Waiting Frame** for the other. Developing a Waiting
Frame turns it into a photograph. The story reads as a **Frame Wall** or a
**Timeline**. The one Frame that matters most is **The Keepsake**. Afterwards,
**The Afterword** — eight questions, two authors, every answer signed and
dated. Then you **Develop** it: Cmd+P, Save as PDF, and the whole thing is a
book.

---

## 6. Before July 18

1. **Deploy.** Push to a private repo → import at vercel.com/new → add
   `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_EMAILS`.
2. **Add the production redirect URI** in Google Cloud Console:
   `https://your-app.vercel.app/api/auth/callback/google`. Forgetting this is
   the #1 reason "it worked locally."
3. **Add the keep-alive secrets** to the GitHub repo (`SUPABASE_URL`,
   `SUPABASE_ANON_KEY`) so Supabase never pauses.
4. **Confirm Airhyl's Gmail** is in `ALLOWED_EMAILS`, in the `authors` table,
   *and* in Google Cloud Console → OAuth consent screen → **Test users**. All
   three. Miss one and she can't sign in.
5. **Create "Tagaytay II."** Write the dedication. Sketch the real July 19
   storyboard. Leave her three Waiting Frames.
6. Then close the laptop.

---

## 7. If something breaks

| Symptom | Cause |
|---|---|
| Q8 overwrote my Theme | It shouldn't — the guard is `if (!story?.theme)`. Check you didn't have a blank Theme. |
| Signature date is yesterday | `created_at` refreshes on every edit; you're seeing a cached page. Reload. |
| Both answers show the same name | `getCurrentAuthor()` matched the wrong row — two `authors` rows share an email. |
| Q1 shows no Frames | You have no *developed* Frames. Waiting Frames can't be the Keepsake. |
| Print page is blank | Images lazy-loaded. The print route uses plain `<img>` for exactly this reason — check you didn't swap in `next/image`. |
| Print has no colour | The browser's "Background graphics" checkbox is off in the print dialog. |
| pageTurn fires only once | You put it in `layout.tsx` instead of `template.tsx`. |
| Afterword redirects to /signin | Your email is in `ALLOWED_EMAILS` but not in the `authors` table. |
