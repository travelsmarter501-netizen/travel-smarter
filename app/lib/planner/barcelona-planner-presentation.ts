import { barcelonaGuide } from "../barcelona-guide";
import { getBarcelonaPlannerMetadata } from "./barcelona-planner-metadata";
import type { GeneratedPlannerPlan, PlannerDay } from "./plannerDayBuilder";
import type { PlannerInterest, PlannerPreferences } from "./plannerTypes";
import type { PlannerDayPresentation, PlannerOptionalSuggestion, PlannerOptionalSuggestionType, PresentedPlannerPlan } from "./plannerPresentationTypes";
import type { Attraction, Experience, FoodPlace } from "../guideTypes";

/**
 * Barcelona Smart Planner — Presentation layer V1 (Barcelona-specific rules).
 *
 * Turns an already-finished GeneratedPlannerPlan into a PresentedPlannerPlan: a title, a
 * one-line summary, an optional highlight, and 0-4 optional "nearby" suggestions per day — all
 * deterministically derived from the plan's own real stops/clusters, the visitor's selected
 * interests, and existing Barcelona guide data. This module NEVER selects places, reorders
 * stops, changes transport legs, or invents a place that doesn't exist in the guide — it only
 * describes what the Day Builder / Route Optimizer already produced (see plannerDayBuilder.ts
 * / plannerRouteOptimizer.ts for the actual itinerary logic, both untouched by this file).
 *
 * -- "nightlife" (Nightlife Integration V1) ------------------------------------------------
 * `PlannerOptionalSuggestionType` includes "nightlife" and it IS populated here, resolved
 * from the real `barcelonaGuide.nightlifeVenues` dataset via the shared `resolvePlace` /
 * `PlaceDetailsSheet` infrastructure (extended in this task to add a `"nightlife"` case —
 * see app/lib/readyPlan.ts, app/lib/readyPlanTypes.ts, app/components/guide/PlaceDetailsSheet.tsx
 * — purely additive, no existing Ready Plan data uses it, so Ready Plan is unaffected). It
 * opens the SAME existing `NightlifeVenueCard` the Guide's own nightlife section already
 * uses — no second detail UI. Same reasoning as before applies to `bogatell` / `nova-icaria`
 * (beach-only places not present in `attractions`, `foodPlaces`, `experiences`, or
 * `nightlifeVenues` — see barcelona-planner-metadata.ts's comments) — still excluded from the
 * optionalNearby candidate pool for the same resolvability reason.
 *
 * -- Montjuïc safety rule (reused) --------------------------------------------------------
 * `barcelonaGuide.attractions` still has a real, separate "montjuic" entry (a general hill/
 * park overview) distinct from the planner's own precise "mnac" placeId (the Museu Nacional
 * d'Art de Catalunya stop — see the "Montjuïc identity cleanup" note in
 * barcelona-planner-metadata.ts and the permanent transport guard in
 * barcelona-planner-route-legs.ts). That old "montjuic" id was deliberately retired from
 * every planner-facing surface, so it is excluded from the optionalNearby candidate pool here
 * too — showing it alongside "mnac" would resurface exactly the two-different-Montjuïc-things
 * confusion that cleanup fixed, even though this feature never computes a transport leg for it.
 */

// -- Signal vocab -------------------------------------------------------------------------

const GAUDI_CORE_IDS = ["sagrada-familia", "park-guell", "casa-batllo", "casa-mila"];
const VIEW_SPOT_IDS = ["bunkers-carmel", "mnac", "tibidabo"];
const BEACH_IDS = new Set(["barceloneta-beach", "bogatell", "nova-icaria"]);
const CULTURE_IDS = new Set(["gothic-quarter", "barcelona-cathedral", "palau-musica", "boqueria", "sant-pau", "ciutadella"]);
const PHOTOWORTHY_IDS = new Set([...GAUDI_CORE_IDS, ...VIEW_SPOT_IDS, "barceloneta-beach"]);
/** Never suggested as optionalNearby — see the Montjuïc safety rule note above. */
const PRESENTATION_EXCLUDED_PLACE_IDS = new Set(["montjuic"]);
const OLD_CITY_CLUSTERS = new Set(["old-city", "city-center", "born"]);
/**
 * Day-title bug fix: a day's title must reflect what its main stops actually ARE, not just the
 * visitor's selected interests. This threshold picks out stops whose own `weights.foodShoppingNightlife`
 * (the same per-place metadata already used everywhere else, e.g. barcelona-planner-metadata.ts)
 * is clearly dominant -- e.g. la-rambla (9), boqueria (10), gothic-quarter (7), cook-and-taste-paella-class (10) --
 * versus an incidental/low value like arc-de-triomf (1) or gaudi-bike-tour (0). Verified against
 * every current placeId's own weights before picking this cutoff.
 */
