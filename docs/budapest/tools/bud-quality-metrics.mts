/* eslint-disable -- review script (not shipped): loose JSON typing on generated plan files is intended. */
// Day metrics for the review tools: the SAME definition the planner uses to accept a change (app/lib/planner/budapest/budapestDayQuality.ts).
// No generation here. Fields: morningGap (09:00 -> first visit), waits (beyond transfer + 15-minute margin, not before dinner), idle,
// visits, travel (meal transfers included), lunch kind / start / end, visitsEnd, dinnerStart (optional dinner), lateLunch (flag: after
// 13:30) and lateLunchMinutes, afterDarkEstimate (listed places, monthly sunset ESTIMATE), cost, order.
import { pathToFileURL } from "url";
const Q: any = await import(pathToFileURL(process.env.ROOT + "/app/lib/planner/budapest/budapestDayQuality.ts").href);
const q = Q.default ?? Q;
export function dayMetrics(d: any) {
  const m = q.finalDayQuality(d);
  return { ...m, lateLunch: m.lateLunchMinutes > 0 ? 1 : 0, end: Math.max(m.visitsEnd, m.lunchEnd ?? 0) };
}
