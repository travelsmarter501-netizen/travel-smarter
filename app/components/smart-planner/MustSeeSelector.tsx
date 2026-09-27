import Image from "next/image";
import { IconCheck } from "../icons";
import { resolvePlace } from "../../lib/readyPlan";
import type { Area, Attraction, Experience, FoodPlace } from "../../lib/guideTypes";

type GuideData = { attractions: Attraction[]; foodPlaces: FoodPlace[]; experiences: Experience[]; areas: Area[] };

/** A small curated set of major Barcelona attractions — real existing guide ids only. */
const MUST_SEE_CANDIDATE_IDS = [
  "sagrada-familia",
  "park-guell",
  "casa-batllo",
  "camp-nou",
  "barceloneta-beach",
  "bunkers-carmel",
  "gothic-quarter",
  "mnac",
];

/**
 * V1.3: selection here is real — passed through as `preferences.mustVisit` into
 * generateBarcelonaSmartPlan, which guarantees (via the Day Builder's coverage-repair pass)
 * that every selected place appears in the generated plan, or generation fails with a typed
 * error instead of silently dropping one. See plannerDayBuilder.ts / generateBarcelonaSmartPlan.ts.
 *
 * V2: no artificial selection cap here — the user may select every candidate below. The real
 * constraint is a 3-day trip's physical capacity (12-18 main stops), enforced server-side by
 * validatePlannerPreferences (see plannerScoring.ts), which returns a clear error instead of
 * generating an impossible plan if that's ever exceeded.
 */
export default function MustSeeSelector({
  guide,
  selected,
  onChange,
}: {
  guide: GuideData;
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const candidates = MUST_SEE_CANDIDATE_IDS.map((id) => resolvePlace(id, "attraction", guide)).filter(
    (resolved): resolved is Extract<NonNullable<typeof resolved>, { type: "attraction" }> => resolved?.type === "attraction"
  );

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id));
      return;
    }
    onChange([...selected, id]);
  }

  if (candidates.length === 0) return null;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-bold text-slate-900">في أماكن أكيد بدك تشوفها؟</h2>
        {selected.length > 0 && (
          <span className="shrink-0 text-xs font-bold text-teal-700">{selected.length} مختارة</span>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-500">اختياري — اختار الأماكن اللي بدك نضمن تكون ضمن خطتك.</p>

      <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {candidates.map(({ place }) => {
          const active = selected.includes(place.id);
          return (
            <button
              key={place.id}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(place.id)}
              className={`flex w-24 shrink-0 flex-col items-center gap-1.5 rounded-2xl border p-2 text-center transition-colors ${
                active ? "border-teal-700 bg-teal-50" : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="relative h-16 w-full overflow-hidden rounded-xl bg-slate-100">
                <Image
                  src={place.image}
                  alt={place.name}
                  fill
                  sizes="96px"
                  style={place.imagePosition ? { objectPosition: place.imagePosition } : undefined}
                  className="object-cover"
                />
                {active && (
                  <span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-teal-700 text-white">
                    <IconCheck className="h-3 w-3" />
                  </span>
                )}
              </div>
              <span dir="auto" className="line-clamp-2 text-[11px] font-bold leading-tight text-slate-700">
                {place.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
