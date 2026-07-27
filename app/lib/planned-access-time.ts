import { endOfUtcDay } from "./document-expiry";

export function getPlannedAccessEntryWindow(input: {
  expectedStart: Date;
  expectedEnd?: Date | null;
  earlyArrivalToleranceMinutes: number;
}) {
  return {
    start: new Date(
      input.expectedStart.getTime() - input.earlyArrivalToleranceMinutes * 60_000,
    ),
    end: input.expectedEnd ?? endOfUtcDay(input.expectedStart),
  };
}

export function isPlannedAccessEnterableAt(input: {
  expectedStart: Date;
  expectedEnd?: Date | null;
  earlyArrivalToleranceMinutes: number;
  now: Date;
}) {
  const window = getPlannedAccessEntryWindow(input);
  return window.start <= input.now && input.now <= window.end;
}
