// -----------------------------------------------------------------------------
// lib/beats.ts
//
// The one genuinely tricky rule in the Storyboard, isolated so it's testable
// and so no component has to re-derive it:
//
//   Timed beats sort by the clock.
//   Untimed beats ("whenever it happens") sort after ALL timed beats,
//   among themselves by sort_order.
//
// Consequence, and this is the important bit (dev guide §4.2): dragging only
// ever reorders UNTIMED beats. A timed beat's position is a function of its
// time, so letting someone drag it would create a state where visual order and
// actual time disagree. To move a timed beat, you change its time. The UI
// enforces this by only making untimed beats draggable.
// -----------------------------------------------------------------------------

import type { Chapter } from '@/lib/types';

export function isTimed(beat: Chapter): boolean {
  return beat.scheduled_at !== null;
}

/** The canonical order. Every view of the Storyboard uses this — no exceptions. */
export function orderBeats(beats: Chapter[]): Chapter[] {
  const timed = beats.filter(isTimed);
  const untimed = beats.filter((b) => !isTimed(b));

  timed.sort(
    (a, b) => new Date(a.scheduled_at as string).getTime() - new Date(b.scheduled_at as string).getTime()
  );
  untimed.sort((a, b) => a.sort_order - b.sort_order);

  return [...timed, ...untimed];
}

/**
 * Moves the untimed beat at `from` to `to` (both indices into the UNTIMED
 * subset, not the full list) and returns the new sort_order for each.
 *
 * Reassigns every untimed beat's index rather than trying to compute a
 * fractional order — with a handful of beats it costs one round trip and
 * removes an entire class of "orders drifted apart" bugs.
 */
export function reindexUntimed(
  untimed: Chapter[],
  from: number,
  to: number
): { id: string; sort_order: number }[] {
  if (from === to || from < 0 || to < 0 || from >= untimed.length || to >= untimed.length) {
    return untimed.map((b, i) => ({ id: b.id, sort_order: i }));
  }

  const next = [...untimed];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);

  return next.map((b, i) => ({ id: b.id, sort_order: i }));
}

/** "4:00 pm" — the Storyboard's time format. Null becomes the untimed label. */
export function formatBeatTime(scheduled_at: string | null, untimedLabel: string): string {
  if (!scheduled_at) return untimedLabel;
  return new Date(scheduled_at).toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm" in LOCAL time, but
 * Postgres hands us a UTC ISO string. Converting naively with toISOString()
 * shifts the clock by the timezone offset — the classic "my 4pm beat says
 * 8am" bug. Subtract the offset first.
 */
export function toLocalInputValue(scheduled_at: string | null): string {
  if (!scheduled_at) return '';
  const d = new Date(scheduled_at);
  const offsetMs = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
}

/** The inverse: a datetime-local value back into a UTC ISO string for Postgres. */
export function fromLocalInputValue(value: string): string | null {
  if (!value) return null;
  const d = new Date(value); // parsed as local time — which is what we want
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
