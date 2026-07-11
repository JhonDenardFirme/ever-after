'use client';
// -----------------------------------------------------------------------------
// components/afterword/QuestionCard.tsx
//
// One question, and up to two answers — yours (editable) and theirs
// (read-only, signed). `unique (question_id, author_id)` in the schema is what
// makes that shape possible without any locking or merge logic: you can only
// ever write your own row.
//
// Three shapes, chosen by `answer_kind`:
//   'text'  a paragraph
//   'word'  a single word, which becomes the story's Theme
//   'frame' a photograph, which becomes The Keepsake
//
// Answers save on blur, silently, like Captions. The signature is the
// confirmation — you see your name and the date appear, and that says "kept"
// better than a toast ever would.
// -----------------------------------------------------------------------------

import { useState, useTransition } from 'react';
import { answerQuestion } from '@/app/actions/afterword';
import { copy } from '@/lib/copy';
import type { AfterwordQuestion, AfterwordEntry, Author, Frame } from '@/lib/types';
import FramePicker from './FramePicker';

function signatureDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Their answer. Never editable — you can't sign someone else's name. */
function TheirAnswer({
  entry,
  author,
  frames,
}: {
  entry: AfterwordEntry;
  author: Author;
  frames: Frame[];
}) {
  const frame = entry.answer_frame_id ? frames.find((f) => f.id === entry.answer_frame_id) : null;

  return (
    <div className="border-l-2 border-rule pl-5">
      <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-ink-soft">
        {copy.afterword.theirAnswer(author.name)}
      </p>

      {frame?.media_url ? (
        <div className="relative mb-3 aspect-[3/2] w-full max-w-[14rem] overflow-hidden rounded-lg border border-rule">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={frame.media_url}
            alt={frame.caption ?? 'Their Keepsake'}
            className="h-full w-full object-cover"
          />
        </div>
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
  const [frameId, setFrameId] = useState<string | null>(mine?.answer_frame_id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save(value: string | null) {
    setError(null);
    startTransition(async () => {
      const result = await answerQuestion(storyId, slug, question.id, question.answer_kind, value);
      if (!result.ok) setError(result.error || copy.afterword.saveError);
    });
  }

  const savedText = mine?.answer_text ?? '';

  return (
    <article className="border-t border-rule py-10 first:border-t-0 first:pt-0">
      <p className="mb-3 text-[10px] uppercase tracking-[0.24em] text-ink-soft">
        {String(index).padStart(2, '0')}
      </p>

      <h2 className="mb-6 max-w-xl font-serif text-2xl leading-snug text-ink">
        {question.question}
      </h2>

      <div className="grid gap-8 sm:grid-cols-2">
        {/* Mine — editable */}
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-ink-soft">
            {copy.afterword.yourAnswer}
          </p>

          {question.answer_kind === 'frame' ? (
            <FramePicker
              frames={frames}
              selectedId={frameId}
              disabled={isPending}
              onSelect={(id) => {
                setFrameId(id);
                save(id);
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
              <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-ember">
                {copy.afterword.themeNote}
              </p>
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
          {mine && !isPending && (
            <p className="mt-2 text-xs italic text-ink-soft">
              {copy.afterword.signedBy(me.name, signatureDate(mine.created_at))}
            </p>
          )}
          {isPending && (
            <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-ink-soft">
              {copy.afterword.saving}
            </p>
          )}
          {error && (
            <p role="alert" className="mt-2 text-xs text-ember">
              {error}
            </p>
          )}
        </div>

        {/* Theirs — read-only, or a quiet absence */}
        <div>
          {theirs && theirAuthor ? (
            <TheirAnswer entry={theirs} author={theirAuthor} frames={frames} />
          ) : (
            theirAuthor && (
              <div className="border-l-2 border-rule pl-5">
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
