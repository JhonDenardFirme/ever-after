'use client';
// -----------------------------------------------------------------------------
// components/storyboard/BeatEditor.tsx
//
// The detail panel below the timeline. Edits the selected beat in place —
// no modal, no separate route. Same "same screen, same data" principle the
// masterfile asks for.
//
// Every field saves on blur, silently. Only errors speak up. That's the
// masterfile's "when to say nothing at all" rule: the interface trusts you.
//
// The delete flow is the exception — it asks, using the exact heavy copy from
// masterfile §7, because a beat takes its Frames' attachment with it.
// -----------------------------------------------------------------------------

import { useState, useTransition, useEffect } from 'react';
import { updateChapter, deleteChapter, type ChapterField } from '@/app/actions/chapters';
import { toLocalInputValue, fromLocalInputValue } from '@/lib/beats';
import { copy } from '@/lib/copy';
import type { Chapter, BeatType } from '@/lib/types';
import { TrashIcon } from '@/components/ui/icons';
import BeatIcon from './BeatIcon';

const TYPES: BeatType[] = ['travel', 'arrival', 'activity', 'meal', 'rest', 'other'];

export default function BeatEditor({ beat, slug }: { beat: Chapter; slug: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Local drafts so typing doesn't fight the server round-trip.
  const [title, setTitle] = useState(beat.title);
  const [notes, setNotes] = useState(beat.notes ?? '');
  const [setting, setSetting] = useState(beat.setting ?? '');
  const [time, setTime] = useState(toLocalInputValue(beat.scheduled_at));

  // Selecting a different beat swaps everything underneath us.
  useEffect(() => {
    setTitle(beat.title);
    setNotes(beat.notes ?? '');
    setSetting(beat.setting ?? '');
    setTime(toLocalInputValue(beat.scheduled_at));
    setConfirming(false);
    setError(null);
  }, [beat.id, beat.title, beat.notes, beat.setting, beat.scheduled_at]);

  function save(field: ChapterField, value: string) {
    setError(null);
    startTransition(async () => {
      const result = await updateChapter(beat.id, slug, field, value);
      if (!result.ok) setError(result.error || copy.storyboard.saveError);
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteChapter(beat.id, slug);
      if (!result.ok) setError(result.error);
    });
  }

  const { editorLabels: L, editorPlaceholders: P } = copy.storyboard;
  const fieldClass =
    'w-full rounded-lg border border-rule bg-paper px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-violet-2';
  const labelClass = 'mb-1.5 block text-[10px] uppercase tracking-[0.22em] text-ink-soft';

  return (
    <div className="rounded-2xl border border-rule bg-paper2 p-6">
      {/* Title — serif, because the beat's name is the story talking */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => title.trim() !== beat.title && save('title', title)}
        placeholder={P.title}
        aria-label={L.title}
        className="mb-5 w-full bg-transparent font-serif text-2xl text-ink outline-none placeholder:text-ink-soft/40"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`time-${beat.id}`} className={labelClass}>
            {L.time}
          </label>
          <input
            id={`time-${beat.id}`}
            type="datetime-local"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            onBlur={() => save('scheduled_at', fromLocalInputValue(time) ?? '')}
            className={fieldClass}
          />
          <p className="mt-1.5 text-[11px] italic text-ink-soft">
            {beat.scheduled_at ? copy.storyboard.timedHint : copy.storyboard.untimedHint}
          </p>
        </div>

        <div>
          <label htmlFor={`setting-${beat.id}`} className={labelClass}>
            {L.setting}
          </label>
          <input
            id={`setting-${beat.id}`}
            value={setting}
            onChange={(e) => setSetting(e.target.value)}
            onBlur={() => setting !== (beat.setting ?? '') && save('setting', setting)}
            placeholder={P.setting}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor={`notes-${beat.id}`} className={labelClass}>
          {L.notes}
        </label>
        <textarea
          id={`notes-${beat.id}`}
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== (beat.notes ?? '') && save('notes', notes)}
          placeholder={P.notes}
          className={`${fieldClass} resize-none font-serif`}
        />
      </div>

      {/* Beat type — a row of icons. Selection is the only place violet fills. */}
      <div className="mt-5">
        <p className={labelClass}>{L.type}</p>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => {
            const active = beat.beat_type === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => !active && save('beat_type', t)}
                aria-pressed={active}
                className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs transition-colors ${
                  active
                    ? 'border-violet bg-violet text-paper'
                    : 'border-rule text-ink-soft hover:border-violet-2 hover:text-violet'
                }`}
              >
                <BeatIcon type={t} size={14} />
                {copy.beatTypes[t]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer: saving state, errors, and the destructive action */}
      <div className="mt-6 flex items-center justify-between border-t border-rule pt-4">
        <p className="text-[10px] uppercase tracking-[0.18em] text-ink-soft">
          {isPending ? copy.prologue.saving : '\u00A0'}
        </p>

        {confirming ? (
          <div className="flex items-center gap-3">
            <p className="max-w-[16rem] text-right text-xs text-ink-soft">
              {copy.storyboard.deleteBeatConfirm}
            </p>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-full border border-rule px-3.5 py-2 text-xs text-ink-soft"
            >
              {copy.storyboard.confirmNo}
            </button>
            <button
              type="button"
              onClick={remove}
              className="rounded-full bg-ember px-3.5 py-2 text-xs text-paper"
            >
              {copy.storyboard.confirmYes}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={copy.storyboard.deleteBeat}
            title={copy.storyboard.deleteBeat}
            className="flex items-center gap-1.5 rounded-full border border-rule px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-ember hover:text-ember"
          >
            <TrashIcon size={13} />
            {copy.storyboard.deleteBeat}
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs text-ember">
          {error}
        </p>
      )}
    </div>
  );
}
