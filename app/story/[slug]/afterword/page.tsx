// -----------------------------------------------------------------------------
// app/story/[slug]/afterword/page.tsx — The Afterword (1.2 rebuild).
//
// Its own page, reachable from the album. A violet hero, an auto-carousel of the
// story's photographs, then the four-section question bank (Keepsake / Looking
// Back / Looking Within / Looking Ahead). Both authors answer independently
// (unique(question_id, author_id)); it all reflects on refresh.
//
// Existing stories are backfilled with the new bank idempotently
// (ensureAfterwordBank); any older, section-less questions that were answered
// still show, grouped last, so nothing written before the rebuild is lost.
// -----------------------------------------------------------------------------

import { notFound, redirect } from 'next/navigation';
import {
  getStoryBySlug,
  getAfterwordQuestions,
  getAfterwordEntries,
  getFramesForStory,
  getAuthorsById,
  getCurrentAuthor,
  getCoverUrl,
  ensureAfterwordBank,
} from '@/lib/queries';
import { copy, AFTERWORD_SECTIONS } from '@/lib/copy';
import { glowGradient } from '@/lib/gradients';
import QuestionCard from '@/components/afterword/QuestionCard';
import AfterwordCarousel from '@/components/afterword/AfterwordCarousel';
import AfterwordClear from '@/components/afterword/AfterwordClear';
import SectionHeading from '@/components/ui/SectionHeading';
import StarDivider from '@/components/ui/StarDivider';
import StarsBackground from '@/components/ui/StarsBackground';
import BackLink from '@/components/ui/BackLink';
import type { AfterwordQuestion } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AfterwordPage({ params }: { params: { slug: string } }) {
  const story = await getStoryBySlug(params.slug);
  if (!story) notFound();

  const me = await getCurrentAuthor();
  if (!me) redirect('/signin');

  // Make sure the story has the four-section bank (backfills older stories once).
  await ensureAfterwordBank(story.id);

  const [questions, entries, frames, authors, coverUrl] = await Promise.all([
    getAfterwordQuestions(story.id),
    getAfterwordEntries(story.id),
    getFramesForStory(story.id),
    getAuthorsById(),
    getCoverUrl(story),
  ]);

  const theirAuthor = Object.values(authors).find((a) => a.id !== me.id) ?? null;

  const cardFor = (question: AfterwordQuestion, index: number) => (
    <QuestionCard
      key={question.id}
      question={question}
      storyId={story.id}
      slug={story.slug}
      index={index + 1}
      me={me}
      theirAuthor={theirAuthor}
      mine={entries.find((e) => e.question_id === question.id && e.author_id === me.id) ?? null}
      theirs={
        theirAuthor
          ? entries.find((e) => e.question_id === question.id && e.author_id === theirAuthor.id) ?? null
          : null
      }
      frames={frames}
    />
  );

  // Old, section-less questions that were actually answered — keep them visible.
  const legacyAnswered = questions.filter(
    (q) => !q.section && entries.some((e) => e.question_id === q.id)
  );

  return (
    <main className="min-h-dvh">
      {/* Hero — thinner than the album cover (this is an inside page), and it
          dissolves into the paper at the base, same as the Fleeting Frames cover. */}
      <div className="relative flex min-h-[32vh] items-center justify-center overflow-hidden px-6 text-center sm:min-h-[38vh]" style={{ backgroundImage: glowGradient(1) }}>
        {coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-multiply" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-violet-deep/80 via-violet-deep/20 to-violet-deep/45" />
        <StarsBackground opacity={0.5} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-paper to-transparent" />
        <div className="relative">
          <p className="mb-4 text-[11px] uppercase tracking-[0.3em] text-ember">{copy.afterword.eyebrow}</p>
          <h1 className="font-serif text-5xl text-paper [text-shadow:0_2px_30px_rgba(0,0,0,0.5)] sm:text-7xl">
            {copy.afterword.title}
          </h1>
          <p className="mx-auto mt-5 max-w-md text-sm italic leading-relaxed text-violet-3">
            {copy.afterword.tagline}
          </p>
          <StarDivider onDark className="mx-auto mt-6 max-w-[12rem]" />
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-6 py-14">
        <BackLink href={`/story/${story.slug}`} label={story.title} className="mb-10" />

        <AfterwordCarousel frames={frames} />

        {AFTERWORD_SECTIONS.map((section) => {
          const inSection = questions.filter((q) => q.section === section.key);
          if (inSection.length === 0) return null;
          return (
            <div key={section.key} className="mb-20">
              <StarDivider className="mx-auto mb-12 max-w-sm" />
              <SectionHeading align="center" title={section.title} tagline={section.blurb} />
              {inSection.map((q, i) => cardFor(q, i))}
            </div>
          );
        })}

        {legacyAnswered.length > 0 && (
          <div className="mb-8">
            <p className="mb-6 text-[10px] uppercase tracking-[0.3em] text-ink-soft">{copy.afterword.earlier}</p>
            {legacyAnswered.map((q, i) => cardFor(q, i))}
          </div>
        )}

        <div className="mt-8 flex flex-col items-center gap-6 border-t border-rule pt-10 text-center">
          <AfterwordClear storyId={story.id} slug={story.slug} />
          <BackLink href={`/story/${story.slug}`} label={story.title} className="justify-center" />
        </div>
      </section>
    </main>
  );
}