const FOOD_SHOPPING_NIGHTLIFE_DOMINANT_WEIGHT = 6;

/**
 * V2 Final Exception Handling: a day the Day Builder honestly couldn't fill past 3 main stops
 * (a real, documented geography+similarity constraint -- see barcelona-planner-day-builder.ts)
 * must never read as broken. Title/summary below special-case exactly this stop count into
 * intentional-pacing language instead of falling through to a generic/mismatched theme title.
 * This is presentation-only: it never changes which stops were selected, never pads the day,
 * and never touches optionalNearby's own independent selection logic below.
 */
const LIGHTER_DAY_STOP_COUNT = 3;

/** Short Latin-script label per planner cluster — used only for human-facing "reason" text, never shown as a raw cluster id. */
const CLUSTER_LABEL: Record<string, string> = {
  "eixample-north": "Eixample",
  "passeig-gracia": "Passeig de Gràcia",
  "gracia-north": "Gràcia",
  "old-city": "Gothic Quarter",
  "city-center": "Plaça Catalunya",
  born: "Born",
  seafront: "Barceloneta",
  "seafront-east": "Poblenou",
  montjuic: "Montjuïc",
  "les-corts": "Les Corts",
  tibidabo: "Tibidabo",
};

/** Lowercase substrings matched against FoodPlace.area / Experience.area (both free text, not an id). */
const CLUSTER_AREA_KEYWORDS: Record<string, string[]> = {
  "eixample-north": ["eixample"],
  "passeig-gracia": ["eixample", "passeig de gràcia", "passeig de gracia", "rambla de catalunya"],
  "gracia-north": ["gràcia", "gracia"],
  "old-city": ["gothic", "rambla", "raval", "sant antoni"],
  "city-center": ["gothic", "catalunya"],
  born: ["born"],
  seafront: ["barceloneta"],
  "seafront-east": ["barceloneta", "poblenou", "port olímpic", "port olimpic", "port fòrum", "port forum"],
  montjuic: ["montjuïc", "montjuic", "poble sec"],
  "les-corts": ["les corts"],
  tibidabo: ["tibidabo", "sant gervasi"],
};

/** Exact match against Attraction.areaId — les-corts/tibidabo have no corresponding guide Area (those attractions use areaId "other"). */
const CLUSTER_TO_GUIDE_AREA_ID: Record<string, string | undefined> = {
  "eixample-north": "eixample",
  "passeig-gracia": "eixample",
  "gracia-north": "gracia",
  "old-city": "gothic-quarter",
  "city-center": "gothic-quarter",
  born: "el-born",
  seafront: "barceloneta",
  "seafront-east": "barceloneta",
  montjuic: "montjuic",
};

// -- Day signals (facts derived from the day's real stops/clusters) -----------------------

type DaySignals = {
  gaudiCount: number;
  hasViewSpot: boolean;
  lastStopIsSunsetView: boolean;
  hasFootball: boolean;
  hasBeach: boolean;
  oldCityCount: number;
  cultureCount: number;
  photoCount: number;
  hasFoodShoppingNightlifeStop: boolean;
};

function computeDaySignals(day: PlannerDay): DaySignals {
  const stopIds = day.stops.map((stop) => stop.placeId);
  const idSet = new Set(stopIds);

  const lastStopId = stopIds[stopIds.length - 1];
  const lastMeta = lastStopId ? getBarcelonaPlannerMetadata(lastStopId) : undefined;
  const lastStopIsSunsetView = !!lastStopId && VIEW_SPOT_IDS.includes(lastStopId) && !!lastMeta?.preferredTime.includes("sunset");

  const oldCityCount = stopIds.filter((id) => {
    const meta = getBarcelonaPlannerMetadata(id);
    return !!meta && OLD_CITY_CLUSTERS.has(meta.cluster);
  }).length;

  return {
    gaudiCount: GAUDI_CORE_IDS.filter((id) => idSet.has(id)).length,
    hasViewSpot: VIEW_SPOT_IDS.some((id) => idSet.has(id)),
    lastStopIsSunsetView,
    hasFootball: idSet.has("camp-nou"),
    hasBeach: [...BEACH_IDS].some((id) => idSet.has(id)),
    oldCityCount,
    cultureCount: stopIds.filter((id) => CULTURE_IDS.has(id)).length,
    photoCount: stopIds.filter((id) => PHOTOWORTHY_IDS.has(id)).length,
    hasFoodShoppingNightlifeStop: stopIds.some((id) => {
      const meta = getBarcelonaPlannerMetadata(id);
      return !!meta && meta.weights.foodShoppingNightlife >= FOOD_SHOPPING_NIGHTLIFE_DOMINANT_WEIGHT;
    }),
  };
}

