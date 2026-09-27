import type { PlannerPlaceMetadata } from "./plannerTypes";

/**
 * Barcelona Smart Planner — metadata layer.
 *
 * Only references existing place ids from app/lib/barcelona-guide.ts (verified to exist
 * as of this file's creation — see the audit report). No place data (name/address/hours/
 * image/rating/price/maps links/description) is duplicated here; resolve `placeId` against
 * the real guide data at render time, the same way app/lib/readyPlan.ts does for the Ready Plan.
 *
 * Metadata only: no scoring/ranking logic, no UI, no AI. That comes in a later task.
 */
export const barcelonaPlannerMetadata: PlannerPlaceMetadata[] = [
  {
    placeId: "sagrada-familia",
    weights: { popular: 10, cultureLocal: 10, viewsNature: 3, beachRelax: 0, footballExperiences: 2, foodShoppingNightlife: 0 },
    priority: 10,
    preferredTime: "morning",
    cluster: "eixample-north",
    visitDurationMinutes: 120,
  },
  {
    placeId: "sant-pau",
    weights: { popular: 7, cultureLocal: 9, viewsNature: 4, beachRelax: 0, footballExperiences: 1, foodShoppingNightlife: 0 },
    priority: 7,
    preferredTime: "daytime",
    cluster: "eixample-north",
    visitDurationMinutes: 60,
  },
  {
    // V2 density closure: a real, already-verified guide attraction (added to the guide in an
    // earlier task, address/hours/coordinates verified) that was simply never given planner
    // metadata. A few minutes' walk from sagrada-familia -- same cluster. Weights follow the
    // guide's own description ("سوق حي أصيل بعيد عن الزحمة السياحية" -- an authentic LOCAL
    // market, not an iconic/touristy one): moderate cultureLocal/foodShoppingNightlife, low
    // popular/priority (a genuine but minor stop, never meant to outrank a real attraction),
    // short visitDurationMinutes matching the guide's own "15-20 دقيقة" quick-stop framing.
    placeId: "mercat-sagrada-familia",
    weights: { popular: 5, cultureLocal: 8, viewsNature: 1, beachRelax: 0, footballExperiences: 0, foodShoppingNightlife: 8 },
    priority: 5,
    preferredTime: "morning",
    cluster: "eixample-north",
    visitDurationMinutes: 20,
  },
  {
    placeId: "park-guell",
    weights: { popular: 10, cultureLocal: 8, viewsNature: 9, beachRelax: 0, footballExperiences: 3, foodShoppingNightlife: 0 },
    priority: 10,
    preferredTime: "morning/daytime",
    cluster: "gracia-north",
    visitDurationMinutes: 120,
  },
  {
    placeId: "bunkers-carmel",
    weights: { popular: 8, cultureLocal: 3, viewsNature: 10, beachRelax: 1, footballExperiences: 3, foodShoppingNightlife: 0 },
    priority: 9,
    preferredTime: "sunset",
    cluster: "gracia-north",
    visitDurationMinutes: 60,
  },
  {
    // V2.1 balance closure: a real, existing guide shoppingArea (id "passeig-de-gracia",
    // stored address "Passeig de Gràcia, 08007 Barcelona, Spain") -- the same street casa-batllo
    // and casa-mila already sit on, so cluster="passeig-gracia" is exact, not a judgment call.
    // Deliberately NOT a member of the gaudi-core similarity group: it's a genuinely different
    // kind of stop (browsing the boulevard/window shopping), not another Gaudí building visit,
    // so it adds real variety to a day rather than competing with casa-mila for the same cap.
    // Weights lead with foodShoppingNightlife (its real purpose per the guide's own "شارع
    // الماركات العالمية الفاخرة" description); priority kept low so it never outranks a real
    // attraction. visitDurationMinutes matches the guide's other "walk through a central point"
    // stops (placa-catalunya, 30min) rather than a full building visit.
    placeId: "passeig-de-gracia",
    weights: { popular: 6, cultureLocal: 4, viewsNature: 2, beachRelax: 0, footballExperiences: 0, foodShoppingNightlife: 9 },
    priority: 6,
    preferredTime: "anytime",
    cluster: "passeig-gracia",
    visitDurationMinutes: 30,
  },
  {
    placeId: "casa-batllo",
    weights: { popular: 9, cultureLocal: 9, viewsNature: 5, beachRelax: 0, footballExperiences: 2, foodShoppingNightlife: 2 },
    priority: 9,
    preferredTime: "daytime",
    cluster: "passeig-gracia",
    visitDurationMinutes: 90,
  },
  {
    placeId: "casa-mila",
    weights: { popular: 8, cultureLocal: 9, viewsNature: 5, beachRelax: 0, footballExperiences: 2, foodShoppingNightlife: 2 },
    priority: 8,
    preferredTime: "daytime",
    cluster: "passeig-gracia",
    visitDurationMinutes: 90,
  },
  {
    placeId: "placa-catalunya",
    weights: { popular: 8, cultureLocal: 5, viewsNature: 2, beachRelax: 0, footballExperiences: 1, foodShoppingNightlife: 8 },
    priority: 7,
    preferredTime: "anytime",
    cluster: "city-center",
    visitDurationMinutes: 30,
  },
  {
    // V2.1 balance closure: a real, existing guide shoppingArea (id "portal-angel", stored
    // address "Portal de l'Àngel, 08002 Barcelona, Spain") -- the pedestrian street directly
    // connecting Plaça de Catalunya to the Gothic Quarter, so cluster="old-city" reflects
    // where it actually sits (immediately adjacent to gothic-quarter/barcelona-cathedral).
    // Weights lead with foodShoppingNightlife per the guide's own "شارع مزدحم بالماركات
    // المتوسطة والشائعة" description; priority kept low, same reasoning as passeig-de-gracia
    // above. visitDurationMinutes matches the same "walk through a central point" precedent.
    placeId: "portal-angel",
    weights: { popular: 4, cultureLocal: 3, viewsNature: 1, beachRelax: 0, footballExperiences: 0, foodShoppingNightlife: 9 },
    priority: 5,
    preferredTime: "anytime",
    cluster: "old-city",
    visitDurationMinutes: 30,
  },
  {
    placeId: "gothic-quarter",
    weights: { popular: 9, cultureLocal: 10, viewsNature: 6, beachRelax: 0, footballExperiences: 2, foodShoppingNightlife: 7 },
    priority: 10,
    preferredTime: "daytime/evening",
    cluster: "old-city",
    visitDurationMinutes: 120,
  },
  {
    placeId: "barcelona-cathedral",
    weights: { popular: 8, cultureLocal: 10, viewsNature: 5, beachRelax: 0, footballExperiences: 1, foodShoppingNightlife: 2 },
    priority: 8,
    preferredTime: "daytime",
    cluster: "old-city",
    visitDurationMinutes: 60,
  },
  {
    placeId: "la-rambla",
    weights: { popular: 9, cultureLocal: 6, viewsNature: 3, beachRelax: 0, footballExperiences: 1, foodShoppingNightlife: 9 },
    priority: 8,
    preferredTime: "daytime/evening",
    cluster: "old-city",
    visitDurationMinutes: 60,
  },
  {
    placeId: "boqueria",
    weights: { popular: 8, cultureLocal: 8, viewsNature: 2, beachRelax: 0, footballExperiences: 2, foodShoppingNightlife: 10 },
    priority: 8,
    preferredTime: "morning/daytime",
    cluster: "old-city",
    visitDurationMinutes: 60,
  },
  {
    placeId: "placa-reial",
    weights: { popular: 7, cultureLocal: 7, viewsNature: 4, beachRelax: 0, footballExperiences: 1, foodShoppingNightlife: 9 },
    priority: 7,
    preferredTime: "evening",
    cluster: "old-city",
    visitDurationMinutes: 45,
  },
  {
    placeId: "palau-musica",
    weights: { popular: 7, cultureLocal: 10, viewsNature: 5, beachRelax: 0, footballExperiences: 3, foodShoppingNightlife: 2 },
    priority: 7,
    preferredTime: "daytime/evening",
    cluster: "born",
    visitDurationMinutes: 75,
  },
  {
    placeId: "arc-de-triomf",
    weights: { popular: 7, cultureLocal: 6, viewsNature: 7, beachRelax: 0, footballExperiences: 1, foodShoppingNightlife: 1 },
    priority: 6,
    preferredTime: "daytime",
    cluster: "born",
    visitDurationMinutes: 30,
  },
  {
    placeId: "ciutadella",
    weights: { popular: 7, cultureLocal: 5, viewsNature: 9, beachRelax: 2, footballExperiences: 2, foodShoppingNightlife: 1 },
    priority: 7,
    preferredTime: "daytime",
    cluster: "born",
    visitDurationMinutes: 90,
  },
  {
    // Guide gap-fill (V2.2): a real, extremely highly-rated (4.7★/40k+ reviews) Gothic
    // basilica, verified 2026-08. Genuinely worth recommending on its own merits (see this
    // task's report) -- not required to fix the remaining 6 underfilled profiles, but adds
    // depth/variety to old-city+born days. cultureLocal-led weights; priority kept at 8,
    // matching (not exceeding) barcelona-cathedral's own priority.
    placeId: "santa-maria-del-mar",
    weights: { popular: 8, cultureLocal: 9, viewsNature: 3, beachRelax: 0, footballExperiences: 1, foodShoppingNightlife: 1 },
    priority: 8,
    preferredTime: "daytime/evening",
    cluster: "born",
    visitDurationMinutes: 40,
  },
  {
    placeId: "barceloneta-beach",
    weights: { popular: 9, cultureLocal: 3, viewsNature: 8, beachRelax: 10, footballExperiences: 3, foodShoppingNightlife: 6 },
    priority: 9,
    preferredTime: "morning/afternoon",
    cluster: "seafront",
    visitDurationMinutes: 120,
  },
  {
    // Guide gap-fill (V2.2): the structural fix for the old-city+seafront+seafront-east
    // 3-cluster-maxed failure pattern. Verified 2026-08 to be only 7min/450m flat walk from
    // barceloneta-beach (vs 17min/1.2km to ciutadella) -- genuinely closer to "seafront" than
    // "born", so cluster="seafront" reflects real geography, not a convenience pick. This lets
    // an old-city+seafront+seafront-east day add it as a 4th stop within the already-used
    // "seafront" cluster instead of needing a blocked 4th cluster.
    placeId: "museu-historia-catalunya",
    weights: { popular: 5, cultureLocal: 7, viewsNature: 3, beachRelax: 2, footballExperiences: 1, foodShoppingNightlife: 2 },
    priority: 6,
    preferredTime: "daytime",
    cluster: "seafront",
    visitDurationMinutes: 75,
  },
  {
    placeId: "bogatell",
    weights: { popular: 6, cultureLocal: 1, viewsNature: 7, beachRelax: 10, footballExperiences: 3, foodShoppingNightlife: 4 },
    priority: 6,
    preferredTime: "morning/afternoon",
    cluster: "seafront-east",
    visitDurationMinutes: 120,
  },
  {
    placeId: "nova-icaria",
    weights: { popular: 6, cultureLocal: 1, viewsNature: 7, beachRelax: 10, footballExperiences: 3, foodShoppingNightlife: 4 },
    priority: 6,
    preferredTime: "morning/afternoon",
    cluster: "seafront-east",
    visitDurationMinutes: 120,
  },
  {
    // Montjuïc identity cleanup: placeId moved from the old vague "montjuic" to the precise
    // "mnac" (Museu Nacional d'Art de Catalunya / Plaça d'Espanya approach) guide entry.
    // Weights/priority/preferredTime/visitDurationMinutes intentionally left unchanged from
    // the original generic-Montjuïc values — see that task's report for the values flagged
    // as worth reconsidering (footballExperiences weight, visitDurationMinutes) but NOT
    // applied here, per "prefer leaving scoring behavior stable in this task".
    placeId: "mnac",
    weights: { popular: 8, cultureLocal: 8, viewsNature: 10, beachRelax: 1, footballExperiences: 7, foodShoppingNightlife: 2 },
    priority: 9,
    preferredTime: "daytime/sunset",
    cluster: "montjuic",
    visitDurationMinutes: 180,
  },
  {
    placeId: "camp-nou",
    weights: { popular: 8, cultureLocal: 5, viewsNature: 3, beachRelax: 0, footballExperiences: 10, foodShoppingNightlife: 3 },
    priority: 8,
    preferredTime: "daytime",
    cluster: "les-corts",
    visitDurationMinutes: 120,
  },
  {
    // Guide gap-fill (V2.2): Camp Nou was the ONLY les-corts place -- this real Gothic
    // monastery (verified 2026-08, ~28min transit from Camp Nou) gives the cluster a second
    // real stop, letting a les-corts+2-beaches (or les-corts+gracia-north+tibidabo) day pick
    // up a 4th stop WITHOUT adding a 4th cluster. cultureLocal-led weights and a conservative
    // priority (well under Sagrada Família/Park Güell/Gothic Quarter's 9-10) keep it from ever
    // outranking a core landmark -- see this task's report for the reasoning.
    placeId: "monestir-pedralbes",
    weights: { popular: 5, cultureLocal: 8, viewsNature: 3, beachRelax: 0, footballExperiences: 2, foodShoppingNightlife: 0 },
    priority: 6,
    preferredTime: "morning",
    cluster: "les-corts",
    visitDurationMinutes: 60,
  },
  {
    // Guide gap-fill (V2.2): a free public garden directly across Avinguda Diagonal from
    // Camp Nou -- verified 2026-08, ~20min walk/transit, notably closer than the monastery
    // above. Same les-corts-scarcity fix, plus gives a free/short option alongside the paid
    // monastery. Low priority/weights so it never outranks a real landmark.
    placeId: "jardins-palau-pedralbes",
    weights: { popular: 4, cultureLocal: 3, viewsNature: 6, beachRelax: 1, footballExperiences: 2, foodShoppingNightlife: 0 },
    priority: 5,
    preferredTime: "anytime",
    cluster: "les-corts",
    visitDurationMinutes: 35,
  },
  {
    placeId: "tibidabo",
    weights: { popular: 7, cultureLocal: 4, viewsNature: 10, beachRelax: 1, footballExperiences: 8, foodShoppingNightlife: 2 },
    priority: 7,
    preferredTime: "daytime/sunset",
    cluster: "tibidabo",
    visitDurationMinutes: 180,
  },
  {
    // V1.6 candidate-pool expansion (Food/Shopping/Nightlife): promoted from the existing
    // Guide Experience entry "cook-and-taste-paella-class" (real bookingUrl, Gothic Quarter
    // market tour + hands-on cooking class) -- see the "Smart Planner Food Candidate Pool
    // Audit" task's report for why this was selected over every other Food/Nightlife entry
    // inspected (a genuine multi-hour activity, not just a meal choice; low taste-dependency;
    // no alcohol/nightlife assumption). visitDurationMinutes=210 is the deterministic
    // midpoint of the Guide's own "3-4 ساعات" range -- not invented, not shortened to fit.
    // Weights lead heavily with foodShoppingNightlife (the genuine hands-on food experience)
    // and moderately with cultureLocal (a real local-market immersion, one tier below a
    // landmark like Sant Pau's 9); popular kept low-moderate (a well-reviewed booked
    // activity, not a Barcelona icon -- deliberately NOT inflated to force selection outside
    // a genuine food-interest profile); every unrelated interest is 0.
    placeId: "cook-and-taste-paella-class",
    weights: { popular: 4, cultureLocal: 7, viewsNature: 0, beachRelax: 0, footballExperiences: 0, foodShoppingNightlife: 10 },
    priority: 6,
    preferredTime: "anytime",
    cluster: "old-city",
    visitDurationMinutes: 210,
  },
];

/** Looks up one place's planner metadata by its guide placeId, or undefined if not found. */
export function getBarcelonaPlannerMetadata(placeId: string): PlannerPlaceMetadata | undefined {
  return barcelonaPlannerMetadata.find((entry) => entry.placeId === placeId);
}

/** Returns every place currently covered by the planner metadata layer. */
export function getBarcelonaPlannerPlaces(): PlannerPlaceMetadata[] {
  return barcelonaPlannerMetadata;
}
