/** Minimum value for `<input type="datetime-local" />` (local time, no past slots). */
export function minDatetimeLocal(now = new Date()) {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function parseDatetimeLocal(value: string) {
  return new Date(value);
}

export function isDatetimeLocalInPast(value: string, now = new Date()) {
  if (!value) return false;
  const parsed = parseDatetimeLocal(value);
  return Number.isNaN(parsed.getTime()) || parsed.getTime() < now.getTime();
}

/** Keep editing an already-past event without forcing `min` to now. */
export function startUnchangedForMin(value: string, original: string | null) {
  return Boolean(original && value === original && isDatetimeLocalInPast(value));
}
