// Formats minutes as "1h 20min" once it's over an hour, plain "45 min" otherwise.
export function formatDuration(totalMinutes) {
  const mins = Math.round(totalMinutes);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}
