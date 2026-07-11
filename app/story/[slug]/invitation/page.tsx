// -----------------------------------------------------------------------------
// app/story/[slug]/invitation/page.tsx — the Invitation (1.2).
//
// A read-only, shareable view of the Outline — "come with me, here's the day I
// have in mind." Just the Moments, laid out on a violet hero, no editing. It
// lives behind the same auth as everything else (the two of you), so sharing
// the link with each other is all it needs to be.
// -----------------------------------------------------------------------------

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getStoryBySlug, getChapters, getCoverUrl } from '@/lib/queries';
import { copy } from '@/lib/copy';
import MomentTimeline from '@/components/storyboard/MomentTimeline';

export const dynamic = 'force-dynamic';

export default async function InvitationPage({ params }: { params: { slug: string } }) {
  const story = await getStoryBySlug(params.slug);
  if (!story) notFound();

  const [beats, coverUrl] = await Promise.all([getChapters(story.id), getCoverUrl(story)]);

  return (
    <main className="min-h-dvh">
      {/* Hero */}
      <div className="relative flex min-h-[52vh] items-center justify-center overflow-hidden bg-violet-hero px-6 text-center">
        {coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-multiply" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-violet-deep/85 via-violet-deep/25 to-violet-deep/50" />

        <div className="relative">
          <p className="mb-4 text-[11px] uppercase tracking-[0.3em] text-ember">
            {copy.storyboard.invitationEyebrow}
          </p>
          <h1 className="font-serif text-5xl text-paper [text-shadow:0_2px_30px_rgba(0,0,0,0.5)] sm:text-7xl">
            {copy.storyboard.invitationTitle}
          </h1>
          <p className="mx-auto mt-5 max-w-md font-serif text-lg italic text-violet-3">
            {story.title} — {copy.storyboard.invitationLead}
          </p>
        </div>
      </div>

      {/* The Moments */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        {beats.length > 0 ? (
          <MomentTimeline beats={beats} />
        ) : (
          <p className="py-16 text-center font-serif text-xl italic text-ink-soft">
            {copy.storyboard.empty}
          </p>
        )}

        <div className="mt-14 border-t border-rule pt-8 text-center">
          <Link
            href={`/story/${story.slug}`}
            className="inline-block rounded-full border border-rule px-6 py-3 text-xs tracking-wide text-ink-soft transition-colors hover:border-violet-2 hover:text-violet"
          >
            ← {story.title}
          </Link>
        </div>
      </section>
    </main>
  );
}
