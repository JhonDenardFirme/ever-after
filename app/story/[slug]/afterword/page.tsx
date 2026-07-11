// -----------------------------------------------------------------------------
// app/story/[slug]/afterword/page.tsx — The Afterword.
//
// The reflection, written after the story is lived. Eight questions, seeded
// when the story was created (see createStory), so this page never has to
// generate anything.
//
// Both of us can answer every question. `unique (question_id, author_id)`
// means our answers can't collide — you write your row, she writes hers, they
// render side by side. No locking, no merge, no last-write-wins.
// -----------------------------------------------------------------------------

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  getStoryBySlug,
  getAfterwordQuestions,
  getAfterwordEntries,
  getFramesForStory,
  getAuthorsById,
  getCurrentAuthor,
} from '@/lib/queries';
import { copy } from '@/lib/copy';
import QuestionCard from '@/components/afterword/QuestionCard';

export const dynamic = 'force-dynamic';

export default async function AfterwordPage({ params }: { params: { slug: string } }) {
  const story = await getStoryBySlug(params.slug);
  if (!story) notFound();

  const me = await getCurrentAuthor();
  // Middleware guarantees a session; this guards the authors-table mismatch.
  if (!me) redirect('/signin');

  const [questions, entries, frames, authors] = await Promise.all([
    getAfterwordQuestions(story.id),
    getAfterwordEntries(story.id),
    getFramesForStory(story.id),
    getAuthorsById(),
  ]);

  // The other author, if there is one. Ever After is built for two.
  const theirAuthor = Object.values(authors).find((a) => a.id !== me.id) ?? null;

  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-6 py-12 sm:py-16">
      <header className="mb-14">
        <Link
          href={`/story/${story.slug}`}
          className="mb-8 inline-block text-[11px] uppercase tracking-[0.2em] text-ink-soft transition-colors hover:text-violet"
        >
          ← {story.title}
        </Link>

        <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-ember">
          {copy.afterword.eyebrow}
        </p>
        <h1 className="mb-3 font-serif text-4xl text-ink sm:text-5xl">
          {copy.afterword.title}
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-ink-soft">
          {copy.afterword.lead}
        </p>
      </header>

      {questions.length === 0 ? (
        <p className="py-24 text-center font-serif text-xl italic text-ink-soft">
          {copy.afterword.empty}
        </p>
      ) : (
        <div>
          {questions.map((question, i) => (
            <QuestionCard
              key={question.id}
              question={question}
              storyId={story.id}
              slug={story.slug}
              index={i + 1}
              me={me}
              theirAuthor={theirAuthor}
              mine={entries.find((e) => e.question_id === question.id && e.author_id === me.id) ?? null}
              theirs={
                theirAuthor
                  ? entries.find(
                      (e) => e.question_id === question.id && e.author_id === theirAuthor.id
                    ) ?? null
                  : null
              }
              frames={frames}
            />
          ))}
        </div>
      )}

      <div className="mt-16 border-t border-rule pt-10 text-center">
        <Link
          href={`/story/${story.slug}/print`}
          className="inline-block rounded-full bg-violet px-7 py-3.5 text-sm tracking-wide text-paper transition-colors hover:bg-violet-2"
        >
          {copy.print.action}
        </Link>
      </div>
    </main>
  );
}
