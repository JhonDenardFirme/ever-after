'use client';
// -----------------------------------------------------------------------------
// components/prologue/EditableField.tsx
//
// The inline-edit primitive the whole Prologue is built from. Click the text,
// it becomes an input. Blur or Enter saves. Escape reverts.
//
// Three deliberate choices:
//
//  1. No Save button, no toast on success. A Caption that saves silently is
//     the masterfile's "when to say nothing at all" rule — the interface
//     trusts you. Errors still speak up, because those you need to know about.
//
//  2. Optimistic-ish: the field keeps showing what you typed while the action
//     is in flight. If the save fails we revert to the last known-good value
//     and surface the error. No spinner over a text field.
//
//  3. `variant` picks the typography, not the behaviour. Story voice = serif
//     (title, dedication, epigraph). Interface voice = sans (dates, setting).
//     That split is the typographic half of "never speak like software."
// -----------------------------------------------------------------------------

import { useState, useTransition, useRef, useEffect } from 'react';
import { updateStory, type EditableField as FieldName } from '@/app/actions/stories';
import { copy } from '@/lib/copy';

type Variant = 'title' | 'serif' | 'serif-italic' | 'sans' | 'date';

const VARIANT_CLASS: Record<Variant, string> = {
  title: 'font-serif text-4xl sm:text-5xl leading-tight text-ink',
  serif: 'font-serif text-xl leading-relaxed text-ink',
  'serif-italic': 'font-serif italic text-xl leading-relaxed text-ink',
  sans: 'text-sm text-ink',
  date: 'text-sm text-ink',
};

export default function EditableField({
  storyId,
  field,
  value,
  placeholder,
  variant = 'sans',
  multiline = false,
  label,
}: {
  storyId: string;
  field: FieldName;
  value: string | null;
  placeholder: string;
  variant?: Variant;
  multiline?: boolean;
  label?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [saved, setSaved] = useState(value ?? ''); // last value the server confirmed
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);

  // Server sent down a new value (e.g. another tab saved it) — sync up,
  // but never clobber what someone is actively typing.
  useEffect(() => {
    if (!editing) {
      setDraft(value ?? '');
      setSaved(value ?? '');
    }
  }, [value, editing]);

  useEffect(() => {
    if (editing) {
      ref.current?.focus();
      ref.current?.select?.();
    }
  }, [editing]);

  function commit() {
    setEditing(false);
    if (draft === saved) return; // nothing changed, don't hit the network

    setError(null);
    startTransition(async () => {
      const result = await updateStory(storyId, field, draft);
      if (result.ok) {
        setSaved(draft);
      } else {
        setDraft(saved); // revert to the last thing the server agreed to
        setError(result.error || copy.prologue.saveError);
      }
    });
  }

  function cancel() {
    setDraft(saved);
    setEditing(false);
    setError(null);
  }

  const isDate = variant === 'date';
  const shared = `w-full bg-transparent ${VARIANT_CLASS[variant]}`;

  return (
    <div className="group">
      {label && (
        <p className="mb-1.5 text-[10px] uppercase tracking-[0.22em] text-ink-soft">{label}</p>
      )}

      {editing ? (
        multiline ? (
          <textarea
            ref={ref}
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Escape') cancel();
              // Enter makes a newline in a textarea; Cmd/Ctrl+Enter commits.
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commit();
            }}
            className={`${shared} resize-none rounded-md border border-violet-2/40 px-2 py-1 outline-none`}
          />
        ) : (
          <input
            ref={ref}
            type={isDate ? 'date' : 'text'}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') cancel();
            }}
            className={`${shared} rounded-md border border-violet-2/40 px-2 py-1 outline-none`}
          />
        )
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={`block w-full rounded-md px-2 py-1 text-left transition-colors hover:bg-paper2 ${VARIANT_CLASS[variant]} ${
            !draft ? 'text-ink-soft/50' : ''
          }`}
        >
          {isDate && draft
            ? new Date(draft).toLocaleDateString('en-PH', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : draft || placeholder}
        </button>
      )}

      {isPending && (
        <p className="mt-1 px-2 text-[10px] uppercase tracking-[0.18em] text-ink-soft">
          {copy.prologue.saving}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-1 px-2 text-xs text-ember">
          {error}
        </p>
      )}
    </div>
  );
}
