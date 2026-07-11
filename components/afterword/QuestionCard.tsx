'use client';
// -----------------------------------------------------------------------------
// components/afterword/QuestionCard.tsx (1.2)
//
// One question, up to two answers — yours (editable) and theirs (read-only,
// signed). Four shapes now, by answer_kind:
//   'text'   a paragraph
//   'word'   one word → the story's Theme
//   'rating' a light 1–5 star answer
//   'frame'  the Keepsake — an uploaded photograph (KeepsakeUpload)
//
// unique(question_id, author_id) still does all the concurrency work: you only
// ever write your own row, and the two answers render side by side.
// -----------------------------------------------------------------------------

import { useState, useTransition } from 'react';
import { answerQuestion } from '@/app/actions/afterword';
import { copy } from '@/lib/copy';
import { StarIcon, SparkIcon } from '@/components/ui/icons';
import type { AfterwordQuestion, AfterwordEntry, Author, Frame } from '@/lib/types';
import KeepsakeUpload from './KeepsakeUpload';

function signatureDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** 1–5 stars. Read-only when onPick is omitted. */
function Stars({ value, onPick, disabled }: { value: number; onPick?: (n: number) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const inner = <StarIcon size={22} className={filled ? 'text-ember' : 'text-rule'} />;
        return onPick ? (
          <button
            key={n}
            type="button"
            disabled={disabled}
            aria-label={copy.afterword.rated(n)}
            onClick={() => onPick(n)}
            className="transition-transform hover:scale-110 disabled:opacity-60"
          >
            {inner}
          </button>
        ) : (
          <span key={n}>{inner}</span>
        );
      })}
    </div>
  );
}

function TheirAnswer({ entry, author, frames }: { entry: AfterwordEntry; author: Author; frames: Frame[] }) {
  const frame = entry.answer_frame_id ? frames.find((f) => f.id === entry.answer_frame_id) : null;
  const rating = entry.answer_text && /^[1-5]$/.test(entry.answer_text) ? Number(entry.answer_text) : null;

  return (
    <div>
      <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-ink-soft">
        {copy.afterword.theirAnswer(author.name)}
      </p>

      {frame?.media_url ? (
        <div className="relative mb-3 aspect-[3/2] w-full max-w-[14rem] overflow-hidden rounded-lg border border-rule">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={frame.media_url} alt="" className="h-full w-full object-cover" />
        </div>
      ) : rating !== null ? (
        <Stars value={rating} />
      ) : (
        <p className="font-serif text-lg leading-relaxed text-ink">{entry.answer_text}</p>
      )}

      <p className="mt-2 text-xs italic text-ink-soft">
        {copy.afterword.signedBy(author.name, signatureDate(entry.created_at))}
      </p>
    </div>
  );
}

export default function QuestionCard({
  question,
  storyId,
  slug,
  index,
  mine,
  theirs,
  theirAuthor,
  me,
  frames,
}: {
  question: AfterwordQuestion;
  storyId: string;
  slug: string;
  index: number;
  mine: AfterwordEntry | null;
  theirs: AfterwordEntry | null;
  theirAuthor: Author | null;
  me: Author;
  frames: Frame[];
}) {
  const [draft, setDraft] = useState(mine?.answer_text ?? '');
  const [rating, setRating] = useState(mine?.answer_text && /^[1-5]$/.test(mine.answer_text) ? Number(mine.answer_text) : 0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const savedText = mine?.answer_text ?? '';

  function save(value: string | null) {
    setError(null);
    startTransition(async () => {
      const result = await answerQuestion(storyId, slug, question.id, question.answer_kind, value);
      if (!result.ok) setError(result.error || copy.afterword.saveError);
    });
  }

  const keepsakeFrame =
    question.answer_kind === 'frame' && mine?.answer_frame_id
      ? frames.find((f) => f.id === mine.answer_frame_id) ?? null
      : null;

  return (
    <article className="border-t border-rule py-8 first:border-t-0 first:pt-0">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-violet-2/50 font-serif text-sm text-violet">
          {String(index).padStart(2, '0')}
        </span>
        <h3 className="font-serif text-2xl leading-snug text-ink">{question.question}</h3>
      </div>

      <div className="grid gap-6 sm:grid-cols-[1fr_auto_1fr]">
        {/* Mine — editable */}
        <div>
          <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-ink-soft">{copy.afterword.yourAnswer}</p>

          {question.answer_kind === 'frame' ? (
            <KeepsakeUpload storyId={storyId} slug={slug} questionId={question.id} current={keepsakeFrame} />
          ) : question.answer_kind === 'rating' ? (
            <Stars
              value={rating}
              disabled={isPending}
              onPick={(n) => {
                setRating(n);
                save(String(n));
              }}
            />
          ) : question.answer_kind === 'word' ? (
            <>
              <input
                value={draft}
                disabled={isPending}
                placeholder={copy.afterword.wordPlaceholder}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => draft.trim() !== savedText && save(draft)}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                className="w-full max-w-[12rem] border-b border-rule bg-transparent pb-1 font-serif text-3xl italic text-ink outline-none transition-colors focus:border-violet-2 placeholder:text-ink-soft/40 disabled:opacity-60"
              />
              <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-ember">{copy.afterword.themeNote}</p>
            </>
          ) : (
            <textarea
              rows={4}
              value={draft}
              disabled={isPending}
              placeholder={copy.afterword.textPlaceholder}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => draft.trim() !== savedText && save(draft)}
              className="w-full resize-none rounded-lg border border-rule bg-paper2 px-3.5 py-3 font-serif text-lg leading-relaxed text-ink outline-none transition-colors focus:border-violet-2 placeholder:text-ink-soft/40 disabled:opacity-60"
            />
          )}

          {/* The signature IS the confirmation. No toast. */}
          {mine && !isPending && question.answer_kind !== 'frame' && (
            <p className="mt-2 text-xs italic text-ink-soft">
              {copy.afterword.signedBy(me.name, signatureDate(mine.created_at))}
            </p>
          )}
          {isPending && (
            <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-ink-soft">{copy.afterword.saving}</p>
          )}
          {error && (
            <p role="alert" className="mt-2 text-xs text-ember">
              {error}
            </p>
          )}
        </div>

        {/* Divider between the two answers — hairline + star */}
        <div className="hidden sm:flex sm:flex-col sm:items-center sm:justify-center sm:gap-1">
          <span className="w-px flex-1 bg-gradient-to-b from-transparent to-rule" />
          <SparkIcon size={9} className="text-ember" />
          <span className="w-px flex-1 bg-gradient-to-t from-transparent to-rule" />
        </div>

        {/* Theirs — read-only. Always shown, so both parties have a place. */}
        <div className="border-t border-rule pt-5 sm:border-t-0 sm:pt-0">
          {theirs && theirAuthor ? (
            <TheirAnswer entry={theirs} author={theirAuthor} frames={frames} />
          ) : (
            theirAuthor && (
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                  {copy.afterword.theirAnswer(theirAuthor.name)}
                </p>
                <p className="font-serif italic text-ink-soft/60">{copy.afterword.unanswered}</p>
              </div>
            )
          )}
        </div>
      </div>
    </article>
  );
}
