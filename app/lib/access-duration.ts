export type AccessInterval = {
  entryTimestamp: Date;
  exitTimestamp: Date | null;
};

export function calculateAccessDurationMs(
  intervals: readonly AccessInterval[],
  now = new Date(),
) {
  const nowTimestamp = now.getTime();
  const validIntervals = intervals
    .map((interval) => ({
      start: interval.entryTimestamp.getTime(),
      end: Math.min(interval.exitTimestamp?.getTime() ?? nowTimestamp, nowTimestamp),
    }))
    .filter(({ start, end }) => Number.isFinite(start) && Number.isFinite(end) && end > start)
    .sort((left, right) => left.start - right.start);

  if (validIntervals.length === 0) return 0;

  let total = 0;
  let rangeStart = validIntervals[0].start;
  let rangeEnd = validIntervals[0].end;

  for (const interval of validIntervals.slice(1)) {
    if (interval.start <= rangeEnd) {
      rangeEnd = Math.max(rangeEnd, interval.end);
      continue;
    }

    total += rangeEnd - rangeStart;
    rangeStart = interval.start;
    rangeEnd = interval.end;
  }

  return total + rangeEnd - rangeStart;
}

export function formatAccessDuration(milliseconds: number) {
  const totalMinutes = Math.max(0, Math.floor(milliseconds / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}