// -- Title / summary / highlight -----------------------------------------------------------

/**
 * Deterministic, signal-driven — not a lookup table keyed by "the 7 test profiles". Any 3-day
 * plan the Day Builder can produce (any interest combination, any mustVisit combination) maps
 * to one of these rules purely from its own real stops/clusters/interests.
 *
 * Returns an ORDERED list of equally-truthful phrasings for this exact same day (all describing
 * the same real signals -- never a different claim), most-specific/original-wording first.
 * `buildDayTitle` below picks the first one not already used elsewhere in the same trip, the
 * same proven anti-duplication pattern `buildDaySummaryCandidates`/`buildDaySummary` already use.
 * candidates[0] is always byte-identical to this function's pre-fix single return value, so a
 * trip that never needs a second candidate renders exactly as before.
 */
function buildDayTitleCandidates(signals: DaySignals, day: PlannerDay, interests: readonly PlannerInterest[]): string[] {
  const { gaudiCount, hasViewSpot, hasFootball, hasBeach, oldCityCount, cultureCount, hasFoodShoppingNightlifeStop } = signals;
  const clusters = new Set(day.clusters);

  if (hasFootball) {
    // Fix Repetitive Montjuïc Day: Camp Nou can now naturally share a day with a real view spot
    // (mnac/bunkers-carmel/tibidabo) OR with the guarded "montjuic" attraction itself (not in
    // VIEW_SPOT_IDS, since that list drives several OTHER title/summary branches too and this
    // task only needed the football-day case widened) -- see the new montjuic<->les-corts
    // cluster link in barcelona-planner-day-builder.ts, most commonly producing a Camp Nou +
    // MNAC/Montjuïc "west Barcelona" day. Signal-driven, not hardcoded to one exact itinerary --
    // fires for ANY football day that also happens to include a real Montjuïc-area stop.
    if (hasViewSpot || clusters.has("montjuic")) return ["برشلونة الكروية وإطلالات مونتجويك ⚽🌇"];
    return oldCityCount > 0 ? ["كرة قدم وقلب المدينة ⚽"] : ["يوم كرة قدم في برشلونة ⚽"];
  }
  // A genuinely light day (see LIGHTER_DAY_STOP_COUNT's doc comment) reads as intentional
  // pacing, not a mismatched theme title -- priority per spec: beach, then views, then
  // neighborhoods/culture, then a neutral fallback. Checked before the theme rules below so
  // it always wins at or under this stop count, regardless of what else the day contains.
  //
  // Sellability audit fix (evidence: a live-generated 10-day Football/Experiences plan's Day 9
  // -- a single, real, honestly-thin stop, a sunset catamaran sail with zero football
  // relevance -- kept the generic "أبرز معالم برشلونة ⭐" ("Barcelona's top highlights") title
  // while its OWN summary correctly already said "a lighter day" (buildDaySummaryCandidates'
  // stopCount<=2 fallback below already handled this). The mismatch -- an "abundance" title
  // next to a "scarcity" summary on the same card -- reads as broken/inconsistent to a paying
  // customer. Widening this check from `=== LIGHTER_DAY_STOP_COUNT` (exactly 3) to `<=` closes
  // the gap for 1- and 2-stop days too, matching the summary function's own graduated
  // stopCount<=2/<=4 handling -- title and summary now always agree. Presentation-only: never
  // changes which stops were selected or how many.
  if (day.stops.length <= LIGHTER_DAY_STOP_COUNT) {
    if (hasBeach) return ["يوم أخف على البحر 🌊", "يوم هادئ قرب البحر 🌊"];
    if (hasViewSpot) return ["يوم أخف بإطلالات هادئة 🌇", "يوم هادئ بمناظر جميلة 🌇"];
    if (oldCityCount >= 1 || cultureCount >= 1 || interests.includes("cultureLocal")) {
      return ["يوم أخف بين الأحياء 🏛️", "يوم هادئ وسط الأحياء القديمة 🏛️"];
    }
    return ["يوم أخف في برشلونة ✨", "يوم هادئ في برشلونة ✨"];
  }
  if (gaudiCount >= 2) {
    if (hasViewSpot) return ["Gaudí والمناظر 🌇", "عمارة Gaudí وإطلالات برشلونة 🌇"];
    if (hasBeach) return ["Gaudí والبحر 🌊", "عمارة Gaudí وأجواء البحر 🌊"];
    return ["Gaudí وعمارة برشلونة 🏛️", "أشهر معالم Gaudí المعمارية 🏛️"];
  }
  if (oldCityCount >= 2 && hasBeach) {
    return ["برشلونة القديمة والبحر 🌊", "بين أزقة المدينة القديمة والبحر 🌊"];
  }
  if (oldCityCount >= 2 && (cultureCount >= 1 || interests.includes("cultureLocal"))) {
    return ["فن، شوارع وأجواء محلية 🏛️", "بين أزقة برشلونة القديمة والفن المحلي 🏛️", "أجواء محلية بين شوارع المدينة القديمة 🎨"];
  }
  if (hasBeach && oldCityCount === 0) {
    return ["شاطئ وراحة على البحر 🏖️", "يوم استرخاء على شاطئ برشلونة 🏖️"];
  }
  if (hasViewSpot) {
    return ["مناظر وأجواء برشلونة 🌇", "إطلالات برشلونة الجميلة 🌇"];
  }
  // Bug fix (verified live): this used to fire from `interests.includes("foodShoppingNightlife")`
  // alone (plus an incidental cluster match) with no check on the day's actual stops -- see this
  // function's own doc comment above for the full root-cause trail. Now requires the day to
  // genuinely contain a food/shopping/nightlife-dominant main stop.
  if (hasFoodShoppingNightlifeStop && (clusters.has("old-city") || clusters.has("city-center"))) {
    return ["أكل، تسوق وسهر 🍽️", "تسوق، مطاعم وأجواء سهر 🍽️"];
  }
  if (clusters.has("montjuic")) {
    return ["إطلالات ومتاحف Montjuïc 🖼️", "يوم بين متاحف وإطلالات Montjuïc 🖼️"];
  }
  return ["أبرز معالم برشلونة ⭐", "يوم غني بمعالم برشلونة ⭐"];
}

