/* eslint-disable -- review script (not shipped): loose JSON typing on generated plan files is intended. */
// Round 3 comparison of review variants on the same requests (bud-quality.mts outputs in one directory).
// - Absolute change: variant X against A (= 8e8a309). Cumulative change: against "lunchRules" (the same lunch rules, no review at all).
// - Travel is the KNOWN travel, split into between visits / to and from restaurants; days whose lunch is a lunch break have UNKNOWN food
//   access (no point): counted apart, never as 0 proof.
// - Acceptance failures (per trip, X against A): schedule problem; current place lost; restaurant lunch lost on a date; a day above
//   +15 travel that is not allowed by the rule (lost time in the unreviewed day, recovered / k, at most 45, day total 90); trip travel
//   share more than +2 points (B / C only; for B1 the share is reported, not a failure); a changed meal on a day with the same places
//   that is not equivalent (category, served twice, walk more than +10; no dietary judgement); a new wait of 60+ min; fewer visit minutes.
// - Review log: rejections by reason and pass; the rejections whose ONLY reason was the trip travel share (with the share change).
// Usage: ROOT=$(pwd -W) NODE_OPTIONS=--conditions=react-server npx tsx docs/budapest/tools/bud-r3-compare.mts <dir> B,C,Am,Ba,Ca [out.json]
import { existsSync, readFileSync, writeFileSync } from "fs";
import { pathToFileURL } from "url";
const imp = async (p: string) => { const x: any = await import(pathToFileURL(process.env.ROOT + p).href); return x.default ?? x; };
const Q = await imp("/app/lib/planner/budapest/budapestDayQuality.ts");
const G = await imp("/app/lib/planner/plannerTimingGuard.ts");
const PL = await imp("/app/lib/planner/budapest/budapestPlaces.ts");
const [, , dir, list, outFile] = process.argv;
const load = (name: string) => JSON.parse(readFileSync(`${dir}/${name}.json`, "utf8"));
const FOOD = new Map<string, any>(PL.BUDAPEST_PLACES.foodPlaces.map((p: any) => [p.id, p]));
const RULE: Record<string, { k: number }> = { B: { k: 4 }, C: { k: 3 }, Ba: { k: 4 }, Ca: { k: 3 }, B1: { k: 4 }, B1a: { k: 4 }, Am: { k: Infinity }, A: { k: Infinity } };
const mid = (leg: any) => { const o = leg && leg.sourceStatus !== "unresolved" ? leg.options.find((x: any) => x.mode === leg.recommendedMode) : null; return o ? Math.round((o.durationMinutesMin + o.durationMinutesMax) / 2) : 0; };
const mealWalk = (day: any, id: string) => Object.entries(day.mealLegs ?? {}).reduce((s, [k, leg]) => s + (k.startsWith(id + "::") || k.endsWith("::" + id) ? mid(leg) : 0), 0);
const dayRow = (d: any) => ({ d, q: Q.finalDayQuality(d), problems: G.scheduleProblems(d).size });
const tripOf = (plan: any) => {
  const rows = plan.days.map(dayRow);
  const travel = rows.reduce((s: number, r: any) => s + r.q.travel, 0);
  const visits = rows.reduce((s: number, r: any) => s + r.q.visits, 0);
  return { rows, idle: rows.reduce((s: number, r: any) => s + r.q.idle, 0), travel, visits, share: (100 * travel) / (travel + visits), unknownFood: rows.filter((r: any) => r.q.foodAccessUnknown).length, restaurantLunches: rows.filter((r: any) => r.q.lunch !== "break" && r.q.lunch !== "none").length, places: plan.days.reduce((s: number, d: any) => s + d.stops.length, 0) };
};
const A = new Map(load("A").filter((x: any) => x.plan).map((x: any) => [x.id, x]));
const L = new Map(load("lunchRules").filter((x: any) => x.plan).map((x: any) => [x.id, x]));
const report: any = {};
for (const name of list.split(",")) {
  if (!existsSync(`${dir}/${name}.json`)) { console.log(name, "missing"); continue; }
  const X = load(name).filter((x: any) => x.plan);
  const k = RULE[name]?.k ?? Infinity;
  const tot = { trips: 0, changedTrips: 0, changedDays: 0, idleA: 0, idleX: 0, idleL: 0, travelA: 0, travelX: 0, travelL: 0, visitsA: 0, visitsX: 0, unknownFoodA: 0, unknownFoodX: 0, restaurantA: 0, restaurantX: 0, placesA: 0, placesX: 0, daysOver15VsA: 0, daysOver30VsA: 0, maxDayTravelX: 0 };
  const changes: any[] = [];
  const failures: any[] = [];
  for (const x of X) {
    const a: any = A.get(x.id);
    const l: any = L.get(x.id);
    if (!a || !l) continue;
    const ta = tripOf(a.plan), tx = tripOf(x.plan), tl = tripOf(l.plan);
    tot.trips++;
    tot.idleA += ta.idle; tot.idleX += tx.idle; tot.idleL += tl.idle; tot.travelA += ta.travel; tot.travelX += tx.travel; tot.travelL += tl.travel;
    tot.visitsA += ta.visits; tot.visitsX += tx.visits; tot.unknownFoodA += ta.unknownFood; tot.unknownFoodX += tx.unknownFood; tot.restaurantA += ta.restaurantLunches; tot.restaurantX += tx.restaurantLunches; tot.placesA += ta.places; tot.placesX += tx.places;
    const fails: string[] = [];
    const days: any[] = [];
    let changed = false;
    tx.rows.forEach((rx: any, i: number) => {
      const ra = ta.rows[i], rl = tl.rows[i];
      tot.maxDayTravelX = Math.max(tot.maxDayTravelX, rx.q.travel);
      const same = rx.q.order === ra.q.order && rx.q.idle === ra.q.idle && rx.q.travel === ra.q.travel && rx.q.lunch === ra.q.lunch;
      if (rx.problems) fails.push(`day ${i + 1}: schedule problem`);
      if (same) return;
      changed = true;
      tot.changedDays++;
      const inc = rx.q.travel - ra.q.travel;
      if (inc > 15) tot.daysOver15VsA++;
      if (inc > 30) tot.daysOver30VsA++;
      if (ra.q.lunch !== "break" && ra.q.lunch !== "none" && (rx.q.lunch === "break" || rx.q.lunch === "none")) fails.push(`day ${i + 1}: restaurant lunch lost (${ra.q.lunch})`);
      if (inc > 15) {
        const lost = rl.q.morningGap >= 60 || rl.q.longestWait >= 60;
        const recovered = rl.q.morningGap + rl.q.waits - (rx.q.morningGap + rx.q.waits);
        const cumInc = rx.q.travel - rl.q.travel;
        if (!lost) fails.push(`day ${i + 1}: travel +${inc} vs A without lost time`);
        else if (cumInc > Math.min(recovered / k, 45)) fails.push(`day ${i + 1}: travel +${cumInc} vs the unreviewed day, allowed ${Math.floor(Math.min(recovered / k, 45))}`);
        if (rx.q.travel > 90) fails.push(`day ${i + 1}: day travel ${rx.q.travel} above 90`);
      }
      if (rx.q.longestWait >= 60 && rx.q.longestWait > ra.q.longestWait) fails.push(`day ${i + 1}: new wait of ${rx.q.longestWait}`);
      const sameSet = [...rx.d.stops.map((s: any) => s.id)].sort().join() === [...ra.d.stops.map((s: any) => s.id)].sort().join();
      if (sameSet) for (const type of ["lunch", "dinner"]) {
        const ma = ra.d.timeline.meals.find((m: any) => m.mealType === type), mx = rx.d.timeline.meals.find((m: any) => m.mealType === type);
        if (!ma || ma.placeId === mx?.placeId || ma.placeId === "lunch-break" || !mx || mx.placeId === "lunch-break") continue;
        const fa = FOOD.get(ma.placeId), fx = FOOD.get(mx.placeId);
        // No dietary judgement (no dietary preference in the request; tags are data, not proof). Category, repetition and walk only.
        void fa;
        if (!["local", "restaurants"].includes(fx?.categoryId)) fails.push(`day ${i + 1}: ${type} ${mx.placeId} category ${fx?.categoryId}`);
        if (x.plan.days.some((d: any, j: number) => j !== i && d.timeline.meals.some((m: any) => m.placeId === mx.placeId))) fails.push(`day ${i + 1}: ${type} ${mx.placeId} served twice`);
        const walk = mealWalk(rx.d, mx.placeId) - mealWalk(ra.d, ma.placeId);
        if (walk > 10) fails.push(`day ${i + 1}: ${type} ${ma.placeId} -> ${mx.placeId} walk +${walk}`);
      }
      const f = (r: any) => ({ order: r.q.order, idle: r.q.idle, morning: r.q.morningGap, waits: r.q.waits, longestWait: r.q.longestWait, travel: r.q.travel, stopTravel: r.q.stopTravel, mealTravel: r.q.mealTravel, foodAccessUnknown: r.q.foodAccessUnknown, lunch: r.q.lunch, visits: r.q.visits, visitsEnd: r.q.visitsEnd });
      days.push({ day: i + 1, date: rx.d.actualDate ?? null, weekday: rx.d.weekday ?? null, unreviewed: f(rl), A: f(ra), X: f(rx), absolute: { idle: rx.q.idle - ra.q.idle, travel: inc }, cumulative: { idle: rx.q.idle - rl.q.idle, travel: rx.q.travel - rl.q.travel } });
    });
    if (tx.share - ta.share > 2 && name !== "B1" && name !== "B1a") fails.push(`trip travel share ${ta.share.toFixed(1)}% -> ${tx.share.toFixed(1)}%`);
    if (tx.visits < ta.visits) fails.push(`visit minutes ${ta.visits} -> ${tx.visits}`);
    const aIds = new Set(a.plan.days.flatMap((d: any) => d.stops.map((s: any) => s.id)));
    const xIds = new Set(x.plan.days.flatMap((d: any) => d.stops.map((s: any) => s.id)));
    for (const id of aIds) if (!xIds.has(id)) fails.push(`place lost: ${id}`);
    if (changed) {
      tot.changedTrips++;
      changes.push({ id: x.id, trip: { A: { idle: ta.idle, travel: ta.travel, share: +ta.share.toFixed(1), unknownFood: ta.unknownFood, restaurantLunches: ta.restaurantLunches, places: ta.places, visits: ta.visits }, X: { idle: tx.idle, travel: tx.travel, share: +tx.share.toFixed(1), unknownFood: tx.unknownFood, restaurantLunches: tx.restaurantLunches, places: tx.places, visits: tx.visits }, unreviewed: { idle: tl.idle, travel: tl.travel } }, days });
    }
    if (fails.length) failures.push({ id: x.id, fails });
  }
  // Review log: each rejection condition on its own. A rejection whose ONLY reason is one condition is what that condition alone blocked
  // (a valid schedule that missed an improvement threshold), listed with what it would have changed. Duplicates (the same proposal
  // judged again in a later loop) are counted once.
  const logFile = `${dir}/${name}-review-log.json`;
  const category = (r: string) => {
    const t = r.replace(/^day [0-9]+: /, "");
    if (t.startsWith("trip travel share")) return "trip travel share above +2 points";
    if (t.includes("restaurant lunch lost")) return "restaurant lunch lost";
    if (t.startsWith("travel +") && t.includes("allowed")) return "travel above the B/C allowance";
    if (t.startsWith("travel +") && t.includes("no lost")) return "travel above +15 without lost time";
    if (t.startsWith("travel +")) return "travel above +15 (rule A)";
    if (t.startsWith("day travel")) return "day travel above 90";
    if (t.startsWith("gain")) return "day gain below 30";
    if (t.startsWith("added travel")) return "added travel above half the gain";
    if (t.startsWith("trip gain")) return "trip gain below 30";
    if (t.startsWith("cost +") && t.includes("tolerance")) return "unchanged day weaker than the tolerance";
    if (t.startsWith("cost +")) return "a changed day weaker";
    if (t.includes("walk +")) return "meal walk more than +10";
    if (t.includes("dietary") || t.includes("pork") || t.includes("served on another") || t.includes("category")) return "meal not equivalent";
    if (t.includes("new wait")) return "new wait";
    if (t.includes("schedule problem")) return "schedule problem (validity)";
    if (t.includes("places did not change")) return "unchanged day: idle more than +10";
    if (t.includes("places")) return "day size";
    if (t.includes("no order fits") || t.includes("open on no date")) return "hours (validity)";
    if (t.startsWith("trip idle")) return "trip idle more than +30";
    if (t.includes("current place lost")) return "current place lost";
    if (t.includes("not built")) return "not built (search limit)";
    return t;
  };
  const anyReason: Record<string, number> = {};
  const sole: Record<string, any[]> = {};
  const seen = new Set<string>();
  let judged = 0;
  const searchLimit = { areasNotBuilt: 0, areasCandidates: 0 };
  if (existsSync(logFile)) for (const plan of JSON.parse(readFileSync(logFile, "utf8"))) for (const e of plan.entries) {
    if (e.stage === "areas") { searchLimit.areasCandidates++; if (e.decision === "skipped" && e.reasons.some((r: string) => r.includes("not built"))) searchLimit.areasNotBuilt++; }
    if (e.decision !== "rejected") continue;
    const key = plan.id + JSON.stringify(e);
    if (seen.has(key)) continue;
    seen.add(key);
    judged++;
    const pass = e.detail?.pass ? "extension pass" : "A pass";
    const cats = [...new Set(e.reasons.map(category))] as string[];
    for (const c of cats) anyReason[`${e.stage} / ${pass}: ${c}`] = (anyReason[`${e.stage} / ${pass}: ${c}`] ?? 0) + 1;
    if (cats.length !== 1) continue;
    const what = e.detail?.trial ? { day: e.day, base: { idle: e.detail.base.idle, travel: e.detail.base.travel, lunch: e.detail.base.lunch, foodAccessUnknown: e.detail.base.foodAccessUnknown }, trial: { order: e.detail.trial.order, idle: e.detail.trial.idle, travel: e.detail.trial.travel, lunch: e.detail.trial.lunch, foodAccessUnknown: e.detail.trial.foodAccessUnknown } }
      : e.detail?.days ? { move: e.detail.place ? `${e.detail.place} ${e.detail.from}->${e.detail.to}${e.detail.partner ? " swap " + e.detail.partner : ""}` : e.detail.assignment, days: Object.fromEntries(Object.entries(e.detail.days).map(([n, v]: any) => [n, { idle: `${v.before.idle}->${v.after.idle}`, travel: `${v.before.travel}->${v.after.travel}`, lunch: `${v.before.lunch}->${v.after.lunch}`, foodAccessUnknown: `${v.before.foodAccessUnknown}->${v.after.foodAccessUnknown}` }])) } : undefined;
    (sole[cats[0]] ??= []).push({ id: plan.id, stage: e.stage, pass, reason: e.reasons.join("; "), what });
  }
  const shareOnly = sole["trip travel share above +2 points"] ?? [];
  report[name] = { totals: tot, failures, changes, rejectionsJudged: judged, searchLimit, rejectionsByCondition: Object.fromEntries(Object.entries(anyReason).sort((a, b) => b[1] - a[1])), blockedByOneConditionOnly: sole };
  console.log(`\n== ${name} vs A (cumulative vs the unreviewed plans)`);
  console.log(JSON.stringify({ ...tot, shareA: +((100 * tot.travelA) / (tot.travelA + tot.visitsA)).toFixed(2), shareX: +((100 * tot.travelX) / (tot.travelX + tot.visitsX)).toFixed(2) }));
  console.log(`acceptance failures: ${failures.length} trips`);
  for (const f of failures) console.log(`  ${f.id}: ${f.fails.join("; ")}`);
  for (const c of changes) for (const d of c.days) console.log(`  ${c.id} d${d.day} ${d.date ?? "flex"} ${d.weekday ?? ""}: idle ${d.unreviewed.idle} -> A ${d.A.idle} -> X ${d.X.idle} | known travel ${d.unreviewed.travel} -> A ${d.A.travel} -> X ${d.X.travel} (between visits ${d.X.stopTravel} + restaurants ${d.X.mealTravel})${d.X.foodAccessUnknown ? " | food access unknown" : ""} | lunch ${d.A.lunch} -> ${d.X.lunch}`);
  console.log(`rejections judged (distinct): ${judged}; areas candidates logged ${searchLimit.areasCandidates}, not built (search limit) ${searchLimit.areasNotBuilt}`);
  console.log("blocked by ONE condition only:", JSON.stringify(Object.fromEntries(Object.entries(sole).map(([k, v]) => [k, v.length]))));
  for (const x of shareOnly.slice(0, 40)) console.log(`  share only: ${x.id} ${x.stage} (${x.pass}): ${x.reason} ${JSON.stringify(x.what ?? {})}`);
}
if (outFile) writeFileSync(outFile, JSON.stringify(report, null, 1));
