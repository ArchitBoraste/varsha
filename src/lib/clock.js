// The demo replays one historical model run, so anything issued "now" is stamped on the run's own
// day at the current time of day in IST: the times look live and still fall inside the forecast.

const HOUR = 3_600_000;
const IST_OFFSET = 5.5 * HOUR;
// Drafts exist once the run has been post-processed, about four hours after initialisation.
const READY_AFTER = 4 * HOUR;

/** An ISO timestamp in IST (…+05:30) on the day of the run initialised at `runInit`. */
export function scenarioNow(runInit, now = new Date()) {
  const init = new Date(runInit).getTime() + IST_OFFSET;
  const wall = now.getTime() + IST_OFFSET;
  const runDay = init - (init % (24 * HOUR));
  const stamp = Math.max(runDay + (wall % (24 * HOUR)), init + READY_AFTER);
  return `${new Date(stamp).toISOString().slice(0, 19)}+05:30`;
}

/** An ISO timestamp moved on by `seconds`, keeping its +05:30 offset. */
export function addSeconds(isoIst, seconds) {
  const wall = new Date(isoIst).getTime() + IST_OFFSET + seconds * 1000;
  return `${new Date(wall).toISOString().slice(0, 19)}+05:30`;
}

/** "14:05" or, with seconds, "14:05:12": the wall-clock time written in an IST timestamp. */
export const istClock = (isoIst, withSeconds = false) => isoIst.slice(11, withSeconds ? 19 : 16);