/**
 * Picks the first title candidate not already used elsewhere in the same trip (see
 * `usedTitles`, threaded from `presentBarcelonaSmartPlan`), falling back to a repeat only if
 * every truthful candidate for this specific day's signals is already used -- honest
 * degradation, never fabricates a signal that isn't there. Mirrors `buildDaySummary` exactly.
 */
function buildDayTitle(signals: DaySignals, day: PlannerDay, interests: readonly PlannerInterest[], usedTitles: ReadonlySet<string>): string {
  const candidates = buildDayTitleCandidates(signals, day, interests);
  return candidates.find((candidate) => !usedTitles.has(candidate)) ?? candidates[0];
}

/**
 * Every string below is only ever pushed when the signal it describes is genuinely true for
 * this day — the pool itself is honest, so picking ANY entry from it (not just the first) is
 * always a valid description. Ordered most-specific-first; `buildDaySummary` picks the
 * earliest one not already used elsewhere in the same plan (see its own doc comment).
 *
 * "يوم مليء بالمعالم"-style claims are gated on the day's real stop count (V1.1 polish — a
 * 1-2 stop day never claims to be "full of landmarks"); light-day phrasing ("يوم أخف",
 * "وقت أكبر للاستمتاع") is used instead whenever stopCount is small.
 */
