import type { AccessLogListItem } from "~/lib/database/access-log.server";

const STALE_ACCESS_AGE_MS = 24 * 60 * 60 * 1000;

export function isStaleAccessLog(
  accessLog: Pick<AccessLogListItem, "entryTimestamp" | "exitTimestamp">,
  now = new Date(),
) {
  return (
    accessLog.exitTimestamp === null &&
    now.getTime() - new Date(accessLog.entryTimestamp).getTime() >
      STALE_ACCESS_AGE_MS
  );
}

export function getOpenDurationLabel(
  accessLog: Pick<AccessLogListItem, "entryTimestamp">,
  now = new Date(),
) {
  const elapsedHours = Math.max(
    1,
    Math.floor(
      (now.getTime() - new Date(accessLog.entryTimestamp).getTime()) /
        (60 * 60 * 1000),
    ),
  );

  return `${elapsedHours} h abierto`;
}
