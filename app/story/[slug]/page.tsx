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
import { copy, AFTERWORD_SECTIONS } from '@/lib/copy';
import { getSpotifyOEmbed } from '@/lib/spotify';
import { BookIcon, SparkIcon } from '@/components/ui/icons';
import CoverBanner from '@/components/prologue/CoverBanner';
import PrologueSection from '@/components/prologue/PrologueSection';
import Soundtrack from '@/components/soundtrack/Soundtrack';
import OutlineSection from '@/components/storyboard/OutlineSection';
import PhotoFeed from '@/components/story/PhotoFeed';
import ReflectionsCarousel, { type Reflection } from '@/components/afterword/ReflectionsCarousel';

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

  // Answered free-text reflections for the carousel — both authors per question,
  // included when at least one of them has written something.
  const authorsOrdered = Object.values(authors).sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  const sectionTitle = (key: string | null): string | null =>
    AFTERWORD_SECTIONS.find((s) => s.key === key)?.title ?? null;
  const reflections: Reflection[] = questions
    .filter((q) => q.answer_kind === 'text')
    .map((q) => {
      const answers = authorsOrdered.map((a) => {
        const e = entries.find(
          (x) => x.question_id === q.id && x.author_id === a.id && x.answer_text && x.answer_text.trim()
        );
        return { name: a.name, text: e ? (e.answer_text as string) : null };
      });
      return answers.some((a) => a.text)
        ? { id: q.id, question: q.question, section: sectionTitle(q.section), answers }
        : null;
    })
    .filter((r): r is Reflection => r !== null);

  // The closing one-word question, both answers, shown just above Develop.
  const wordQ = questions.find((q) => q.answer_kind === 'word');
  const wordPair = wordQ
    ? Object.values(authors)
        .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
        .map((a) => {
          const e = entries.find(
            (x) => x.question_id === wordQ.id && x.author_id === a.id && x.answer_text && x.answer_text.trim()
          );
          return { name: a.name, word: e ? (e.answer_text as string) : null };
        })
    : [];
  const anyWord = wordPair.some((w) => w.word);

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

  // ---- Cover-hero metadata (statistics live on the Library frontispiece) ----
  let dateLine: string | null = null;
  if (story.starts_on) {
    const f = new Date(story.starts_on);
    const full: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    if (story.ends_on && story.ends_on !== story.starts_on) {
      const t = new Date(story.ends_on);
      dateLine =
        f.getMonth() === t.getMonth() && f.getFullYear() === t.getFullYear()
          ? `${f.toLocaleDateString('en-PH', { month: 'long', day: 'numeric' })}–${t.getDate()}, ${f.getFullYear()}`
          : `${f.toLocaleDateString('en-PH', full)} – ${t.toLocaleDateString('en-PH', full)}`;
    } else {
      dateLine = f.toLocaleDateString('en-PH', full);
    }
  }
  const authorNames = Object.values(authors).map((a) => a.name).filter(Boolean).join(' & ');
  const metaParts = [dateLine, story.setting, authorNames || null].filter(Boolean) as string[];

  // Album art + title for the custom Spotify card (oEmbed, no auth; may be null).
  const soundtrackMeta = await getSpotifyOEmbed(story.soundtrack);

  // A few photos for the epigraph banner to cross-fade through (not the whole set).
  const photoPool = frames
    .filter((f) => f.status === 'developed' && f.media_url && f.media_type !== 'video')
    .map((f) => f.media_url as string);
  let bannerPhotos = photoPool.length <= 3 ? photoPool : [...photoPool].sort(() => Math.random() - 0.5).slice(0, 3);
  if (bannerPhotos.length === 0 && coverUrl) bannerPhotos = [coverUrl];

  return (
    <main className="min-h-dvh">
      <CoverBanner
        storyId={story.id}
        slug={story.slug}
        coverUrl={coverUrl}
        title={story.title || copy.library.untitled}
        subtitle={copy.prologue.sectionTitle}
        metaParts={metaParts}
      />

      <PrologueSection story={story} bannerPhotos={bannerPhotos} />

      <Soundtrack storyId={story.id} slug={story.slug} soundtrack={story.soundtrack} meta={soundtrackMeta} />

      <OutlineSection storyId={story.id} slug={story.slug} beats={chapters} frames={frames} authors={authors} />

      <PhotoFeed
        storyId={story.id}
        slug={story.slug}
        chapters={chapters}
        frames={frames}
        keepsakes={keepsakes}
        myKeepsakeFrameId={myKeepsakeFrameId}
        authors={authors}
      />

      {/* The answered reflections, as an auto-cycling story-style carousel. */}
      <ReflectionsCarousel reflections={reflections} />

      {/* The one-word pair — both authors, side by side, just above the export. */}
      {anyWord && (
        <section className="mx-auto max-w-2xl px-6 py-10 text-center">
          <p className="mb-8 text-[10px] uppercase tracking-[0.3em] text-ember">{copy.afterword.wordPairEyebrow}</p>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-8">
            {wordPair.slice(0, 2).map((a, i) => (
              <div key={i} className={i === 1 ? 'order-3' : ''}>
                {a.word ? (
                  <p className="bg-ever-gradient bg-clip-text font-serif text-4xl italic text-transparent sm:text-5xl">
                    {a.word}
                  </p>
                ) : (
                  <p className="font-serif text-3xl italic text-ink-soft/40 sm:text-4xl">—</p>
                )}
                <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-ink-soft">{a.name}</p>
              </div>
            ))}
            <div className="order-2 flex flex-col items-center gap-1 self-stretch">
              <span className="w-px flex-1 bg-gradient-to-b from-transparent to-rule" />
              <SparkIcon size={11} className="text-ember" />
              <span className="w-px flex-1 bg-gradient-to-t from-transparent to-rule" />
            </div>
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
            className="inline-flex items-center gap-2 rounded-full bg-ever-gradient px-8 py-4 text-sm tracking-wide text-paper shadow-glow transition-opacity hover:opacity-90"
          >
            <BookIcon size={16} />
            {copy.print.action}
          </Link>
          <p className="mt-3 text-xs italic text-ink-soft">{copy.print.hint}</p>
        </div>
      </div>
    </main>
  );
}