function buildDaySummaryCandidates(signals: DaySignals, day: PlannerDay, interests: readonly PlannerInterest[]): string[] {
  const { gaudiCount, hasViewSpot, hasFootball, hasBeach, oldCityCount, lastStopIsSunsetView } = signals;
  const stopCount = day.stops.length;
  const firstStopId = day.stops[0]?.placeId;
  const startsWithGaudi = !!firstStopId && GAUDI_CORE_IDS.includes(firstStopId);
  const candidates: string[] = [];

  // V2 Final Exception Handling: a genuinely 3-stop day gets explicit intentional-pacing
  // copy, pushed first (most-specific) so it wins over the more generic rules below unless
  // already used elsewhere in the same plan. Never technical, never apologetic -- matches
  // the exact tone this task asked for. Priority mirrors the title's: beach, then views,
  // then neighborhoods/culture, then a neutral fallback.
  if (stopCount === LIGHTER_DAY_STOP_COUNT) {
    if (hasBeach) {
      candidates.push("يوم أخف — وقت أكبر تستمتع فيه بالبحر بدون استعجال.", "يوم مريح، بوقت أوسع للاسترخاء على البحر من غير تسرّع.");
    } else if (hasViewSpot) {
      candidates.push("يوم أخف — وقت أكبر تستمتع فيه بالإطلالات بدون استعجال.", "يوم هادئ، بوقت أوسع تستمتع فيه بالمناظر من غير تسرّع.");
    } else if (oldCityCount >= 1 || interests.includes("cultureLocal")) {
      candidates.push("يوم أخف — وقت أكبر تتجول فيه بين الأحياء بدون استعجال.", "يوم هادئ بين أحياء برشلونة، بوتيرة مريحة من غير تسرّع.");
    } else {
      candidates.push("يوم أخف — وقت أكبر للاستمتاع بدون استعجال.");
    }
  }

  // Gaudí + a genuine sunset-view ending — the day's real opening/closing stops support both halves.
  if (startsWithGaudi && lastStopIsSunsetView && stopCount >= 3) {
    candidates.push(
      "ابدأ بأشهر معالم Gaudí واختم اليوم بإطلالة مميزة.",
      "يوم بين عمارة Gaudí الساحرة، وختام بإطلالة تستاهل الانتظار."
    );
  }

  // Beach + old city together — kept together (title-summary consistency: whenever the title
  // says "والبحر" alongside old-city content, this block is guaranteed to fire, at any stop count).
  if (hasBeach && oldCityCount >= 1) {
    if (stopCount <= 4) {
      candidates.push(
        "يوم خفيف بين البحر والشوارع القديمة مع وقت للاستمتاع بدون استعجال.",
        "توازن بين نزهة على البحر وجولة بين أزقة المدينة القديمة."
      );
    } else {
      candidates.push(
        "يوم غني يجمع بين شوارع برشلونة القديمة التاريخية ووقفة لا بد منها على البحر.",
        "جولة موسّعة بين المعالم التاريخية، وعلى البحر خلي وقت يكفي."
      );
    }
  }

  // Gaudí + beach, no view spot — rare (the two clusters rarely co-occur), kept as a safety net
  // for title-summary consistency ("Gaudí والبحر" title).
  if (gaudiCount >= 2 && hasBeach && !hasViewSpot) {
    candidates.push("جولة على عمارة Gaudí المميزة، وعلى البحر خلي وقت يكفي.");
  }

  if (hasFootball) {
    candidates.push(
      "يوم مخصص لتجربة كرة القدم وأجواء المدينة من حولها.",
      "أجواء كرة قدم حقيقية، مع وقت لبعض أبرز معالم المدينة حواليها."
    );
  }

  if (gaudiCount >= 2) {
    candidates.push(
      "جولة على أشهر معالم Gaudí المعمارية بدون تعقيد.",
      "يوم مخصص لعبقرية Gaudí المعمارية في أكثر من موقع."
    );
  }

  if (oldCityCount >= 2) {
    candidates.push(
      stopCount >= 5
        ? "يوم غني بين أزقة برشلونة القديمة، وفيه وقت كافي لأجمل زواياها التاريخية."
        : "تجول بين أزقة برشلونة القديمة وأجمل معالمها التاريخية."
    );
  }

  if (interests.includes("foodShoppingNightlife") && oldCityCount >= 1) {
    candidates.push("يوم بين أزقة تسوق، مطاعم، وأجواء سهر مسائية.");
  }

  if (hasBeach) {
    candidates.push(stopCount <= 2 ? "يوم أخف على الشاطئ — وقت أكبر للاسترخاء بدون تعب." : "يوم مريح على الشاطئ بعيدًا عن الزحمة.");
  }

  if (lastStopIsSunsetView) {
    candidates.push(stopCount >= 4 ? "يوم مليء بالمعالم، ينتهي بإطلالة تستاهل الانتظار." : "يوم أخف، ينتهي بإطلالة تستاهل الانتظار.");
  }

  // Always-valid fallback, appended last so it's only used when nothing more specific fits.
  candidates.push(stopCount <= 2 ? "يوم أخف، بوقت أكبر للاستمتاع بدون استعجال." : "خطة متوازنة تجمع أهم معالم برشلونة بدون تعب زيادة.");

  return candidates;
}

