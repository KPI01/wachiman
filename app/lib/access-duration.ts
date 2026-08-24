export type AccessInterval = {
  entryTimestamp: Date;
  exitTimestamp: Date | null;
};

export function calculateAccessDurationMs(
  intervals: readonly AccessInterval[],
  now = new Date(),
) {
  return intervals.reduce((total, interval) => {
    const endTimestamp = interval.exitTimestamp ?? now;
    const duration = endTimestamp.getTime() - interval.entryTimestamp.getTime();

    return total + Math.max(0, duration);
  }, 0);
}

export function formatAccessDuration(milliseconds: number) {
  const totalMinutes = Math.max(0, Math.floor(milliseconds / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}
