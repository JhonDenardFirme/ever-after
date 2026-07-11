// -----------------------------------------------------------------------------
// app/story/[slug]/print/page.tsx — Develop this Fleeting Frames.
//
// The whole story, laid out for paper. Cmd/Ctrl+P, "Save as PDF", done — no
// PDF library, no serverless Chrome, no new infrastructure. A well-made print
// stylesheet gets you 90% of a photo book for zero dependencies, and the last
// 10% is not Day 3 work.
//
// Everything that isn't the story hides at print time (see globals.css,
// @media print). What's left is: the Prologue, every Chapter with its Frames
// and Captions, and the Afterword with its signatures.
//
// Deliberately a Server Component with plain <img> instead of next/image —
// the image optimizer serves WebP through a proxy that print engines handle
// inconsistently, and lazy-loaded images famously print blank.
// -----------------------------------------------------------------------------

import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getStoryBySlug,
  getChapters,
  getFramesForStory,
  getAfterwordQuestions,
  getAfterwordEntries,
  getAuthorsById,
  getCoverUrl,
} from '@/lib/queries';
import { orderBeats, formatBeatTime } from '@/lib/beats';
import { copy } from '@/lib/copy';
import { ArrowLeftIcon } from '@/components/ui/icons';

export const dynamic = 'force-dynamic';

function longDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-PH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default async function PrintPage({ params }: { params: { slug: string } }) {
  const story = await getStoryBySlug(params.slug);
  if (!story) notFound();

  const [chapters, frames, questions, entries, authors, coverUrl] = await Promise.all([
    getChapters(story.id),
    getFramesForStory(story.id),
    getAfterwordQuestions(story.id),
    getAfterwordEntries(story.id),
    getAuthorsById(),
    getCoverUrl(story),
  ]);

  const ordered = orderBeats(chapters);
  // Videos can't print. Photographs only on paper.
  const developed = frames.filter(
    (f) => f.status === 'developed' && f.media_url && f.media_type !== 'video'
  );
  const answered = questions.filter((q) => entries.some((e) => e.question_id === q.id));

  const from = longDate(story.starts_on);
  const to = longDate(story.ends_on);

  return (
    <main className="print-sheet mx-auto max-w-3xl px-6 py-12">
      {/* Screen-only controls. Gone at print time. */}
      <div className="no-print mb-12 flex items-center justify-between border-b border-rule pb-6">
        <Link
          href={`/story/${story.slug}`}
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-ink-soft transition-colors hover:text-violet"
        >
          <ArrowLeftIcon size={13} /> {copy.print.back}
        </Link>
        <p className="text-xs italic text-ink-soft">{copy.print.hint}</p>
      </div>

      {/* ---- The Prologue ---- */}
      <section className="print-section mb-16 text-center">
        {coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            className="mx-auto mb-10 max-h-[22rem] w-full rounded-lg object-cover"
          />
        )}

        <h1 className="mb-4 font-serif text-5xl leading-tight text-ink">{story.title}</h1>

        <p className="mb-8 text-[11px] uppercase tracking-[0.24em] text-ink-soft">
          {[story.setting, from && to && from !== to ? `${from} – ${to}` : from]
            .filter(Boolean)
            .join(' · ')}
        </p>

        {story.epigraph && (
          <p className="mx-auto mb-8 max-w-md font-serif text-lg italic leading-relaxed text-ink-soft">
            {story.epigraph}
          </p>
        )}

        {story.dedication && (
          <p className="mx-auto mb-8 max-w-sm font-serif text-xl italic leading-relaxed text-ink">
            {story.dedication}
          </p>
        )}

        {story.description && (
          <p className="mx-auto max-w-lg font-serif text-base leading-relaxed text-ink-soft">
            {story.description}
          </p>
        )}

        {story.theme && (
          <p className="mt-8 text-[11px] uppercase tracking-[0.3em] text-ink-soft">{story.theme}</p>
        )}
      </section>

      {/* ---- The Chapters ---- */}
      {developed.length > 0 && (
        <section className="print-break mb-16">
          {ordered.map((chapter) => {
            const own = developed.filter((f) => f.chapter_id === chapter.id);
            if (own.length === 0) return null; // empty beats don't earn a page

            return (
              <div key={chapter.id} className="print-section mb-14">
                <header className="mb-5 border-b border-rule pb-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                    {formatBeatTime(chapter.scheduled_at, copy.storyboard.untimed)}
                    {chapter.setting ? ` · ${chapter.setting}` : ''}
                  </p>
                  <h2 className="font-serif text-3xl text-ink">{chapter.title}</h2>
                  {chapter.notes && (
                    <p className="mt-1 font-serif italic text-ink-soft">{chapter.notes}</p>
                  )}
                </header>

                <div className="grid grid-cols-2 gap-5">
                  {own.map((frame) => (
                    <figure key={frame.id} className="print-frame">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={frame.media_url as string}
                        alt={frame.caption ?? ''}
                        className="mb-2 w-full rounded-md object-cover"
                      />
                      {frame.caption && (
                        <figcaption className="font-serif text-sm leading-snug text-ink-soft">
                          {frame.caption}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* ---- The Afterword ---- */}
      {answered.length > 0 && (
        <section className="print-break">
          <h2 className="mb-10 text-center font-serif text-3xl text-ink">
            {copy.print.afterwordHeading}
          </h2>

          {answered.map((question) => {
            const mine = entries.filter((e) => e.question_id === question.id);

            return (
              <div key={question.id} className="print-section mb-10 border-t border-rule pt-6">
                <h3 className="mb-4 font-serif text-xl leading-snug text-ink">
                  {question.question}
                </h3>

                {mine.map((entry) => {
                  const author = authors[entry.author_id];
                  const frame = entry.answer_frame_id
                    ? developed.find((f) => f.id === entry.answer_frame_id)
                    : null;

                  return (
                    <div key={entry.id} className="mb-5 border-l-2 border-rule pl-5">
                      {frame?.media_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={frame.media_url}
                          alt=""
                          className="mb-2 max-h-56 rounded-md object-cover"
                        />
                      ) : (
                        <p className="font-serif text-lg leading-relaxed text-ink">
                          {entry.answer_text}
                        </p>
                      )}

                      {author && (
                        <p className="mt-1.5 text-xs italic text-ink-soft">
                          {copy.afterword.signedBy(author.name, longDate(entry.created_at) ?? '')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </section>
      )}

      {/* ---- Colophon ---- */}
      <footer className="mt-20 border-t border-rule pt-8 text-center">
        <p className="font-serif text-sm italic text-ink-soft">{copy.print.colophon}</p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-ink-soft">
          {copy.brand.name}
        </p>
      </footer>
    </main>
  );
}