/**
 * One sentence, maximum — never a paragraph. Picks the first candidate not already used
 * elsewhere in the same plan (see `usedSummaries`, threaded from `presentBarcelonaSmartPlan`)
 * so two days never show byte-identical summary text when a real alternative exists; falls
 * back to a repeat only if every genuinely-matching candidate for this specific day is
 * already used (honest degradation, never fabricates a signal that isn't there).
 */
function buildDaySummary(signals: DaySignals, day: PlannerDay, interests: readonly PlannerInterest[], usedSummaries: ReadonlySet<string>): string {
  const candidates = buildDaySummaryCandidates(signals, day, interests);
  return candidates.find((candidate) => !usedSummaries.has(candidate)) ?? candidates[0];
}

/**
 * Optional. Only returns a label when the underlying claim is genuinely backed by the day's
 * real stops/metadata/guide data — never invents a booking requirement or a claim the data
 * doesn't support. Picks at most one (first matching rule wins).
 */
function buildDayHighlight(signals: DaySignals, day: PlannerDay): string | undefined {
  const idSet = new Set(day.stops.map((stop) => stop.placeId));

  if (idSet.has("camp-nou")) {
    const attraction = barcelonaGuide.attractions.find((a) => a.id === "camp-nou");
    if (attraction && (attraction.bookingStatus === "ضروري مسبقًا" || attraction.bookingStatus === "يفضل مسبقًا")) {
      return "احجز Camp Nou مسبقًا";
    }
  }
  if (signals.lastStopIsSunsetView) {
    return "أفضل ختام: وقت الغروب";
  }
  if (signals.photoCount >= 2) {
    return "أفضل يوم للتصوير";
  }
  if (signals.hasBeach && day.totalVisitMinutes <= 300) {
    return "خلي وقت للبحر";
  }
  if (day.clusters.length <= 1) {
    return "يوم مناسب للمشي";
  }
  // V2 Final Exception Handling: a genuinely 3-stop day always gets a pacing-positive
  // highlight rather than none at all, if nothing more specific above already fired.
  if (day.stops.length === LIGHTER_DAY_STOP_COUNT) {
    return "وتيرة مريحة اليوم";
  }
  return undefined;
}

// -- Optional nearby ------------------------------------------------------------------------

const MAX_OPTIONAL_NEARBY = 4;
const MAX_FOOD_CAFE_PER_DAY = 2;
const MAX_NIGHTLIFE_PER_DAY = 1;
/** Soft cap (V1.1 polish): at most this many suggestions share the same type label, UNLESS no
 * differently-typed, geographically-valid alternative exists for the remaining slots. */
const MAX_PER_TYPE_LABEL = 2;

const FOOD_CAFE_CATEGORY_IDS = new Set(["cafes", "desserts", "breakfast"]);
const EXPERIENCE_LOCAL_CATEGORY_IDS = new Set(["food-experience", "culture"]);

function classifyFoodPlace(place: FoodPlace): PlannerOptionalSuggestionType {
  return FOOD_CAFE_CATEGORY_IDS.has(place.categoryId) ? "cafe" : "food";
}
function classifyExperience(experience: Experience): PlannerOptionalSuggestionType {
  return EXPERIENCE_LOCAL_CATEGORY_IDS.has(experience.categoryId) ? "local" : "experience";
}
function classifyAttraction(attraction: Attraction): PlannerOptionalSuggestionType {
  return PHOTOWORTHY_IDS.has(attraction.id) ? "photo" : "local";
}
// Every nightlifeVenues entry is, by definition, a "nightlife" suggestion — no sub-classification
// needed the way food/cafe or experience/local are split.

/**
 * Ranks a suggestion type by how well it matches the visitor's selected interests — used only
 * to ORDER candidates, never to hard-filter them (a low-priority type can still appear if
 * nothing better is available for that day).
 */
