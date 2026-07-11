// -----------------------------------------------------------------------------
// app/story/[slug]/invitation/page.tsx — the Invitation (1.2).
//
// A read-only, shareable view of the Outline — "come with me, here's the day I
// have in mind." A cover hero in our glowing-gradient treatment, then the
// Moments as a VERTICAL, scrollable timeline (numbered nodes down a rail, cards
// to the side, star dividers). Behind the same auth as everything else.
// -----------------------------------------------------------------------------

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getStoryBySlug, getChapters, getCoverUrl } from '@/lib/queries';
import { orderBeats, formatBeatTime } from '@/lib/beats';
import { glowGradient } from '@/lib/gradients';
import { copy } from '@/lib/copy';
import { ArrowLeftIcon } from '@/components/ui/icons';
import StarField from '@/components/ui/StarField';
import StarDivider from '@/components/ui/StarDivider';
import BeatIcon from '@/components/storyboard/BeatIcon';

export const dynamic = 'force-dynamic';

export default async function InvitationPage({ params }: { params: { slug: string } }) {
  const story = await getStoryBySlug(params.slug);
  if (!story) notFound();

  const [beats, coverUrl] = await Promise.all([getChapters(story.id), getCoverUrl(story)]);
  const ordered = orderBeats(beats);

  return (
    <main className="min-h-dvh">
      {/* Hero — glowing gradient with the cover blended in */}
      <div className="relative flex min-h-[52vh] items-center justify-center overflow-hidden px-6 text-center" style={{ backgroundImage: glowGradient(1) }}>
        {coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45 mix-blend-multiply" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-violet-deep/80 via-transparent to-violet-deep/40" />
        <StarField />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-paper to-transparent" />

        <div className="relative">
          <p className="mb-4 text-[11px] uppercase tracking-[0.3em] text-ember">{copy.storyboard.invitationEyebrow}</p>
          <h1 className="font-serif text-5xl text-paper [text-shadow:0_2px_30px_rgba(0,0,0,0.5)] sm:text-7xl">
            {copy.storyboard.invitationTitle}
          </h1>
          <p className="mx-auto mt-5 max-w-md font-serif text-lg italic text-violet-3">
            {story.title} — {copy.storyboard.invitationLead}
          </p>
          <StarDivider onDark className="mx-auto mt-6 max-w-[12rem]" />
        </div>
      </div>

      {/* The Moments — a vertical timeline */}
      <section className="mx-auto max-w-2xl px-6 py-16">
        {ordered.length > 0 ? (
          <ol className="relative">
            {/* the rail */}
            <div className="absolute bottom-3 left-5 top-3 w-px bg-gradient-to-b from-violet-2/50 via-rule to-violet-2/50" />
            {ordered.map((beat, i) => (
              <li key={beat.id} className="relative mb-6 pl-16">
                <span className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-ever-gradient text-sm text-paper shadow-glow-soft">
                  {i + 1}
                </span>
                <div className="rounded-2xl border border-rule bg-paper2 p-5 transition-colors hover:border-violet-2">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-rule text-violet">
                      <BeatIcon type={beat.beat_type} size={14} />
                    </span>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-ember">
                      {formatBeatTime(beat.scheduled_at, copy.storyboard.untimed)}
                      {beat.setting ? ` · ${beat.setting}` : ''}
                    </p>
                  </div>
                  <p className="font-serif text-xl text-ink">{beat.title}</p>
                  {beat.notes && <p className="mt-1 font-serif text-sm italic text-ink-soft">{beat.notes}</p>}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="py-16 text-center font-serif text-xl italic text-ink-soft">{copy.storyboard.empty}</p>
        )}

        <div className="mt-14 border-t border-rule pt-8 text-center">
          <Link
            href={`/story/${story.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-rule px-6 py-3 text-xs tracking-wide text-ink-soft transition-colors hover:border-violet-2 hover:text-violet"
          >
            <ArrowLeftIcon size={13} /> {story.title}
          </Link>
        </div>
      </section>
    </main>
  );
}
