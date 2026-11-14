/* eslint-disable -- review script (not shipped): loose JSON typing on generated plan files is intended. */
// "With the optional activity" variants, computed by the product's own edit path (applyPlanCustomizations) on a TEST-ONLY copy of the
// Budapest module that gives the conditional place planner metadata. The product module itself never schedules or offers it.
import { readFileSync } from "fs"; import { pathToFileURL } from "url";
const imp = async (p: string) => { const x: any = await import(pathToFileURL(process.env.ROOT + p).href); return x.default ?? x; };
const M = await imp("/app/lib/planner/budapest/budapestCityModule.ts");
const C = await imp("/app/lib/planner/planCustomizations.ts");
const G = await imp("/app/lib/planner/plannerTimingGuard.ts");
const city = M.BUDAPEST_CITY_MODULE;
const extra: Record<string, any> = {
  "szechenyi-bath": { placeId: "szechenyi-bath", weights: { popular: 0, cultureLocal: 0, viewsNature: 0, beachRelax: 0, footballExperiences: 0, foodShoppingNightlife: 0 }, priority: 1, preferredTime: "afternoon", cluster: "city-park", visitDurationMinutes: 150 },
};
const variant = { ...city, metadataById: (id: string) => extra[id] ?? city.metadataById(id), destinationConfig: { ...city.destinationConfig, plannerMetadata: [...city.destinationConfig.plannerMetadata, ...Object.values(extra)] } };
const plans: any[] = JSON.parse(readFileSync(process.argv[2], "utf8"));
const clock = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
for (const spec of process.argv.slice(3)) {
  const [id, dn, add] = spec.split(":");
  const p = plans.find((x) => x.id === id); const day = p.plan.days[Number(dn) - 1];
  const order = [...day.stops.map((s: any) => s.id), add];
  const edited = C.applyPlanCustomizations(variant, p.plan, { [dn]: { order } });
  const d = edited.days[Number(dn) - 1];
  const probs = [...G.scheduleProblems(d)];
  const items = [...d.timeline.stops.map((s: any) => [s.startMinutes, s.endMinutes, s.placeId]), ...(d.timeline.meals ?? []).map((m: any) => [m.startMinutes, m.endMinutes, `[${m.mealType}] ${m.placeId}`])].sort((a, b) => a[0] - b[0]);
  console.log(`\n== ${id} day ${dn} (${d.actualDate} ${d.weekday}) + ${add}: schedule problems: ${probs.join(", ") || "none"}; timing warnings on added: ${(d.stops.find((s: any) => s.id === add)?.warnings ?? []).map((w: any) => w.textAr.slice(0, 50)).join(" / ") || "none"}`);
  for (const [s, e, n] of items) console.log(`   ${clock(s)}-${clock(e)} ${n}`);
}