const INTEREST_TYPE_PRIORITY: Record<PlannerInterest, PlannerOptionalSuggestionType[]> = {
  viewsNature: ["photo", "local", "experience", "food", "cafe", "nightlife"],
  foodShoppingNightlife: ["food", "cafe", "nightlife", "local", "experience", "photo"],
  footballExperiences: ["experience", "local", "photo", "food", "cafe", "nightlife"],
  cultureLocal: ["local", "experience", "photo", "food", "cafe", "nightlife"],
  beachRelax: ["food", "cafe", "photo", "local", "experience", "nightlife"],
  popular: ["photo", "local", "food", "experience", "cafe", "nightlife"],
};

function typeScore(type: PlannerOptionalSuggestionType, interests: PlannerInterest[]): number {
  let score = 0;
  for (const interest of interests) {
    const order = INTEREST_TYPE_PRIORITY[interest];
    score += order.length - order.indexOf(type);
  }
  return score;
}

type Candidate = { placeId: string; type: PlannerOptionalSuggestionType; reason: string };

/** Geographically-relevant, not-already-used candidates for one day — drawn only from real guide data. */
function collectCandidates(day: PlannerDay, excludeIds: ReadonlySet<string>): Candidate[] {
  const clusters = day.clusters;
  if (clusters.length === 0) return [];
  const fallbackAreaLabel = clusters.map((cluster) => CLUSTER_LABEL[cluster]).find(Boolean) ?? "مسار اليوم";
  const candidates: Candidate[] = [];

  for (const attraction of barcelonaGuide.attractions) {
    if (excludeIds.has(attraction.id)) continue;
    const matchedCluster = clusters.find((cluster) => CLUSTER_TO_GUIDE_AREA_ID[cluster] === attraction.areaId);
    if (!matchedCluster) continue;
    const areaLabel = CLUSTER_LABEL[matchedCluster] ?? fallbackAreaLabel;
    candidates.push({ placeId: attraction.id, type: classifyAttraction(attraction), reason: `قريب من مسار ${areaLabel}` });
  }

  for (const food of barcelonaGuide.foodPlaces) {
    if (excludeIds.has(food.id)) continue;
    const areaLower = food.area.toLowerCase();
    const matchedCluster = clusters.find((cluster) => (CLUSTER_AREA_KEYWORDS[cluster] ?? []).some((keyword) => areaLower.includes(keyword)));
    if (!matchedCluster) continue;
    const areaLabel = CLUSTER_LABEL[matchedCluster] ?? fallbackAreaLabel;
    candidates.push({ placeId: food.id, type: classifyFoodPlace(food), reason: `مناسب بعد جولة ${areaLabel}` });
  }

  for (const experience of barcelonaGuide.experiences) {
    if (excludeIds.has(experience.id)) continue;
    const areaLower = (experience.area ?? "").toLowerCase();
    if (!areaLower) continue;
    const matchedCluster = clusters.find((cluster) => (CLUSTER_AREA_KEYWORDS[cluster] ?? []).some((keyword) => areaLower.includes(keyword)));
    if (!matchedCluster) continue;
    const areaLabel = CLUSTER_LABEL[matchedCluster] ?? fallbackAreaLabel;
    candidates.push({ placeId: experience.id, type: classifyExperience(experience), reason: `تجربة قريبة من ${areaLabel}` });
  }

  for (const venue of barcelonaGuide.nightlifeVenues) {
    if (excludeIds.has(venue.id)) continue;
    const areaLower = venue.area.toLowerCase();
    const matchedCluster = clusters.find((cluster) => (CLUSTER_AREA_KEYWORDS[cluster] ?? []).some((keyword) => areaLower.includes(keyword)));
    if (!matchedCluster) continue;
    const areaLabel = CLUSTER_LABEL[matchedCluster] ?? fallbackAreaLabel;
    candidates.push({ placeId: venue.id, type: "nightlife", reason: `سهرة قريبة من ${areaLabel}` });
  }

  return candidates;
}

