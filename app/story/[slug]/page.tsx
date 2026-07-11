// -----------------------------------------------------------------------------
// app/story/[slug]/page.tsx — The Fleeting Frames (the album). (1.2)
//
// The consolidated album. Server Component: fetches the story, its cover, its
// Moments, its Frames, both authors, and the Afterword, then composes:
//
//   Cover → Prologue → Soundtrack → The Outline → The Story (with the answered
//   reflections woven between the photos) → the one-word pair → Develop.
//
// The Afterword still has its own page (linked below); its answered reflections
// and the closing one-word question surface here, on the album, per the brief.
//
// force-dynamic: an edit, a new cover, a developed Frame, or a fresh answer must
// appear immediately.
// -----------------------------------------------------------------------------

import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getStoryBySlug,
  getCoverUrl,
  getChapters,
  getFramesForStory,
  getAuthorsById,
  getAfterwordQuestions,
  getAfterwordEntries,
  getCurrentAuthor,
  ensureAfterwordBank,
} from '@/lib/queries';
import { copy } from '@/lib/copy';
import CoverBanner from '@/components/prologue/CoverBanner';
import PrologueSection from '@/components/prologue/PrologueSection';
import Soundtrack from '@/components/soundtrack/Soundtrack';
import OutlineSection from '@/components/storyboard/OutlineSection';
import PhotoFeed, { type Reflection } from '@/components/story/PhotoFeed';

export const dynamic = 'force-dynamic';

export default async function StoryPage({ params }: { params: { slug: string } }) {
  const story = await getStoryBySlug(params.slug);
  if (!story) notFound();

  await ensureAfterwordBank(story.id);

  const [coverUrl, chapters, frames, authors, questions, entries] = await Promise.all([
    getCoverUrl(story),
    getChapters(story.id),
    getFramesForStory(story.id),
    getAuthorsById(),
    getAfterwordQuestions(story.id),
    getAfterwordEntries(story.id),
  ]);

  // Answered free-text reflections, woven between the photos.
  const reflections: Reflection[] = questions
    .filter((q) => q.answer_kind === 'text')
    .map((q) => {
      const answers = entries
        .filter((e) => e.question_id === q.id && e.answer_text && e.answer_text.trim())
        .map((e) => ({ name: authors[e.author_id]?.name ?? '', text: e.answer_text as string }));
      return answers.length ? { id: q.id, question: q.question, answers } : null;
    })
    .filter((r): r is Reflection => r !== null);

  // The closing one-word question, both answers, shown just above Develop.
  const wordQ = questions.find((q) => q.answer_kind === 'word');
  const wordAnswers = wordQ
    ? entries
        .filter((e) => e.question_id === wordQ.id && e.answer_text && e.answer_text.trim())
        .map((e) => ({ name: authors[e.author_id]?.name ?? '', word: e.answer_text as string }))
    : [];

  // Per-author Keepsakes, from the Keepsake question's Frame answers.
  const me = await getCurrentAuthor();
  const keepsakeQ =
    questions.find((q) => q.answer_kind === 'frame' && q.section === 'keepsake') ??
    questions.find((q) => q.answer_kind === 'frame');
  const keepsakes: Record<string, string[]> = {};
  let myKeepsakeFrameId: string | null = null;
  if (keepsakeQ) {
    for (const e of entries) {
      if (e.question_id === keepsakeQ.id && e.answer_frame_id) {
        (keepsakes[e.answer_frame_id] ??= []).push(authors[e.author_id]?.name ?? '');
        if (me && e.author_id === me.id) myKeepsakeFrameId = e.answer_frame_id;
      }
    }
  }

  return (
    <main className="min-h-dvh">
      {/* Back link floats over the cover (strip is click-through so it never
          obstructs the cover menu). */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 px-6 py-5">
        <Link
          href="/library"
          className="pointer-events-auto text-[11px] uppercase tracking-[0.2em] text-paper/70 transition-colors hover:text-paper"
        >
          ← {copy.prologue.back}
        </Link>
      </div>

      <CoverBanner
        storyId={story.id}
        slug={story.slug}
        coverUrl={coverUrl}
        title={story.title || copy.library.untitled}
        theme={story.theme}
      />

      <PrologueSection story={story} coverUrl={coverUrl} />

      <Soundtrack storyId={story.id} slug={story.slug} soundtrack={story.soundtrack} />

      <OutlineSection
        storyId={story.id}
        slug={story.slug}
        beats={chapters}
        frames={frames}
        authors={authors}
        coverUrl={coverUrl}
      />

      <PhotoFeed
        storyId={story.id}
        slug={story.slug}
        chapters={chapters}
        frames={frames}
        keepsakes={keepsakes}
        myKeepsakeFrameId={myKeepsakeFrameId}
        authors={authors}
        reflections={reflections}
      />

      {/* The one-word pair — the two answers together, just above the export. */}
      {wordAnswers.length > 0 && (
        <section className="mx-auto max-w-2xl px-6 py-10 text-center">
          <p className="mb-6 text-[10px] uppercase tracking-[0.3em] text-ember">
            {copy.afterword.wordPairEyebrow}
          </p>
          <div className="flex flex-wrap items-start justify-center gap-12">
            {wordAnswers.map((a, i) => (
              <div key={i}>
                <p className="bg-ever-gradient bg-clip-text font-serif text-4xl italic text-transparent sm:text-5xl">
                  {a.word}
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-ink-soft">— {a.name}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Onward to the Afterword (its own page). */}
      <div className="mx-auto max-w-2xl px-6 pb-4">
        <Link
          href={`/story/${story.slug}/afterword`}
          className="block rounded-2xl border border-rule bg-paper2 px-6 py-5 text-center transition-colors hover:border-violet-2"
        >
          <p className="mb-1 text-[10px] uppercase tracking-[0.24em] text-ember">{copy.afterword.eyebrow}</p>
          <p className="font-serif text-xl text-ink">{copy.afterword.toAfterword}</p>
        </Link>
      </div>

      {/* Develop — the whole thing, for paper. At the album's foot. */}
      <div className="mx-auto max-w-2xl px-6 pb-24 pt-6 text-center">
        <div className="border-t border-rule pt-10">
          <Link
            href={`/story/${story.slug}/print`}
            className="inline-block rounded-full bg-violet px-8 py-4 text-sm tracking-wide text-paper shadow-glow-soft transition-colors hover:bg-violet-2"
          >
            {copy.print.action}
          </Link>
          <p className="mt-3 text-xs italic text-ink-soft">{copy.print.hint}</p>
        </div>
      </div>
    </main>
  );
}