/**
 * Deterministic selection: rank by interest-fit then placeId (never randomized), cap at
 * MAX_OPTIONAL_NEARBY total and MAX_FOOD_CAFE_PER_DAY food/cafe combined. Never turns into a
 * numbered itinerary — this is purely a flat list of optional suggestions.
 *
 * V1.1 polish: also applies a SOFT `MAX_PER_TYPE_LABEL` diversity cap on top of the existing
 * hard caps, so a day doesn't show e.g. 4 identical "🧭 مكان محلي" cards when better-varied
 * real candidates exist. It's a pure SELECTION cap layered on top of `ranked` (which is
 * already sorted by geographic relevance via `collectCandidates` + interest fit) — it never
 * re-orders by type and never invents/loosens geographic matching. If enforcing diversity
 * would leave slots empty (no differently-typed candidate left), a second pass without the
 * diversity cap fills the remaining slots from the same already-geo-filtered pool, so
 * suggestion quality never drops just to force variety that isn't really there.
 */
function pickOptionalNearby(day: PlannerDay, preferences: PlannerPreferences, excludeIds: ReadonlySet<string>): PlannerOptionalSuggestion[] {
  const ranked = collectCandidates(day, excludeIds).sort((a, b) => {
    const scoreDiff = typeScore(b.type, preferences.interests) - typeScore(a.type, preferences.interests);
    if (scoreDiff !== 0) return scoreDiff;
    return a.placeId.localeCompare(b.placeId);
  });

  function select(enforceTypeDiversity: boolean): PlannerOptionalSuggestion[] {
    const picked: PlannerOptionalSuggestion[] = [];
    const typeCounts = new Map<PlannerOptionalSuggestionType, number>();
    let foodCafeCount = 0;
    let nightlifeCount = 0;
    for (const candidate of ranked) {
      if (picked.length >= MAX_OPTIONAL_NEARBY) break;
      if (picked.some((entry) => entry.placeId === candidate.placeId)) continue;
      const isFoodOrCafe = candidate.type === "food" || candidate.type === "cafe";
      if (isFoodOrCafe && foodCafeCount >= MAX_FOOD_CAFE_PER_DAY) continue;
      if (candidate.type === "nightlife" && nightlifeCount >= MAX_NIGHTLIFE_PER_DAY) continue;
      if (enforceTypeDiversity && (typeCounts.get(candidate.type) ?? 0) >= MAX_PER_TYPE_LABEL) continue;

      picked.push({ placeId: candidate.placeId, type: candidate.type, reason: candidate.reason });
      typeCounts.set(candidate.type, (typeCounts.get(candidate.type) ?? 0) + 1);
      if (isFoodOrCafe) foodCafeCount++;
      if (candidate.type === "nightlife") nightlifeCount++;
    }
    return picked;
  }

  const diverse = select(true);
  if (diverse.length >= MAX_OPTIONAL_NEARBY) return diverse;
  // Soft rule only -- if diversity alone can't fill every slot, fall back to the full ranked
  // pool (still geography-filtered, just without the per-type cap) rather than leaving gaps.
  return select(false);
}

// -- Entry point ------------------------------------------------------------------------------

/**
 * Builds the presentation layer for an already-generated, already-optimized Barcelona plan.
 * Pure and deterministic: the same (plan, preferences) pair always produces the same output.
 * Never mutates `plan` and never influences it — call this strictly AFTER Day Builder + Route
 * Optimizer + Route Legs have already run (see generateBarcelonaSmartPlan.ts), passing its own
 * already-optimized `plan` through unchanged.
 */
export function presentBarcelonaSmartPlan(plan: GeneratedPlannerPlan, preferences: PlannerPreferences): PresentedPlannerPlan {
  const allMainStopIds = new Set(plan.days.flatMap((day) => day.stops.map((stop) => stop.placeId)));
  const usedSuggestionIds = new Set(PRESENTATION_EXCLUDED_PLACE_IDS);
  const usedSummaries = new Set<string>();
  const usedTitles = new Set<string>();

  const byDay: PlannerDayPresentation[] = plan.days.map((day) => {
    const signals = computeDaySignals(day);
    const title = buildDayTitle(signals, day, preferences.interests, usedTitles);
    usedTitles.add(title);
    const summary = buildDaySummary(signals, day, preferences.interests, usedSummaries);
    usedSummaries.add(summary);
    const highlight = buildDayHighlight(signals, day);

    const excludeIds = new Set([...allMainStopIds, ...usedSuggestionIds]);
    const optionalNearby = pickOptionalNearby(day, preferences, excludeIds);
    for (const suggestion of optionalNearby) usedSuggestionIds.add(suggestion.placeId);

    return { title, summary, highlight, optionalNearby };
  });

  return { byDay };
}
