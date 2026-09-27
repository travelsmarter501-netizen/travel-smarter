import { buildPlannerRouteLegs, buildPlannerPlanRouteLegs, resolveLeg } from "./plannerRouteLegs";
import type { PlannerRouteLeg, RouteLegDataEntry } from "./plannerTransportTypes";
import type { GeneratedPlannerPlan, PlannerDay } from "./plannerDayBuilder";

/**
 * Barcelona-specific route-leg data for the Smart Planner's Route Legs layer.
 *
 * Every entry below is reused directly from app/lib/barcelona-ready-plan.ts, whose header
 * documents the verification methodology: each leg was manually checked against real Google
 * Maps and Apple Maps directions results as of 2026-08 (see that file for the full
 * source-by-source notes). Nothing here was re-verified in THIS task, so every entry is
 * `sourceStatus: "existing-project-data"`, not `"verified"`. Values are not changed from the
 * Ready Plan's own numbers.
 *
 * `allowReverseWalkingReuse` is only set on short, flat legs with no noted elevation/stairs
 * or one-way-street caveat in the source data — sant-pau<->park-guell and
 * park-guell<->bunkers-carmel both carry explicit uphill/stairs notes in the Ready Plan and
 * are intentionally left non-reversible. Transit and car durations are never reused in
 * reverse for any entry (never assumed symmetric).
 *
 * ── MONTJUÏC SAFETY RULE ─────────────────────────────────────────────────────────────
 * The Smart Planner's Montjuïc identity cleanup moved the planner's main Montjuïc-area stop
 * from the old vague "montjuic" placeId to a precise one, "mnac" (Museu Nacional d'Art de
 * Catalunya / Plaça d'Espanya approach — see barcelona-planner-metadata.ts). The Final MNAC
 * Transport Audit then manually verified exactly 3 directional pairs into "mnac"
 * (gothic-quarter, la-rambla, placa-catalunya — see the entries below, all
 * sourceStatus "verified"). Any OTHER pair touching "mnac" not listed below is simply absent
 * from this table and falls through to the generic builder's own unresolved default — no
 * blanket override is needed to keep unverified MNAC routes from being mistaken for verified.
 *
 * "montjuic" itself is no longer referenced by the planner metadata layer at all (so it can
 * no longer appear in a Day Builder output), but is PERMANENTLY guarded below regardless —
 * see PERMANENTLY_UNRESOLVED_PLACE_IDS further down — even if a future edit ever adds a table entry
 * for it by mistake. The Ready Plan (app/lib/barcelona-ready-plan.ts) separately still uses
 * "montjuic" for its own itinerary (a different, real, already-verified upper-hill stop) —
 * that is untouched; this safety rule only concerns the Smart Planner's route-leg layer,
 * which never reads Ready Plan data.
 */
export const BARCELONA_ROUTE_LEG_DATA: RouteLegDataEntry[] = [
  {
    // Complete Transport-Time Verification: RE-VERIFIED, existing walking time was STALE.
    // Google walk 23-26min/1.5-1.8km (all routes mostly flat) -- was stored as 15-20min/1.1km,
    // a meaningful understatement. Google transit 11-15min, direct L5->L4 (both stations sit
    // on L5, one-stop change), trains every 5-6min -- fast and reliable, now clearly beats the
    // corrected walk time, so recommendedMode moves from walking to transit.
    fromPlaceId: "sagrada-familia",
    toPlaceId: "sant-pau",
    recommendedMode: "transit",
    sourceStatus: "verified",
    allowReverseWalkingReuse: true,
    options: [
      { mode: "walking", durationMinutesMin: 23, durationMinutesMax: 26, distanceKm: 1.6 },
      { mode: "transit", durationMinutesMin: 11, durationMinutesMax: 15, note: "Direct L5->L4, one-stop change, every 5-6min." },
    ],
  },
  {
    fromPlaceId: "sant-pau",
    toPlaceId: "park-guell",
    recommendedMode: "transit",
    sourceStatus: "existing-project-data",
    allowReverseWalkingReuse: false, // uphill route (Ready Plan note) — not safe to assume symmetric downhill
    options: [
      { mode: "walking", durationMinutesMin: 35, durationMinutesMax: 40, distanceKm: 2.3, note: "Uphill route." },
      { mode: "transit", durationMinutesMin: 25, durationMinutesMax: 30, note: "Direct bus — range includes wait time, not just ride time." },
      { mode: "car", durationMinutesMin: 10, durationMinutesMax: 15 },
    ],
  },
  {
    fromPlaceId: "park-guell",
    toPlaceId: "bunkers-carmel",
    recommendedMode: "walking",
    sourceStatus: "existing-project-data",
    allowReverseWalkingReuse: false, // uphill + stairs (Ready Plan note) — not safe to assume symmetric
    options: [
      { mode: "walking", durationMinutesMin: 20, durationMinutesMax: 25, distanceKm: 1.5, note: "Uphill, some stairs." },
      { mode: "transit", durationMinutesMin: 20, durationMinutesMax: 25 },
      {
        mode: "car",
        durationMinutesMin: 7,
        durationMinutesMax: 20,
        note: "Time varies a lot due to Park Güell's limited vehicle access and one-way restrictions.",
      },
    ],
  },
  {
    fromPlaceId: "casa-mila",
    toPlaceId: "casa-batllo",
    recommendedMode: "walking",
    sourceStatus: "existing-project-data",
    allowReverseWalkingReuse: true,
    options: [{ mode: "walking", durationMinutesMin: 7, durationMinutesMax: 9, distanceKm: 0.5 }],
  },
  {
    fromPlaceId: "barceloneta-beach",
    toPlaceId: "ciutadella",
    recommendedMode: "walking",
    sourceStatus: "existing-project-data",
    allowReverseWalkingReuse: true,
    options: [
      { mode: "walking", durationMinutesMin: 18, durationMinutesMax: 22, distanceKm: 1.5 },
      { mode: "transit", durationMinutesMin: 15, durationMinutesMax: 20 },
      { mode: "car", durationMinutesMin: 10, durationMinutesMax: 15 },
    ],
  },
  {
    fromPlaceId: "ciutadella",
    toPlaceId: "arc-de-triomf",
    recommendedMode: "walking",
    sourceStatus: "existing-project-data",
    allowReverseWalkingReuse: true,
    options: [{ mode: "walking", durationMinutesMin: 10, durationMinutesMax: 12, distanceKm: 0.8 }],
  },
  {
    fromPlaceId: "arc-de-triomf",
    toPlaceId: "gothic-quarter",
    recommendedMode: "walking",
    sourceStatus: "existing-project-data",
    allowReverseWalkingReuse: true,
    options: [
      { mode: "walking", durationMinutesMin: 15, durationMinutesMax: 18, distanceKm: 1.2 },
      { mode: "car", durationMinutesMin: 9, durationMinutesMax: 11 },
    ],
  },
  {
    fromPlaceId: "gothic-quarter",
    toPlaceId: "barcelona-cathedral",
    recommendedMode: "walking",
    sourceStatus: "existing-project-data",
    allowReverseWalkingReuse: true,
    options: [{ mode: "walking", durationMinutesMin: 2, durationMinutesMax: 2, distanceKm: 0.15 }],
  },
  {
    fromPlaceId: "barcelona-cathedral",
    toPlaceId: "la-rambla",
    recommendedMode: "walking",
    sourceStatus: "existing-project-data",
    allowReverseWalkingReuse: true,
    options: [{ mode: "walking", durationMinutesMin: 5, durationMinutesMax: 8, distanceKm: 0.55 }],
  },
  {
    fromPlaceId: "la-rambla",
    toPlaceId: "boqueria",
    recommendedMode: "walking",
    sourceStatus: "existing-project-data",
    allowReverseWalkingReuse: true,
    options: [{ mode: "walking", durationMinutesMin: 2, durationMinutesMax: 2, distanceKm: 0.15 }],
  },
  {
    fromPlaceId: "boqueria",
    toPlaceId: "placa-catalunya",
    recommendedMode: "walking",
    sourceStatus: "existing-project-data",
    allowReverseWalkingReuse: true,
    options: [
      { mode: "walking", durationMinutesMin: 8, durationMinutesMax: 10, distanceKm: 0.6 },
      { mode: "transit", durationMinutesMin: 5, durationMinutesMax: 10 },
      { mode: "car", durationMinutesMin: 10, durationMinutesMax: 15 },
    ],
  },

  // ── Transport Route Audit V1 (verified 2026-08) ─────────────────────────────────────
  // The 13 entries below were manually checked in THIS task against live Google Maps and
  // Apple Maps directions results (both walking/driving; transit only where each provider
  // actually surfaced it — Apple's web client never exposed transit for any of these).
  // `sourceStatus: "verified"`, not "existing-project-data". Ranges combine both sources'
  // visible route options; a single `distanceKm` is stored per the type (no range support),
  // with both sources' raw distances documented in the leg comment. No `allowReverseWalkingReuse`
  // was added automatically per the audit's scope — see the task report for reversal candidates.
  {
    // Google walk 21-23min/1.5-1.6km (flat); Apple walk 20-21min/0.9-1.0mi(~1.4-1.6km, flat).
    // Google transit 11-16min (best: direct L1/L3 metro from Arc de Triomf, 11min). Google car
    // 17-19min/3.0-3.3km; Apple car 19-22min/1.9-3.3mi (fastest 19min/1.9mi, current road closure
    // on La Rambla affects the route). Direct metro is materially faster than the ~20min walk.
    fromPlaceId: "arc-de-triomf",
    toPlaceId: "boqueria",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 20, durationMinutesMax: 23, distanceKm: 1.5 },
      { mode: "transit", durationMinutesMin: 11, durationMinutesMax: 16, note: "Fastest: direct L1/L3 metro from Arc de Triomf station." },
      { mode: "car", durationMinutesMin: 17, durationMinutesMax: 22 },
    ],
  },
  {
    // Google walk 20-24min/1.5-1.8km (flat seafront promenade); Apple walk (exact address
    // pair) 21-22min/1.1mi(~1.8km, flat). Google transit 19-22min (bus only — no faster than
    // walking). Google car 6min/2.2-3.2km; Apple car 6min/1.1-1.2mi(~1.8-1.9km) — sources
    // agree on driving time but distance figures diverge notably between providers.
    fromPlaceId: "barceloneta-beach",
    toPlaceId: "bogatell",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 20, durationMinutesMax: 22, distanceKm: 1.7, note: "Flat seafront promenade (Passeig Marítim)." },
      { mode: "transit", durationMinutesMin: 19, durationMinutesMax: 22, note: "Bus only; not materially faster than walking." },
      { mode: "car", durationMinutesMin: 6, durationMinutesMax: 6 },
    ],
  },
  {
    // Google walk 8-9min/0.6km (flat, dense pedestrian old-city streets); Apple walk
    // 8-9min/0.4mi(~0.6km), one route noted "gently uphill". No distinct transit route
    // offered by Google (falls back to walking) — too short for transit to help. Google car
    // 13min/1.4km and Apple car 13min/0.9mi(~1.4km) agree exactly, but driving is clearly
    // worse than walking here (forced detour around the pedestrian zone).
    fromPlaceId: "boqueria",
    toPlaceId: "barcelona-cathedral",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 8, durationMinutesMax: 9, distanceKm: 0.6 }],
  },
  {
    // Google walk 8-10min/0.6-0.75km (flat); Apple walk 7-8min/0.3-0.4mi(~0.5-0.65km, flat).
    // Short dense pedestrian-zone leg — transit/car not checked (guidance: avoid recommending
    // them for very short central walks regardless of what a routing engine technically lists).
    fromPlaceId: "boqueria",
    toPlaceId: "gothic-quarter",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 7, durationMinutesMax: 10, distanceKm: 0.6 }],
  },
  {
    // Both hillside destinations, ~2km apart by straight line but NOT close on foot. Google
    // walk: 1h54-1h59min/6.7-7.3km. Apple walk: 1h57-1h59min/3.7-3.8mi(~6.0-6.1km), explicitly
    // flagged "1,350-1,400 ft climb" (~410-430m). Walking is impractical and intentionally
    // EXCLUDED from options below (see the audit report). Google transit: 52min-1h9min, every
    // itinerary requires a bus/tram leg PLUS the Funicular Cuca de Llum (no direct route).
    // Google car: 28-29min/11.1km via BP-1417 mountain road (34min/13.5km alt). Apple car:
    // 25min/6mi(~9.7km). Car is clearly the most practical option given the elevation/distance.
    fromPlaceId: "bunkers-carmel",
    toPlaceId: "tibidabo",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 52, durationMinutesMax: 69, note: "Requires a bus/tram leg plus the Funicular Cuca de Llum — no direct route." },
      { mode: "car", durationMinutesMin: 25, durationMinutesMax: 29 },
    ],
  },
  {
    // Cross-city leg. Google walk: 1h4min/4.7km, flat but Google flags the route as partly
    // using "restricted or private roads" — walking is intentionally EXCLUDED from options
    // below. Google transit: 29-40min (best: 29-30min via direct L5->L3 or L3 from Palau
    // Reial metro). Google car: 18-23min/4.8-5.5km (usual traffic); Apple car: 18-20min/
    // 3.0-3.7mi(~4.8-6.0km) — sources agree closely. Apple's web client did not expose
    // transit for this route. Transit chosen over car: only ~10min slower, avoids the
    // difficult/expensive parking near Casa Batlló on Passeig de Gràcia.
    fromPlaceId: "camp-nou",
    toPlaceId: "casa-batllo",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 29, durationMinutesMax: 40, note: "Fastest: direct L5/L3 metro, ~29-30min." },
      { mode: "car", durationMinutesMin: 18, durationMinutesMax: 23, distanceKm: 5.2 },
    ],
  },
  {
    // Google walk 10-11min/0.75-0.8km (flat, along Passeig de Gràcia); Apple walk 9min/
    // 0.4mi(~0.6km, gently downhill). Short practical urban walk — transit/car not checked.
    fromPlaceId: "casa-batllo",
    toPlaceId: "placa-catalunya",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 9, durationMinutesMax: 11, distanceKm: 0.7 }],
  },
  {
    // Google walk 13-14min/0.95-1.0km (negligible net elevation change); Apple walk
    // 12-13min/0.6mi(~0.97km), noted "gentle hill". Short practical Born-area walk —
    // transit/car not checked.
    fromPlaceId: "ciutadella",
    toPlaceId: "palau-musica",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 12, durationMinutesMax: 14, distanceKm: 1.0, note: "Gentle hill noted by one source." }],
  },
  {
    // Verified using the guide's own stored la-rambla anchor (Pla de la Boqueria) rather than
    // a bare "La Rambla Barcelona" search — La Rambla is a ~1.2km street, and the generic
    // query resolved to inconsistent points between Google and Apple (see audit report).
    // With the precise anchor: Google walk 5-6min/0.4-0.45km (flat); Apple walk 6min/
    // 0.3mi(~0.48km, flat) — closely consistent. Very short pedestrian leg.
    fromPlaceId: "gothic-quarter",
    toPlaceId: "la-rambla",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 5, durationMinutesMax: 6, distanceKm: 0.45 }],
  },
  {
    // Verified using the guide's stored la-rambla anchor (Pla de la Boqueria) — a generic
    // "La Rambla Barcelona" query produced inconsistent, unreliable results between and
    // within providers for this longer leg (see audit report). With the precise anchor:
    // Google walk 28-30min/2.0-2.1km (flat); Apple walk 27min/1.2-1.3mi(~1.9-2.1km, flat) —
    // now closely consistent. Google transit 23-24min (metro L4 or bus D20). Google car
    // 24-27min/3.5-4.7km (heavy traffic noted); Apple car 19-23min/2.0-2.6mi(~3.2-4.2km).
    // Walking kept as recommended: only ~5min slower than transit, pleasant Born-area route.
    fromPlaceId: "la-rambla",
    toPlaceId: "barceloneta-beach",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 27, durationMinutesMax: 30, distanceKm: 2.0 },
      { mode: "transit", durationMinutesMin: 23, durationMinutesMax: 24 },
      { mode: "car", durationMinutesMin: 19, durationMinutesMax: 27 },
    ],
  },
  {
    // Verified using the guide's stored la-rambla anchor (Pla de la Boqueria). Google walk
    // 4min/270-280m (flat); Apple walk 3min/0.1mi(~0.16km, flat). Very short pedestrian leg.
    fromPlaceId: "la-rambla",
    toPlaceId: "placa-reial",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 3, durationMinutesMax: 4, distanceKm: 0.2 }],
  },
  {
    // Google walk 27-29min/2.0-2.1km (negligible net elevation); Apple walk 26-28min/
    // 1.3mi(~2.1km, one route "gentle hill"). Google transit 18-21min (direct L4 metro, best
    // 18-19min) — materially faster than the ~27min walk. Google car 10-12min/2.1-3.0km;
    // Apple car 8-11min/1.3-1.5mi(~2.1-2.4km) — car is fastest, but transit chosen over car
    // per Barcelona urban usability (parking near the beach is limited; metro is direct).
    fromPlaceId: "palau-musica",
    toPlaceId: "barceloneta-beach",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 26, durationMinutesMax: 29, distanceKm: 2.0 },
      { mode: "transit", durationMinutesMin: 18, durationMinutesMax: 21, note: "Direct L4 metro." },
      { mode: "car", durationMinutesMin: 8, durationMinutesMax: 12 },
    ],
  },
  {
    // Google walk 15-16min/1.1-1.2km (negligible net elevation); Apple walk 13-14min/
    // 0.6-0.7mi(~1.0-1.1km), one route noted "gentle hill". Short/moderate dense
    // Gothic-Quarter-to-Born walk — transit/car not checked (clearly walkable distance).
    fromPlaceId: "placa-reial",
    toPlaceId: "palau-musica",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 13, durationMinutesMax: 16, distanceKm: 1.05, note: "Gentle hill noted by one source." }],
  },

  // ── Final MNAC Transport Audit (verified 2026-08) ───────────────────────────────────
  // These 3 entries target the EXACT stored MNAC anchor (Museu Nacional d'Art de Catalunya,
  // Palau Nacional, Parc de Montjuïc, s/n, 08038 Barcelona — coordinates 41.3684399,2.15357),
  // resolved directly via that coordinate pin in both Google and Apple Maps (not a generic
  // "Montjuïc"/"MNAC Barcelona"/"Plaça d'Espanya" text search). Origins used the same precise
  // guide anchors as prior audits (Plaça Nova for gothic-quarter, the guide's stored
  // "Pla de la Boqueria, La Rambla" point for la-rambla, Plaça de Catalunya for placa-catalunya).
  // All walking routes climb toward Palau Nacional — every source reports meaningful uphill
  // (Google: ~65-135m gain; Apple: "250 ft climb", ~76m, on every route checked). This is a
  // different elevation profile from the old upper-hill "montjuic" point and is documented per
  // route below. sourceStatus "verified" — freshly checked in this task.
  {
    // Google walk 40-43min/2.7-2.9km, ~67-126m elevation gain depending on route. Apple walk
    // 43min/1.7mi(~2.7km), "250 ft climb" (~76m). Google transit 29-39min (best: direct L3
    // metro, Liceu -> Espanya, 29min). Google car 20-22min/4.5-5.2km; Apple car 17-21min/
    // 2.7-3mi(~4.3-4.8km). Transit chosen: materially faster than the uphill ~40min walk.
    fromPlaceId: "gothic-quarter",
    toPlaceId: "mnac",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 40, durationMinutesMax: 43, distanceKm: 2.8, note: "Meaningful uphill toward Palau Nacional (~70-130m gain)." },
      { mode: "transit", durationMinutesMin: 29, durationMinutesMax: 39, note: "Fastest: direct L3 metro from Liceu to Espanya." },
      { mode: "car", durationMinutesMin: 17, durationMinutesMax: 22 },
    ],
  },
  {
    // Verified using the guide's own stored la-rambla anchor (Pla de la Boqueria), consistent
    // with the prior audit's finding that a generic "La Rambla Barcelona" query resolves
    // inconsistently. Google walk 36-39min/2.4-2.6km, ~66-123m elevation gain. Apple walk
    // 38-40min/1.5-1.6mi(~2.4-2.6km), "250 ft climb" (~76m) on every route. Google transit
    // 23-42min (best: direct L3 metro from Liceu, 23min). Google car 21-25min/4.5-5.5km;
    // Apple car 26-27min/2.8-2.9mi(~4.5-4.7km). Transit chosen: materially faster than the
    // uphill ~36-39min walk.
    fromPlaceId: "la-rambla",
    toPlaceId: "mnac",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 36, durationMinutesMax: 40, distanceKm: 2.5, note: "Meaningful uphill toward Palau Nacional (~65-125m gain)." },
      { mode: "transit", durationMinutesMin: 23, durationMinutesMax: 25, note: "Fastest: direct L3 metro from Liceu." },
      { mode: "car", durationMinutesMin: 21, durationMinutesMax: 27 },
    ],
  },
  {
    // Google walk 40-41min/2.7-2.8km, ~66-133m elevation gain. Apple walk 42-43min/1.7mi
    // (~2.7km), "250 ft climb" (~76m). Google transit: best 22min via DIRECT L1/L3 metro from
    // Plaça Catalunya itself (no transfer/walk-to-station needed) — by far the fastest and
    // most convenient of the 3 MNAC routes. Google car 13-17min/3.8-4.5km; Apple car
    // 15-16min/2.4-2.8mi(~3.9-4.5km). Transit strongly preferred: direct line, avoids the
    // ~40min uphill walk, and central Barcelona parking near Plaça Catalunya is impractical.
    fromPlaceId: "placa-catalunya",
    toPlaceId: "mnac",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 40, durationMinutesMax: 43, distanceKm: 2.7, note: "Meaningful uphill toward Palau Nacional (~65-135m gain)." },
      { mode: "transit", durationMinutesMin: 22, durationMinutesMax: 30, note: "Fastest: direct L1/L3 metro straight from Plaça Catalunya station." },
      { mode: "car", durationMinutesMin: 13, durationMinutesMax: 17 },
    ],
  },

  // -- Final Transport Coverage Audit (verified 2026-08) -------------------------------
  // The 20 entries below complete the remaining unresolved pairs found by the 41-profile
  // Smart Planner audit after Day Builder V1.2 stabilized itinerary logic. Verified in THIS
  // task against live Google Maps and Apple Maps directions results, using exact stored
  // coordinates/addresses where available (gothic-quarter, mnac, la-rambla's Pla de la
  // Boqueria anchor, placa-catalunya, barceloneta-beach, palau-musica, sagrada-familia,
  // arc-de-triomf) and the official precise-place-name result otherwise (placa-reial,
  // casa-batllo, camp-nou, sant-pau, park-guell, barcelona-cathedral, boqueria -- none of
  // which have a stored address/coordinates yet). Each pair verified independently in its
  // exact stated direction -- no reverse-direction data reused, even where a verified
  // opposite-direction pair already existed. sourceStatus "verified", not "existing-project-data".
  {
    // Google walk 8min/600m (flat). Apple walk 8-9min/0.4-0.5mi(~0.65-0.8km, mostly flat/gentle
    // hills). Short pedestrian-zone leg -- transit/car not checked.
    fromPlaceId: "gothic-quarter",
    toPlaceId: "placa-reial",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 8, durationMinutesMax: 9, distanceKm: 0.6 }],
  },
  {
    // Google walk 39-40min/2.6-2.7km, ~67-123m elevation gain. Apple walk 39-40min/1.6mi
    // (~2.6km), "250 ft climb" (~76m). Google transit 26-42min (best: direct L3 from Liceu,
    // 26min). Google car 18-20min/4.7-5.1km; Apple car 19-20min/2.9-3mi(~4.7-4.8km). Transit
    // chosen: avoids the uphill ~40min walk.
    fromPlaceId: "placa-reial",
    toPlaceId: "mnac",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 39, durationMinutesMax: 40, distanceKm: 2.6, note: "Meaningful uphill toward Palau Nacional (~65-125m gain)." },
      { mode: "transit", durationMinutesMin: 26, durationMinutesMax: 42, note: "Fastest: direct L3 metro from Liceu." },
      { mode: "car", durationMinutesMin: 18, durationMinutesMax: 20 },
    ],
  },
  {
    // Google walk 4min/270-280m (flat). Apple walk 3min/0.1mi(~0.16km, flat). Very short
    // pedestrian leg -- transit/car not checked.
    fromPlaceId: "placa-reial",
    toPlaceId: "la-rambla",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 3, durationMinutesMax: 4, distanceKm: 0.2 }],
  },
  {
    // Google walk 65-67min/4.7-4.8km, flat but Google flags "restricted/private roads" --
    // walking intentionally EXCLUDED from options (impractical, matches the reverse leg's
    // treatment). Google transit 27-42min (best: direct L3 from Passeig de Gracia, 27min).
    // Google car 13-14min/4.7-5.1km; Apple car 16-17min/3.4-3.5mi(~5.5-5.6km). Apple transit
    // not exposed (falls back to driving). Transit chosen over car for parking-simplicity,
    // matching the reverse direction's established recommendation.
    fromPlaceId: "casa-batllo",
    toPlaceId: "camp-nou",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 27, durationMinutesMax: 42, note: "Fastest: direct L3 metro from Passeig de Gracia." },
      { mode: "car", durationMinutesMin: 13, durationMinutesMax: 17 },
    ],
  },
  {
    // Google walk 39-40min/2.9-3.0km, flat per Google; Apple walk 42-46min/1.7-1.8mi
    // (~2.7-2.9km), "gentle hill" noted. Google transit 20-29min (best: bus 47 or direct
    // L5/L3, 20min). Google car 8-10min/3.1-3.7km; Apple car 8-10min/1.9mi(~3.1km). Transit
    // chosen: materially faster than the ~40min walk.
    fromPlaceId: "sant-pau",
    toPlaceId: "casa-batllo",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 39, durationMinutesMax: 42, distanceKm: 2.9, note: "Mostly flat, with a gentle hill on some routes." },
      { mode: "transit", durationMinutesMin: 20, durationMinutesMax: 25, note: "Fastest: bus 47 or direct L5/L3 metro." },
      { mode: "car", durationMinutesMin: 8, durationMinutesMax: 10 },
    ],
  },
  {
    // Google walk 26-27min/1.9-2.0km (flat); Apple walk 27min/1.2mi(~1.9km, flat). Google
    // transit 17-21min. Google car 16-19min/3.7-4.5km; Apple car 15-19min/2.2-2.7mi
    // (~3.5-4.3km). Walking kept as recommended: flat, pleasant route toward the seafront,
    // only ~7-8min slower than transit.
    fromPlaceId: "placa-reial",
    toPlaceId: "barceloneta-beach",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 26, durationMinutesMax: 27, distanceKm: 1.9 },
      { mode: "transit", durationMinutesMin: 17, durationMinutesMax: 21 },
      { mode: "car", durationMinutesMin: 15, durationMinutesMax: 19 },
    ],
  },
  {
    // Google walk 70min/5.2km, flat but restricted/private roads noted -- EXCLUDED
    // (impractical). Google transit 30-38min (best: direct L3 from Palau Reial, 30min).
    // Google car 16-18min/5.3-5.7km; Apple car 17-19min/3.4-4.1mi(~5.5-6.6km, notes walking
    // required for the final pedestrian-zone stretch). Transit chosen: avoids that caveat
    // and the difficult parking near Placa Catalunya.
    fromPlaceId: "camp-nou",
    toPlaceId: "placa-catalunya",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 30, durationMinutesMax: 38, note: "Fastest: direct L3 metro from Palau Reial." },
      { mode: "car", durationMinutesMin: 16, durationMinutesMax: 19, note: "Final stretch is pedestrian-only near the destination." },
    ],
  },
  {
    // Verified independently of the sagrada-familia -> park-guell direction (which remains
    // unresolved -- not part of this task's 20 pairs). Google walk 27min/2.2km, with
    // elevation segments showing a clear NET DESCENT (~120-150m down) -- this direction is
    // notably easier than the uphill reverse. Apple walk 31-32min/1.4mi(~2.25km), "gently
    // downhill". Google transit 27-31min (best: bus V19, 27min -- no real advantage over
    // walking). Google car 8-9min/2.3-2.7km; Apple car 9-11min/1.7-2.1mi(~2.7-3.4km).
    // Walking kept as recommended: downhill and transit offers no time savings.
    fromPlaceId: "park-guell",
    toPlaceId: "sagrada-familia",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 27, durationMinutesMax: 32, distanceKm: 2.2, note: "Downhill (net descent) -- notably easier than the uphill reverse direction." },
      { mode: "transit", durationMinutesMin: 27, durationMinutesMax: 31 },
      { mode: "car", durationMinutesMin: 8, durationMinutesMax: 11 },
    ],
  },
  {
    // Google walk 11-12min/850-900m (negligible elevation). Apple walk 10min/0.5mi(~0.8km,
    // flat). Short central pedestrian leg -- transit/car not checked.
    fromPlaceId: "palau-musica",
    toPlaceId: "la-rambla",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 10, durationMinutesMax: 12, distanceKm: 0.85 }],
  },
  {
    // Google walk 25-26min/1.8-1.9km (flat); Apple walk 24-25min/1.1mi(~1.8km, "gentle
    // hill" noted). Google transit 17-20min. Walking kept as recommended: only ~7-8min
    // slower than transit, pleasant route toward the seafront.
    fromPlaceId: "barcelona-cathedral",
    toPlaceId: "barceloneta-beach",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 24, durationMinutesMax: 26, distanceKm: 1.85, note: "Gentle hill noted by one source." },
      { mode: "transit", durationMinutesMin: 17, durationMinutesMax: 20 },
    ],
  },
  {
    // Google walk 15-17min/1.1-1.2km (flat); Apple walk 15-16min/0.7mi(~1.1km, flat).
    // Moderate central walk -- transit/car not checked (clearly walkable, flat distance).
    fromPlaceId: "placa-catalunya",
    toPlaceId: "arc-de-triomf",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 15, durationMinutesMax: 17, distanceKm: 1.15 }],
  },
  {
    // Google transit 33-55min (best: direct L3 from Palau Reial, 33min). Google car
    // 21-22min/5.9-6.6km; Apple car 21min/3.7-5.2mi(~6.0-8.4km). Walking not checked
    // (cross-city distance, consistent with other Camp Nou legs). Transit chosen: avoids
    // driving into/parking near the Gothic Quarter's restricted pedestrian zone.
    fromPlaceId: "camp-nou",
    toPlaceId: "barcelona-cathedral",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 33, durationMinutesMax: 55, note: "Fastest: direct L3 metro from Palau Reial." },
      { mode: "car", durationMinutesMin: 21, durationMinutesMax: 22 },
    ],
  },
  {
    // Google walk 13-14min/0.95-1.0km (negligible elevation); Apple walk 12min/0.6mi
    // (~0.96km, flat). Short central pedestrian leg -- transit/car not checked.
    fromPlaceId: "palau-musica",
    toPlaceId: "boqueria",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 12, durationMinutesMax: 14, distanceKm: 0.95 }],
  },
  {
    // Google walk 31-32min/2.2-2.3km (flat); Apple walk 30-31min/1.4mi(~2.25km). Google
    // transit 22-31min (best: bus 4759, 22min). Transit chosen: this leaves the beach
    // toward the dense old-city market, not a beachfront stroll, and saves a real ~9min.
    fromPlaceId: "barceloneta-beach",
    toPlaceId: "boqueria",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 30, durationMinutesMax: 32, distanceKm: 2.25 },
      { mode: "transit", durationMinutesMin: 22, durationMinutesMax: 31, note: "Fastest: bus 4759 direct from Platja de la Barceloneta." },
    ],
  },
  {
    // Google walk 41-45min/2.8-3.0km, ~68-128m elevation gain. Apple walk 44-46min/1.8-1.9mi
    // (~2.9-3.1km), "250 ft climb" (~76m). Google transit 30-40min (best: direct L3 from
    // Liceu, 30min). Google car 13-14min/4.3-5.5km; Apple car 16-19min/2.8-3.1mi
    // (~4.5-5.0km). Transit chosen: avoids the uphill ~43min walk.
    fromPlaceId: "barcelona-cathedral",
    toPlaceId: "mnac",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 41, durationMinutesMax: 45, distanceKm: 2.9, note: "Meaningful uphill toward Palau Nacional (~70-130m gain)." },
      { mode: "transit", durationMinutesMin: 30, durationMinutesMax: 40, note: "Fastest: direct L3 metro from Liceu." },
      { mode: "car", durationMinutesMin: 13, durationMinutesMax: 19 },
    ],
  },
  {
    // Verified independently of the reverse (casa-batllo -> park-guell doesn't exist as a
    // pair; sant-pau -> park-guell is a different, already-verified pair). Google walk
    // 40-41min/3.1km, elevation shows mixed/undulating terrain with a net descent. Apple
    // walk 43-45min/1.8-1.9mi(~2.9-3.1km), "moderate hills". Google transit 21-31min (best:
    // direct L3, 21min). Google car 13-14min/4.1-4.5km; Apple car 13-14min/2.0-2.9mi
    // (~3.2-4.7km). Transit chosen: materially faster than the ~40min undulating walk.
    fromPlaceId: "park-guell",
    toPlaceId: "casa-batllo",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 40, durationMinutesMax: 41, distanceKm: 3.1, note: "Undulating terrain (moderate hills), net descent." },
      { mode: "transit", durationMinutesMin: 21, durationMinutesMax: 31, note: "Fastest: direct L3 metro." },
      { mode: "car", durationMinutesMin: 13, durationMinutesMax: 14 },
    ],
  },
  {
    // Google walk 10min/700m, flat. Apple walk 11min/0.5mi(~0.8km), "gently uphill" (minor).
    // Short central pedestrian leg -- transit/car not checked.
    fromPlaceId: "la-rambla",
    toPlaceId: "placa-catalunya",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 10, durationMinutesMax: 11, distanceKm: 0.75, note: "Gently uphill per one source." }],
  },
  {
    // Google transit 28-45min (best: direct L3 from Palau Reial, 28min). Google car
    // 24-31min/7.9-8.5km (one route detoured around a La Rambla closure); Apple car
    // 23-24min/3.9-4.6mi(~6.3-7.4km). Walking not checked (cross-city). Transit chosen:
    // avoids driving into/parking near La Rambla's restricted zone.
    fromPlaceId: "camp-nou",
    toPlaceId: "boqueria",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 28, durationMinutesMax: 45, note: "Fastest: direct L3 metro from Palau Reial." },
      { mode: "car", durationMinutesMin: 23, durationMinutesMax: 31 },
    ],
  },
  {
    // Google walk 6min/400-450m, negligible elevation. Apple walk 6min/0.3mi(~0.48km,
    // flat). Very short pedestrian leg -- transit/car not checked.
    fromPlaceId: "palau-musica",
    toPlaceId: "barcelona-cathedral",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 6, durationMinutesMax: 6, distanceKm: 0.4 }],
  },

  // ── Must Visit Transport Closure (verified 2026-08) ─────────────────────────────────
  // Closes the one unresolved pair introduced by mustVisit combinations that pull in
  // Casa Batllo (Passeig de Gracia, 43, 08007 Barcelona) alongside La Rambla's stored
  // Pla de la Boqueria anchor (08002 Barcelona) -- both exact stored guide addresses.
  // Verified independently in this one direction only; the reverse (la-rambla ->
  // casa-batllo) is a different, still-unverified pair and is intentionally left alone.
  {
    // Google walk: best route 19min/1.5km via La Rambla (alt routes 23min/1.7km,
    // 25min/1.8km) -- "mostly flat". Apple walk: 21-22min/0.9-1.0mi(~1.4-1.6km), gentle
    // downhill/hill. Google transit: 6min, direct L3 metro (Passeig de Gracia -> Liceu,
    // ~3min ride, trains every ~7min) -- range below covers a possible missed train.
    // Google car: fastest 18min/3.4km (normal traffic; alt 19min/5.0km, 19min/4.5km,
    // heavier traffic). Apple car: fastest 18min/2.2mi(~3.5km); alt 20-21min/2.6mi
    // (~4.2km) -- Apple flags "walking required to reach destination" on all car routes
    // since La Rambla itself is pedestrian-only. Apple transit not exposed (falls back to
    // the same driving results). Transit chosen: a direct one-line metro hop, dramatically
    // faster than walking or driving/parking near a pedestrian-only destination.
    fromPlaceId: "casa-batllo",
    toPlaceId: "la-rambla",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 19, durationMinutesMax: 22, distanceKm: 1.5, note: "Mostly flat; best of 3 routes shown." },
      { mode: "transit", durationMinutesMin: 6, durationMinutesMax: 13, note: "Direct L3 metro, Passeig de Gracia -> Liceu; trains ~every 7min." },
      { mode: "car", durationMinutesMin: 18, durationMinutesMax: 19, distanceKm: 3.4, note: "Destination is pedestrian-only; short walk from parking/drop-off." },
    ],
  },
  {
    // Google transit 55min-1h8min (best: bus D20 or L3+L4 combo, 50-55min -- requires a
    // transfer, no direct line covers this distance). Google car 21-25min/9.7-11.8km; Apple
    // car 21-24min/6-7.8mi(~9.7-12.6km). Walking not checked (far cross-city). Car chosen:
    // this is the one pair in the audit where car is DRAMATICALLY faster (more than double
    // transit's time, not just "a few minutes"), a genuine case for recommending it.
    fromPlaceId: "camp-nou",
    toPlaceId: "barceloneta-beach",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 50, durationMinutesMax: 68, note: "Requires a transfer (e.g. L3 then L4) -- no direct line covers this distance." },
      { mode: "car", durationMinutesMin: 21, durationMinutesMax: 25 },
    ],
  },

  // ── Final Transport Closure After V1.1 Rebalance (verified 2026-08) ────────────────
  // The 17 entries below close every directional pair left unresolved by the Smart Planner
  // V1.1 density-rebalancing pass (extracted from a full run of the 41 baseline profiles + 6
  // named UX scenarios + 15 mustVisit cases -- 62 cases total). Verified in THIS task against
  // live Google Maps and Apple Maps directions, using exact stored guide coordinates as the
  // anchor wherever available (arc-de-triomf, barcelona-cathedral, boqueria, placa-catalunya,
  // la-rambla's Pla de la Boqueria point, camp-nou, casa-mila, placa-reial, gothic-quarter,
  // barceloneta-beach, palau-musica, park-guell, tibidabo, sant-pau, bunkers-carmel). Each
  // direction verified independently -- no value copied from its reverse, even where a
  // verified opposite-direction pair already exists in this table. sourceStatus "verified".
  {
    // Google walk 17-20min/1.2-1.4km, "mostly flat". Apple walk 15-16min/0.7-0.8mi
    // (~1.1-1.3km), "gentle hill" on both routes. Short central walk -- transit/car not
    // checked.
    fromPlaceId: "arc-de-triomf",
    toPlaceId: "barcelona-cathedral",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 15, durationMinutesMax: 20, distanceKm: 1.3, note: "Gentle hill noted by one source." }],
  },
  {
    // Google walk 9-10min/650-750m, flat. Apple walk 7-8min/0.3-0.4mi(~0.5-0.65km), one
    // route "moderate hill". Short pedestrian-zone leg -- transit/car not checked.
    fromPlaceId: "barcelona-cathedral",
    toPlaceId: "boqueria",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 7, durationMinutesMax: 10, distanceKm: 0.65 }],
  },
  {
    // Verified using the guide's stored la-rambla anchor (Pla de la Boqueria). Google walk
    // 9min/650-700m, flat. Apple walk 9min/0.5mi(~0.8km), "gently downhill" -- consistent
    // with the reverse direction's stored "gently uphill" note. Very short pedestrian leg.
    fromPlaceId: "placa-catalunya",
    toPlaceId: "la-rambla",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 9, durationMinutesMax: 9, distanceKm: 0.7, note: "Gently downhill." }],
  },
  {
    // Verified using Camp Nou's stored coordinates (its street address geocodes to a parking
    // lot). Google walk 58min/4.2km flagged "restricted or private roads" -- EXCLUDED. Google
    // transit 25-38min (best: direct L5 metro from Badal, 25min). Google car 18-19min/
    // 4.6-5.2km; Apple car 15-17min/3-3.1mi(~4.8-5.0km); Apple transit not exposed (falls
    // back to driving). Transit chosen over the faster car: Casa Milà sits on the same
    // Passeig de Gràcia stretch as Casa Batlló, where parking is difficult/expensive --
    // same reasoning as the sibling camp-nou -> casa-batllo entry.
    fromPlaceId: "camp-nou",
    toPlaceId: "casa-mila",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 25, durationMinutesMax: 38, note: "Fastest: direct L5 metro from Badal." },
      { mode: "car", durationMinutesMin: 15, durationMinutesMax: 19 },
    ],
  },
  {
    // Google walk 12min/950m, mostly flat. Apple walk 13min/0.6mi(~1.0km), "gently
    // downhill". Short central walk -- transit/car not checked.
    fromPlaceId: "placa-catalunya",
    toPlaceId: "placa-reial",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 12, durationMinutesMax: 13, distanceKm: 0.95 }],
  },
  {
    // Verified using Camp Nou's stored coordinates. Walking not checked (cross-city,
    // consistent with other Camp Nou legs). Google transit 30-32min (best: L5+L3 combo,
    // 30min; direct L3 from Palau Reial, 32min). Google car 27-28min/6.2-8.5km; Apple car
    // 25-29min/4-5.6mi(~6.4-9.0km); Apple transit not exposed. Transit chosen: avoids
    // driving into/parking near the Gothic-Quarter-adjacent pedestrian zone around Plaça
    // Reial, and is barely slower than car.
    fromPlaceId: "camp-nou",
    toPlaceId: "placa-reial",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 30, durationMinutesMax: 32, note: "Fastest: L5+L3 combo, or direct L3 from Palau Reial." },
      { mode: "car", durationMinutesMin: 25, durationMinutesMax: 29 },
    ],
  },
  {
    // Google walk 18-20min/1.3-1.5km, flat. Apple walk 19min/0.8-0.9mi(~1.3-1.4km), "gentle
    // hill". Google transit 14-18min (best: direct L4 metro, 14min). Walking kept as
    // recommended: only ~4-6min slower than transit, pleasant route toward the seafront.
    fromPlaceId: "gothic-quarter",
    toPlaceId: "barceloneta-beach",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 18, durationMinutesMax: 20, distanceKm: 1.4, note: "Gentle hill noted by one source." },
      { mode: "transit", durationMinutesMin: 14, durationMinutesMax: 18, note: "Fastest: direct L4 metro." },
    ],
  },
  {
    // Verified using the guide's stored la-rambla anchor (Pla de la Boqueria). Google walk
    // 12-14min/900m-1.0km, negligible elevation. Apple walk 11-13min/0.5-0.6mi(~0.8-1.0km),
    // mostly flat. Short central pedestrian leg -- transit/car not checked.
    fromPlaceId: "la-rambla",
    toPlaceId: "palau-musica",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 11, durationMinutesMax: 14, distanceKm: 0.9 }],
  },
  {
    // Verified independently of the reverse (camp-nou -> placa-catalunya, already verified
    // above). Google walk 1h11min/5.1km flagged "restricted or private roads" -- EXCLUDED.
    // Google transit 31-45min (best: direct L3 metro from Plaça Catalunya, 31min). Google car
    // 19-21min/5.4-6.9km; Apple car 19min/3.2-4mi(~5.1-6.4km); Apple transit not exposed.
    // Transit chosen: avoids arriving into Camp Nou's restricted/private-road area by car.
    fromPlaceId: "placa-catalunya",
    toPlaceId: "camp-nou",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 31, durationMinutesMax: 45, note: "Fastest: direct L3 metro from Plaça Catalunya." },
      { mode: "car", durationMinutesMin: 19, durationMinutesMax: 21 },
    ],
  },
  {
    // Google walk 25-27min/1.8-2.0km, flat. Apple walk 23-25min/1.1mi(~1.8km), flat. Google
    // transit 16min, direct bus V19 from Pg Lluís Companys - Arc de Triomf. Transit chosen:
    // materially faster (~10min), single direct bus.
    fromPlaceId: "arc-de-triomf",
    toPlaceId: "barceloneta-beach",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 23, durationMinutesMax: 27, distanceKm: 1.9 },
      { mode: "transit", durationMinutesMin: 16, durationMinutesMax: 16, note: "Direct bus V19." },
    ],
  },
  {
    // Google walk 10-13min/750-900m, flat. Apple walk 10min/0.5mi(~0.8km), "gently uphill".
    // Short central walk -- transit/car not checked.
    fromPlaceId: "barcelona-cathedral",
    toPlaceId: "placa-catalunya",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 10, durationMinutesMax: 13, distanceKm: 0.8, note: "Gently uphill per one source." }],
  },
  {
    // Google walk 7-8min/550-600m, flat. Apple walk 7min/0.3mi(~0.5km), "gently downhill".
    // Very short pedestrian leg -- transit/car not checked.
    fromPlaceId: "barcelona-cathedral",
    toPlaceId: "placa-reial",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 7, durationMinutesMax: 8, distanceKm: 0.55 }],
  },
  {
    // Verified independently of the reverse (placa-reial -> barceloneta-beach, already
    // verified above). Google walk 22min/1.6km, flat. Apple walk 21-23min/1mi(~1.6km), flat.
    // Google transit 18-20min (best: direct bus D20, 18min). Walking kept as recommended:
    // only ~4min slower than transit, matches the reverse direction's own choice.
    fromPlaceId: "barceloneta-beach",
    toPlaceId: "placa-reial",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 21, durationMinutesMax: 23, distanceKm: 1.6 },
      { mode: "transit", durationMinutesMin: 18, durationMinutesMax: 20, note: "Direct bus D20." },
    ],
  },
  {
    // Bogatell has no stored coordinates in the guide (only a street address covering the
    // full promenade length) -- used the resolved "Bogatell Beach" place pin per provider,
    // matching the mapsUrl query already stored on that entry, rather than the bare street
    // address (which resolved to an implausibly distant point on Google, 42min/3.1km).
    // Google walk (Playa de Bogatell) 27min/2.0km, flat. Apple walk 31-33min/1.5-1.6mi
    // (~2.4-2.6km), flat -- the two providers' "Bogatell Beach" pins sit at noticeably
    // different points along the promenade; both figures are reported rather than picking
    // one. Google transit 21-23min -- not materially faster than walking. Walking kept:
    // flat seafront promenade, matches the reverse direction's own choice.
    fromPlaceId: "bogatell",
    toPlaceId: "barceloneta-beach",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 27, durationMinutesMax: 33, distanceKm: 2.3, note: "Flat seafront promenade." },
      { mode: "transit", durationMinutesMin: 21, durationMinutesMax: 23 },
    ],
  },
  {
    // Verified using Camp Nou's stored coordinates and the guide's stored la-rambla anchor
    // (Pla de la Boqueria). Google walk 1h11min/5.3km flagged "restricted or private roads"
    // -- EXCLUDED. Google transit 28min, direct L3 metro from Palau Reial. Google car
    // 29-30min/6.4-8.4km (best route avoids a La Rambla closure); Apple car 23-29min/
    // 3.6-3.9mi(~5.8-6.3km); Apple transit not exposed. Transit chosen: avoids driving
    // into/parking near La Rambla's pedestrian-only zone, matching the sibling
    // camp-nou -> boqueria entry's reasoning.
    fromPlaceId: "camp-nou",
    toPlaceId: "la-rambla",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 28, durationMinutesMax: 28, note: "Direct L3 metro from Palau Reial." },
      { mode: "car", durationMinutesMin: 23, durationMinutesMax: 30 },
    ],
  },
  {
    // Elevation-risk pair -- verified independently in this direction only, not copied from
    // any nearby entry. Google walk 1h41min-1h49min/5.4-6.2km, BOTH routes flagged
    // "restricted or private roads" AND a massive ~440-500m elevation gain -- EXCLUDED,
    // clearly impractical. Google transit 52min-1h3min, every itinerary needs a bus leg PLUS
    // the Funicular Cuca de Llum (no direct route) -- same pattern as the sibling
    // bunkers-carmel -> tibidabo entry. Google car 24-29min/10.2-10.5km via the BP-1417
    // mountain road; Apple car 21-28min/5.9-7mi(~9.5-11.3km); Apple transit not exposed. Car
    // chosen: dramatically faster than transit, matching the sibling entry's own conclusion.
    fromPlaceId: "park-guell",
    toPlaceId: "tibidabo",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 52, durationMinutesMax: 63, note: "Requires a bus leg plus the Funicular Cuca de Llum -- no direct route." },
      { mode: "car", durationMinutesMin: 21, durationMinutesMax: 29 },
    ],
  },
  {
    // Elevation-risk pair -- verified independently in this direction only. Google walk
    // 36-39min/1.9-2.1km, ~196-254m elevation gain (uphill, not restricted). Apple walk
    // 34min/1.2mi(~1.9km), "650 ft climb" (~198m) -- both sources confirm a real, meaningful
    // uphill. Google transit 35-45min (best: bus 114, 35min) -- no real advantage over
    // walking. Google car 6min/2.3km but flagged "restricted or private roads"; Apple car
    // 16-22min/1.4-2.9mi(~2.3-4.7km) -- sources differ sharply, likely because Apple's
    // fastest route avoids the same restricted road Google flags (Bunkers del Carmel has
    // limited vehicle access -- same caveat noted on the sibling park-guell -> bunkers-carmel
    // entry). Car chosen using Apple's non-restricted figure: clearly faster than the uphill
    // walk or the no-better transit option.
    fromPlaceId: "sant-pau",
    toPlaceId: "bunkers-carmel",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 34, durationMinutesMax: 39, distanceKm: 2.0, note: "Meaningful uphill (~200m elevation gain)." },
      { mode: "transit", durationMinutesMin: 35, durationMinutesMax: 45, note: "Fastest: bus 114." },
      { mode: "car", durationMinutesMin: 16, durationMinutesMax: 22 },
    ],
  },

  // ── V2 Balance Closure Transport Verification (verified 2026-08) ───────────────────
  // The 26 entries below close every directional pair left unresolved after the V2 day-
  // balance rewrite: adding mercat-sagrada-familia to the planner metadata, linking the
  // gracia-north/passeig-gracia clusters, and unlocking the gaudi-core similarity cap under
  // cultureLocal all introduced new stop adjacencies the planner had never produced before.
  // Verified in THIS task against live Google Maps and Apple Maps directions, using exact
  // stored guide coordinates (mercat-sagrada-familia, sagrada-familia, casa-mila, casa-batllo,
  // park-guell, placa-reial, palau-musica, gothic-quarter, sant-pau, barcelona-cathedral,
  // ciutadella, placa-catalunya, camp-nou, mnac, la-rambla, arc-de-triomf, tibidabo,
  // barceloneta-beach). Each direction verified independently -- no reverse-direction value
  // reused, even where a verified opposite-direction pair already exists in this table.
  {
    // Google walk 5-6min/400m, flat -- the market sits immediately behind Sagrada Familia.
    // Apple walk 6min/0.2mi(~0.32km), mostly flat. Very short pedestrian leg -- transit/car
    // not checked.
    fromPlaceId: "mercat-sagrada-familia",
    toPlaceId: "sagrada-familia",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 5, durationMinutesMax: 6, distanceKm: 0.35 }],
  },
  {
    // Google walk 21-22min/1.5-1.6km, flat. Apple walk 23-26min/1-1.1mi(~1.6-1.8km), flat.
    // Google transit 10-16min (fastest: direct L5 metro from Sagrada Familia station).
    // Transit chosen: materially faster than the ~21min walk.
    fromPlaceId: "sagrada-familia",
    toPlaceId: "casa-mila",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 21, durationMinutesMax: 26, distanceKm: 1.6 },
      { mode: "transit", durationMinutesMin: 10, durationMinutesMax: 16, note: "Fastest: direct L5 metro from Sagrada Familia station." },
    ],
  },
  {
    // Google walk 30min/2.2km, flat. Apple walk 33-34min/1.4mi(~2.25km), mostly flat/gentle
    // hill. Google transit 13-17min (fastest: bus X1, 13min). Transit chosen: materially
    // faster than the 30min walk.
    fromPlaceId: "mercat-sagrada-familia",
    toPlaceId: "casa-batllo",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 30, durationMinutesMax: 34, distanceKm: 2.2 },
      { mode: "transit", durationMinutesMin: 13, durationMinutesMax: 17, note: "Fastest: bus X1." },
    ],
  },
  {
    // Google walk 51-52min/3.3-3.4km, ~110-135m elevation gain. Apple walk 54-56min/2-2.1mi
    // (~3.2-3.4km), "350-450 ft climb" (~107-137m) -- meaningful uphill on both sources,
    // EXCLUDED from options as impractical. Google transit 27-35min (several near-tied
    // options: direct L3, bus 24, or L3+D40). Google car 13-15min/3.4-3.7km; Apple car
    // 18-19min/2.6-2.7mi(~4.2-4.3km), "walking required to reach destination" (Park Güell's
    // restricted entrance access, same caveat noted on other Park Güell-bound legs). Transit
    // chosen over the faster car: avoids that caveat and the uphill walk.
    fromPlaceId: "casa-batllo",
    toPlaceId: "park-guell",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 27, durationMinutesMax: 35, note: "Direct L3 metro, bus 24, or L3+D40." },
      { mode: "car", durationMinutesMin: 13, durationMinutesMax: 19, note: "Some walking needed to reach the entrance from parking." },
    ],
  },
  {
    // Google walk 41-43min/2.6km, ~110-135m elevation gain. Apple walk 44-47min/1.7-1.8mi
    // (~2.7-2.9km), "400 ft climb" (~122m) -- EXCLUDED, impractical uphill. Google transit
    // 31-41min, best route requires a bus+bus transfer (V21+H6) -- no direct line. Google car
    // 9-11min/2.6-3.0km; Apple car 10-12min/1.7-1.9mi(~2.7-3.1km), walking required at
    // destination. Car chosen: dramatically faster than transit's inconvenient transfer.
    fromPlaceId: "mercat-sagrada-familia",
    toPlaceId: "park-guell",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 31, durationMinutesMax: 41, note: "Requires a bus transfer (V21+H6) -- no direct route." },
      { mode: "car", durationMinutesMin: 9, durationMinutesMax: 12, note: "Walking required at destination (Park Güell's restricted entrance access)." },
    ],
  },
  {
    // Google walk 23-28min/1.7-2.1km, flat. Apple walk 24min/1.1mi(~1.8km), gently downhill.
    // Google transit 9-17min (fastest: direct L3 metro from Passeig de Gràcia, 9min). Transit
    // chosen: materially faster than the ~23min walk.
    fromPlaceId: "casa-batllo",
    toPlaceId: "placa-reial",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 23, durationMinutesMax: 28, distanceKm: 1.9 },
      { mode: "transit", durationMinutesMin: 9, durationMinutesMax: 17, note: "Fastest: direct L3 metro from Passeig de Gràcia." },
    ],
  },
  {
    // Google walk 14-15min/1.0-1.1km, negligible elevation. Apple walk 13-14min/0.6-0.7mi
    // (~1.0-1.1km), mostly flat. Short central pedestrian leg -- transit/car not checked.
    fromPlaceId: "palau-musica",
    toPlaceId: "placa-reial",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 13, durationMinutesMax: 15, distanceKm: 1.05 }],
  },
  {
    // Google walk 9-11min/650-800m, negligible elevation. Apple walk 9min/0.4mi(~0.65km),
    // mostly flat. Short central pedestrian leg -- transit/car not checked.
    fromPlaceId: "gothic-quarter",
    toPlaceId: "palau-musica",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 9, durationMinutesMax: 11, distanceKm: 0.7 }],
  },
  {
    // Google walk 12-14min/1.0-1.1km, flat. Apple walk 13min/0.6mi(~1.0km), gently downhill
    // (consistent with the reverse direction's own "minor uphill" note). Short central
    // pedestrian leg -- transit/car not checked.
    fromPlaceId: "sant-pau",
    toPlaceId: "mercat-sagrada-familia",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 12, durationMinutesMax: 14, distanceKm: 1.05 }],
  },
  {
    // Google walk 18-20min/1.3-1.5km, flat. Apple walk 18min/0.8mi(~1.3km), gentle hill.
    // Short-moderate pedestrian leg -- transit/car not checked.
    fromPlaceId: "barcelona-cathedral",
    toPlaceId: "ciutadella",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 18, durationMinutesMax: 20, distanceKm: 1.4 }],
  },
  {
    // Google walk 10-11min/750-850m, flat. Apple walk 10min/0.5mi(~0.8km), gently downhill.
    // Short central pedestrian leg -- transit/car not checked.
    fromPlaceId: "placa-catalunya",
    toPlaceId: "barcelona-cathedral",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 10, durationMinutesMax: 11, distanceKm: 0.8 }],
  },
  {
    // Google walk 25-26min/1.9km, flat. Apple walk 25-26min/1.2mi(~1.9km), flat/gentle hill.
    // Google transit 15-19min (fastest: direct bus H16 from Pl Catalunya, 15min). Transit
    // chosen: materially faster than the ~25min walk.
    fromPlaceId: "placa-catalunya",
    toPlaceId: "ciutadella",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 25, durationMinutesMax: 26, distanceKm: 1.9 },
      { mode: "transit", durationMinutesMin: 15, durationMinutesMax: 19, note: "Fastest: direct bus H16 from Plaça Catalunya." },
    ],
  },
  {
    // Google walk 1h18min/5.8km flagged "restricted or private roads" -- EXCLUDED. Google
    // transit 36-53min (fastest: direct L3 metro from Palau Reial, 36min). Google car
    // 24-25min/6.5-7.1km (one route also restricted-flagged); Apple car 25-26min/4-6.1mi
    // (~6.4-9.8km). Transit chosen over the faster car: avoids driving into/parking near the
    // Gothic Quarter's restricted pedestrian zone, matching the sibling
    // camp-nou -> barcelona-cathedral entry's reasoning.
    fromPlaceId: "camp-nou",
    toPlaceId: "gothic-quarter",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 36, durationMinutesMax: 53, note: "Fastest: direct L3 metro from Palau Reial." },
      { mode: "car", durationMinutesMin: 24, durationMinutesMax: 26 },
    ],
  },
  {
    // Google walk 18-19min/1.3-1.4km, negligible elevation. Apple walk 18-19min/0.8-0.9mi
    // (~1.3-1.45km), mostly flat/gentle hill. Short-moderate pedestrian leg -- transit/car
    // not checked.
    fromPlaceId: "palau-musica",
    toPlaceId: "ciutadella",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 18, durationMinutesMax: 19, distanceKm: 1.35 }],
  },
  {
    // Google walk 27min/1.9km, flat. Apple walk 28-30min/1.2-1.3mi(~1.9-2.1km), flat. Google
    // transit 13-15min (fastest: direct L5 metro, 13min). Transit chosen: materially faster
    // than the ~27min walk.
    fromPlaceId: "mercat-sagrada-familia",
    toPlaceId: "casa-mila",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 27, durationMinutesMax: 30, distanceKm: 2.0 },
      { mode: "transit", durationMinutesMin: 13, durationMinutesMax: 15, note: "Fastest: direct L5 metro." },
    ],
  },
  {
    // Google walk 15-17min/1.0-1.1km, flat. Apple walk 14min/0.6mi(~1.0km), "100 ft climb"
    // (~30m, minor). Short central pedestrian leg -- transit/car not checked.
    fromPlaceId: "mercat-sagrada-familia",
    toPlaceId: "sant-pau",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 14, durationMinutesMax: 17, distanceKm: 1.05, note: "Minor uphill (~30m)." }],
  },
  {
    // Google transit 30-44min (fastest: direct L5 metro from Collblanc, 30min). Google car
    // 18-21min/6.5-7.8km; Apple car 18-21min/4-5.3mi(~6.4-8.5km). Walking not checked
    // (cross-city, consistent with other Camp Nou legs). Transit chosen over the faster car:
    // avoids the difficult parking in dense Eixample residential streets, matching the
    // sibling camp-nou -> casa-mila/sagrada-familia entries' reasoning.
    fromPlaceId: "camp-nou",
    toPlaceId: "mercat-sagrada-familia",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 30, durationMinutesMax: 44, note: "Fastest: direct L5 metro from Collblanc." },
      { mode: "car", durationMinutesMin: 18, durationMinutesMax: 21 },
    ],
  },
  {
    // Google transit 27-44min (fastest: direct L5 metro from Collblanc, 27min). Google car
    // 16-20min/5.7-7.1km; Apple car 18-20min/4.2-5.1mi(~6.8-8.2km). Walking not checked
    // (cross-city). Transit chosen: avoids difficult Eixample parking near Sagrada Família.
    fromPlaceId: "camp-nou",
    toPlaceId: "sagrada-familia",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 27, durationMinutesMax: 44, note: "Fastest: direct L5 metro from Collblanc." },
      { mode: "car", durationMinutesMin: 16, durationMinutesMax: 20 },
    ],
  },
  {
    // Google walk 39-40min/2.4-2.5km, ~110-135m elevation gain. Apple walk 41-44min/1.5-1.6mi
    // (~2.4-2.6km), "350-400 ft climb" (~107-122m) -- EXCLUDED, impractical uphill. Google
    // transit 33-41min (fastest: bus V19, 33min). Google car 11-13min/2.7-3.2km; Apple car
    // 12-13min/1.8-1.9mi(~2.9-3.1km), walking required at destination. Car chosen:
    // dramatically faster than transit and the uphill walk.
    fromPlaceId: "sagrada-familia",
    toPlaceId: "park-guell",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 33, durationMinutesMax: 41, note: "Fastest: bus V19." },
      { mode: "car", durationMinutesMin: 11, durationMinutesMax: 13, note: "Walking required at destination (Park Güell's restricted entrance access)." },
    ],
  },
  {
    // Google walk 24min/1.7km, flat. Apple walk 24min/1.1mi(~1.8km), mostly flat. Google
    // transit 20-21min -- not materially faster than walking. Walking kept: flat route, only
    // ~4min slower than transit.
    fromPlaceId: "barceloneta-beach",
    toPlaceId: "la-rambla",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 24, durationMinutesMax: 24, distanceKm: 1.75 },
      { mode: "transit", durationMinutesMin: 20, durationMinutesMax: 21 },
    ],
  },
  {
    // Google walk 26-27min/1.8-1.9km, flat. Apple walk 23-25min/1.1mi(~1.8km), flat. Google
    // transit 14-23min (fastest: direct bus V19, 14min). Transit chosen: materially faster,
    // matching the reverse direction's own choice (arc-de-triomf -> barceloneta-beach).
    fromPlaceId: "barceloneta-beach",
    toPlaceId: "arc-de-triomf",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 23, durationMinutesMax: 27, distanceKm: 1.85 },
      { mode: "transit", durationMinutesMin: 14, durationMinutesMax: 23, note: "Fastest: direct bus V19." },
    ],
  },
  {
    // Elevation-risk pair -- verified independently, not copied from any nearby entry.
    // Google walk 2h40min/9.5km, ~500m elevation gain -- EXCLUDED, clearly impractical.
    // Google transit 1h32min-1h42min, every itinerary requires a bus+train transfer (e.g.
    // H16+S2) -- no direct route. Google car 36-37min/14.3-25.8km via the BP-1417 mountain
    // road; Apple car 31-32min/7.9-8mi(~12.7-12.9km). Car chosen: dramatically faster than
    // transit, matching the sibling bunkers-carmel/park-guell -> tibidabo entries.
    fromPlaceId: "ciutadella",
    toPlaceId: "tibidabo",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 92, durationMinutesMax: 102, note: "Requires a bus+train transfer (e.g. H16+S2) -- no direct route." },
      { mode: "car", durationMinutesMin: 31, durationMinutesMax: 37 },
    ],
  },
  {
    // Google walk 19-22min/1.3-1.6km, flat. Apple walk 18min/0.8mi(~1.3km), gentle hill.
    // Short-moderate pedestrian leg -- transit/car not checked.
    fromPlaceId: "ciutadella",
    toPlaceId: "barcelona-cathedral",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 18, durationMinutesMax: 22, distanceKm: 1.45 }],
  },
  {
    // Google walk 36-37min/2.8-2.9km, undulating (min ~2m net gain but 98-135m up/down
    // segments). Apple walk 40-41min/1.7mi(~2.7km), "steep hills" on 2 of 3 routes, "gently
    // downhill" on the 3rd -- genuinely undulating terrain, not a clean uphill/downhill.
    // Google transit 21-34min (fastest: direct bus 24 from CAP Larrard, 21min). Google car
    // 11-12min/3.0-3.7km; Apple car 12-14min/1.8-2.3mi(~2.9-3.7km). Transit chosen: avoids
    // the undulating walk, matching the sibling park-guell -> casa-batllo entry's reasoning.
    fromPlaceId: "park-guell",
    toPlaceId: "casa-mila",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 21, durationMinutesMax: 34, note: "Fastest: direct bus 24 from CAP Larrard." },
      { mode: "car", durationMinutesMin: 11, durationMinutesMax: 14 },
    ],
  },
  {
    // Google transit 37-52min (fastest: direct L3 metro, 37min). Google car 16-18min/
    // 5.7-7.3km; Apple car 15-19min/3.1-3.9mi(~5.0-6.3km). Walking not checked (cross-city,
    // consistent with other Camp Nou legs). Car chosen: transit is more than double car's
    // time, matching the sibling camp-nou -> barceloneta-beach entry's "genuine case for
    // recommending car" reasoning -- MNAC/Montjuïc also has more practical parking than the
    // dense old-city destinations other Camp Nou legs avoid by transit.
    fromPlaceId: "camp-nou",
    toPlaceId: "mnac",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 37, durationMinutesMax: 52, note: "Fastest: direct L3 metro." },
      { mode: "car", durationMinutesMin: 15, durationMinutesMax: 19 },
    ],
  },
  {
    // Google walk 32-34min/2.4-2.6km, mixed elevation (net descent-ish but not clean). Apple
    // walk 34-35min/1.5mi(~2.4km), "moderate hill". Google transit 20-34min (fastest: direct
    // L3 metro from Espanya, 20min). Google car 15-16min/4.0-5.0km (avoiding a La Rambla
    // closure); Apple car 15-19min/2-2.6mi(~3.2-4.2km). Transit chosen: avoids the hill walk,
    // matching the reverse direction's own choice (la-rambla -> mnac).
    fromPlaceId: "mnac",
    toPlaceId: "la-rambla",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 32, durationMinutesMax: 35, distanceKm: 2.5, note: "Undulating terrain." },
      { mode: "transit", durationMinutesMin: 20, durationMinutesMax: 34, note: "Fastest: direct L3 metro from Espanya." },
      { mode: "car", durationMinutesMin: 15, durationMinutesMax: 19 },
    ],
  },

  // ── Directional Pair Closure Round (verified 2026-08) ───────────────────────────────
  // The 26 entries below close a fresh batch of directional pairs surfaced by continued
  // Smart Planner day-builder testing. Verified in THIS task against live Google Maps and
  // Apple Maps directions results, using exact stored guide coordinates as the anchor
  // wherever available (sagrada-familia, casa-mila, casa-batllo, park-guell, placa-reial,
  // palau-musica, gothic-quarter, sant-pau, barcelona-cathedral, ciutadella, placa-catalunya,
  // camp-nou, mnac, la-rambla's Pla de la Boqueria point, arc-de-triomf, barceloneta-beach,
  // mercat-sagrada-familia, boqueria, bunkers-carmel) and the guide's stored EXACT address
  // strings for the two shoppingArea stops with no coordinates (portal-angel: "Portal de
  // l'Angel, 08002 Barcelona, Spain"; passeig-de-gracia: "Passeig de Gracia, 08007 Barcelona,
  // Spain"). Apple's web client did not expose transit for any leg checked in this round
  // where transit was a real option under consideration (dirflg=r rendered identically to
  // dirflg=d every single time it was checked) -- noted individually below on each affected
  // leg. Each direction verified independently -- no reverse-direction value reused, even
  // where a verified opposite-direction pair already exists in this table.
  //
  // Anchor-ambiguity note: 4 of these legs touch "passeig-de-gracia", whose stored address
  // has no coordinates. Google consistently resolves it to a point near the Plaça Catalunya
  // end of the street; Apple consistently resolves it to a point much closer to Casa Batlló
  // further up the street -- the two pins are genuinely several hundred meters apart. Per
  // the bogatell entry's precedent, both figures are reported honestly in each affected
  // leg's note rather than averaged or arbitrarily chosen. "portal-angel" (also address-only)
  // showed NO comparable ambiguity -- both providers resolved it consistently in every leg
  // touching it in this round.
  {
    // Google walk 8-9min/650-700m, "all routes mostly flat" per Google. Apple walk
    // 9min/0.4mi(~0.64km), gently downhill. Consistent between sources -- very short
    // pedestrian leg, transit/car not checked.
    fromPlaceId: "portal-angel",
    toPlaceId: "la-rambla",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 8, durationMinutesMax: 9, distanceKm: 0.65 }],
  },
  {
    // Google walk 26min/1.9km, flat. Apple walk 28-29min/1.2mi(~1.9km), mostly flat/gentle
    // hill -- consistent. Google transit 11-19min (fastest: L5+L3 combo, 11min; a 26min
    // outlier route excluded from the range). Transit chosen: materially faster than the
    // ~26-29min walk.
    fromPlaceId: "sagrada-familia",
    toPlaceId: "casa-batllo",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 26, durationMinutesMax: 29, distanceKm: 1.9 },
      { mode: "transit", durationMinutesMin: 11, durationMinutesMax: 19, note: "Fastest: L5+L3 metro combo." },
    ],
  },
  {
    // Google walk 9-10min/650-700m, negligible elevation. Apple walk 8min/0.4mi(~0.65km),
    // gently downhill -- consistent. Short central pedestrian leg -- transit/car not checked.
    fromPlaceId: "placa-catalunya",
    toPlaceId: "palau-musica",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 8, durationMinutesMax: 10, distanceKm: 0.68 }],
  },
  {
    // Anchor-ambiguity leg (see section note above): Google walk 12-13min/850m via the
    // south (Plaça Catalunya) end of the stored "Passeig de Gracia" address; Apple walk
    // 3min/0.1mi(~0.16km) resolving to a point right next to Casa Batlló itself. No stored
    // coordinates for passeig-de-gracia to disambiguate -- both figures reported honestly
    // rather than averaged. Either way this is a short walkable leg -- transit/car not
    // checked.
    fromPlaceId: "passeig-de-gracia",
    toPlaceId: "casa-batllo",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 3, durationMinutesMax: 13 },
    ],
  },
  {
    // Verified independently of the reverse (camp-nou -> barcelona-cathedral, already
    // verified above). Google transit 35-54min (fastest: direct L3 from Liceu, 35min).
    // Google car: fastest route 32min/6.5km flagged restricted/private roads; unrestricted
    // alt 31min/17.2km via B-10. Apple car 23-25min/6.1-6.2mi(~9.8-10km, fastest), alt
    // 25min/4mi(~6.4km). Apple transit not exposed (identical to driving). Walking not
    // checked (cross-city, consistent with other Camp Nou legs). Transit chosen over car:
    // avoids driving into/parking near the Gothic Quarter's restricted pedestrian zone,
    // matching the sibling camp-nou -> barcelona-cathedral entry's reasoning.
    fromPlaceId: "barcelona-cathedral",
    toPlaceId: "camp-nou",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 35, durationMinutesMax: 54, note: "Fastest: direct L3 metro from Liceu." },
      { mode: "car", durationMinutesMin: 23, durationMinutesMax: 32 },
    ],
  },
  {
    // Anchor-ambiguity leg (see section note above): Google walk 18-19min/1.4km via the
    // south (Plaça Catalunya) end of the stored "Passeig de Gracia" address; Apple walk
    // 10min/0.4mi(~0.64km) resolving to a point close to Casa Milà itself. Both figures
    // reported honestly. Short walkable leg either way -- transit/car not checked.
    fromPlaceId: "casa-mila",
    toPlaceId: "passeig-de-gracia",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 10, durationMinutesMax: 19 },
    ],
  },
  {
    // Google walk 8min/600m, flat. Apple walk 9min/0.4mi(~0.64km), mostly flat --
    // consistent. Short pedestrian-zone leg -- transit/car not checked.
    fromPlaceId: "boqueria",
    toPlaceId: "portal-angel",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 8, durationMinutesMax: 9, distanceKm: 0.62 }],
  },
  {
    // Google walk 10min/700-750m, minor elevation change. Apple walk 9min/0.4mi(~0.65km),
    // mostly flat -- consistent. Short central pedestrian leg -- transit/car not checked.
    fromPlaceId: "arc-de-triomf",
    toPlaceId: "palau-musica",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 9, durationMinutesMax: 10, distanceKm: 0.7 }],
  },
  {
    // Google walk 4min/300m, mostly flat. Apple walk 2min/400ft(~0.12km), mostly flat --
    // consistent, very short. Portal de l'Àngel resolved consistently between providers
    // here -- transit/car not checked.
    fromPlaceId: "placa-catalunya",
    toPlaceId: "portal-angel",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 2, durationMinutesMax: 4, distanceKm: 0.25 }],
  },
  {
    // Verified using Camp Nou's stored coordinates. Google transit 33-53min (fastest: L5+
    // R4 combo, 33min; direct L3 from Palau Reial, 35min). Google car 19-22min/5.7-5.9km;
    // Apple car 17-22min/3.3-4.4mi(~5.3-7.1km); Apple transit not exposed (identical to
    // driving). Walking not checked (cross-city, consistent with other Camp Nou legs).
    // Transit chosen over the faster car: Portal de l'Àngel is a pedestrian-only shopping
    // street, so driving would still require parking away and walking in -- same reasoning
    // as the sibling camp-nou -> casa-batllo/casa-mila/gothic-quarter entries.
    fromPlaceId: "camp-nou",
    toPlaceId: "portal-angel",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 33, durationMinutesMax: 53, note: "Fastest: L5+R4 combo, or direct L3 from Palau Reial." },
      { mode: "car", durationMinutesMin: 17, durationMinutesMax: 22, note: "Destination is a pedestrian-only shopping street; a short walk from parking/drop-off is still required." },
    ],
  },
  {
    // Google walk 55-56min/4.2-4.3km, undulating (up to ~135m elevation change). Apple walk
    // 1h2min/2.5mi(~4.0km), mixed gentle/steep hills -- EXCLUDED, impractical. Google transit
    // 30-42min (fastest: direct L3, 30min). Google car 17-19min/4.6-5.9km; Apple car
    // 17-19min/2.9-3.7mi(~4.7-6.0km) -- sources agree closely; Apple transit not exposed
    // (identical to driving). Transit chosen over the faster car: Portal de l'Àngel is a
    // pedestrian-only shopping street requiring a walk-in from parking, matching the sibling
    // camp-nou -> portal-angel entry's reasoning.
    fromPlaceId: "park-guell",
    toPlaceId: "portal-angel",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 30, durationMinutesMax: 42, note: "Fastest: direct L3 metro." },
      { mode: "car", durationMinutesMin: 17, durationMinutesMax: 19, note: "Destination is a pedestrian-only shopping street; a short walk from parking/drop-off is still required." },
    ],
  },
  {
    // Google walk 24-28min/1.7-2.0km, flat. Apple walk 22min/1mi(~1.6km), gentle hills --
    // consistent. Moderate old-city-to-Born walk -- transit/car not checked (clearly
    // walkable distance, matching similar-length entries above).
    fromPlaceId: "placa-reial",
    toPlaceId: "ciutadella",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 22, durationMinutesMax: 28, distanceKm: 1.75 }],
  },
  {
    // Google walk 25-28min/1.8-2.0km, flat. Apple walk 28min/1.3mi(~2.1km), gentle hill --
    // consistent. Google transit 17-22min (fastest: bus 47 from Pepe Rubianes, 17min).
    // Walking kept as recommended: only ~6-8min slower than transit, pleasant route toward
    // the old city, matching the sibling barcelona-cathedral -> barceloneta-beach and
    // placa-reial -> barceloneta-beach entries' own choices.
    fromPlaceId: "barceloneta-beach",
    toPlaceId: "portal-angel",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 25, durationMinutesMax: 28, distanceKm: 1.95 },
      { mode: "transit", durationMinutesMin: 17, durationMinutesMax: 22, note: "Fastest: bus 47 from Pepe Rubianes." },
    ],
  },
  {
    // Google walk 47min/3.5km, flat. Apple walk 46-50min/2mi(~3.2km), gentle hills --
    // roughly consistent (no meaningful passeig-de-gracia anchor ambiguity at this
    // distance). Google transit 17-32min (fastest: L5+L3 combo from Sant Pau | Dos de Maig,
    // 17min). Transit chosen: materially faster than the ~47-50min walk.
    fromPlaceId: "sant-pau",
    toPlaceId: "passeig-de-gracia",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 46, durationMinutesMax: 50, distanceKm: 3.5 },
      { mode: "transit", durationMinutesMin: 17, durationMinutesMax: 32, note: "Fastest: L5+L3 metro combo from Sant Pau | Dos de Maig." },
    ],
  },
  {
    // Google walk 38-39min/2.7km, flat. Apple walk 34-35min/1.5mi(~2.4km), gentle hills --
    // roughly consistent. Google transit 15-24min (fastest: L3+L5 combo, 15min; slower
    // routes up to 24min). Transit chosen: materially faster than the ~35-39min walk.
    fromPlaceId: "passeig-de-gracia",
    toPlaceId: "mercat-sagrada-familia",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 34, durationMinutesMax: 39, distanceKm: 2.55 },
      { mode: "transit", durationMinutesMin: 15, durationMinutesMax: 24, note: "Fastest: L3+L5 metro combo." },
    ],
  },
  {
    // Anchor-ambiguity leg (see section note above): Google walk 10min/800m via the south
    // (Plaça Catalunya) end of the stored "Passeig de Gracia" address, consistent with the
    // placa-catalunya -> barcelona-cathedral entry's own 10-11min/0.8km. Apple walk
    // 18min/0.7mi(~1.1km) resolving further north, gentle hill. Both figures reported
    // honestly. Short walkable leg either way -- transit/car not checked.
    fromPlaceId: "passeig-de-gracia",
    toPlaceId: "barcelona-cathedral",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 10, durationMinutesMax: 18 },
    ],
  },
  {
    // Google walk 42-46min/2.8-3.1km, ~66-127m elevation gain. Apple walk 44-45min/1.8mi
    // (~2.9km), "250 ft climb" (~76m) -- consistent meaningful uphill. Google transit
    // 26-35min (fastest: direct L1/L3 from Plaça Catalunya - Pg de Gràcia, 26min). Google
    // car 15-19min/4.2-4.9km; Apple car 16-21min/2.8-3.2mi(~4.5-5.2km) -- consistent; Apple
    // transit not exposed (identical to driving). Transit chosen: avoids the uphill
    // ~42-46min walk, matching the other verified MNAC legs' own reasoning.
    fromPlaceId: "portal-angel",
    toPlaceId: "mnac",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 42, durationMinutesMax: 46, distanceKm: 2.9, note: "Meaningful uphill toward Palau Nacional (~65-130m gain)." },
      { mode: "transit", durationMinutesMin: 26, durationMinutesMax: 35, note: "Fastest: direct L1/L3 metro from Plaça Catalunya - Pg de Gràcia." },
      { mode: "car", durationMinutesMin: 15, durationMinutesMax: 21 },
    ],
  },
  {
    // Google walk 47-50min/3.2-3.4km, ~74-128m elevation gain. Apple walk 48-49min/1.9-2mi
    // (~3.1-3.2km), "250 ft climb" (~76m) -- consistent meaningful uphill. Google transit
    // 28-42min (fastest: direct L1 from Urquinaona, 28min). Google car 17-20min/4.6-5.4km;
    // Apple car 18-23min/2.8-4.4mi(~4.5-7.1km); Apple transit not exposed (identical to
    // driving). Transit chosen: avoids the uphill ~47-49min walk, matching the other
    // verified MNAC legs' own reasoning.
    fromPlaceId: "palau-musica",
    toPlaceId: "mnac",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 47, durationMinutesMax: 50, distanceKm: 3.15, note: "Meaningful uphill toward Palau Nacional (~75-130m gain)." },
      { mode: "transit", durationMinutesMin: 28, durationMinutesMax: 42, note: "Fastest: direct L1 metro from Urquinaona." },
      { mode: "car", durationMinutesMin: 17, durationMinutesMax: 23 },
    ],
  },
  {
    // Verified independently of the reverse (placa-catalunya -> mnac, already verified
    // above). Google walk 38-39min/2.8km, this direction nets downhill overall but still
    // undulating (up 133m/down to 66m across route segments). Apple walk 42-47min/1.8-1.9mi
    // (~2.9-3.1km), moderate/steep hills noted (one route flags "escalator required" --
    // Montjuïc's outdoor escalators). Google transit 21-29min (fastest: direct L1/L3 from
    // Espanya, 21min). Google car 15-16min/3.7-4.0km; Apple car 15-18min/2.4-2.9mi
    // (~3.9-4.7km); Apple transit not exposed (identical to driving). Transit chosen:
    // avoids the undulating walk, matching the reverse direction's own choice.
    fromPlaceId: "mnac",
    toPlaceId: "placa-catalunya",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 38, durationMinutesMax: 47, distanceKm: 2.85, note: "Undulating terrain; one route requires Montjuïc's outdoor escalators." },
      { mode: "transit", durationMinutesMin: 21, durationMinutesMax: 29, note: "Fastest: direct L1/L3 metro from Espanya." },
      { mode: "car", durationMinutesMin: 15, durationMinutesMax: 18 },
    ],
  },
  {
    // Verified independently of the reverse (camp-nou -> boqueria, already verified above).
    // Google transit 28-42min (fastest: direct L3 from Liceu, 28min). Google car
    // 26-28min/5.8-7.9km (fastest route avoids a current closed road); Apple car
    // 22-25min/3.4-4.3mi(~5.5-6.9km); Apple transit not exposed (identical to driving).
    // Walking not checked (cross-city, consistent with other Camp Nou legs). Transit
    // chosen: avoids driving into/parking near La Rambla's pedestrian-only zone, matching
    // the sibling camp-nou -> boqueria entry's reasoning.
    fromPlaceId: "boqueria",
    toPlaceId: "camp-nou",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 28, durationMinutesMax: 42, note: "Fastest: direct L3 metro from Liceu." },
      { mode: "car", durationMinutesMin: 22, durationMinutesMax: 28, note: "Fastest route avoids a current road closure." },
    ],
  },
  {
    // Verified using the guide's stored la-rambla anchor (Pla de la Boqueria). Google walk
    // 9min/650-700m, flat -- consistent with the reverse direction's own 8-9min. Apple walk
    // 9-10min/0.4-0.5mi(~0.65-0.8km), gently uphill (consistent with the reverse direction's
    // stored "gently downhill" note). Very short pedestrian leg -- transit/car not checked.
    fromPlaceId: "la-rambla",
    toPlaceId: "portal-angel",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 9, durationMinutesMax: 10, distanceKm: 0.7, note: "Gently uphill." }],
  },
  {
    // Google transit 42-61min (fastest: L4+H6 combo, 42min -- no direct route). Google car
    // 26-27min/5.8-7.0km; Apple car 24-27min/3.6-4.4mi(~5.8-7.1km) -- consistent; Apple
    // transit not exposed (identical to driving). Walking not checked (far cross-city,
    // ~5-6km along a hilly route). Transit chosen despite the faster car time: the ratio
    // (~1.6-2.2x) is well short of the "dramatically faster" threshold used to justify car
    // for the sibling mercat-sagrada-familia/sagrada-familia -> park-guell entries above
    // (~3x, forced bus transfers), and Park Güell's restricted entrance access means car
    // still requires walking in from parking anyway -- matching the casa-batllo ->
    // park-guell entry's own reasoning for keeping transit.
    fromPlaceId: "barceloneta-beach",
    toPlaceId: "park-guell",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 42, durationMinutesMax: 61, note: "Fastest: L4+H6 bus/metro combo -- no direct route." },
      { mode: "car", durationMinutesMin: 24, durationMinutesMax: 27, note: "Park Güell's restricted entrance access means a walk from parking is still required." },
    ],
  },
  {
    // Elevation/cross-city pair -- verified independently, using Camp Nou's and
    // bunkers-carmel's stored coordinates. Google transit 64-75min, every itinerary
    // requires a transfer (e.g. L5+24) -- no direct route. Google car 18-24min/7.1-15.0km
    // (fastest, no restriction flag); Apple car 29-34min/4.7-6.2mi(~7.6-10.0km) -- sources
    // differed significantly on this long cross-city route; both figures reported rather
    // than picking one. Apple transit not exposed (identical to driving). Walking not
    // checked (cross-city, consistent with other Camp Nou legs, plus Bunkers del Carmel's
    // known uphill/limited-access approach noted on sibling entries). Car chosen:
    // dramatically faster than transit even using Apple's slower figure, matching the
    // sibling bunkers-carmel/park-guell -> tibidabo entries' own conclusion.
    fromPlaceId: "camp-nou",
    toPlaceId: "bunkers-carmel",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 64, durationMinutesMax: 75, note: "Requires a transfer (e.g. L5+24) -- no direct route." },
      { mode: "car", durationMinutesMin: 18, durationMinutesMax: 34 },
    ],
  },
  {
    // Anchor-ambiguity leg (see section note above): Google walk 4-5min/350-400m via the
    // south (Plaça Catalunya) end of the stored "Passeig de Gracia" address, consistent
    // with the placa-catalunya -> portal-angel entry's own 2-4min/0.25km. Apple walk
    // 9min/0.4mi(~0.64km) resolving further north, gently downhill. Both figures reported
    // honestly. Very short walkable leg either way -- transit/car not checked.
    fromPlaceId: "passeig-de-gracia",
    toPlaceId: "portal-angel",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 4, durationMinutesMax: 9 },
    ],
  },
  {
    // Google walk 23-24min/1.6-1.7km, flat. Apple walk 24-25min/1.1mi(~1.75km), mostly
    // flat/gentle hill -- consistent. Moderate Born-to-old-city walk -- transit/car not
    // checked (clearly walkable distance).
    fromPlaceId: "ciutadella",
    toPlaceId: "portal-angel",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 23, durationMinutesMax: 25, distanceKm: 1.7 }],
  },
  {
    // Google walk 6min/400-450m, minor elevation. Apple walk 6min/0.3mi(~0.48km), gently
    // uphill -- consistent. Very short pedestrian leg -- transit/car not checked.
    fromPlaceId: "palau-musica",
    toPlaceId: "portal-angel",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 6, durationMinutesMax: 6, distanceKm: 0.45 }],
  },

  // ── Directional Pair Closure Round 2 (verified 2026-08) ─────────────────────────────
  // A second pass surfaced by re-running the full 69-profile matrix after the round above
  // landed: 8 directional pairs the prior round's scoping missed (mostly the REVERSE of a
  // pair already verified above, checked independently rather than assumed symmetric) plus
  // one pair (passeig-de-gracia -> park-guell) that was mid-verification when this task's
  // work was interrupted and is completed here using the walking/transit/car figures already
  // gathered live in this same task before the interruption.
  {
    // Reverse of passeig-de-gracia -> casa-batllo above -- verified independently, not
    // assumed symmetric. Anchor-ambiguity leg (see the Round 1 section note above): Google
    // walk 11-12min/850m via the south (Plaça Catalunya) end of the stored address; Apple
    // walk 3min/0.05mi(~0.08km) resolving right next to Casa Batlló. Both figures reported
    // honestly. Short walkable leg either way -- transit/car not checked.
    fromPlaceId: "casa-batllo",
    toPlaceId: "passeig-de-gracia",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 3, durationMinutesMax: 12 },
    ],
  },
  {
    // Google walk 6min/450m, mostly flat. Apple walk 8min/0.4mi(~0.64km), gentle hills --
    // consistent, portal-angel resolved consistently between providers here. Short central
    // pedestrian leg -- transit/car not checked.
    fromPlaceId: "barcelona-cathedral",
    toPlaceId: "portal-angel",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 6, durationMinutesMax: 8, distanceKm: 0.45 }],
  },
  {
    // Google walk 7min/500m, mostly flat. Apple walk 9min/0.4mi(~0.64km), mostly flat --
    // consistent. Short pedestrian-zone leg -- transit/car not checked.
    fromPlaceId: "portal-angel",
    toPlaceId: "gothic-quarter",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 7, durationMinutesMax: 9, distanceKm: 0.5 }],
  },
  {
    // Reverse of casa-mila -> passeig-de-gracia and sibling anchor-ambiguity legs above --
    // verified independently. Google walk 3min/200-220m, mostly flat, resolving near the
    // south (Plaça Catalunya) end of the stored address. Apple walk 10min/0.4mi(~0.64km),
    // gently downhill, resolving further north -- matches this exact divergence pattern
    // already documented for every other passeig-de-gracia leg in this table. Both figures
    // reported honestly.
    fromPlaceId: "passeig-de-gracia",
    toPlaceId: "placa-catalunya",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 3, durationMinutesMax: 10 },
    ],
  },
  {
    // Reverse of barceloneta-beach -> portal-angel above -- verified independently. Google
    // walk 25-26min/1.8-1.9km, mostly flat. Apple walk 27min/1.3mi(~2.1km), gentle hill --
    // consistent with the reverse direction. Google transit 18-21min (fastest: direct L4
    // metro, 18min; alt bus 4759 or V15 up to 21min) -- comparable to the reverse direction's
    // own bus-47 transit figure. Transit chosen: modestly faster than the ~25-27min walk.
    fromPlaceId: "portal-angel",
    toPlaceId: "barceloneta-beach",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 25, durationMinutesMax: 27, distanceKm: 1.85 },
      { mode: "transit", durationMinutesMin: 18, durationMinutesMax: 21, note: "Fastest: direct L4 metro; alt bus 4759/V15." },
    ],
  },
  {
    // Verified using Camp Nou's stored coordinates. Google walk 1h11min/5.1km flagged
    // restricted/private roads -- EXCLUDED, matching every other Camp Nou leg's treatment.
    // Google transit 29-30min (fastest: direct L3 from Plaça Catalunya, or L1+D20/L3+L5
    // combos, all 29-30min; two slower bus-only routes up to 43min excluded as outliers).
    // Google car 18-21min/5.3-5.6km; Apple car 15-18min/2.9-3.3mi(~4.7-5.3km); Apple transit
    // not exposed (identical to driving). Transit chosen over the faster car for
    // parking-simplicity, matching the sibling casa-batllo -> camp-nou entry's own reasoning
    // (same source area, same conclusion).
    fromPlaceId: "passeig-de-gracia",
    toPlaceId: "camp-nou",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 29, durationMinutesMax: 30, note: "Fastest: direct L3 from Plaça Catalunya, or L1+D20/L3+L5 combos." },
      { mode: "car", durationMinutesMin: 15, durationMinutesMax: 21 },
    ],
  },
  {
    // Completes verification started earlier in this same task before an interruption --
    // all figures gathered live against Google/Apple Maps, none estimated after the fact.
    // Google walk 1h/3.9km with ~119-135m elevation gain across the routes shown -- EXCLUDED,
    // steep and impractical. Google transit 28-29min (fastest: direct L3 metro or bus 24
    // from Pl Catalunya - Rambla Catalunya). Google car 17min/4.0-4.5km via Pg. de St. Joan or
    // Carrer de l'Escorial. Apple car 15-16min/2.2-2.6mi(~3.5-4.2km) -- consistent with
    // Google. Apple transit not exposed (dirflg=r rendered identically to dirflg=d). Transit
    // chosen: avoids the steep ~1h uphill walk while staying close to car's own time.
    fromPlaceId: "passeig-de-gracia",
    toPlaceId: "park-guell",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 28, durationMinutesMax: 29, note: "Fastest: direct L3 metro or bus 24 from Pl Catalunya - Rambla Catalunya." },
      { mode: "car", durationMinutesMin: 15, durationMinutesMax: 17 },
    ],
  },
  {
    // Google walk 11-12min/800-950m, mostly flat. Apple walk 12min/0.6mi(~0.97km), mostly
    // flat -- consistent, portal-angel resolved consistently between providers here. Short
    // central pedestrian leg -- transit/car not checked.
    fromPlaceId: "portal-angel",
    toPlaceId: "placa-reial",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 11, durationMinutesMax: 12, distanceKm: 0.87 }],
  },

  // ── Pedralbes/Born/MHC Transport Verification (verified 2026-08) ───────────────────
  // The 38 entries below verify every directional pair introduced by this task's 4 new
  // places: monestir-pedralbes and jardins-palau-pedralbes (Pedralbes/les-corts cluster,
  // notably far from the city center), and santa-maria-del-mar and museu-historia-catalunya
  // (Born/seafront). Verified in THIS task against live Google Maps and Apple Maps directions
  // results, using the exact stored coordinates given for the 4 new places and existing guide
  // anchors elsewhere (camp-nou's stored coordinates only, never its address; la-rambla's
  // Pla de la Boqueria point; portal-angel and passeig-de-gracia's stored address strings;
  // "Bogatell Beach" search text for bogatell, not the bare street address, matching the
  // precedent already documented on the existing bogatell entries; "Bunkers del Carmel,
  // Barcelona, Spain" for bunkers-carmel, which resolved reliably to "MUHBA Turó de la
  // Rovira" -- the official name for the same landmark). Each direction verified
  // independently -- no reverse-direction value reused, even where a verified opposite-
  // direction pair already exists in this table (several reverse pairs of #1, #14, #18, #19
  // are included below and were re-queried from scratch rather than mirrored).
  {
    // Google walk 7min/450-500m ("all routes mostly flat"). Apple walk 7-8min/0.3mi
    // (~0.48km), mostly flat. Very short seafront leg -- transit/car not checked.
    fromPlaceId: "museu-historia-catalunya",
    toPlaceId: "barceloneta-beach",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 7, durationMinutesMax: 8, distanceKm: 0.48 }],
  },
  {
    // Verified using Camp Nou's stored coordinates. Google walk 20min/1.3km, ALL 3 routes
    // flagged restricted/private roads -- EXCLUDED, matching every other Camp Nou leg's
    // treatment. Google transit 18min, bus M12 (16min ride, every 10min). Google car: best
    // unrestricted route 7min/1.6km ("little traffic, as usual"); a restricted-flagged
    // alt also shows 7min/1.9km. Apple car 11-12min/1.2-1.6mi(~1.9-2.6km). Apple transit not
    // exposed (identical to driving). Car chosen over transit (18min): more than double
    // transit's time, and Jardins de Pedralbes is an open public garden with ordinary street
    // parking, not a dense pedestrian zone requiring the parking-avoidance reasoning used on
    // sibling Camp Nou legs into Casa Batlló/Milà/Plaça Catalunya.
    // RE-VERIFIED (Residual Transport + Natural Reclaim Final Validation task) using the EXACT
    // stored lat/lng pair (41.3808,2.1228 -> 41.38839,2.11703) rather than a plain-text place
    // search -- CONFIRMS the original data. All 3 walking routes are still flagged
    // restricted/private roads (20min/1.3km); car is still unrestricted at 7-9min/1.6-2.0km;
    // transit is bus M12 (20min) or V1 (22min). The earlier "~12-13min unrestricted walk"
    // reading that conflicted with this came from a plain-text "Camp Nou" search, which Google
    // resolves to a different, more public-facing point than this exact coordinate (which Google
    // itself labels "Sala Roma", a specific Barça building at Carrer d'Arístides Maillol, 12) --
    // an ANCHOR MISMATCH in that earlier check, not a genuine source disagreement. Classification:
    // A (original stored value correct). Kept as-is; transit range widened slightly (18->18-22)
    // to honestly reflect this second independent reading.
    fromPlaceId: "camp-nou",
    toPlaceId: "jardins-palau-pedralbes",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 18, durationMinutesMax: 22, note: "Bus M12 or V1, every 10min." },
      { mode: "car", durationMinutesMin: 7, durationMinutesMax: 12 },
    ],
  },
  {
    // Verified using Camp Nou's stored coordinates. Google walk 28-29min/2.2-2.3km, ALL
    // routes flagged restricted/private roads -- EXCLUDED. Google transit 26-34min, best bus
    // H4+113 combo, 26min. Google car 8-10min/2.2-2.5km, no restriction flag; Apple car
    // 9min/1.6mi(~2.6km) -- consistent. Apple transit not exposed (identical to driving). Car
    // chosen: ~3x faster than transit, a dramatic difference matching the sibling
    // camp-nou->barceloneta-beach "genuine case for recommending car" reasoning.
    fromPlaceId: "monestir-pedralbes",
    toPlaceId: "camp-nou",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 26, durationMinutesMax: 34, note: "Fastest: bus H4+113 combo." },
      { mode: "car", durationMinutesMin: 8, durationMinutesMax: 10 },
    ],
  },
  {
    // Verified independently of the reverse (barcelona-cathedral -> barceloneta-beach,
    // already verified above). Google walk 20-21min/1.4-1.5km ("all routes mostly flat").
    // Google transit 15-18min (fastest: direct L4 metro). Apple walk 20-21min/0.9mi
    // (~1.45km), gentle hill. Walking kept as recommended: only ~5min slower than transit,
    // matching the reverse direction's own choice.
    fromPlaceId: "barceloneta-beach",
    toPlaceId: "barcelona-cathedral",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 20, durationMinutesMax: 21, distanceKm: 1.45, note: "Gentle hill noted by one source." },
      { mode: "transit", durationMinutesMin: 15, durationMinutesMax: 18, note: "Fastest: direct L4 metro." },
    ],
  },
  {
    // Google walk 55min/4.1km, flat but too long to be practical (vs transit's 22min, 2.5x)
    // -- EXCLUDED. Google transit 22-32min, best direct L3+L5 metro combo, 22min. Google car
    // 18-21min/4.8-5.6km, heavy traffic noted on 2 of 3 routes. Apple car 15-21min/2.6-3.3mi
    // (~4.2-5.3km). Apple transit not exposed (identical to driving). Transit chosen over the
    // faster car: Casa Milà sits on Passeig de Gràcia where parking is difficult/expensive,
    // matching the sibling camp-nou->casa-mila entry's own reasoning.
    fromPlaceId: "jardins-palau-pedralbes",
    toPlaceId: "casa-mila",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 22, durationMinutesMax: 32, note: "Fastest: direct L3+L5 metro combo." },
      { mode: "car", durationMinutesMin: 18, durationMinutesMax: 21, note: "Heavy traffic noted on 2 of 3 routes." },
    ],
  },
  {
    // Google walk 61min/4.6km, flat but too long (vs transit's 25min, 2.4x) -- EXCLUDED.
    // Google transit 25-38min, best direct L3 metro from Palau Reial, 25min. Google car
    // 20-21min/5.3-5.9km. Apple car 17-19min/2.8-3.2mi(~4.5-5.1km). Apple transit not
    // exposed (identical to driving). Transit chosen over car: Casa Batlló parking
    // difficulty, matching the sibling camp-nou->casa-batllo and jardins-palau-pedralbes
    // ->casa-mila entries' own reasoning.
    fromPlaceId: "jardins-palau-pedralbes",
    toPlaceId: "casa-batllo",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 25, durationMinutesMax: 38, note: "Fastest: direct L3 metro from Palau Reial." },
      { mode: "car", durationMinutesMin: 20, durationMinutesMax: 21 },
    ],
  },
  {
    // Google walk 11-13min/850-950m, negligible elevation (minor mixed ups/downs). Apple walk
    // 11min/0.5mi(~0.8km), mostly flat. Short Born-area leg -- transit/car not checked.
    fromPlaceId: "palau-musica",
    toPlaceId: "santa-maria-del-mar",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 11, durationMinutesMax: 13, distanceKm: 0.85 }],
  },
  {
    // Google walk 17-22min/1.2-1.6km, flat. Apple walk 16min/0.7mi(~1.1km), mostly flat.
    // Short-moderate seafront-adjacent walk -- transit/car not checked (clearly walkable).
    fromPlaceId: "ciutadella",
    toPlaceId: "museu-historia-catalunya",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 16, durationMinutesMax: 22, distanceKm: 1.3 }],
  },
  {
    // Google walk 19-20min/1.4-1.5km, flat. Apple walk 21min/1mi(~1.6km), gentle hill (one
    // route "gently downhill"). Portal de l'Àngel resolved consistently between providers
    // here (no anchor ambiguity) -- transit/car not checked.
    fromPlaceId: "portal-angel",
    toPlaceId: "museu-historia-catalunya",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 19, durationMinutesMax: 21, distanceKm: 1.45, note: "Gentle hill noted by one source." }],
  },
  {
    // Google walk 13-14min/900-950m, flat. Apple walk 13-14min/0.6mi(~0.95km), mostly flat.
    // Short Born-to-seafront leg -- transit/car not checked.
    fromPlaceId: "santa-maria-del-mar",
    toPlaceId: "barceloneta-beach",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 13, durationMinutesMax: 14, distanceKm: 0.92 }],
  },
  {
    // Bogatell has no stored coordinates (only a street address covering the full promenade
    // length) -- used "Bogatell Beach" search text per the precedent already documented on
    // the existing bogatell entries, rather than the bare address. Google walk (Playa de
    // Bogatell) 29-32min/2.1-2.4km, flat. Google transit 24-28min, best bus 47, 24min -- not
    // materially faster than walking. Apple walk 27-28min/1.2-1.3mi(~1.9-2.1km), mostly flat
    // -- roughly consistent with Google here (no major anchor-ambiguity flag needed for this
    // direction). Walking kept as recommended: matches the reverse direction's own choice
    // (bogatell<->barceloneta-beach) and transit offers no real time savings.
    fromPlaceId: "bogatell",
    toPlaceId: "museu-historia-catalunya",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 27, durationMinutesMax: 32, distanceKm: 2.3, note: "Flat seafront promenade." },
      { mode: "transit", durationMinutesMin: 24, durationMinutesMax: 28, note: "Fastest: bus 47 -- not materially faster than walking." },
    ],
  },
  {
    // Google walk 21min/1.3-1.4km, flat. Apple walk 20min/0.8mi(~1.3km), "150 ft climb"
    // (~46m, minor uphill) -- consistent with Jardins de Pedralbes sitting slightly below the
    // monastery. Short-moderate Pedralbes-area leg -- transit/car not checked.
    fromPlaceId: "jardins-palau-pedralbes",
    toPlaceId: "monestir-pedralbes",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 20, durationMinutesMax: 21, distanceKm: 1.35, note: "Minor uphill (~45m gain)." }],
  },
  {
    // Google walk 1h2min/4.7-4.8km, net descent but too long to be practical (vs transit's
    // 28min, 2.2x) -- EXCLUDED. Google transit 28-48min, best direct L3 metro, 28min. Google
    // car 36-41min/7.2-13.9km, best route avoids a La Rambla closure. Apple car 33min/
    // 4.1-4.9mi(~6.6-7.9km). Apple transit not exposed (identical to driving). Transit
    // chosen: fastest option overall (beats car), and avoids driving into/parking near
    // Boqueria's pedestrian market zone, matching the sibling camp-nou->boqueria entry's
    // reasoning.
    fromPlaceId: "park-guell",
    toPlaceId: "boqueria",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 28, durationMinutesMax: 48, note: "Fastest: direct L3 metro." },
      { mode: "car", durationMinutesMin: 33, durationMinutesMax: 41, note: "Fastest route avoids a La Rambla closure." },
    ],
  },
  {
    // Google walk 12-14min/900m-1.0km, flat. Apple walk 12min/0.6mi(~0.95km), mostly flat
    // (one route "moderate hill"). Short Born-area leg -- transit/car not checked.
    fromPlaceId: "ciutadella",
    toPlaceId: "santa-maria-del-mar",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 12, durationMinutesMax: 14, distanceKm: 0.95 }],
  },
  {
    // Verified independently of the reverse (museu-historia-catalunya->barceloneta-beach
    // above). Google walk 6-8min/450-550m, flat. Apple walk 7-8min/0.3mi(~0.48km), mostly
    // flat. Very short seafront leg -- transit/car not checked.
    fromPlaceId: "barceloneta-beach",
    toPlaceId: "museu-historia-catalunya",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 6, durationMinutesMax: 8, distanceKm: 0.5 }],
  },
  {
    // Google walk not checked (~6km cross-city, consistent with other far les-corts legs).
    // Google transit 25-39min, best direct L3 metro from Palau Reial, 25min. Google car
    // 22min/5.9-6.5km, consistent across all 3 routes. Apple car 20-23min/3.2-3.7mi
    // (~5.1-6.0km). Apple transit not exposed (identical to driving). Transit chosen over
    // car despite close timing: Plaça Catalunya is a dense central pedestrian square with
    // difficult parking, matching the sibling camp-nou->placa-catalunya entry's reasoning.
    fromPlaceId: "jardins-palau-pedralbes",
    toPlaceId: "placa-catalunya",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 25, durationMinutesMax: 39, note: "Fastest: direct L3 metro from Palau Reial." },
      { mode: "car", durationMinutesMin: 22, durationMinutesMax: 23 },
    ],
  },
  {
    // Google walk 20-22min/1.4-1.6km, flat. Apple walk 19min/0.9mi(~1.45km), mostly flat.
    // Short-moderate walk -- transit/car not checked (clearly walkable).
    fromPlaceId: "boqueria",
    toPlaceId: "museu-historia-catalunya",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 19, durationMinutesMax: 22, distanceKm: 1.5 }],
  },
  {
    // Google walk 9min/600m, flat. Apple walk 8min/0.3mi(~0.48km), mostly flat. Very short
    // Born-to-seafront leg -- transit/car not checked.
    fromPlaceId: "santa-maria-del-mar",
    toPlaceId: "museu-historia-catalunya",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 8, durationMinutesMax: 9, distanceKm: 0.5 }],
  },
  {
    // Google walk 19-20min/1.4-1.5km, negligible elevation (minor mixed ups/downs). Apple
    // walk 18min/0.8mi(~1.3km), mostly flat. Short-moderate walk -- transit/car not checked.
    fromPlaceId: "palau-musica",
    toPlaceId: "museu-historia-catalunya",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 18, durationMinutesMax: 20, distanceKm: 1.4 }],
  },
  {
    // Verified independently of the reverse (palau-musica->museu-historia-catalunya above).
    // Google walk 20-21min/1.4-1.5km, negligible elevation. Apple walk 18min/0.8mi(~1.3km),
    // mostly flat. Short-moderate walk -- transit/car not checked.
    fromPlaceId: "museu-historia-catalunya",
    toPlaceId: "palau-musica",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 18, durationMinutesMax: 21, distanceKm: 1.4 }],
  },
  {
    // Destination searched as "Bunkers del Carmel, Barcelona, Spain", which resolved
    // reliably and consistently to "MUHBA Turó de la Rovira" (the official name for the same
    // landmark) on both providers. Google walk 1h19-1h20min/4.9km, ~239-254m elevation gain
    // -- EXCLUDED, steep and impractical. Google transit 41-56min, best L3+V19 combo or
    // direct L4, 41min. Google car 29min/9.2-9.4km, best route avoids a closed road on
    // Carrer de la Gran Vista, no restriction flag. Apple car 25-31min/3-3.9mi(~4.8-6.3km).
    // Apple transit not exposed (identical to driving). Car chosen: ~1.5-1.7x faster than
    // transit, matching the sibling bunkers-carmel entries' own car preference.
    fromPlaceId: "passeig-de-gracia",
    toPlaceId: "bunkers-carmel",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 41, durationMinutesMax: 56, note: "Fastest: L3+V19 bus/metro combo, or direct L4." },
      { mode: "car", durationMinutesMin: 25, durationMinutesMax: 29 },
    ],
  },
  {
    // Google walk 14-17min/1.0-1.2km, flat. Apple walk 14min/0.6mi(~1.0km), gentle hill.
    // Short seafront-adjacent leg -- transit/car not checked.
    fromPlaceId: "barcelona-cathedral",
    toPlaceId: "museu-historia-catalunya",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 14, durationMinutesMax: 17, distanceKm: 1.05, note: "Gentle hill noted by one source." }],
  },
  {
    // Google walk 48min/3.7km, net descent (elevation segments show ~135m net downhill).
    // Apple walk 54-55min/2.2-2.3mi(~3.5-3.7km), gently downhill on 2 of 3 routes ("moderate
    // hill" on the 3rd). Google transit 33-46min, best multi-bus/metro combo, 33min. Google
    // car 17-18min/4.4-4.7km; Apple car 19-20min/2.8-3mi(~4.5-4.8km) -- consistent. Apple
    // transit did not return a distinct result (near-identical to driving). Car chosen: ~2x
    // faster than transit even at its best, and Arc de Triomf is an open plaza/monument, not
    // a dense pedestrian-only zone like Casa Batlló or Plaça Catalunya, so the parking-
    // avoidance reasoning used on those sibling legs doesn't apply here.
    fromPlaceId: "park-guell",
    toPlaceId: "arc-de-triomf",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 48, durationMinutesMax: 55, distanceKm: 3.6, note: "Net descent (downhill), but a long walk -- transit/car both faster." },
      { mode: "transit", durationMinutesMin: 33, durationMinutesMax: 46 },
      { mode: "car", durationMinutesMin: 17, durationMinutesMax: 20 },
    ],
  },
  {
    // Used "Bogatell Beach" search text per established precedent. Google walk (Playa de
    // Bogatell) 29-32min/2.1-2.4km, flat. Google transit 25-32min, best direct bus D20,
    // 25min -- not materially faster than walking. Apple walk 27-28min/1.2-1.3mi
    // (~1.9-2.1km), mostly flat. Walking kept as recommended: matches the reverse direction
    // (#bogatell->museu-historia-catalunya above) and the bogatell<->barceloneta-beach
    // pattern.
    fromPlaceId: "museu-historia-catalunya",
    toPlaceId: "bogatell",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 27, durationMinutesMax: 32, distanceKm: 2.3, note: "Flat seafront promenade." },
      { mode: "transit", durationMinutesMin: 25, durationMinutesMax: 32, note: "Fastest: direct bus D20 -- not materially faster than walking." },
    ],
  },
  {
    // Google walk not checked (far cross-city, ~7km). Google transit 41-70min, best L3+D20
    // combo, 41min. Google car 26-28min/17.8-21.8km via the B-20/B-10 highway. Apple car
    // 21-28min/4.8-13mi(~7.7-20.9km) -- wide spread between a highway-fastest route and a
    // "fewer turns" city route. Apple transit not exposed (identical to driving). Car
    // chosen: ~1.5x faster than transit, matching the sibling camp-nou->barceloneta-beach
    // car-preference precedent (beachfront parking isn't the dense-pedestrian-zone problem
    // that drives the transit choice on Casa Batlló/Milà/Plaça Catalunya legs).
    fromPlaceId: "jardins-palau-pedralbes",
    toPlaceId: "barceloneta-beach",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 41, durationMinutesMax: 70, note: "Fastest: direct L3+D20 combo." },
      { mode: "car", durationMinutesMin: 26, durationMinutesMax: 28 },
    ],
  },
  {
    // Anchor-ambiguity leg (same pattern documented on the passeig-de-gracia section note
    // earlier in this file): Google walk 15min/1.2km via the south (Plaça Catalunya) end of
    // the stored address, mostly flat. Apple walk 21min/1mi(~1.6km) resolving further north,
    // gently downhill. No stored coordinates for passeig-de-gracia to disambiguate -- both
    // figures reported honestly rather than averaged.
    fromPlaceId: "passeig-de-gracia",
    toPlaceId: "placa-reial",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 15, durationMinutesMax: 21 },
    ],
  },
  {
    // Google walk 22-24min/1.6km, flat. Apple walk 20min/0.9mi(~1.45km), mostly flat.
    // Short-moderate walk -- transit/car not checked (clearly walkable).
    fromPlaceId: "museu-historia-catalunya",
    toPlaceId: "arc-de-triomf",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 20, durationMinutesMax: 24, distanceKm: 1.55 }],
  },
  {
    // Google walk not checked (far cross-city). Google transit 37-44min, best L3+bus combo
    // from Liceu, 37min. Google car 33-34min/6.6-6.9km, best route avoids La Rambla
    // closures. Apple car 28-31min/4.1-4.7mi(~6.6-7.6km). Apple transit did not return a
    // distinct result (near-identical to driving). Transit chosen despite being close to
    // car's time: the origin (Boqueria) is a pedestrian-only market zone, so driving still
    // requires walking to/from parking, matching the sibling camp-nou<->boqueria entries'
    // reasoning.
    fromPlaceId: "boqueria",
    toPlaceId: "monestir-pedralbes",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 37, durationMinutesMax: 44, note: "Fastest: L3 metro from Liceu plus a bus/metro combo." },
      { mode: "car", durationMinutesMin: 28, durationMinutesMax: 34 },
    ],
  },
  {
    // Google walk 21-22min/1.6km, flat. Google transit 12-20min, best direct L4 metro from
    // Passeig de Gràcia, 12min. Apple walk 20min/0.9mi(~1.45km), gentle hill. Transit chosen:
    // materially faster than the ~20-22min walk via a direct metro line.
    fromPlaceId: "casa-batllo",
    toPlaceId: "barcelona-cathedral",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 20, durationMinutesMax: 22, distanceKm: 1.55, note: "Gentle hill noted by one source." },
      { mode: "transit", durationMinutesMin: 12, durationMinutesMax: 20, note: "Fastest: direct L4 metro from Passeig de Gràcia." },
    ],
  },
  {
    // Google walk 49-51min/3.3-3.5km, ~74-129m elevation gain (uphill toward Palau Nacional,
    // matching the elevation profile documented on every other verified MNAC leg). Google
    // transit 33-52min, best L4+L1 combo, 33min. Google car 15-16min/4.1-5.4km. Apple walk
    // 50-54min/2-2.2mi(~3.2-3.5km), "250-300 ft climb" (~76-91m) -- consistent. Apple car
    // 15-20min/2.5-4mi(~4-6.4km). Apple transit did not return a distinct result
    // (near-identical to driving). Transit chosen despite car being faster: the origin
    // (Santa Maria del Mar, dense old-city/Born) matches the established pattern where every
    // other central-point ->mnac leg (gothic-quarter, la-rambla, placa-catalunya) chose
    // transit over a faster car due to central parking difficulty.
    fromPlaceId: "santa-maria-del-mar",
    toPlaceId: "mnac",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 49, durationMinutesMax: 54, distanceKm: 3.4, note: "Meaningful uphill toward Palau Nacional (~75-130m gain)." },
      { mode: "transit", durationMinutesMin: 33, durationMinutesMax: 52, note: "Fastest: direct L4+L1 metro combo." },
      { mode: "car", durationMinutesMin: 15, durationMinutesMax: 20 },
    ],
  },
  {
    // Verified independently of the reverse (santa-maria-del-mar<->museu-historia-catalunya
    // above). Google walk 9min/600m, flat. Apple walk 8min/0.3mi(~0.48km), mostly flat. Very
    // short leg -- transit/car not checked.
    fromPlaceId: "museu-historia-catalunya",
    toPlaceId: "santa-maria-del-mar",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 8, durationMinutesMax: 9, distanceKm: 0.5 }],
  },
  {
    // Verified independently of the reverse (ciutadella<->santa-maria-del-mar above). Google
    // walk 12-14min/900m-1.0km, flat. Apple walk 12min/0.6mi(~0.95km), mostly flat (one
    // route "moderate hill"). Short Born-area leg -- transit/car not checked.
    fromPlaceId: "santa-maria-del-mar",
    toPlaceId: "ciutadella",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 12, durationMinutesMax: 14, distanceKm: 0.95 }],
  },
  {
    // Verified using the guide's stored la-rambla anchor (Pla de la Boqueria). Google walk
    // 24-25min/1.7-1.8km, flat. Google transit 17-29min, best direct L3+L1 metro combo from
    // Liceu, 17min. Apple walk 22min/1mi(~1.6km), gentle hill. Transit chosen: materially
    // faster than the ~22-25min walk, matching the sibling placa-catalunya->ciutadella
    // entry's reasoning.
    fromPlaceId: "la-rambla",
    toPlaceId: "ciutadella",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 22, durationMinutesMax: 25, distanceKm: 1.65, note: "Gentle hill noted by one source." },
      { mode: "transit", durationMinutesMin: 17, durationMinutesMax: 29, note: "Fastest: direct L3+L1 metro combo from Liceu." },
    ],
  },
  {
    // Verified independently of the reverse (palau-musica->barceloneta-beach above). Google
    // walk 24-29min/1.7-2.1km, negligible elevation. Google transit 16-24min, best direct L4
    // metro from Barceloneta, 16min. Apple walk 23-24min/1.1mi(~1.75km), mostly flat (one
    // route "gentle hill"). Transit chosen: materially faster than the ~23-24min walk,
    // matching the reverse direction's own choice.
    fromPlaceId: "barceloneta-beach",
    toPlaceId: "palau-musica",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 23, durationMinutesMax: 24, distanceKm: 1.75 },
      { mode: "transit", durationMinutesMin: 16, durationMinutesMax: 24, note: "Fastest: direct L4 metro from Barceloneta." },
    ],
  },
  {
    // Verified independently of the reverse (arc-de-triomf->palau-musica above). Google walk
    // 10min/700-750m, minor elevation. Apple walk 9min/0.4mi(~0.64km), mostly flat. Very
    // short leg -- transit/car not checked.
    fromPlaceId: "palau-musica",
    toPlaceId: "arc-de-triomf",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 9, durationMinutesMax: 10, distanceKm: 0.7 }],
  },
  {
    // Google walk 18-21min/1.4-1.6km, flat. Google transit 6min, direct L3 metro (Passeig de
    // Gràcia -> Liceu, ~2min ride, trains every 5min). Google car 28min/3.5-5.2km, avoiding
    // La Rambla closures. Apple walk 20min/0.8mi(~1.3km), gently downhill. Apple transit not
    // exposed (falls back to driving, ~21-26min). Transit chosen: a direct one-line metro
    // hop, dramatically faster than walking or driving into Boqueria's pedestrian zone,
    // matching the sibling casa-batllo->la-rambla entry's reasoning exactly.
    fromPlaceId: "casa-batllo",
    toPlaceId: "boqueria",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 18, durationMinutesMax: 21, distanceKm: 1.5, note: "Gently downhill." },
      { mode: "transit", durationMinutesMin: 6, durationMinutesMax: 13, note: "Direct L3 metro, Passeig de Gracia -> Liceu; trains ~every 5min." },
      { mode: "car", durationMinutesMin: 28, durationMinutesMax: 28 },
    ],
  },
  {
    // Google walk 42-44min/2.8-3.0km, ~63-132m elevation gain (uphill toward Palau Nacional,
    // matching the profile documented on every other MNAC leg). Google transit 22-34min,
    // best direct L1+L3 metro combo, 22min. Google car 13-17min/3.8-4.8km. Apple walk
    // 50-54min/1.9-2.1mi(~3.1-3.4km), "200 ft climb" (~61m); 2 of 3 routes flag "escalator
    // required" (Montjuïc's outdoor escalators, matching the note on the sibling
    // mnac->placa-catalunya entry). Apple car 17-18min/2.5-3.1mi(~4-5km). Apple transit did
    // not return a distinct result (near-identical to driving). Transit chosen despite car
    // being faster: matches the established *->mnac pattern from central/Eixample points
    // (portal-angel->mnac and palau-musica->mnac both chose transit over a faster car to
    // avoid the uphill walk).
    fromPlaceId: "passeig-de-gracia",
    toPlaceId: "mnac",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 42, durationMinutesMax: 54, distanceKm: 3.2, note: "Meaningful uphill toward Palau Nacional (~65-130m gain); some routes require Montjuïc's outdoor escalators." },
      { mode: "transit", durationMinutesMin: 22, durationMinutesMax: 34, note: "Fastest: direct L1+L3 metro combo." },
      { mode: "car", durationMinutesMin: 13, durationMinutesMax: 18 },
    ],
  },
  {
    // Google walk not checked (far cross-city, ~5km+ down from Montjuïc). Google transit
    // 35-54min, best direct L1+L4 metro combo, 35min. Google car 16-19min/4.7-5.7km; Apple
    // car 15-17min/3-3.5mi(~4.8-5.6km) -- consistent. Apple transit not exposed (identical
    // to driving). Car chosen: ~2x faster than transit, matching the sibling
    // camp-nou->mnac entry's reasoning (MNAC/Montjuïc and the beachfront both have practical
    // parking, unlike the dense old-city destinations other legs avoid by transit).
    fromPlaceId: "mnac",
    toPlaceId: "barceloneta-beach",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 35, durationMinutesMax: 54, note: "Fastest: direct L1+L4 metro combo." },
      { mode: "car", durationMinutesMin: 16, durationMinutesMax: 19 },
    ],
  },
  {
    // Surfaced by the Must-Visit transport audit (not in the original 38-pair batch) --
    // verified independently of the reverse (ciutadella -> museu-historia-catalunya, already
    // verified above). Google walk 17-22min/1.2-1.6km, "all routes mostly flat". Apple walk
    // 16min/0.7mi(~1.1km), "moderate hill" -- times/distances agree closely despite the minor
    // elevation-description difference. Short flat-ish Born-to-seafront walk -- transit/car
    // not checked.
    fromPlaceId: "museu-historia-catalunya",
    toPlaceId: "ciutadella",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 16, durationMinutesMax: 22, distanceKm: 1.2 }],
  },

  // ── Cook & Taste + Gothic Quarter Corridor Verification V1 (verified 2026-08) ────────
  // Closes the 5 unresolved pairs the "Smart Planner Unresolved Transport Audit V1" task
  // identified as involving cook-and-taste-paella-class (Carrer del Paradís, 3, 08002
  // Barcelona -- the guide's own stored address, used exactly as-is), plus the one unrelated
  // gap (placa-catalunya -> gothic-quarter). gothic-quarter uses the SAME established anchor
  // as every other gothic-quarter entry in this file: Plaça Nova, 08002 Barcelona (the guide's
  // stored coordinates 41.38278, 2.17694). boqueria and barcelona-cathedral use their official
  // names directly (no stored coordinates/address for either, consistent with how every other
  // entry for these two places was verified elsewhere in this file). portal-angel uses its
  // stored address "Portal de l'Àngel, 08002 Barcelona, Spain". Each direction verified
  // independently against live Google and Apple Maps walking directions -- no value copied
  // from any reverse pair, even for gothic-quarter -> portal-angel where the opposite
  // direction was already verified in this table (7-9min/0.5km, see that entry above) -- see
  // this direction's own note for how the two compare. All 6 are short, flat-to-gentle-slope
  // old-city walks; walking is clearly the only sensible mode (well under any transit
  // threshold) -- transit/car not checked, consistent with every other very-short central leg
  // in this file.
  {
    // Google: best 9min/650m via Carrer de la Boqueria (2 alt routes: 10min/750m), all flat.
    // Apple: 8min/0.4mi(~0.64km), "mostly flat". Sources agree closely.
    fromPlaceId: "boqueria",
    toPlaceId: "cook-and-taste-paella-class",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 8, durationMinutesMax: 10, distanceKm: 0.65 }],
  },
  {
    // Google: 7min/550m via Av del Portal de l'Àngel, flat (single route offered). Apple:
    // 9min/0.4mi(~0.64km), "mostly flat". Sources agree closely.
    fromPlaceId: "cook-and-taste-paella-class",
    toPlaceId: "portal-angel",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 7, durationMinutesMax: 9, distanceKm: 0.6 }],
  },
  {
    // Google: 3min/260m via Carrer de la Pietat + Carrer del Bisbe, flat. Apple: 3min/0.2mi
    // (~0.32km), "mostly flat". Very short leg -- Cook & Taste's stored address borders the
    // Plaça Nova/Cathedral block directly. Sources agree closely.
    fromPlaceId: "cook-and-taste-paella-class",
    toPlaceId: "gothic-quarter",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 3, durationMinutesMax: 3, distanceKm: 0.3 }],
  },
  {
    // Verified independently despite the reverse (portal-angel -> gothic-quarter, 7-9min/
    // 0.5km) already being verified above -- no value copied from it. Google: 4min/280m via
    // Carrer dels Arcs + Av del Portal de l'Àngel, flat (single route offered). Apple: 6min/
    // 0.3mi(~0.48km), "gently uphill". Both sources independently show this direction as a bit
    // faster than its reverse -- a real directional asymmetry (Portal de l'Àngel sits slightly
    // higher than Plaça Nova), not an error or a copied value.
    fromPlaceId: "gothic-quarter",
    toPlaceId: "portal-angel",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      {
        mode: "walking",
        durationMinutesMin: 4,
        durationMinutesMax: 6,
        distanceKm: 0.4,
        note: "Gently uphill on the direct route; a flatter alternative is slightly longer.",
      },
    ],
  },
  {
    // Google: best 3min/230m via Carrer dels Comtes + Carrer del Paradís (alt 4min/270m via
    // Carrer del Bisbe + Carrer de la Pietat), all flat. Apple: 2min/0.1mi(~0.16km), "mostly
    // flat" -- Apple's distance figure is notably smaller than Google's, reported honestly
    // rather than reconciled. Very short leg -- Cook & Taste's stored address borders the
    // Cathedral directly.
    fromPlaceId: "barcelona-cathedral",
    toPlaceId: "cook-and-taste-paella-class",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 2, durationMinutesMax: 4, distanceKm: 0.2 }],
  },
  {
    // Verified directly against live Maps -- NOT derived from placa-catalunya -> la-rambla +
    // la-rambla -> gothic-quarter. Google: 7min/500m via Av del Portal de l'Àngel, flat
    // (single route offered). Apple: 6min/0.3mi(~0.48km), "gently downhill" -- consistent with
    // the gothic-quarter -> portal-angel entry's "gently uphill" in the opposite direction
    // (Plaça Catalunya sits slightly higher than the Gothic Quarter core). Sources agree
    // closely on time and distance.
    fromPlaceId: "placa-catalunya",
    toPlaceId: "gothic-quarter",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 6, durationMinutesMax: 7, distanceKm: 0.5, note: "Gently downhill." }],
  },

  // ── Route Coverage Verification Phase (verified live 2026-09-06) ──────────────────────
  // 25 pairs added, picked strictly by observed generation frequency (see the long-trip audit
  // script's own "top unresolved pairs" ranking) among genuinely fixable pairs -- i.e. pairs
  // with a real, specific Guide-stored coordinate or address on both ends. Every entry below
  // was checked live against Google Maps directions using the SAME stored coordinate/address
  // each place already resolves to elsewhere in this file (e.g. gothic-quarter's own anchor
  // is reused nowhere here since none of these pairs touch it). Each direction was queried
  // independently -- no value was copied from a reverse pair even where one already existed in
  // this table (e.g. monestir-pedralbes -> jardins-palau-pedralbes below genuinely differs from
  // the already-stored reverse: 17min here vs 20-21min the other way -- real street-network
  // asymmetry, not a copy-paste). Two pairs from the same priority list were deliberately left
  // OUT of this batch and remain unresolved: gothic-quarter -> gothic-quarter-tapas-wine-tour
  // and gaudi-bike-tour -> gothic-quarter-tapas-wine-tour -- the tour's Guide entry has no
  // stored address or coordinates, only a generic "Gothic Quarter" area label, so there is no
  // real specific point to verify a route against (a "Gothic Quarter Barcelona" text search
  // would only resolve to Google's own guessed centroid of the whole neighborhood, not a real
  // meeting point -- exactly the kind of derived/invented anchor this file's own rules reject).
  // Every "montjuic"-touching pair from the same priority list (montjuic->mnac, placa-catalunya
  // ->montjuic, portal-angel->montjuic, boqueria->montjuic) was correctly excluded per the
  // PERMANENTLY_UNRESOLVED_PLACE_IDS guard below -- not re-litigated here.
  {
    // Google walk: best 19min/1.3km via Passeig de Santa Madrona + Av. Miramar (single flat-ish
    // route); alt 23min/1.6km via Av. de l'Estadi + Av. Miramar with real elevation gain
    // (+165m/-11m then +105m/-49m net uphill) -- the cable-car's upper station sits higher on
    // the hill than MNAC. Used the faster, lower-elevation route as the primary option.
    fromPlaceId: "mnac",
    toPlaceId: "teleferic-montjuic",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 19, durationMinutesMax: 23, distanceKm: 1.3, note: "Some uphill on the longer alternate route." }],
  },
  {
    // Google walk: 20min/1.4km via Carrer del Carme, single route offered, flat central walk.
    fromPlaceId: "mercat-sant-antoni",
    toPlaceId: "barcelona-cathedral",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 20, durationMinutesMax: 20, distanceKm: 1.4 }],
  },
  {
    // Google walk: 7min/500m via Carrer de la Boqueria (alt 8min/600m via Carrer de Ferran),
    // flat old-city walk -- Cook & Taste's stored address sits just off La Rambla.
    fromPlaceId: "cook-and-taste-paella-class",
    toPlaceId: "la-rambla",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 7, durationMinutesMax: 8, distanceKm: 0.5 }],
  },
  {
    // Google walk: 17min/1.3km via Carrer de l'Abadessa Olzet, flat -- verified independently
    // in THIS direction, not copied from the already-stored reverse (jardins-palau-pedralbes ->
    // monestir-pedralbes, 20-21min/1.35km) -- real street-network asymmetry between the two
    // directions, not an inconsistency.
    fromPlaceId: "monestir-pedralbes",
    toPlaceId: "jardins-palau-pedralbes",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 17, durationMinutesMax: 17, distanceKm: 1.3 }],
  },
  {
    // Google walk: 17min/1.3km via Carrer de Martí i Franquès -- ALL 3 routes Google offered
    // for this pair were flagged "restricted use / includes private roads" (this crosses the
    // UPC Campus Nord university grounds). Re-checked under transit mode: Google returned the
    // identical 17min walking route with no faster public-transit alternative for this short a
    // hop. Recorded as-is with the caveat noted rather than silently dropped or upgraded to a
    // different mode -- a real visitor may prefer to route around campus manually.
    fromPlaceId: "jardins-palau-pedralbes",
    toPlaceId: "camp-nou",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 17, durationMinutesMax: 17, distanceKm: 1.3, note: "Route crosses university (UPC Campus Nord) grounds, which may be gated at night." }],
  },
  {
    // Google walk: 33min/2.4km via Carrer de Roger de Flor + Carrer de Casp, flat but long.
    // Google transit: multiple lines 15-21min (direct L2 from Sagrada Família station fastest
    // at 15min; L5/L3=16min; D50 bus=17min; L4=20min; bus 19=21min) -- transit is materially
    // faster than the 33min walk, so transit is recommended per this file's existing mode logic.
    fromPlaceId: "sagrada-familia",
    toPlaceId: "passeig-de-gracia",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 33, durationMinutesMax: 34, distanceKm: 2.4 },
      { mode: "transit", durationMinutesMin: 15, durationMinutesMax: 21, note: "Fastest: direct L2 metro from Sagrada Família station." },
    ],
  },
  {
    // Google walk: 2min/140m via Carrer de Colom + La Rambla, flat -- both stops sit in the
    // same small old-city block.
    fromPlaceId: "gaudi-bike-tour",
    toPlaceId: "tablao-cordobes-flamenco",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 2, durationMinutesMax: 2, distanceKm: 0.14 }],
  },
  {
    // Google walk: 22min/1.6km via Carrer del Doctor Aiguader + Av. del Litoral, flat waterfront
    // walk. Destination anchored to the general "Port Olímpic" area (the Guide's own
    // sunset-catamaran-sail entry has no exact departure-point address) -- same kind of
    // named-area anchor already used elsewhere in this file (e.g. "Bogatell Beach" search text).
    fromPlaceId: "museu-historia-catalunya",
    toPlaceId: "sunset-catamaran-sail",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 22, durationMinutesMax: 23, distanceKm: 1.6, note: "Destination anchored to the general Port Olímpic area -- no exact departure point stored." }],
  },
  {
    // Google walk: 12min/900m via Av del Portal de l'Àngel (alt 14min/1.0km via Via Laietana),
    // flat.
    fromPlaceId: "passeig-de-gracia",
    toPlaceId: "cook-and-taste-paella-class",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 12, durationMinutesMax: 14, distanceKm: 0.9 }],
  },
  {
    // Google walk: 20min/1.5km via Carrer de l'Hospital, flat.
    fromPlaceId: "mercat-sant-antoni",
    toPlaceId: "cook-and-taste-paella-class",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 20, durationMinutesMax: 20, distanceKm: 1.5 }],
  },
  {
    // Two hilltop viewpoints on opposite sides of the city -- genuinely far apart, not a short
    // adjacency. Google transit: worst-case, 51min+ minimum involving the Tibidabo funicular
    // plus a bus transfer -- impractical. Google driving: 26-27min/12.0-12.8km via Carretera de
    // l'Arrabassada/BP-1417, normal traffic -- the only practical mode for this pair, recorded
    // as such rather than defaulting to walking/transit just because both are "viewpoints."
    fromPlaceId: "tibidabo",
    toPlaceId: "bunkers-carmel",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [{ mode: "car", durationMinutesMin: 26, durationMinutesMax: 27, distanceKm: 12.1, note: "Transit is impractical for this pair (51min+ via funicular + bus transfer)." }],
  },
  {
    // Google walk: 23min/1.6km via Carrer de la Princesa (alt 25-26min/1.8km), flat.
    fromPlaceId: "ciutadella",
    toPlaceId: "gaudi-bike-tour",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 23, durationMinutesMax: 26, distanceKm: 1.6 }],
  },
  {
    // Google walk: 22-23min/1.7km via Carrer de Pau Claris or Av del Portal de l'Àngel, flat.
    fromPlaceId: "casa-batllo",
    toPlaceId: "cook-and-taste-paella-class",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 22, durationMinutesMax: 23, distanceKm: 1.7 }],
  },
  {
    // Google walk: 20min/1.5km via Carrer de l'Hospital -- verified independently in this
    // direction (not copied from the forward mercat-sant-antoni -> cook-and-taste entry above,
    // even though the real value happens to match).
    fromPlaceId: "cook-and-taste-paella-class",
    toPlaceId: "mercat-sant-antoni",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 20, durationMinutesMax: 20, distanceKm: 1.5 }],
  },
  {
    // Google walk: 26min/1.9km via Carrer de l'Hospital, flat.
    fromPlaceId: "mercat-sant-antoni",
    toPlaceId: "santa-maria-del-mar",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 26, durationMinutesMax: 28, distanceKm: 1.9 }],
  },
  {
    // Google walk: 9min/650m via Av. del Litoral, flat -- both beaches sit on the same
    // waterfront promenade, Port Olímpic anchor same as the museu-historia-catalunya entry
    // above.
    fromPlaceId: "bogatell",
    toPlaceId: "sunset-catamaran-sail",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 9, durationMinutesMax: 9, distanceKm: 0.65 }],
  },
  {
    // Google walk: 13min/1.0km via Carrer dels Escudellers, flat.
    fromPlaceId: "tablao-cordobes-flamenco",
    toPlaceId: "santa-maria-del-mar",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 13, durationMinutesMax: 16, distanceKm: 1.0 }],
  },
  {
    // Google walk: 18min/1.3km via Carrer de l'Hospital, flat.
    fromPlaceId: "gaudi-bike-tour",
    toPlaceId: "mercat-sant-antoni",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 18, durationMinutesMax: 20, distanceKm: 1.3 }],
  },
  {
    // Google walk: 17min/1.2km via Carrer de l'Hospital, flat.
    fromPlaceId: "mercat-sant-antoni",
    toPlaceId: "tablao-cordobes-flamenco",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 17, durationMinutesMax: 18, distanceKm: 1.2 }],
  },
  {
    // Google walk: 12min/850m via La Rambla, flat.
    fromPlaceId: "portal-angel",
    toPlaceId: "tablao-cordobes-flamenco",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 12, durationMinutesMax: 13, distanceKm: 0.85 }],
  },
  {
    // Google walk: 21-22min/1.6km via Carrer de la Princesa or Carrer de Ferran, flat.
    fromPlaceId: "arc-de-triomf",
    toPlaceId: "gaudi-bike-tour",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 21, durationMinutesMax: 22, distanceKm: 1.6 }],
  },
  {
    // Google walk: 31min/2.3km via Carrer de l'Hospital, flat but long. Google transit: 19min
    // direct L2+L4 (transfer at Sant Antoni station) -- materially faster, recommended.
    fromPlaceId: "mercat-sant-antoni",
    toPlaceId: "museu-historia-catalunya",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 31, durationMinutesMax: 31, distanceKm: 2.3 },
      { mode: "transit", durationMinutesMin: 19, durationMinutesMax: 19, note: "Direct L2+L4, transfer at Sant Antoni station." },
    ],
  },
  {
    // Google walk: 11min/800m via Av del Portal de l'Àngel, flat.
    fromPlaceId: "placa-reial",
    toPlaceId: "portal-angel",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 11, durationMinutesMax: 13, distanceKm: 0.8 }],
  },
  {
    // Google walk: 21min/1.5km via Pg. de Gràcia, flat.
    fromPlaceId: "la-rambla",
    toPlaceId: "casa-batllo",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 21, durationMinutesMax: 24, distanceKm: 1.5 }],
  },
  {
    // Google walk: 8min/550m via Carrer de l'Argenteria, flat -- both sit at the Born/Gothic
    // Quarter boundary.
    fromPlaceId: "santa-maria-del-mar",
    toPlaceId: "barcelona-cathedral",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 8, durationMinutesMax: 8, distanceKm: 0.55 }],
  },

  // ── Post-Route-First Coverage Recovery (verified live 2026-09-09) ──────────────────────
  // 18 pairs added, picked strictly by observed post-route-first-upgrade generation frequency
  // (see the long-trip audit script's own "top unresolved pairs" ranking, re-run AFTER the
  // Route-First Planning Upgrade and AFTER correcting the audit script's stale Surprise Me
  // preset / missing Teleferic gate -- the old pre-upgrade frequency list was no longer
  // representative of what the current planner actually generates). Every entry below was
  // checked live against Google Maps directions using the SAME stored coordinate/address each
  // place already resolves to elsewhere in this file. Each direction was queried
  // independently -- no value copied from a reverse pair even where one already existed in
  // this table (e.g. arc-de-triomf -> portal-angel below was verified separately from the
  // already-stored portal-angel -> arc-de-triomf, and genuinely matches at 15min -- confirmed,
  // not assumed). `gothic-quarter -> gothic-quarter-tapas-wine-tour` (the single highest-
  // frequency unresolved pair in this pass) was deliberately left OUT again: the tour's Guide
  // entry still has no stored address or coordinates, only a generic "Gothic Quarter" area
  // label, so there is still no real specific point to verify a route against -- see this
  // file's own note on the Route Coverage Verification Phase for the identical reasoning.
  //
  // 3 additional real, verified pairs were found and then DELIBERATELY REVERTED after testing:
  // casa-mila<->bunkers-carmel, jardins-palau-pedralbes->passeig-de-gracia, and
  // passeig-de-gracia->casa-mila. All three are genuinely real, Google-verified data -- but
  // adding them measurably changed main-stop SELECTION in the "All 8 interests" scenario via
  // the Day Builder's own verified-minutes tie-break (Route-First Planning Upgrade, approved
  // separately): a 10-day plan's Day 10 dropped from 4 stops/345min visit to a genuinely thin
  // 2 stops/95min visit -- a real content-quality regression, not just a reordering.
  // UPDATE (Natural Cluster Reclaim Audit task): jardins-palau-pedralbes->passeig-de-gracia has
  // since been RESTORED PERMANENTLY -- see its own entry further down in this file for the full
  // history and the `plannerNaturalClusterReclaim.ts` repair pass that fixes the Day 10
  // starvation directly, rather than continuing to hide accurate data. casa-mila<->bunkers-
  // carmel and passeig-de-gracia->casa-mila remain unresolved -- out of scope for that task
  // (only the one specific route was investigated), left for a future pass to revisit with the
  // same reclaim mechanism now available.
  {
    // Google walk: 17min/1.3km via Avinguda Miramar + Passeig de Santa Madrona, net downhill
    // (real elevation drop toward MNAC at the base of the hill) -- genuinely differs from the
    // already-stored reverse (mnac -> teleferic-montjuic, 19-23min, net uphill) -- real
    // directional asymmetry, not a copy.
    fromPlaceId: "teleferic-montjuic",
    toPlaceId: "mnac",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 17, durationMinutesMax: 19, distanceKm: 1.3, note: "Net downhill this direction." }],
  },
  {
    // Google walk: 13min/900m via Passeig de Joan de Borbó, flat.
    fromPlaceId: "barceloneta-beach",
    toPlaceId: "santa-maria-del-mar",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 13, durationMinutesMax: 14, distanceKm: 0.95 }],
  },
  {
    // Google walk: 12min/850m via Carrer de Montcada, minor elevation, not enough to change mode.
    fromPlaceId: "santa-maria-del-mar",
    toPlaceId: "palau-musica",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 12, durationMinutesMax: 12, distanceKm: 0.85 }],
  },
  {
    // Google walk: 13min/950m via Moll del Dipòsit, flat.
    fromPlaceId: "gothic-quarter",
    toPlaceId: "museu-historia-catalunya",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 13, durationMinutesMax: 14, distanceKm: 1.0 }],
  },
  {
    // Google walk: 11min/800m via Av del Portal de l'Àngel, flat.
    fromPlaceId: "gaudi-bike-tour",
    toPlaceId: "portal-angel",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 11, durationMinutesMax: 12, distanceKm: 0.8 }],
  },
  {
    // Google walk: 15min/1.1km via Carrer de Trafalgar, flat.
    fromPlaceId: "portal-angel",
    toPlaceId: "arc-de-triomf",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 15, durationMinutesMax: 16, distanceKm: 1.1 }],
  },
  {
    // Google walk: 15min/1.1km via Carrer de Trafalgar / Carrer de Sant Pere Més Baix, flat --
    // verified independently in this direction, genuinely matches the forward direction above.
    fromPlaceId: "arc-de-triomf",
    toPlaceId: "portal-angel",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 15, durationMinutesMax: 16, distanceKm: 1.1 }],
  },
  {
    // Google walk: 20min/1.4km via Carrer d'Avinyó, flat.
    fromPlaceId: "museu-historia-catalunya",
    toPlaceId: "boqueria",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 20, durationMinutesMax: 22, distanceKm: 1.5 }],
  },
  {
    // Google walk: 17min/1.3km via Av del Portal de l'Àngel, flat.
    fromPlaceId: "placa-catalunya",
    toPlaceId: "santa-maria-del-mar",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 17, durationMinutesMax: 18, distanceKm: 1.3 }],
  },
  {
    // Google walk: 20min/1.4km via Carrer del Carme, flat.
    fromPlaceId: "mercat-sant-antoni",
    toPlaceId: "portal-angel",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 20, durationMinutesMax: 23, distanceKm: 1.4 }],
  },
  {
    // Google walk: 13min/900m via Carrer de l'Argenteria + Carrer de Ferran, flat.
    fromPlaceId: "santa-maria-del-mar",
    toPlaceId: "placa-reial",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 13, durationMinutesMax: 13, distanceKm: 0.9 }],
  },
  {
    // Google walk: 17min/1.3km via Carrer de l'Hospital, flat.
    fromPlaceId: "mercat-sant-antoni",
    toPlaceId: "gaudi-bike-tour",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 17, durationMinutesMax: 19, distanceKm: 1.3 }],
  },
  {
    // Google walk: 2min/120m via La Rambla, flat -- both sit in the same small old-city block.
    fromPlaceId: "tablao-cordobes-flamenco",
    toPlaceId: "placa-reial",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 2, durationMinutesMax: 2, distanceKm: 0.12 }],
  },
  {
    // Google walk: 14min/1.0km via Carrer del Carme, flat.
    fromPlaceId: "mercat-sant-antoni",
    toPlaceId: "boqueria",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 14, durationMinutesMax: 15, distanceKm: 1.0 }],
  },
  {
    // Google walk: 7min/550m via Av del Portal de l'Àngel, flat.
    fromPlaceId: "portal-angel",
    toPlaceId: "cook-and-taste-paella-class",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 7, durationMinutesMax: 7, distanceKm: 0.55 }],
  },
  {
    // Google walk: 13min/1.0km via Moll del Dipòsit, flat.
    fromPlaceId: "cook-and-taste-paella-class",
    toPlaceId: "museu-historia-catalunya",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 13, durationMinutesMax: 14, distanceKm: 1.0 }],
  },
  {
    // Google walk: 23min/1.6km via Carrer de la Princesa, flat.
    fromPlaceId: "gaudi-bike-tour",
    toPlaceId: "ciutadella",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 23, durationMinutesMax: 25, distanceKm: 1.6 }],
  },
  {
    // Google walk: 4min/300m via Av del Portal de l'Àngel, flat -- same street, short block.
    fromPlaceId: "portal-angel",
    toPlaceId: "placa-catalunya",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 4, durationMinutesMax: 4, distanceKm: 0.3 }],
  },

  // ── Transport Data Enrichment (verified live 2026-09-10) ────────────────────────────────
  // 11 pairs added, picked strictly from the current production planner's own real generation
  // output (route-first selection + cross-day optimizer LIVE, current 36-candidate pool) --
  // every consecutive main-stop pair actually encountered across all 7 customer-facing
  // profiles x 1-10 days was collected first; these 11 were every FIXABLE unresolved pair
  // found (each independently verified, walking/transit/driving checked separately, no
  // direction ever copied from its reverse). Left deliberately unresolved (per this task's
  // own exclusion rule): every pair touching the permanently-guarded legacy "montjuic"
  // placeId (enforceMontjuicSafetyRule already hides these regardless of table contents), and
  // every pair touching "gothic-quarter-tapas-wine-tour" (still no exact meeting-point address
  // in the Guide -- UNRESOLVABLE WITHOUT SPECIFIC ANCHOR, unchanged from the prior task's own
  // finding). One entry (jardins-palau-pedralbes -> passeig-de-gracia) was previously verified
  // AND REVERTED in an earlier task for causing a real Day Builder selection regression --
  // re-verified fresh here (22-23min transit, close to the earlier 24-25min reading), reverted
  // AGAIN at the time of this comment pending a proper fix for that regression, and finally
  // RESTORED PERMANENTLY by the later Natural Cluster Reclaim Audit task (see that entry's own
  // comment further down this file) once a repair pass existed to fix the planner's reaction
  // instead of continuing to hide the accurate data.
  {
    // Google transit: 16-17min fastest via direct L2/L4 metro from Sagrada Família station.
    // Google walk: 37min/2.7km (too far to be the recommended mode). Google drive: 19-20min/3.6-3.7km.
    fromPlaceId: "sagrada-familia",
    toPlaceId: "barcelona-cathedral",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 35, durationMinutesMax: 39, distanceKm: 2.7 },
      { mode: "transit", durationMinutesMin: 15, durationMinutesMax: 17, note: "Fastest: direct L2/L4 metro from Sagrada Família station." },
      { mode: "car", durationMinutesMin: 19, durationMinutesMax: 22, distanceKm: 3.6 },
    ],
  },
  {
    // Google transit: 29min fastest via L2/L1 metro, one change. Google drive: 25min/6.4km.
    // Google walk: 1h9min/4.9km -- not a real option, omitted.
    fromPlaceId: "sagrada-familia",
    toPlaceId: "mnac",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 27, durationMinutesMax: 31, note: "Fastest: L2/L1 metro, one change at Passeig de Gràcia." },
      { mode: "car", durationMinutesMin: 23, durationMinutesMax: 27, distanceKm: 6.4 },
    ],
  },
  {
    // Google drive: 25min/5.7km (real-time, heavy traffic noted). Google transit: 34min via
    // L4 metro from Jaume I station. Google walk: 1h3min/4.6km -- not a real option, omitted.
    fromPlaceId: "la-rambla",
    toPlaceId: "bogatell",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 32, durationMinutesMax: 36, note: "Metro L4 from Jaume I station." },
      { mode: "car", durationMinutesMin: 23, durationMinutesMax: 27, distanceKm: 5.7, note: "Real-time traffic; can vary." },
    ],
  },
  {
    // Google transit: 23min fastest via L5/L4 metro from Sant Pau | Dos de Maig station.
    // Google drive: 18min/4.1km. Google walk: 51-52min/3.8km -- not a real option, omitted.
    fromPlaceId: "sant-pau",
    toPlaceId: "gothic-quarter",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 21, durationMinutesMax: 25, note: "Fastest: L5/L4 metro from Sant Pau | Dos de Maig station." },
      { mode: "car", durationMinutesMin: 16, durationMinutesMax: 20, distanceKm: 4.1 },
    ],
  },
  {
    // Google walk: 17min/1.2km. Google transit (bus H16) also 17min -- no real advantage over
    // walking, omitted (matches this task's own "don't show a mode with no benefit" rule).
    fromPlaceId: "portal-angel",
    toPlaceId: "ciutadella",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 16, durationMinutesMax: 19, distanceKm: 1.2 }],
  },
  {
    // Google walk: 9min/650-700m, flat, same old-city block.
    fromPlaceId: "gothic-quarter",
    toPlaceId: "tablao-cordobes-flamenco",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 8, durationMinutesMax: 10, distanceKm: 0.68 }],
  },
  {
    // Google walk: 16min/1.1-1.2km, flat.
    fromPlaceId: "arc-de-triomf",
    toPlaceId: "cook-and-taste-paella-class",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 15, durationMinutesMax: 18, distanceKm: 1.15 }],
  },
  {
    // Google transit: 17min fastest via bus 47 from Platja de la Barceloneta. Google walk:
    // 26min/1.9km -- transit materially better, recommended over the longer walk.
    fromPlaceId: "barceloneta-beach",
    toPlaceId: "gothic-quarter",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 24, durationMinutesMax: 28, distanceKm: 1.9 },
      { mode: "transit", durationMinutesMin: 15, durationMinutesMax: 19, note: "Fastest: bus 47 from Platja de la Barceloneta." },
    ],
  },
  // jardins-palau-pedralbes -> passeig-de-gracia: RESTORED (Natural Cluster Reclaim Audit task).
  // Google transit 22-23min via direct L3 metro from Palau Reial station; Google drive
  // 31min/6.1km -- the data was always correct. Previously kept unresolved because storing it
  // shifted a Day Builder tie-break (this file's own getVerifiedTravelMinutes) that pulled
  // camp-nou onto an early day, starving a later day of its natural les-corts cluster-mates
  // (monestir-pedralbes/camp-nou/jardins-palau-pedralbes normally travel together) -- see the
  // git history on this file for the full root-cause trace (reproduced deterministically across
  // 6 day-counts with the exact "All 8 legacy union" interest set). The Natural Cluster Reclaim
  // Audit task built `plannerNaturalClusterReclaim.ts` (a bounded, deterministic, V2-only repair
  // pass that runs after Day Builder + Route Optimizer and before the cross-day optimizer) and
  // proved it fixes exactly this case -- e.g. at 10 days the starved Day 10 recovers from
  // [monestir-pedralbes, jardins-palau-pedralbes] (2 stops/thin) to [monestir-pedralbes,
  // camp-nou, jardins-palau-pedralbes] (3 stops/healthy, -33min total verified travel) -- with
  // zero regressions across the full long-trip/short-trip/dated/accommodation matrix. See that
  // task's own final report for the complete evidence trail. Known data should never be
  // structurally worse than unknown data; now that the planner's reaction is repaired, the
  // verified route stays permanently.
  {
    fromPlaceId: "jardins-palau-pedralbes",
    toPlaceId: "passeig-de-gracia",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 22, durationMinutesMax: 23, note: "Direct L3 metro from Palau Reial station." },
      { mode: "car", durationMinutesMin: 31, durationMinutesMax: 31, distanceKm: 6.1 },
    ],
  },
  {
    // Google walk: 12min/950m, flat.
    fromPlaceId: "portal-angel",
    toPlaceId: "santa-maria-del-mar",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 11, durationMinutesMax: 13, distanceKm: 0.95 }],
  },
  {
    // Google transit: 24min fastest via L3 metro from Lesseps station. Google drive:
    // 20min/4.9km. Google walk: 49-51min/3.8-3.9km -- not a real option, omitted.
    fromPlaceId: "park-guell",
    toPlaceId: "passeig-de-gracia",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 22, durationMinutesMax: 26, note: "Fastest: L3 metro from Lesseps station." },
      { mode: "car", durationMinutesMin: 18, durationMinutesMax: 22, distanceKm: 4.9 },
    ],
  },

  // ── Complete Transport-Time Verification (verified live 2026-09-10, batch 1/N) ───────────
  // Found via a comprehensive 10-profile x 1-10 day route universe scan (route-first + cross-day
  // optimizer LIVE), independently verified live against Google Maps, each direction checked
  // separately. See this task's own report for the full methodology and remaining unresolved
  // list (guarded/anchorless pairs, and the one documented exception above).
  {
    // Google walk: 15min/1.1km, flat.
    fromPlaceId: "placa-reial",
    toPlaceId: "museu-historia-catalunya",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 14, durationMinutesMax: 16, distanceKm: 1.1 }],
  },
  {
    // Google walk: 6min/450m, flat. gaudi-bike-tour's real meeting point is Plaça Reial itself
    // (same address as placa-reial in the Guide).
    fromPlaceId: "gaudi-bike-tour",
    toPlaceId: "boqueria",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 5, durationMinutesMax: 7, distanceKm: 0.45 }],
  },
  {
    // Google transit: 22min fastest via L2/L4 metro. Google walk: 33-42min/2.4-3.1km -- too far,
    // omitted.
    fromPlaceId: "mercat-sant-antoni",
    toPlaceId: "ciutadella",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 20, durationMinutesMax: 24, note: "Fastest: L2/L4 metro." }],
  },
  {
    // Google walk: 4min/280m, same street, short block.
    fromPlaceId: "la-rambla",
    toPlaceId: "tablao-cordobes-flamenco",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 3, durationMinutesMax: 5, distanceKm: 0.28 }],
  },
  {
    // Google walk: 7min/500m, flat.
    fromPlaceId: "santa-maria-del-mar",
    toPlaceId: "cook-and-taste-paella-class",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 6, durationMinutesMax: 9, distanceKm: 0.55 }],
  },
  {
    // Google walk: 8min/600m, flat.
    fromPlaceId: "cook-and-taste-paella-class",
    toPlaceId: "tablao-cordobes-flamenco",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 7, durationMinutesMax: 9, distanceKm: 0.6 }],
  },
  {
    // Google transit: 8min fastest via direct L3 metro from Plaça Catalunya station. Google
    // walk: 20min/1.3km -- the stored "passeig-de-gracia" address is a generic street-level
    // anchor that Google resolves near the Plaça Catalunya end for a plain-text query, some
    // distance from Casa Milà's own end of the boulevard; transit is clearly the honest,
    // materially-better option here regardless of which exact point the query resolves to.
    // RE-CONFIRMED (Residual Transport + Natural Reclaim Final Validation task): re-queried
    // using this exact stored address text (no coordinates exist for "passeig-de-gracia" --
    // this generic anchor ambiguity is a real, inherent property of the stored place, not
    // something to paper over with an unofficial coordinate). Fresh reading: walk 20min/1.4km,
    // matching the stored 19-21min/1.3km closely. No correction needed.
    fromPlaceId: "passeig-de-gracia",
    toPlaceId: "casa-mila",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 19, durationMinutesMax: 21, distanceKm: 1.3 },
      { mode: "transit", durationMinutesMin: 7, durationMinutesMax: 9, note: "Fastest: direct L3 metro from Plaça Catalunya station." },
    ],
  },
  {
    // Residual Transport + Natural Reclaim Final Validation: RE-VERIFIED using the exact stored
    // coordinates (casa-mila 41.39528,2.16167; bunkers-carmel 41.41928,2.16171 -- both resolved
    // Google Maps titles to the precise stored addresses, confirming no anchor mismatch). Google
    // drive 15-18min/3.7-3.9km (was previously stored as 23-27min/5.8km -- a meaningfully stale
    // figure, corrected here). Google transit 38-47min, fastest via a single bus 24 line (was
    // previously stored as 32-36min via L5/L4 metro -- also corrected to the fresh reading).
    // Google walk 63-68min/3.8-4.2km -- genuinely NOT PRACTICAL at this distance/uphill, omitted
    // per this file's convention. Car remains clearly recommended: ~1/3 of transit's time.
    fromPlaceId: "casa-mila",
    toPlaceId: "bunkers-carmel",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 38, durationMinutesMax: 47, note: "Fastest: bus 24, single line." },
      { mode: "car", durationMinutesMin: 15, durationMinutesMax: 18, distanceKm: 3.9 },
    ],
  },
  {
    // Residual Transport + Natural Reclaim Final Validation: NEWLY VERIFIED, independent of the
    // forward direction (no reverse-assumption reuse). Exact stored coordinates used both ways.
    // Google walk 53min/3.9km (downhill vs the forward 63-68min -- real elevation asymmetry, not
    // copied). Google transit 33-43min, fastest bus 24. Google drive 14-15min/5.2-5.5km. Car
    // recommended: same dramatic margin as the forward direction.
    fromPlaceId: "bunkers-carmel",
    toPlaceId: "casa-mila",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 33, durationMinutesMax: 43, note: "Fastest: bus 24, single line." },
      { mode: "car", durationMinutesMin: 14, durationMinutesMax: 15, distanceKm: 5.4 },
    ],
  },

  // ── Complete Transport-Time Verification (verified live 2026-09-10, batch 2/3) ───────────
  {
    // Google transit: 26-28min fastest via direct L3 metro from Palau Reial station. Google
    // drive: 26min/5.6km -- close, transit kept as recommended (not substantially slower).
    fromPlaceId: "jardins-palau-pedralbes",
    toPlaceId: "mnac",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 26, durationMinutesMax: 30, note: "Fastest: direct L3 metro from Palau Reial station." },
      { mode: "car", durationMinutesMin: 24, durationMinutesMax: 28, distanceKm: 5.6 },
    ],
  },
  {
    // Google walk: 6min/450m, flat.
    fromPlaceId: "placa-reial",
    toPlaceId: "boqueria",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 5, durationMinutesMax: 7, distanceKm: 0.45 }],
  },
  {
    // Google drive: 32min/8.0km. Google transit: 43min fastest via L3 (long real-time wait at
    // Lesseps) -- car meaningfully more reliable here. Google walk: 49-51min/3.8-3.9km, omitted.
    fromPlaceId: "park-guell",
    toPlaceId: "mnac",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 40, durationMinutesMax: 46, note: "L3 metro from Lesseps station; schedule-dependent wait." },
      { mode: "car", durationMinutesMin: 30, durationMinutesMax: 34, distanceKm: 8.0 },
    ],
  },
  {
    // Google drive: 23min/5.4km. Google transit: 33min fastest via L4 (long wait at
    // Urquinaona). Google walk: too far, omitted.
    fromPlaceId: "portal-angel",
    toPlaceId: "bogatell",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 31, durationMinutesMax: 35, note: "L4 metro from Urquinaona station; schedule-dependent wait." },
      { mode: "car", durationMinutesMin: 21, durationMinutesMax: 25, distanceKm: 5.4 },
    ],
  },
  {
    // Google walk: 15min/1.1km, flat.
    fromPlaceId: "tablao-cordobes-flamenco",
    toPlaceId: "palau-musica",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 14, durationMinutesMax: 16, distanceKm: 1.1 }],
  },
  {
    // Google walk: 17min/1.3km, flat.
    fromPlaceId: "la-rambla",
    toPlaceId: "museu-historia-catalunya",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 16, durationMinutesMax: 18, distanceKm: 1.3 }],
  },
  {
    // Google transit: 18-19min fastest via direct L4 metro. Google walk: 31min/2.2km, omitted.
    fromPlaceId: "ciutadella",
    toPlaceId: "casa-batllo",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 17, durationMinutesMax: 19, note: "Fastest: direct L4 metro." }],
  },
  {
    // Google walk: 14min/1.0km, flat.
    fromPlaceId: "gaudi-bike-tour",
    toPlaceId: "palau-musica",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 13, durationMinutesMax: 15, distanceKm: 1.0 }],
  },
  {
    // Google walk: 19min/1.4km, flat.
    fromPlaceId: "placa-catalunya",
    toPlaceId: "mercat-sant-antoni",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 18, durationMinutesMax: 20, distanceKm: 1.4 }],
  },
  {
    // Google walk: 11min/850m, flat -- confirms the stored "passeig-de-gracia" anchor resolves
    // near the Plaça Catalunya end for a plain-text query (see the casa-mila entry's own note).
    fromPlaceId: "passeig-de-gracia",
    toPlaceId: "boqueria",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 10, durationMinutesMax: 12, distanceKm: 0.85 }],
  },
  {
    // Google drive: 28min/5.9km. Google transit: 34min fastest via L4 (long wait at Jaume I).
    // Google walk: too far, omitted.
    fromPlaceId: "placa-reial",
    toPlaceId: "bogatell",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 32, durationMinutesMax: 36, note: "L4 metro from Jaume I station; schedule-dependent wait." },
      { mode: "car", durationMinutesMin: 26, durationMinutesMax: 30, distanceKm: 5.9 },
    ],
  },
  {
    // Google drive: 28min/6.0km. Google transit: 35min fastest via L4 (long wait). Google
    // walk: too far, omitted.
    fromPlaceId: "tablao-cordobes-flamenco",
    toPlaceId: "bogatell",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 33, durationMinutesMax: 37, note: "L4 metro from Jaume I station; schedule-dependent wait." },
      { mode: "car", durationMinutesMin: 26, durationMinutesMax: 30, distanceKm: 6.0 },
    ],
  },
  {
    // Google transit: 26-27min fastest via L3 metro + Montjuïc Funicular (FM) from Paral·lel
    // station. Google walk: 31min/1.9km (uphill).
    fromPlaceId: "tablao-cordobes-flamenco",
    toPlaceId: "teleferic-montjuic",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 29, durationMinutesMax: 33, distanceKm: 1.9, note: "Uphill." },
      { mode: "transit", durationMinutesMin: 24, durationMinutesMax: 28, note: "Metro L3 + Montjuïc Funicular from Paral·lel station." },
    ],
  },

  // ── Complete Transport-Time Verification (verified live 2026-09-10, batch 3/3) ───────────
  {
    // Google transit: 18-21min fastest via L3/L5 or L4/L5 metro (one change).
    fromPlaceId: "gothic-quarter",
    toPlaceId: "sagrada-familia",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 16, durationMinutesMax: 20, note: "L3/L5 or L4/L5 metro, one change." }],
  },
  {
    // Google walk: 13min/1.0km, flat.
    fromPlaceId: "santa-maria-del-mar",
    toPlaceId: "tablao-cordobes-flamenco",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 12, durationMinutesMax: 14, distanceKm: 1.0 }],
  },
  {
    // Google walk: 16min/1.1km, flat.
    fromPlaceId: "la-rambla",
    toPlaceId: "mercat-sant-antoni",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 15, durationMinutesMax: 17, distanceKm: 1.1 }],
  },
  {
    // Google walk: 19min/1.4km, flat.
    fromPlaceId: "mercat-sant-antoni",
    toPlaceId: "placa-reial",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 18, durationMinutesMax: 20, distanceKm: 1.4 }],
  },
  {
    // Google walk: 4min/280m, same street. gaudi-bike-tour's meeting point is Plaça Reial.
    fromPlaceId: "gaudi-bike-tour",
    toPlaceId: "la-rambla",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 3, durationMinutesMax: 5, distanceKm: 0.28 }],
  },
  {
    // Google transit: 31min fastest via L2/L1 metro, one change.
    fromPlaceId: "mercat-sagrada-familia",
    toPlaceId: "mnac",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 29, durationMinutesMax: 33, note: "L2/L1 metro, one change." }],
  },
  {
    // Google transit: 21min fastest via direct L3 metro.
    fromPlaceId: "mnac",
    toPlaceId: "boqueria",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 19, durationMinutesMax: 23, note: "Fastest: direct L3 metro." }],
  },
  {
    // Google walk: 6min/450m, flat -- symmetric with the reverse direction (also verified).
    fromPlaceId: "boqueria",
    toPlaceId: "placa-reial",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 5, durationMinutesMax: 7, distanceKm: 0.45 }],
  },
  {
    // Google transit: 16-17min fastest via direct L2 metro.
    fromPlaceId: "mercat-sagrada-familia",
    toPlaceId: "passeig-de-gracia",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 15, durationMinutesMax: 17, note: "Fastest: direct L2 metro." }],
  },
  {
    // Google transit: 29-30min fastest via L4 or L3 metro. Google drive: 24min/5.1km (close,
    // transit kept -- not substantially slower).
    fromPlaceId: "park-guell",
    toPlaceId: "gothic-quarter",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 27, durationMinutesMax: 31, note: "L4 or L3 metro." },
      { mode: "car", durationMinutesMin: 22, durationMinutesMax: 26, distanceKm: 5.1 },
    ],
  },
  {
    // Google drive: 27min/6.2km. Google transit: 36min fastest via L4 (slower).
    fromPlaceId: "casa-batllo",
    toPlaceId: "bunkers-carmel",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 34, durationMinutesMax: 38, note: "L4 metro, one change." },
      { mode: "car", durationMinutesMin: 25, durationMinutesMax: 29, distanceKm: 6.2 },
    ],
  },
  {
    // Google walk: 16min/1.2km, flat.
    fromPlaceId: "passeig-de-gracia",
    toPlaceId: "arc-de-triomf",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 15, durationMinutesMax: 17, distanceKm: 1.2 }],
  },

  // ── Final Transport Coverage Pass ────────────────────────────────────────────────────
  // 12 directional pairs newly verified against live Google Maps directions (checked
  // 2026-09), prioritized by customer-visible frequency across the full flexible-mode
  // profile x day-count matrix. Each direction checked independently -- no value reused
  // from a reverse pair, even where one already exists in this table. Walking omitted
  // wherever the route exceeded ~25min and a clearly better mode existed (never included
  // just to fill out three options). Apple Maps cross-check was not repeated for this pass
  // (Google alone was decisive/consistent for every pair below); "verified" here means
  // checked against live Google Maps directions, one source, same bar as this file's
  // existing single-source entries.
  {
    // Google transit: 17-21min, direct L3 metro from Palau Reial station (~4min walk to
    // platform, trains every 5-8min). Google walk: 1h9min/5.2km -- far too long to offer as
    // a real option, omitted per this task's own "extremely long walking route may be
    // omitted" allowance. Google drive: fastest-time route uses the B-10 ring road
    // (16.9km/28min) while a shorter in-city alternative (7.1km) ran 34-36min under
    // heavier-than-usual live traffic at check time -- too inconsistent to report an honest
    // car range from a single live snapshot, so car is omitted; transit is both faster and
    // more reliable here regardless.
    fromPlaceId: "jardins-palau-pedralbes",
    toPlaceId: "boqueria",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 17, durationMinutesMax: 21, note: "Direct L3 from Palau Reial station." }],
  },
  {
    // Google transit: 41-53min across several viable metro+bus combos (fastest: L3+bus 113,
    // 41min) -- no single dominant fast line, a genuinely awkward cross-town connection.
    // Google drive: consistently 17-19min/5.6-6.0km via Av. Diagonal across three route
    // options -- materially faster and far more reliable than transit, so car is
    // recommended here (same logic as the sibling casa-batllo/passeig-de-gracia -> les-corts
    // entries elsewhere in this table). Walking omitted (~5.8km, over an hour).
    fromPlaceId: "casa-batllo",
    toPlaceId: "monestir-pedralbes",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 41, durationMinutesMax: 53, note: "No single fast line -- several metro+bus combos, e.g. L3+113 or L3+V5." },
      { mode: "car", durationMinutesMin: 17, durationMinutesMax: 19, distanceKm: 5.8 },
    ],
  },
  {
    // Verified independently of the reverse (passeig-de-gracia -> camp-nou, already verified
    // above) -- not assumed symmetric. Google transit: 27-31min across several viable
    // combos (L5+L1 fastest at 27min; L3+bus and L9S+L10S+L1 also close). Google drive:
    // 24-27min/5.7-6.5km, but flagged "heavier traffic than usual" at check time on every
    // route option -- kept as a secondary range rather than the sole figure, since transit
    // is comparably fast here and avoids that traffic uncertainty entirely. Walking omitted
    // (~6.5km).
    fromPlaceId: "camp-nou",
    toPlaceId: "passeig-de-gracia",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 27, durationMinutesMax: 31, note: "L5+L1 or L3 combo, several viable routes." },
      { mode: "car", durationMinutesMin: 24, durationMinutesMax: 27, distanceKm: 6.1, note: "Google flagged heavier-than-usual traffic on every route checked -- treat as approximate." },
    ],
  },
  {
    // Google walk: 17-18min/1.3km, flat, via Passeig de Gràcia or Rambla de Catalunya.
    fromPlaceId: "casa-mila",
    toPlaceId: "placa-catalunya",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 17, durationMinutesMax: 18, distanceKm: 1.3 }],
  },
  {
    // tablao-cordobes-flamenco has its own precise, numbered Guide address ("La Rambla, 35")
    // -- distinct from the ambiguous generic "Gothic Quarter Tapas & Wine Tour" experience,
    // which has no stored address and stays unresolved (see this file's own Montjuïc-style
    // safety notes). Google walk: 17-21min/1.2-1.5km, flat, via Carrer dels Escudellers or
    // Rambla de Santa Mònica.
    fromPlaceId: "tablao-cordobes-flamenco",
    toPlaceId: "museu-historia-catalunya",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 17, durationMinutesMax: 21, distanceKm: 1.35 }],
  },
  {
    // Google transit: 25min fastest (direct L3 from Liceu station, trains every ~7min);
    // slower combos ran 34-41min. Google walk: 37min/2.5km was also offered but is
    // meaningfully slower than transit with no other advantage, so kept out of the option
    // list per this task's "omit an unreasonable mode" allowance rather than padded in.
    fromPlaceId: "tablao-cordobes-flamenco",
    toPlaceId: "mnac",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 25, durationMinutesMax: 34, note: "Fastest: direct L3 from Liceu station." }],
  },
  {
    // Resolved against la-rambla's own established anchor point (this file's "Pla de la
    // Boqueria" precedent, matching the Guide's own stored address for la-rambla) rather
    // than the bare ambiguous "La Rambla, Barcelona" text -- Google walk: 15-17min/1.1-1.3km,
    // flat, via Carrer de l'Hospital.
    fromPlaceId: "mercat-sant-antoni",
    toPlaceId: "la-rambla",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 15, durationMinutesMax: 17, distanceKm: 1.2 }],
  },
  {
    // Google walk: 14-16min/1.0-1.2km, flat -- barcelona-cathedral sits essentially inside
    // the Gothic Quarter (2min from the existing gothic-quarter entry), so this closely
    // matches the already-verified arc-de-triomf -> gothic-quarter pair (15-18min).
    fromPlaceId: "barcelona-cathedral",
    toPlaceId: "arc-de-triomf",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 14, durationMinutesMax: 16, distanceKm: 1.1 }],
  },
  {
    // Google transit: 14-18min via direct L2, or L1+L2/L3+L5 combos -- resolves reliably to
    // the real "Passeig de Gràcia" metro station/interchange regardless of the street
    // address's own walking-distance ambiguity (see this file's anchor-ambiguity note
    // earlier), since transit routing normalizes to that fixed station.
    fromPlaceId: "passeig-de-gracia",
    toPlaceId: "sagrada-familia",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 14, durationMinutesMax: 18, note: "Direct L2, or L1/L3+L5 combos, from Passeig de Gràcia station." }],
  },
  {
    // gaudi-bike-tour's own stored Guide address is "Plaça Reial, 08002 Barcelona, Spain" --
    // identical to placa-reial's own stored address (its real-world meeting point), so this
    // reuses that same real location rather than guessing. Google walk: 9-10min/650-700m,
    // flat, via Carrer de Ferran or Carrer del Bisbe.
    fromPlaceId: "gaudi-bike-tour",
    toPlaceId: "barcelona-cathedral",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 9, durationMinutesMax: 10, distanceKm: 0.65, note: "Resolved from the tour's own Plaça Reial meeting point." }],
  },
  {
    // Google transit: 18-30min (fastest: L4+L2 combo, 18min). Google walk: 34-37min/2.4-2.7km
    // also offered -- kept as a secondary honest option since it's long but not unreasonable,
    // unlike the jardins-palau-pedralbes/casa-batllo pairs above.
    fromPlaceId: "museu-historia-catalunya",
    toPlaceId: "mercat-sant-antoni",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 34, durationMinutesMax: 37, distanceKm: 2.55 },
      { mode: "transit", durationMinutesMin: 18, durationMinutesMax: 30, note: "Fastest: L4+L2 metro combo." },
    ],
  },
  {
    // Google transit: 18-23min, direct-ish from Arc de Triomf station (L1, or L1+L2).
    // Google walk: 36min/2.6km also offered -- kept as a secondary honest option, same
    // reasoning as the museu-historia-catalunya pair above.
    fromPlaceId: "arc-de-triomf",
    toPlaceId: "mercat-sant-antoni",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 36, durationMinutesMax: 36, distanceKm: 2.6 },
      { mode: "transit", durationMinutesMin: 18, durationMinutesMax: 23, note: "L1 direct from Arc de Triomf station, or L1+L2." },
    ],
  },
  {
    // teleferic-montjuic has its own precise Guide address ("Avinguda de Miramar, 30" -- the
    // cable car's lower station) -- distinct from the permanently-guarded generic "montjuic"
    // placeId, and safe to resolve. Google transit: 30-35min, fastest via the Montjuïc
    // funicular + direct L3 metro; other combos ran up to 44min. Google walk: 37min/2.6km
    // also offered but no faster than transit, so left out of the option list.
    fromPlaceId: "teleferic-montjuic",
    toPlaceId: "barcelona-cathedral",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 30, durationMinutesMax: 35, note: "Montjuïc funicular + direct L3 metro." }],
  },

  // ── Final Route Gap Closure ──────────────────────────────────────────────────────────
  // The remaining 16 pairs identified as "fixable" by the prior coverage pass -- every one
  // has a real, precise, single-point address in the Guide (cook-and-taste-paella-class:
  // "Carrer del Paradís, 3"; teleferic-montjuic: "Avinguda de Miramar, 30"; every other
  // endpoint already anchored elsewhere in this file). Checked live against Google Maps
  // (2026-09), each direction independently -- no reverse-direction value assumed. The
  // permanently-guarded literal "montjuic" and the anchor-less "Gothic Quarter Tapas & Wine
  // Tour" were both left completely untouched, exactly as instructed.
  {
    // Google walk: 10-13min/0.8-1.0km, flat, via Av del Portal de l'Àngel.
    fromPlaceId: "placa-catalunya",
    toPlaceId: "cook-and-taste-paella-class",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 10, durationMinutesMax: 13, distanceKm: 0.9 }],
  },
  {
    // Google walk: 9min/650m, flat.
    fromPlaceId: "cook-and-taste-paella-class",
    toPlaceId: "palau-musica",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 9, durationMinutesMax: 9, distanceKm: 0.65 }],
  },
  {
    // Google walk: 23-24min/1.6-1.7km, flat, via Carrer de Sant Carles.
    fromPlaceId: "barceloneta-beach",
    toPlaceId: "cook-and-taste-paella-class",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 23, durationMinutesMax: 24, distanceKm: 1.65 }],
  },
  {
    // Google walk: 11min/800m, flat, via Carrer de la Princesa.
    fromPlaceId: "cook-and-taste-paella-class",
    toPlaceId: "ciutadella",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 11, durationMinutesMax: 11, distanceKm: 0.8 }],
  },
  {
    // Google transit: 32-43min, fastest via direct L3 + Montjuïc funicular from Palau Reial
    // station. Walking not checked (clearly impractical across this distance/elevation).
    fromPlaceId: "jardins-palau-pedralbes",
    toPlaceId: "teleferic-montjuic",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 32, durationMinutesMax: 43, note: "L3 metro + Montjuïc funicular from Palau Reial station." }],
  },
  {
    // Google transit: 27-30min, fastest via bus 55/funicular or L3+funicular combos. Google
    // walk: 32min/2.0km also offered but not faster -- left out of the option list.
    fromPlaceId: "placa-reial",
    toPlaceId: "teleferic-montjuic",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 27, durationMinutesMax: 30, note: "Bus + Montjuïc funicular, or L3 + funicular." }],
  },
  {
    // Google transit: 27-33min (fastest: L4+L2 combo, 27min; direct bus D20, 30min).
    fromPlaceId: "barceloneta-beach",
    toPlaceId: "mercat-sant-antoni",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 27, durationMinutesMax: 33, note: "Fastest: L4+L2 metro combo, or direct bus D20." }],
  },
  {
    // Google walk: 26-29min/1.8-2.1km, flat, via Carrer de Sant Carles or Pg. de Colom.
    fromPlaceId: "tablao-cordobes-flamenco",
    toPlaceId: "barceloneta-beach",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 26, durationMinutesMax: 29, distanceKm: 1.95 }],
  },
  {
    // Anchor-ambiguity pair (see this file's own passeig-de-gracia section note): resolved via
    // transit only, since transit routing normalizes to the real Passeig de Gràcia metro
    // interchange regardless of the street address's own walking-distance ambiguity. Google
    // transit: 14-17min, direct L1/L2/L3 (also a fast Aerobus-style A1/A2 option from Pl.
    // Catalunya - Fontanella, 14min, but that's an airport-bus service, not relevant here).
    fromPlaceId: "passeig-de-gracia",
    toPlaceId: "mercat-sant-antoni",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 14, durationMinutesMax: 17, note: "Direct L1, L2, or L3 metro." }],
  },
  {
    // Google walk: 21-23min/1.5-1.7km, flat, via Carrer del Carme.
    fromPlaceId: "barcelona-cathedral",
    toPlaceId: "mercat-sant-antoni",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 21, durationMinutesMax: 23, distanceKm: 1.6 }],
  },
  {
    // Google transit: 14-18min, direct L2 or L3 from Sant Antoni station -- materially faster
    // than the 28min/2.0km walk also offered, which is kept as a secondary honest option.
    fromPlaceId: "mercat-sant-antoni",
    toPlaceId: "casa-batllo",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 28, durationMinutesMax: 28, distanceKm: 2.0 },
      { mode: "transit", durationMinutesMin: 14, durationMinutesMax: 18, note: "Direct L2 or L3 metro from Sant Antoni station." },
    ],
  },
  {
    // Resolved from gaudi-bike-tour's own stored Plaça Reial meeting point (see the sibling
    // gaudi-bike-tour -> barcelona-cathedral entry above for the same reasoning). Google
    // transit: 9-17min, direct L3 from Liceu station (9min) -- clearly faster than the
    // 25-31min/1.8-2.1km walk also offered, which is kept as a secondary honest option.
    fromPlaceId: "gaudi-bike-tour",
    toPlaceId: "casa-batllo",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 25, durationMinutesMax: 31, distanceKm: 1.95 },
      { mode: "transit", durationMinutesMin: 9, durationMinutesMax: 17, note: "Direct L3 from Liceu station." },
    ],
  },
  {
    // Anchor-ambiguity pair (see this file's own passeig-de-gracia section note). Google
    // transit: 36-48min across several commuter-rail/bus combos, no single dominant fast
    // line. Google drive: consistently 19-22min/6.2-6.5km via Av. Diagonal, "light traffic as
    // usual" -- materially faster and far more reliable than transit, same pattern as the
    // sibling casa-batllo -> monestir-pedralbes entry above. Walking not checked (~6.3km).
    fromPlaceId: "passeig-de-gracia",
    toPlaceId: "monestir-pedralbes",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 36, durationMinutesMax: 48, note: "No single fast line -- commuter rail (L6/S1/S2) + L12 bus, or L3 + bus combos." },
      { mode: "car", durationMinutesMin: 19, durationMinutesMax: 22, distanceKm: 6.3 },
    ],
  },
  {
    // Google transit: 25-31min, fastest via L4+L5 from Barceloneta station.
    fromPlaceId: "barceloneta-beach",
    toPlaceId: "sagrada-familia",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 25, durationMinutesMax: 31, note: "Fastest: direct L4+L5 metro combo from Barceloneta station." }],
  },
  {
    // Google walk: 21-22min/1.6km, flat, via Carrer de la Princesa or Carrer de Ferran.
    fromPlaceId: "arc-de-triomf",
    toPlaceId: "placa-reial",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 21, durationMinutesMax: 22, distanceKm: 1.6 }],
  },
  {
    // Resolved to gaudi-bike-tour's own stored Plaça Reial meeting point. Google walk:
    // 12-13min/1.0km, flat, via La Rambla.
    fromPlaceId: "placa-catalunya",
    toPlaceId: "gaudi-bike-tour",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 12, durationMinutesMax: 13, distanceKm: 1.0, note: "Resolved to the tour's own Plaça Reial meeting point." }],
  },

  // ── Final Route Gap Closure, follow-up ─────────────────────────────────────────────────────
  // 4 additional pairs surfaced by the post-fix full-matrix recount (not part of the original
  // 16-pair list, but every endpoint is already an established, precise anchor elsewhere in
  // this file). Checked live against Google Maps (2026-09), same rigor as the 16 above.
  {
    // Google walk: 22min/1.5km, mostly flat, via Via Laietana or Pg. de Gràcia (both equal).
    // Google transit: 13-17min, fastest via direct L3 or L4 metro -- materially faster than the
    // walk, so transit is recommended; walk kept as a secondary honest option.
    fromPlaceId: "barcelona-cathedral",
    toPlaceId: "casa-batllo",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 22, durationMinutesMax: 22, distanceKm: 1.5 },
      { mode: "transit", durationMinutesMin: 13, durationMinutesMax: 17, note: "Direct L3 or L4 metro." },
    ],
  },
  {
    // Google transit: 30-33min, fastest via L5+L3 metro combo. Google car: 17-20min/6.4-7.0km,
    // light traffic. Transit chosen over car despite being slower, matching this file's own
    // established pattern for every other Camp Nou leg (see the sibling camp-nou <-> casa-batllo
    // and camp-nou -> placa-catalunya entries above): avoids the difficult/expensive parking
    // near the stadium.
    fromPlaceId: "sant-pau",
    toPlaceId: "camp-nou",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 30, durationMinutesMax: 33, note: "Fastest: direct L5+L3 metro combo." },
      { mode: "car", durationMinutesMin: 17, durationMinutesMax: 20, distanceKm: 6.7 },
    ],
  },
  {
    // Google transit: 27-30min, fastest via L3 metro + Montjuïc funicular from Plaça Catalunya --
    // same range/pattern as the sibling placa-reial -> teleferic-montjuic entry above. Walking
    // not checked (clearly impractical across this distance/elevation).
    fromPlaceId: "la-rambla",
    toPlaceId: "teleferic-montjuic",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 27, durationMinutesMax: 30, note: "L3 metro + Montjuïc funicular from Plaça Catalunya." }],
  },
  {
    // Resolved from gaudi-bike-tour's own stored Plaça Reial meeting point to cook-and-taste's
    // "Carrer del Paradís, 3" address. Google walk: 7min/500m, flat.
    fromPlaceId: "gaudi-bike-tour",
    toPlaceId: "cook-and-taste-paella-class",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 7, durationMinutesMax: 7, distanceKm: 0.5, note: "Resolved from the tour's own Plaça Reial meeting point." }],
  },

  // ── Fix Meal-Adjacent Transport Connectors ───────────────────────────────────────────────────
  // The 30 highest-frequency meal-adjacent pairs (attraction<->real Guide foodPlaces record)
  // surfaced by the post-fix full-matrix frequency audit. Every foodPlaces endpoint below has a
  // real, precise street address in the Guide (never a bare area/neighborhood name); every
  // attraction/experience endpoint was already an established anchor elsewhere in this file.
  // Checked live against Google Maps (2026-09), each direction independently -- no reverse-
  // direction value assumed, matching this file's own existing verification standard exactly.
  {
    // Google transit: 14-20min, fastest direct L5 from Verdaguer station. Google walk: 22min/
    // 1.7km, flat (kept as a secondary honest option).
    fromPlaceId: "el-noa-noa",
    toPlaceId: "sagrada-familia",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 22, durationMinutesMax: 22, distanceKm: 1.7 },
      { mode: "transit", durationMinutesMin: 14, durationMinutesMax: 20, note: "Fastest: direct L5 metro from Verdaguer station." },
    ],
  },
  {
    // Google walk: 14min/1.0km, flat.
    fromPlaceId: "federal-cafe",
    toPlaceId: "boqueria",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 14, durationMinutesMax: 14, distanceKm: 1.0 }],
  },
  {
    // Google transit: 35-40min (fastest: direct bus 22 or 114, ~35min, multiple transfers/no
    // single fast line). Google car: 19-20min/5.4-6.2km, "best route now given traffic" --
    // materially faster and far simpler than the bus-only transit options. Car recommended.
    fromPlaceId: "bunkers-carmel",
    toPlaceId: "bar-mut",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 35, durationMinutesMax: 40, note: "No single fast line -- direct bus 22 or 114." },
      { mode: "car", durationMinutesMin: 19, durationMinutesMax: 20, distanceKm: 5.8 },
    ],
  },
  {
    // Google walk: 4min/280m, flat.
    fromPlaceId: "els-quatre-gats",
    toPlaceId: "gothic-quarter",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 4, durationMinutesMax: 4, distanceKm: 0.28 }],
  },
  {
    // Google transit: 28-39min, fastest direct L3 metro. Walking not checked (cross-city
    // distance, well beyond a practical walk).
    fromPlaceId: "cerveceria-catalana",
    toPlaceId: "park-guell",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 28, durationMinutesMax: 39, note: "Fastest: direct L3 metro." }],
  },
  {
    // Google transit: 32-52min (fastest: direct bus 63, ~32min, no fast rail option). Google
    // car: 16-17min/5.4km, light traffic -- materially faster, same pattern as the sibling
    // passeig-de-gracia -> monestir-pedralbes entry above. Car recommended.
    fromPlaceId: "brunch-and-cake",
    toPlaceId: "monestir-pedralbes",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 32, durationMinutesMax: 52, note: "No fast rail option -- direct bus 63 is fastest." },
      { mode: "car", durationMinutesMin: 16, durationMinutesMax: 17, distanceKm: 5.4 },
    ],
  },
  {
    // Google walk: 5-6min/0.4-0.45km, flat.
    fromPlaceId: "baluard-barceloneta",
    toPlaceId: "museu-historia-catalunya",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 5, durationMinutesMax: 6, distanceKm: 0.43 }],
  },
  {
    // Google walk: 13min/0.95-1.0km, flat.
    fromPlaceId: "placa-reial",
    toPlaceId: "el-xampanyet",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 13, durationMinutesMax: 13, distanceKm: 0.98 }],
  },
  {
    // Google walk: 29-33min/2.1-2.3km, flat (kept as a secondary honest option). Google transit:
    // 14-23min, fastest direct L5 metro.
    fromPlaceId: "mercat-sagrada-familia",
    toPlaceId: "cerveceria-catalana",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 29, durationMinutesMax: 33, distanceKm: 2.2 },
      { mode: "transit", durationMinutesMin: 14, durationMinutesMax: 23, note: "Fastest: direct L5 metro." },
    ],
  },
  {
    // Google walk: 8min/0.6km, flat.
    fromPlaceId: "brunch-and-cake",
    toPlaceId: "casa-batllo",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 8, durationMinutesMax: 8, distanceKm: 0.6 }],
  },
  {
    // Google walk: 7min/500m, flat.
    fromPlaceId: "nomad-coffee",
    toPlaceId: "arc-de-triomf",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 7, durationMinutesMax: 7, distanceKm: 0.5 }],
  },
  {
    // Google walk: 17-20min/1.4-1.5km, ~62-74m elevation LOSS (downhill, kept as a secondary
    // honest option). Google transit: 14min, direct bus 55 or 121 -- chosen over the walk to
    // avoid the descent from Montjuïc, consistent with this file's own general caution around
    // Montjuïc-hill legs.
    fromPlaceId: "mnac",
    toPlaceId: "quimet-y-quimet",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 17, durationMinutesMax: 20, distanceKm: 1.45, note: "~62-74m elevation loss (downhill from Montjuïc)." },
      { mode: "transit", durationMinutesMin: 14, durationMinutesMax: 14, note: "Direct bus 55 or 121." },
    ],
  },
  {
    // Google walk: 3min/190m, flat.
    fromPlaceId: "placa-catalunya",
    toPlaceId: "100-montaditos",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 3, durationMinutesMax: 3, distanceKm: 0.19 }],
  },
  {
    // Google walk: 21-23min/1.5-1.7km, flat (kept as a secondary honest option). Google transit:
    // 18-31min, fastest via L2+L4 metro combo.
    fromPlaceId: "federal-cafe",
    toPlaceId: "barcelona-cathedral",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 21, durationMinutesMax: 23, distanceKm: 1.6 },
      { mode: "transit", durationMinutesMin: 18, durationMinutesMax: 31, note: "Fastest: L2+L4 metro combo." },
    ],
  },
  {
    // Google walk: 20-22min/1.5-1.6km, flat.
    fromPlaceId: "satans-coffee-corner",
    toPlaceId: "mercat-sant-antoni",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 20, durationMinutesMax: 22, distanceKm: 1.55 }],
  },
  {
    // Google walk: 7-8min/550m, flat.
    fromPlaceId: "cook-and-taste-paella-class",
    toPlaceId: "els-quatre-gats",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 7, durationMinutesMax: 8, distanceKm: 0.55 }],
  },
  {
    // Google walk: 12-13min/0.9-1.0km, flat.
    fromPlaceId: "palau-musica",
    toPlaceId: "cal-pep",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 12, durationMinutesMax: 13, distanceKm: 0.95 }],
  },
  {
    // Google walk: 15-16min/1.1-1.2km, flat.
    fromPlaceId: "7-portes",
    toPlaceId: "barceloneta-beach",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 15, durationMinutesMax: 16, distanceKm: 1.15 }],
  },
  {
    // Google walk: 6-7min/0.4-0.45km, flat.
    fromPlaceId: "museu-historia-catalunya",
    toPlaceId: "7-portes",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 6, durationMinutesMax: 7, distanceKm: 0.43 }],
  },
  {
    // Google transit: 40-50min (fastest: rail S2/L6/S1 combo, ~40min, expensive/no simple direct
    // line). Google car: 20min/6.1-6.3km, "best route despite normal traffic" -- materially
    // faster. Car recommended.
    fromPlaceId: "100-montaditos",
    toPlaceId: "monestir-pedralbes",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 40, durationMinutesMax: 50, note: "No simple direct line -- fastest is a rail (S2/L6/S1) combo." },
      { mode: "car", durationMinutesMin: 20, durationMinutesMax: 20, distanceKm: 6.2 },
    ],
  },
  {
    // Google walk: 5min/350m, flat.
    fromPlaceId: "barceloneta-beach",
    toPlaceId: "la-cova-fumada",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 5, durationMinutesMax: 5, distanceKm: 0.35 }],
  },
  {
    // Google walk: 1min/100m, flat.
    fromPlaceId: "portal-angel",
    toPlaceId: "els-quatre-gats",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 1, durationMinutesMax: 1, distanceKm: 0.1 }],
  },
  {
    // Google walk: 15-16min/1.1-1.2km, flat.
    fromPlaceId: "barceloneta-beach",
    toPlaceId: "7-portes",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 15, durationMinutesMax: 16, distanceKm: 1.15 }],
  },
  {
    // Google walk: 12-14min/0.9-1.0km, flat.
    fromPlaceId: "cal-pep",
    toPlaceId: "palau-musica",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 12, durationMinutesMax: 14, distanceKm: 0.95 }],
  },
  {
    // Google walk: 1min/98m, flat.
    fromPlaceId: "cal-pep",
    toPlaceId: "santa-maria-del-mar",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 1, durationMinutesMax: 1, distanceKm: 0.1 }],
  },
  {
    // Google walk: 10min/750m, flat.
    fromPlaceId: "nomad-coffee",
    toPlaceId: "ciutadella",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 10, durationMinutesMax: 10, distanceKm: 0.75 }],
  },
  {
    // Google transit: 42-57min (fastest: L7 metro + Funicular Cuca de Llum, ~42min, multiple
    // transfers). Google car: 26-28min/10.6km, "fastest route now given traffic" -- materially
    // faster and far simpler. Car recommended.
    fromPlaceId: "slowmov",
    toPlaceId: "tibidabo",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 42, durationMinutesMax: 57, note: "Fastest: L7 metro + Funicular Cuca de Llum (Tramvia Blau)." },
      { mode: "car", durationMinutesMin: 26, durationMinutesMax: 28, distanceKm: 10.6 },
    ],
  },
  {
    // Google walk: 7-8min/500-600m, flat -- verified using the guide's own stored la-rambla
    // anchor (Pla de la Boqueria), consistent with this file's existing la-rambla convention.
    fromPlaceId: "conesa-entrepans",
    toPlaceId: "la-rambla",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 7, durationMinutesMax: 8, distanceKm: 0.55 }],
  },
  {
    // Google transit: 22-33min, fastest via bus L9/5X9/5 or L1+L3 metro combo (~22min). Walking
    // not checked (cross-city distance).
    fromPlaceId: "mnac",
    toPlaceId: "ciutat-comtal",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 22, durationMinutesMax: 33, note: "Fastest: bus L9/5X9/5 or L1+L3 metro combo." }],
  },
  {
    // Reverse direction of the sibling mnac -> quimet-y-quimet entry above -- verified
    // independently, not assumed symmetric. Google walk: 22-23min/1.4-1.5km, ~62-74m elevation
    // GAIN (uphill to Montjuïc, kept as a secondary honest option). Google transit: 16-25min,
    // fastest direct bus 55 -- chosen over the uphill walk.
    fromPlaceId: "quimet-y-quimet",
    toPlaceId: "mnac",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 22, durationMinutesMax: 23, distanceKm: 1.45, note: "~62-74m elevation gain (uphill to Montjuïc)." },
      { mode: "transit", durationMinutesMin: 16, durationMinutesMax: 25, note: "Fastest: direct bus 55." },
    ],
  },

  // ── Fix Meal-Adjacent Transport Connectors, follow-up (next-highest-frequency batch) ─────────
  // Same methodology/rigor as the batch above -- every foodPlaces endpoint has a real, precise
  // street address; every attraction endpoint was already an established anchor. Checked live
  // against Google Maps (2026-09), each direction independently.
  {
    // Anchor-ambiguity pair (see this file's own passeig-de-gracia section note): resolved via
    // transit only. Google transit: 10-17min, fastest direct L3 from Diagonal station.
    fromPlaceId: "la-bodegueta",
    toPlaceId: "passeig-de-gracia",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 10, durationMinutesMax: 17, note: "Fastest: direct L3 metro from Diagonal station." }],
  },
  {
    // Reverse of the sibling entry above -- verified independently. Google transit: 10-14min,
    // fastest direct L3 from Plaça Catalunya station.
    fromPlaceId: "passeig-de-gracia",
    toPlaceId: "la-bodegueta",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 10, durationMinutesMax: 14, note: "Fastest: direct L3 metro from Plaça Catalunya station." }],
  },
  {
    // Google walk: 15-18min/1.1-1.3km, flat.
    fromPlaceId: "boqueria",
    toPlaceId: "el-xampanyet",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 15, durationMinutesMax: 18, distanceKm: 1.2 }],
  },
  {
    // Google transit: 18-27min, fastest via L3+L5 metro combo. Walking not checked (cross-city
    // distance).
    fromPlaceId: "jardins-palau-pedralbes",
    toPlaceId: "la-bodegueta",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 18, durationMinutesMax: 27, note: "Fastest: L3+L5 metro combo." }],
  },
  {
    // Google transit: 19min, direct L3 from Palau Reial station (single option offered).
    fromPlaceId: "jardins-palau-pedralbes",
    toPlaceId: "quimet-y-quimet",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 19, durationMinutesMax: 19, note: "Direct L3 metro from Palau Reial station." }],
  },
  {
    // Verified using the guide's own stored la-rambla anchor (Pla de la Boqueria). Google walk:
    // 8-9min/0.6-0.65km, flat.
    fromPlaceId: "els-quatre-gats",
    toPlaceId: "la-rambla",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 8, durationMinutesMax: 9, distanceKm: 0.63 }],
  },
  {
    // Google walk: 8-10min/0.65-0.8km, flat.
    fromPlaceId: "conesa-entrepans",
    toPlaceId: "tablao-cordobes-flamenco",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 8, durationMinutesMax: 10, distanceKm: 0.73 }],
  },
  {
    // Google walk: 42-47min/3.1-3.4km, flat -- too far, not a real option. Google transit:
    // 33-42min, fastest via bus 59 or direct L4.
    fromPlaceId: "bogatell",
    toPlaceId: "la-cova-fumada",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 33, durationMinutesMax: 42, note: "Fastest: bus 59 or direct L4 metro." }],
  },
  {
    // Google walk: 13-15min/1.0-1.1km, flat.
    fromPlaceId: "arc-de-triomf",
    toPlaceId: "cal-pep",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 13, durationMinutesMax: 15, distanceKm: 1.05 }],
  },
  {
    // Google walk: 1min/110m, flat.
    fromPlaceId: "cook-and-taste-paella-class",
    toPlaceId: "conesa-entrepans",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 1, durationMinutesMax: 1, distanceKm: 0.11 }],
  },
  {
    // Google walk: 22-24min/1.6-1.7km, flat (kept as a secondary honest option). Google transit:
    // 15-24min, fastest direct bus 55 -- chosen over the borderline-long walk.
    fromPlaceId: "mnac",
    toPlaceId: "miramar-barcelona",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 22, durationMinutesMax: 24, distanceKm: 1.65 },
      { mode: "transit", durationMinutesMin: 15, durationMinutesMax: 24, note: "Fastest: direct bus 55." },
    ],
  },
  {
    // Google walk: 9-10min/0.65-0.7km, flat.
    fromPlaceId: "cafes-el-magnifico",
    toPlaceId: "ciutadella",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 9, durationMinutesMax: 10, distanceKm: 0.68 }],
  },
  {
    // Resolved to gaudi-bike-tour's own stored Plaça Reial meeting point. Google walk: 9min/
    // 700m, flat.
    fromPlaceId: "bar-lobo",
    toPlaceId: "gaudi-bike-tour",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 9, durationMinutesMax: 9, distanceKm: 0.7, note: "Resolved to the tour's own Plaça Reial meeting point." }],
  },
  {
    // Google transit: 26-37min, fastest direct L3 metro.
    fromPlaceId: "la-bodegueta",
    toPlaceId: "park-guell",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 26, durationMinutesMax: 37, note: "Fastest: direct L3 metro." }],
  },
  {
    // Google walk: 19-22min/1.3-1.6km, flat.
    fromPlaceId: "placa-reial",
    toPlaceId: "ciutat-comtal",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 19, durationMinutesMax: 22, distanceKm: 1.45 }],
  },
  {
    // Google transit: 41-53min (fastest: L3+bus 119 combo, ~41min, no single fast line). Google
    // car: 25-27min/5.9-6.4km, "fastest route now given traffic" -- materially faster, same
    // pattern as the sibling bunkers-carmel -> bar-mut entry above. Car recommended.
    fromPlaceId: "la-bodegueta",
    toPlaceId: "bunkers-carmel",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 41, durationMinutesMax: 53, note: "No single fast line -- fastest is an L3+bus 119 combo." },
      { mode: "car", durationMinutesMin: 25, durationMinutesMax: 27, distanceKm: 6.15 },
    ],
  },
  {
    // Google walk: 2min/190m, flat.
    fromPlaceId: "100-montaditos",
    toPlaceId: "placa-catalunya",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 2, durationMinutesMax: 2, distanceKm: 0.19 }],
  },
  {
    // Google walk: 27-28min/2.0-2.1km, flat -- too far, not a real option. Google transit:
    // 18-27min, fastest direct L5 from Verdaguer station.
    fromPlaceId: "el-noa-noa",
    toPlaceId: "mercat-sagrada-familia",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 18, durationMinutesMax: 27, note: "Fastest: direct L5 metro from Verdaguer station." }],
  },

  // ── Fix Meal-Adjacent Transport Connectors, third batch (remaining top-frequency pairs) ──────
  // Same methodology as the two batches above. Every literal "montjuic"-touching pair and every
  // gothic-quarter-tapas-wine-tour pair found by the frequency audit was deliberately left
  // OUT of this batch -- both stay correctly unresolved per this task's own Section 6.
  {
    // Google walk: 13-15min/0.95-1.0km, flat.
    fromPlaceId: "gothic-quarter",
    toPlaceId: "7-portes",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 13, durationMinutesMax: 15, distanceKm: 0.98 }],
  },
  {
    // Google walk: 5-6min/0.35-0.4km, flat.
    fromPlaceId: "barcelona-cathedral",
    toPlaceId: "els-quatre-gats",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 5, durationMinutesMax: 6, distanceKm: 0.38 }],
  },
  {
    // Google walk: 3min/220m, flat.
    fromPlaceId: "federal-cafe",
    toPlaceId: "mercat-sant-antoni",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 3, durationMinutesMax: 3, distanceKm: 0.22 }],
  },
  {
    // Google walk: 25-28min/1.8-2.1km, flat (kept as a secondary honest option). Google transit:
    // 19-32min, fastest direct L4 metro.
    fromPlaceId: "portal-angel",
    toPlaceId: "la-cova-fumada",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 25, durationMinutesMax: 28, distanceKm: 1.95 },
      { mode: "transit", durationMinutesMin: 19, durationMinutesMax: 32, note: "Fastest: direct L4 metro." },
    ],
  },
  {
    // Google walk: 6-7min/0.4-0.5km, flat.
    fromPlaceId: "7-portes",
    toPlaceId: "museu-historia-catalunya",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 6, durationMinutesMax: 7, distanceKm: 0.45 }],
  },
  {
    // Google transit: 43-67min (fastest: L7 metro + Funicular Cuca de Llum, ~43min, multiple
    // transfers). Google car: 27-29min/10.4-11.3km, "fastest route now given traffic" --
    // materially faster and far simpler. Car recommended.
    fromPlaceId: "la-bodegueta",
    toPlaceId: "tibidabo",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 43, durationMinutesMax: 67, note: "Fastest: L7 metro + Funicular Cuca de Llum (Tramvia Blau)." },
      { mode: "car", durationMinutesMin: 27, durationMinutesMax: 29, distanceKm: 10.9 },
    ],
  },
  {
    // Google walk: 12-13min/0.85-1.0km, flat.
    fromPlaceId: "portal-angel",
    toPlaceId: "canete",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 12, durationMinutesMax: 13, distanceKm: 0.93 }],
  },
  {
    // Google walk: 4min/240m, flat.
    fromPlaceId: "7-portes",
    toPlaceId: "santa-maria-del-mar",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 4, durationMinutesMax: 4, distanceKm: 0.24 }],
  },
  {
    // Anchor-ambiguity pair (see this file's own passeig-de-gracia section note) -- but here
    // Google's own resolved point lands only 4min/270m away regardless, so the ambiguity has no
    // material effect on this particular direction. Google walk: 4min/270m, flat.
    fromPlaceId: "passeig-de-gracia",
    toPlaceId: "100-montaditos",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 4, durationMinutesMax: 4, distanceKm: 0.27 }],
  },
  {
    // Google walk: 4min/300m, flat.
    fromPlaceId: "gothic-quarter",
    toPlaceId: "conesa-entrepans",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 4, durationMinutesMax: 4, distanceKm: 0.3 }],
  },
  {
    // Google walk: 16-17min/1.1-1.2km, ~93-105m elevation LOSS (downhill from Montjuïc) --
    // faster than the 19min direct funicular option, so walking is recommended here (opposite of
    // the sibling mnac -> quimet-y-quimet entry, which is uphill in this direction).
    fromPlaceId: "teleferic-montjuic",
    toPlaceId: "quimet-y-quimet",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 16, durationMinutesMax: 17, distanceKm: 1.15, note: "~93-105m elevation loss (downhill from Montjuïc)." }],
  },
  {
    // Google walk: 7min/500m, flat.
    fromPlaceId: "placa-reial",
    toPlaceId: "conesa-entrepans",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 7, durationMinutesMax: 7, distanceKm: 0.5 }],
  },
  {
    // Google walk: 4min/280m, flat.
    fromPlaceId: "gothic-quarter",
    toPlaceId: "els-quatre-gats",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 4, durationMinutesMax: 4, distanceKm: 0.28 }],
  },
  {
    // Resolved to gaudi-bike-tour's own stored Plaça Reial meeting point. Google walk: 7min/
    // 500-550m, flat.
    fromPlaceId: "gaudi-bike-tour",
    toPlaceId: "agut",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 7, durationMinutesMax: 7, distanceKm: 0.53, note: "Resolved to the tour's own Plaça Reial meeting point." }],
  },
  {
    // Verified using the guide's own stored la-rambla anchor (Pla de la Boqueria). Google walk:
    // 16-18min/1.1-1.3km, flat.
    fromPlaceId: "la-rambla",
    toPlaceId: "quimet-y-quimet",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 16, durationMinutesMax: 18, distanceKm: 1.2 }],
  },
  {
    // Google walk: 3min/190m, flat.
    fromPlaceId: "barcelona-cathedral",
    toPlaceId: "conesa-entrepans",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 3, durationMinutesMax: 3, distanceKm: 0.19 }],
  },
  {
    // Reverse of the sibling gothic-quarter -> conesa-entrepans entry above -- verified
    // independently. Google walk: 4min/300m, flat.
    fromPlaceId: "conesa-entrepans",
    toPlaceId: "gothic-quarter",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 4, durationMinutesMax: 4, distanceKm: 0.3 }],
  },

  // ── Final Meal Route Coverage Pass ────────────────────────────────────────────────────────────
  // Highest-frequency remaining meal-adjacent pairs (6x and 5x instance frequency), verified live
  // against Google Maps (2026-09), each direction independently. Literal "montjuic" and
  // gothic-quarter-tapas-wine-tour pairs deliberately excluded (kept unresolved per this task's
  // own Section 5/Section 6).
  {
    // Google walk: 9min/650m, flat.
    fromPlaceId: "bar-lobo",
    toPlaceId: "passeig-de-gracia",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 9, durationMinutesMax: 9, distanceKm: 0.65 }],
  },
  {
    // Google transit: 35-46min (fastest: direct bus 22, ~35min, no fast rail option). Google
    // car: 21-22min/6.2km, "best route now given traffic" -- materially faster. Car recommended,
    // matching the sibling la-bodegueta -> bunkers-carmel entry above.
    fromPlaceId: "bunkers-carmel",
    toPlaceId: "la-bodegueta",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 35, durationMinutesMax: 46, note: "No fast rail option -- direct bus 22 is fastest." },
      { mode: "car", durationMinutesMin: 21, durationMinutesMax: 22, distanceKm: 6.2 },
    ],
  },
  {
    // Google walk: 9min/600m, flat.
    fromPlaceId: "canete",
    toPlaceId: "cook-and-taste-paella-class",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 9, durationMinutesMax: 9, distanceKm: 0.6 }],
  },
  {
    // Google walk: 11-12min/0.8-0.9km, flat.
    fromPlaceId: "brunch-and-cake",
    toPlaceId: "placa-catalunya",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 11, durationMinutesMax: 12, distanceKm: 0.85 }],
  },
  {
    // Google walk: 18-19min/1.2-1.3km, flat.
    fromPlaceId: "bar-lobo",
    toPlaceId: "casa-batllo",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 18, durationMinutesMax: 19, distanceKm: 1.25 }],
  },
  {
    // Google walk: 10-12min/0.75-0.9km, flat.
    fromPlaceId: "satans-coffee-corner",
    toPlaceId: "placa-catalunya",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 10, durationMinutesMax: 12, distanceKm: 0.83 }],
  },
  {
    // Google walk: 4-5min/300-350m, flat.
    fromPlaceId: "canete",
    toPlaceId: "placa-reial",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 4, durationMinutesMax: 5, distanceKm: 0.33 }],
  },
  {
    // Google walk: 13-14min/1.0km, flat.
    fromPlaceId: "portal-angel",
    toPlaceId: "el-xampanyet",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 13, durationMinutesMax: 14, distanceKm: 1.0 }],
  },
  {
    // Google walk: 10-11min/0.75km, flat.
    fromPlaceId: "barceloneta-beach",
    toPlaceId: "1881-sagardi",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 10, durationMinutesMax: 11, distanceKm: 0.75 }],
  },
  {
    // Google transit: 10min, direct L3 from Liceu station (single option offered -- walk not
    // offered, cross-city distance).
    fromPlaceId: "cafe-de-lopera",
    toPlaceId: "casa-mila",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 10, durationMinutesMax: 10, note: "Direct L3 metro from Liceu station." }],
  },
  {
    // Google walk: 11-13min/0.75-0.85km, flat.
    fromPlaceId: "7-portes",
    toPlaceId: "cook-and-taste-paella-class",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 11, durationMinutesMax: 13, distanceKm: 0.8 }],
  },
  {
    // Google walk: 19-20min/1.4-1.5km, flat.
    fromPlaceId: "cook-and-taste-paella-class",
    toPlaceId: "la-cova-fumada",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 19, durationMinutesMax: 20, distanceKm: 1.45 }],
  },
  {
    // Google transit: 14-28min, fastest direct L3 metro from Liceu. Walk not offered (cross-city
    // distance).
    fromPlaceId: "tablao-cordobes-flamenco",
    toPlaceId: "bar-mut",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 14, durationMinutesMax: 28, note: "Fastest: direct L3 metro from Liceu station." }],
  },
  {
    // Google walk: 15min/1.1km, flat.
    fromPlaceId: "bar-lobo",
    toPlaceId: "mercat-sant-antoni",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 15, durationMinutesMax: 15, distanceKm: 1.1 }],
  },
  {
    // Resolved to gaudi-bike-tour's own stored Plaça Reial meeting point. Google walk: 3min/
    // 230-260m, flat.
    fromPlaceId: "cafe-de-lopera",
    toPlaceId: "gaudi-bike-tour",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 3, durationMinutesMax: 3, distanceKm: 0.24, note: "Resolved to the tour's own Plaça Reial meeting point." }],
  },
  {
    // Google walk: 13-14min/0.9-1.0km, flat.
    fromPlaceId: "santa-maria-del-mar",
    toPlaceId: "la-cova-fumada",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 13, durationMinutesMax: 14, distanceKm: 0.95 }],
  },
  {
    // Google walk: 13min/1.0km, flat.
    fromPlaceId: "casa-mila",
    toPlaceId: "ciutat-comtal",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 13, durationMinutesMax: 13, distanceKm: 1.0 }],
  },
  {
    // Google walk: 11-14min/0.85-1.0km, flat.
    fromPlaceId: "portal-angel",
    toPlaceId: "agut",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 11, durationMinutesMax: 14, distanceKm: 0.93 }],
  },
  {
    // Google transit: 6min, direct L3 from Liceu station -- materially faster than the 22-27min/
    // 1.5-1.9km walk also offered, which is kept as a secondary honest option.
    fromPlaceId: "cafe-de-lopera",
    toPlaceId: "casa-batllo",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 22, durationMinutesMax: 27, distanceKm: 1.7 },
      { mode: "transit", durationMinutesMin: 6, durationMinutesMax: 6, note: "Direct L3 metro from Liceu station." },
    ],
  },
  {
    // Google walk: 4min/290m, flat.
    fromPlaceId: "canete",
    toPlaceId: "la-rambla",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 4, durationMinutesMax: 4, distanceKm: 0.29 }],
  },
  {
    // Google transit: 32-46min, fastest direct L4 metro. Walk not offered (cross-city distance).
    fromPlaceId: "baluard-barceloneta",
    toPlaceId: "bogatell",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 32, durationMinutesMax: 46, note: "Fastest: direct L4 metro." }],
  },
  {
    // Google transit: 10-20min, fastest direct L3 metro from Liceu. Walk not offered.
    fromPlaceId: "satans-coffee-corner",
    toPlaceId: "casa-batllo",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 10, durationMinutesMax: 20, note: "Fastest: direct L3 metro from Liceu station." }],
  },
  {
    // Anchor-ambiguity pair (see this file's own passeig-de-gracia section note): resolved via
    // transit only. Google transit: 11-16min, fastest direct bus D50.
    fromPlaceId: "brunch-and-cake",
    toPlaceId: "passeig-de-gracia",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 11, durationMinutesMax: 16, note: "Fastest: direct bus D50." }],
  },
  {
    // Google transit: 40-44min (fastest: direct bus 22, ~40min, no fast rail option). Google
    // car: 21min/6.1-6.2km, "best route now given traffic" -- materially faster. Car
    // recommended.
    fromPlaceId: "bunkers-carmel",
    toPlaceId: "cerveceria-catalana",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "transit", durationMinutesMin: 40, durationMinutesMax: 44, note: "No fast rail option -- direct bus 22 is fastest." },
      { mode: "car", durationMinutesMin: 21, durationMinutesMax: 21, distanceKm: 6.15 },
    ],
  },
  {
    // Google transit: 21-31min, fastest via L3+L5 metro combo.
    fromPlaceId: "jardins-palau-pedralbes",
    toPlaceId: "cerveceria-catalana",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 21, durationMinutesMax: 31, note: "Fastest: L3+L5 metro combo." }],
  },
  {
    // Anchor-ambiguity pair (see this file's own passeig-de-gracia section note): resolved via
    // transit only. Google transit: 13-18min, fastest direct L3 from Diagonal station.
    fromPlaceId: "cerveceria-catalana",
    toPlaceId: "passeig-de-gracia",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 13, durationMinutesMax: 18, note: "Fastest: direct L3 metro from Diagonal station." }],
  },
  {
    // Google transit: 13-19min, fastest direct L5 metro.
    fromPlaceId: "mercat-sagrada-familia",
    toPlaceId: "la-bodegueta",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 13, durationMinutesMax: 19, note: "Fastest: direct L5 metro." }],
  },

  // ── Final Meal Route Coverage Pass, 4x-frequency batch ────────────────────────────────────────
  {
    // Google walk: 6min/0.4-0.45km, flat.
    fromPlaceId: "baluard-barceloneta",
    toPlaceId: "barceloneta-beach",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 6, durationMinutesMax: 6, distanceKm: 0.43 }],
  },
  {
    // Google walk: 23-27min/1.7-1.9km, flat -- borderline. Google transit: 10-20min, fastest
    // direct L5 metro -- chosen over the walk.
    fromPlaceId: "sagrada-familia",
    toPlaceId: "cerveceria-catalana",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 23, durationMinutesMax: 27, distanceKm: 1.8 },
      { mode: "transit", durationMinutesMin: 10, durationMinutesMax: 20, note: "Fastest: direct L5 metro." },
    ],
  },
  {
    // Google walk: 3min/240m, flat.
    fromPlaceId: "casa-mila",
    toPlaceId: "la-bodegueta",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 3, durationMinutesMax: 3, distanceKm: 0.24 }],
  },
  {
    // Google transit: 28-45min, fastest direct L4 metro from Barceloneta station. Walk not
    // offered (cross-city distance).
    fromPlaceId: "7-portes",
    toPlaceId: "bogatell",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 28, durationMinutesMax: 45, note: "Fastest: direct L4 metro from Barceloneta station." }],
  },
  {
    // Google walk: 8min/550m, flat.
    fromPlaceId: "ciutadella",
    toPlaceId: "cal-pep",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 8, durationMinutesMax: 8, distanceKm: 0.55 }],
  },
  {
    // Google walk: 12-13min/0.85-1.0km, flat.
    fromPlaceId: "canete",
    toPlaceId: "portal-angel",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 12, durationMinutesMax: 13, distanceKm: 0.93 }],
  },
  {
    // Google transit: 25-33min, fastest direct L3 metro from Liceu station.
    fromPlaceId: "canete",
    toPlaceId: "mnac",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 25, durationMinutesMax: 33, note: "Fastest: direct L3 metro from Liceu station." }],
  },
  {
    // Google walk: 12-13min/0.85-0.9km, flat.
    fromPlaceId: "casa-batllo",
    toPlaceId: "bar-mut",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 12, durationMinutesMax: 13, distanceKm: 0.88 }],
  },
  {
    // Google walk: 3min/250m, flat.
    fromPlaceId: "satans-coffee-corner",
    toPlaceId: "barcelona-cathedral",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 3, durationMinutesMax: 3, distanceKm: 0.25 }],
  },
  {
    // Google walk: 8min/600m, flat.
    fromPlaceId: "cook-and-taste-paella-class",
    toPlaceId: "canete",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 8, durationMinutesMax: 8, distanceKm: 0.6 }],
  },
  {
    // Google walk: 5min/350m, flat.
    fromPlaceId: "casa-mila",
    toPlaceId: "bar-mut",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 5, durationMinutesMax: 5, distanceKm: 0.35 }],
  },
  {
    // Google transit: 24-26min, fastest direct bus D40 or 27.
    fromPlaceId: "slowmov",
    toPlaceId: "park-guell",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 24, durationMinutesMax: 26, note: "Fastest: direct bus D40 or 27." }],
  },
  {
    // Google walk: 4min/240m, flat.
    fromPlaceId: "santa-maria-del-mar",
    toPlaceId: "7-portes",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 4, durationMinutesMax: 4, distanceKm: 0.24 }],
  },
  {
    // Google walk: 24min/1.4km, flat -- actually the fastest option (Google transit: 25-30min,
    // fastest direct bus V19, not materially faster). Walking recommended.
    fromPlaceId: "el-noa-noa",
    toPlaceId: "park-guell",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 24, durationMinutesMax: 24, distanceKm: 1.4 },
      { mode: "transit", durationMinutesMin: 25, durationMinutesMax: 30, note: "Direct bus V19." },
    ],
  },
  {
    // Verified using the guide's own stored la-rambla anchor (Pla de la Boqueria). Google walk:
    // 13min/950m, flat.
    fromPlaceId: "la-rambla",
    toPlaceId: "el-xampanyet",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 13, durationMinutesMax: 13, distanceKm: 0.95 }],
  },
  {
    // Google transit: 22-31min, fastest via L3+L2 metro combo.
    fromPlaceId: "jardins-palau-pedralbes",
    toPlaceId: "ciutat-comtal",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 22, durationMinutesMax: 31, note: "Fastest: L3+L2 metro combo." }],
  },

  // ── Final Meal Route Coverage Pass, 3x-frequency batch ────────────────────────────────────────
  {
    // Google walk: 3-4min/230-260m, flat.
    fromPlaceId: "tablao-cordobes-flamenco",
    toPlaceId: "canete",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 3, durationMinutesMax: 4, distanceKm: 0.25 }],
  },
  {
    // Google walk: 8min/600m, flat.
    fromPlaceId: "portal-angel",
    toPlaceId: "conesa-entrepans",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 8, durationMinutesMax: 8, distanceKm: 0.6 }],
  },
  {
    // Reverse of the sibling tablao-cordobes-flamenco -> canete entry above -- verified
    // independently. Google walk: 3-4min/230-260m, flat.
    fromPlaceId: "canete",
    toPlaceId: "tablao-cordobes-flamenco",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 3, durationMinutesMax: 4, distanceKm: 0.25 }],
  },
  {
    // Verified using the guide's own stored la-rambla anchor (Pla de la Boqueria). Google walk:
    // 9-11min/0.65-0.85km, flat.
    fromPlaceId: "agut",
    toPlaceId: "la-rambla",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 9, durationMinutesMax: 11, distanceKm: 0.75 }],
  },
  {
    // Google transit: 31-46min, fastest direct L3 metro. Walk not offered (cross-city distance).
    fromPlaceId: "agut",
    toPlaceId: "mnac",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 31, durationMinutesMax: 46, note: "Fastest: direct L3 metro." }],
  },
  {
    // Google walk: 3-4min/230-280m, flat.
    fromPlaceId: "satans-coffee-corner",
    toPlaceId: "gothic-quarter",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 3, durationMinutesMax: 4, distanceKm: 0.26 }],
  },
  {
    // Google walk: 10-11min/0.8km, flat.
    fromPlaceId: "barcelona-cathedral",
    toPlaceId: "canete",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 10, durationMinutesMax: 11, distanceKm: 0.8 }],
  },
  {
    // Google walk: 7-9min/0.55-0.7km, flat.
    fromPlaceId: "satans-coffee-corner",
    toPlaceId: "boqueria",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 7, durationMinutesMax: 9, distanceKm: 0.63 }],
  },
  {
    // Google walk: 11-14min/0.85-1.1km, flat.
    fromPlaceId: "els-quatre-gats",
    toPlaceId: "tablao-cordobes-flamenco",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 11, durationMinutesMax: 14, distanceKm: 0.95 }],
  },
  {
    // Google walk: 1min/98m, flat.
    fromPlaceId: "santa-maria-del-mar",
    toPlaceId: "cal-pep",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 1, durationMinutesMax: 1, distanceKm: 0.1 }],
  },
  {
    // Google transit: 14-24min, fastest direct L3 metro from Liceu station.
    fromPlaceId: "satans-coffee-corner",
    toPlaceId: "casa-mila",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 14, durationMinutesMax: 24, note: "Fastest: direct L3 metro from Liceu station." }],
  },
  {
    // Google walk: 9min/650-700m, flat.
    fromPlaceId: "gothic-quarter",
    toPlaceId: "canete",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 9, durationMinutesMax: 9, distanceKm: 0.68 }],
  },
  {
    // Google walk: 10-12min/0.75-0.85km, flat.
    fromPlaceId: "placa-reial",
    toPlaceId: "sky-bar-grand-central",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 10, durationMinutesMax: 12, distanceKm: 0.8 }],
  },

  // ── Final Meal Route Coverage Pass, 2x-frequency batch ────────────────────────────────────────
  {
    // Google walk: 26-28min/1.9-2.0km, flat -- too far. Google transit: 22-28min, fastest direct
    // L4 metro.
    fromPlaceId: "boqueria",
    toPlaceId: "la-cova-fumada",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 22, durationMinutesMax: 28, note: "Fastest: direct L4 metro." }],
  },
  {
    // Google walk: 9min/650m, flat.
    fromPlaceId: "tablao-cordobes-flamenco",
    toPlaceId: "conesa-entrepans",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 9, durationMinutesMax: 9, distanceKm: 0.65 }],
  },
  {
    // Google walk: 7min/500-550m, flat.
    fromPlaceId: "conesa-entrepans",
    toPlaceId: "placa-reial",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 7, durationMinutesMax: 7, distanceKm: 0.53 }],
  },
  {
    // Google walk: 7-8min/550-600m, flat.
    fromPlaceId: "satans-coffee-corner",
    toPlaceId: "tablao-cordobes-flamenco",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 7, durationMinutesMax: 8, distanceKm: 0.58 }],
  },
  {
    // Google walk: 11min/850m, flat.
    fromPlaceId: "100-montaditos",
    toPlaceId: "boqueria",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 11, durationMinutesMax: 11, distanceKm: 0.85 }],
  },
  {
    // Google transit: 23-37min, fastest direct L3 metro from Poble Sec.
    fromPlaceId: "mercat-sant-antoni",
    toPlaceId: "bar-mut",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 23, durationMinutesMax: 37, note: "Fastest: direct L3 metro from Poble Sec station." }],
  },
  {
    // Google walk: 13-14min/0.9-1.0km, flat.
    fromPlaceId: "7-portes",
    toPlaceId: "gothic-quarter",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 13, durationMinutesMax: 14, distanceKm: 0.95 }],
  },
  {
    // Google walk: 9min/650-700m, flat.
    fromPlaceId: "barcelona-cathedral",
    toPlaceId: "el-xampanyet",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 9, durationMinutesMax: 9, distanceKm: 0.68 }],
  },
  {
    // Google walk: 8min/600m, flat.
    fromPlaceId: "casa-batllo",
    toPlaceId: "100-montaditos",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 8, durationMinutesMax: 8, distanceKm: 0.6 }],
  },
  {
    // Google walk: 10-11min/0.75-0.8km, flat.
    fromPlaceId: "gothic-quarter",
    toPlaceId: "el-xampanyet",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 10, durationMinutesMax: 11, distanceKm: 0.78 }],
  },
  {
    // Google walk: 16-17min/1.1-1.2km, flat.
    fromPlaceId: "cafes-el-magnifico",
    toPlaceId: "placa-catalunya",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 16, durationMinutesMax: 17, distanceKm: 1.15 }],
  },
  {
    // Google walk: 6min/450m, flat.
    fromPlaceId: "tablao-cordobes-flamenco",
    toPlaceId: "kiosko-universal",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 6, durationMinutesMax: 6, distanceKm: 0.45 }],
  },
  {
    // Google walk: 6-7min/450-500m, flat.
    fromPlaceId: "casa-batllo",
    toPlaceId: "ciutat-comtal",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 6, durationMinutesMax: 7, distanceKm: 0.48 }],
  },
  {
    // Google walk: 20-22min/1.4-1.5km, flat.
    fromPlaceId: "ciutadella",
    toPlaceId: "la-cova-fumada",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 20, durationMinutesMax: 22, distanceKm: 1.45 }],
  },
  {
    // Google walk: 6min/450m, flat.
    fromPlaceId: "bar-lobo",
    toPlaceId: "placa-catalunya",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 6, durationMinutesMax: 6, distanceKm: 0.45 }],
  },
  {
    // Google walk: 6min/450m, flat.
    fromPlaceId: "museu-historia-catalunya",
    toPlaceId: "la-cova-fumada",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 6, durationMinutesMax: 6, distanceKm: 0.45 }],
  },
  {
    // Resolved to gaudi-bike-tour's own stored Plaça Reial meeting point. Google walk: 14-15min/
    // 1.0km, flat.
    fromPlaceId: "gaudi-bike-tour",
    toPlaceId: "7-portes",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 14, durationMinutesMax: 15, distanceKm: 1.0, note: "Resolved to the tour's own Plaça Reial meeting point." }],
  },
  {
    // Google transit: 23-29min, fastest direct L3 metro.
    fromPlaceId: "park-guell",
    toPlaceId: "la-bodegueta",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [{ mode: "transit", durationMinutesMin: 23, durationMinutesMax: 29, note: "Fastest: direct L3 metro." }],
  },
  {
    // Google walk: 16-19min/1.2-1.3km, flat.
    fromPlaceId: "cafe-de-lopera",
    toPlaceId: "mercat-sant-antoni",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 16, durationMinutesMax: 19, distanceKm: 1.25 }],
  },

  // ── Final Meal Route Coverage Pass, final push to cross the 90% coverage target ───────────────
  {
    // Google walk: 15-16min/1.1km, flat.
    fromPlaceId: "cafes-el-magnifico",
    toPlaceId: "arc-de-triomf",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 15, durationMinutesMax: 16, distanceKm: 1.1 }],
  },
  {
    // Verified using the guide's own stored la-rambla anchor (Pla de la Boqueria). Google walk:
    // 7-8min/500-600m, flat.
    fromPlaceId: "la-rambla",
    toPlaceId: "conesa-entrepans",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 7, durationMinutesMax: 8, distanceKm: 0.55 }],
  },
  {
    // Google walk: 13-14min/0.9-1.0km, flat.
    fromPlaceId: "ciutadella",
    toPlaceId: "agut",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 13, durationMinutesMax: 14, distanceKm: 0.95 }],
  },
  {
    // Reverse of the sibling ciutadella -> agut entry above -- verified independently. Google
    // walk: 13-14min/0.9-1.0km, flat.
    fromPlaceId: "agut",
    toPlaceId: "ciutadella",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 13, durationMinutesMax: 14, distanceKm: 0.95 }],
  },
  {
    // Google walk: 10-11min/0.7-0.8km, flat.
    fromPlaceId: "boqueria",
    toPlaceId: "conesa-entrepans",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 10, durationMinutesMax: 11, distanceKm: 0.75 }],
  },
  {
    // Google walk: 24-28min/1.7-2.0km, flat -- too far, kept as a secondary honest option. Google
    // transit: 15-24min, fastest direct L4 metro from Urquinaona station.
    fromPlaceId: "palau-musica",
    toPlaceId: "la-cova-fumada",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 24, durationMinutesMax: 28, distanceKm: 1.85 },
      { mode: "transit", durationMinutesMin: 15, durationMinutesMax: 24, note: "Fastest: direct L4 metro from Urquinaona station." },
    ],
  },
  {
    // Google walk: 21min/1.6km, flat.
    fromPlaceId: "federal-cafe",
    toPlaceId: "portal-angel",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 21, durationMinutesMax: 21, distanceKm: 1.6 }],
  },
  {
    // Google walk: 23-24min/1.7km, flat, no faster transit alternative for this central old-city
    // walk (consistent with the sibling satans-coffee-corner -> mercat-sant-antoni entry above).
    fromPlaceId: "conesa-entrepans",
    toPlaceId: "mercat-sant-antoni",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 23, durationMinutesMax: 24, distanceKm: 1.7 }],
  },

  // ---- Round 3B/3B.1/3B.2: Live Route Backfill (born-cluster + old-city coverage gaps) -------
  // Every entry below was independently verified in BOTH directions via live Google Maps walking
  // directions on 2026-09-13, using each place's own exact stored Guide address (never haversine,
  // never inferred, never a "looks nearby" estimate). The 8 entries below matched EXACTLY in both
  // directions (identical duration, identical distance, both flagged "mostly flat" by Google) --
  // `allowReverseWalkingReuse: true` is only set on these, per this file's own honesty rule for
  // that flag ("only safe for short/flat paths with no known elevation/asymmetry"). The 2 pairs
  // that showed a real (if small, 1-minute) directional difference are stored as their own two
  // separate direction-specific entries instead, with reverse reuse deliberately left off.
  {
    // Google walk: 3min/190m both directions, flat. Fills the previously fully-disconnected
    // el-born <-> born-cluster gap (see Round 3's diagnostic: el-born had zero route-leg entries
    // at all before this task).
    fromPlaceId: "el-born",
    toPlaceId: "santa-maria-del-mar",
    recommendedMode: "walking",
    sourceStatus: "verified",
    allowReverseWalkingReuse: true,
    options: [{ mode: "walking", durationMinutesMin: 3, durationMinutesMax: 3, distanceKm: 0.19 }],
  },
  {
    // Google walk: 3min/210m both directions, flat.
    fromPlaceId: "el-born",
    toPlaceId: "museu-picasso",
    recommendedMode: "walking",
    sourceStatus: "verified",
    allowReverseWalkingReuse: true,
    options: [{ mode: "walking", durationMinutesMin: 3, durationMinutesMax: 3, distanceKm: 0.21 }],
  },
  {
    // Google walk: 5min/350m both directions, flat.
    fromPlaceId: "mercat-santa-caterina",
    toPlaceId: "museu-picasso",
    recommendedMode: "walking",
    sourceStatus: "verified",
    allowReverseWalkingReuse: true,
    options: [{ mode: "walking", durationMinutesMin: 5, durationMinutesMax: 5, distanceKm: 0.35 }],
  },
  {
    // Google walk: 8min/600m both directions, flat.
    fromPlaceId: "mercat-santa-caterina",
    toPlaceId: "el-born",
    recommendedMode: "walking",
    sourceStatus: "verified",
    allowReverseWalkingReuse: true,
    options: [{ mode: "walking", durationMinutesMin: 8, durationMinutesMax: 8, distanceKm: 0.6 }],
  },
  {
    // Google walk: 13min/1.0km both directions, flat. Fills a pre-existing gap between two
    // original-pool born-cluster candidates (see Round 3's diagnostic).
    fromPlaceId: "santa-maria-del-mar",
    toPlaceId: "arc-de-triomf",
    recommendedMode: "walking",
    sourceStatus: "verified",
    allowReverseWalkingReuse: true,
    options: [{ mode: "walking", durationMinutesMin: 13, durationMinutesMax: 13, distanceKm: 1.0 }],
  },
  {
    // Google walk: 4min/270m both directions, flat.
    fromPlaceId: "mercat-santa-caterina",
    toPlaceId: "palau-musica",
    recommendedMode: "walking",
    sourceStatus: "verified",
    allowReverseWalkingReuse: true,
    options: [{ mode: "walking", durationMinutesMin: 4, durationMinutesMax: 4, distanceKm: 0.27 }],
  },
  {
    // Google walk: 10min/750m both directions, flat, direct via La Rambla.
    fromPlaceId: "museu-maritim",
    toPlaceId: "la-rambla",
    recommendedMode: "walking",
    sourceStatus: "verified",
    allowReverseWalkingReuse: true,
    options: [{ mode: "walking", durationMinutesMin: 10, durationMinutesMax: 10, distanceKm: 0.75 }],
  },
  {
    // Google walk: 15min/1.1km both directions, flat, direct via Rambla del Poblenou.
    fromPlaceId: "rambla-poblenou",
    toPlaceId: "bogatell",
    recommendedMode: "walking",
    sourceStatus: "verified",
    allowReverseWalkingReuse: true,
    options: [{ mode: "walking", durationMinutesMin: 15, durationMinutesMax: 15, distanceKm: 1.1 }],
  },

  // -- Direction-specific (Round 3B.1 found a real, if small, 1-minute directional difference on
  // both of the next two pairs -- stored as separate entries per direction, allowReverseWalkingReuse
  // deliberately omitted so the builder never substitutes one direction's number for the other's.
  {
    // Google walk fromPlaceId -> toPlaceId: 18min/1.3km, flat, via La Rambla.
    fromPlaceId: "museu-maritim",
    toPlaceId: "portal-angel",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 18, durationMinutesMax: 18, distanceKm: 1.3 }],
  },
  {
    // Google walk fromPlaceId -> toPlaceId (reverse of the above): 17min/1.3km, flat, via La Rambla.
    // One minute faster than the other direction -- kept as its own entry rather than reused.
    fromPlaceId: "portal-angel",
    toPlaceId: "museu-maritim",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 17, durationMinutesMax: 17, distanceKm: 1.3 }],
  },
  {
    // Google walk fromPlaceId -> toPlaceId: 18min/1.3km, flat, via Carrer de la Riera Alta + Carrer del Carme.
    fromPlaceId: "mercat-sant-antoni",
    toPlaceId: "gothic-quarter",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 18, durationMinutesMax: 18, distanceKm: 1.3 }],
  },
  {
    // Google walk fromPlaceId -> toPlaceId (reverse of the above): 19min/1.3km, flat, via Carrer del Carme + Carrer de la Riera Alta.
    // One minute slower than the other direction -- kept as its own entry rather than reused.
    fromPlaceId: "gothic-quarter",
    toPlaceId: "mercat-sant-antoni",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 19, durationMinutesMax: 19, distanceKm: 1.3 }],
  },

  // ---- Round 3B.4: Final Safe Main-Stop Route Backfill --------------------------------------
  // Every entry below was independently verified via live Google Maps walking directions on
  // 2026-09-14, using each place's own exact stored Guide address -- targeting the specific
  // main-stop connectors identified by Round 3B.3's bottleneck audit as breaking a 4-long or
  // 5-long unresolved run in the 7d Experiences+Food+Shopping / 10d Surprise Me personas.
  {
    // Google walk: 9min/650m both directions (default route), flat.
    fromPlaceId: "mercat-santa-caterina",
    toPlaceId: "santa-maria-del-mar",
    recommendedMode: "walking",
    sourceStatus: "verified",
    allowReverseWalkingReuse: true,
    options: [{ mode: "walking", durationMinutesMin: 9, durationMinutesMax: 9, distanceKm: 0.65 }],
  },
  {
    // Google walk: 7min/450m both directions (default route), flat.
    fromPlaceId: "ciutadella",
    toPlaceId: "museu-picasso",
    recommendedMode: "walking",
    sourceStatus: "verified",
    allowReverseWalkingReuse: true,
    options: [{ mode: "walking", durationMinutesMin: 7, durationMinutesMax: 7, distanceKm: 0.45 }],
  },
  {
    // Google walk fromPlaceId -> toPlaceId: 16min/1.2km, flat, via La Rambla.
    fromPlaceId: "barcelona-cathedral",
    toPlaceId: "museu-maritim",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 16, durationMinutesMax: 16, distanceKm: 1.2 }],
  },
  {
    // Google walk fromPlaceId -> toPlaceId (reverse of the above): 17min/1.2km, flat, via La Rambla.
    // One minute slower than the other direction -- kept as its own entry rather than reused.
    fromPlaceId: "museu-maritim",
    toPlaceId: "barcelona-cathedral",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 17, durationMinutesMax: 17, distanceKm: 1.2 }],
  },
  {
    // Google walk fromPlaceId -> toPlaceId: 12min/850m, flat, via Carrer de Montcada.
    fromPlaceId: "el-born",
    toPlaceId: "palau-musica",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 12, durationMinutesMax: 12, distanceKm: 0.85 }],
  },
  {
    // Google walk fromPlaceId -> toPlaceId (reverse of the above): 11min/850m, flat, via Carrer de Montcada.
    // One minute faster than the other direction -- kept as its own entry rather than reused.
    fromPlaceId: "palau-musica",
    toPlaceId: "el-born",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 11, durationMinutesMax: 11, distanceKm: 0.85 }],
  },
  {
    // Google walk fromPlaceId -> toPlaceId: 13min/850m, flat, via Carrer Comtal.
    fromPlaceId: "mercat-santa-caterina",
    toPlaceId: "placa-catalunya",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 13, durationMinutesMax: 13, distanceKm: 0.85 }],
  },
  {
    // Google walk fromPlaceId -> toPlaceId (reverse of the above): 12min/850m, flat, via Carrer Comtal.
    // One minute faster than the other direction -- kept as its own entry rather than reused.
    fromPlaceId: "placa-catalunya",
    toPlaceId: "mercat-santa-caterina",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 12, durationMinutesMax: 12, distanceKm: 0.85 }],
  },
  {
    // Google walk fromPlaceId -> toPlaceId: 12min/750m via Passeig de Santa Madrona, no elevation
    // flag on the default route (short intra-Montjuic-hill hop between two attractions already
    // on the hill -- distinct from the long flat-city-to-hilltop pairs this project excludes).
    fromPlaceId: "fundacio-joan-miro",
    toPlaceId: "mnac",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 12, durationMinutesMax: 12, distanceKm: 0.75 }],
  },
  {
    // Google walk fromPlaceId -> toPlaceId (reverse of the above): 11min/800m via Passeig de Santa
    // Madrona -- a slightly different default path each direction, but both short, flat, and
    // reasonably stable -- kept as its own entry rather than reused.
    fromPlaceId: "mnac",
    toPlaceId: "fundacio-joan-miro",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 11, durationMinutesMax: 11, distanceKm: 0.8 }],
  },
  {
    // Google walk fromPlaceId -> toPlaceId: 8min/550m via Avinguda Miramar, flat. Round 3B.4
    // special-check cleared: "teleferic-montjuic" has its own exact stored address (Avinguda de
    // Miramar, 30) distinct from the literal "montjuic" placeholder guarded by
    // PERMANENTLY_UNRESOLVED_PLACE_IDS/enforceMontjuicSafetyRule below -- that guard matches only
    // the exact string "montjuic" and does not apply here, so this entry neither bypasses nor
    // weakens it.
    fromPlaceId: "fundacio-joan-miro",
    toPlaceId: "teleferic-montjuic",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 8, durationMinutesMax: 8, distanceKm: 0.55 }],
  },
  {
    // Google walk fromPlaceId -> toPlaceId (reverse of the above): 7min/550m via Avinguda Miramar,
    // flat. One minute faster than the other direction -- kept as its own entry rather than reused.
    fromPlaceId: "teleferic-montjuic",
    toPlaceId: "fundacio-joan-miro",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 7, durationMinutesMax: 7, distanceKm: 0.55 }],
  },

  // ---- Approved Content Patch: 4 explicitly-approved routes only ----------------------------
  // One direction each, as explicitly approved -- no reverse-reuse flag added since only one
  // direction's value was approved for each pair. The reverse direction stays unresolved.
  {
    fromPlaceId: "mercat-santa-caterina",
    toPlaceId: "arc-de-triomf",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 7, durationMinutesMax: 7, distanceKm: 0.495 }],
  },
  {
    // No distance supplied -- distanceKm is optional in TransportOption and is simply omitted
    // here rather than estimated.
    fromPlaceId: "el-born",
    toPlaceId: "barceloneta-beach",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 15, durationMinutesMax: 15 }],
  },
  {
    fromPlaceId: "barceloneta-beach",
    toPlaceId: "museu-picasso",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 14, durationMinutesMax: 14, distanceKm: 1.2 }],
  },
  {
    fromPlaceId: "fundacio-joan-miro",
    toPlaceId: "quimet-y-quimet",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [{ mode: "walking", durationMinutesMin: 12, durationMinutesMax: 12, distanceKm: 0.94 }],
  },

  // ---- Route Patch Batch 2: 3 explicitly-approved routes only --------------------------------
  // One direction each, as explicitly approved -- no reverse-reuse, no reverse entry added.
  // la-rambla <-> fundacio-joan-miro was live-verified in the same batch but deliberately left
  // unresolved: walking has confirmed real elevation/stairs, transit has no single dominant
  // option, and the driving result was traffic-sensitive at verification time -- no clean stable
  // mode to recommend.
  {
    // Google transit: 24min via Metro L4 (Barceloneta -> Rambla del Poblenou), single line, no
    // transfer. Walking (39min/2.8km, flat) and driving (9min/4.2km via B-10) also verified and
    // kept as secondary options; transit recommended since it clearly beats the long walk with a
    // simple one-line ride. No transit distance is stored -- none was shown by the live route.
    fromPlaceId: "museu-historia-catalunya",
    toPlaceId: "rambla-poblenou",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 39, durationMinutesMax: 39, distanceKm: 2.8 },
      { mode: "transit", durationMinutesMin: 24, durationMinutesMax: 24, note: "Metro L4, direct, from Barceloneta." },
      { mode: "car", durationMinutesMin: 9, durationMinutesMax: 9, distanceKm: 4.2 },
    ],
  },
  {
    // Google walk: 26min/1.7km -- route detail view confirms real elevation gain (~75-84m) and
    // explicit "use stairs" instructions on Carrer de Blasco de Garay -- NOT a flat walk, so
    // walking is kept as a real verified option but is NOT the recommended mode. Google transit
    // (26min via Funicular de Montjuïc from Paral·lel) has several comparable-time bus
    // alternatives (23-26min) with no single dominant choice, so also not recommended. Google
    // drive: 11min/2.7km via Passeig de Santa Madrona, the one clean, fast, single-route option --
    // recommended. No reverse-reuse: same uphill/stairs asymmetry rationale as this file's other
    // elevation-flagged pairs (see sant-pau -> park-guell above).
    fromPlaceId: "mercat-sant-antoni",
    toPlaceId: "fundacio-joan-miro",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 26, durationMinutesMax: 26, distanceKm: 1.7, note: "Real elevation gain and stairs along the route -- not flat." },
      { mode: "transit", durationMinutesMin: 26, durationMinutesMax: 26, note: "Funicular de Montjuïc from Paral·lel; several comparable bus alternatives exist." },
      { mode: "car", durationMinutesMin: 11, durationMinutesMax: 11, distanceKm: 2.7 },
    ],
  },
  {
    // Google walk: 18min/1.4km, flat, single clear route via Carrer de Sant Antoni Abat --
    // recommended. Transit (18min, bus V11) and driving (14min/2.4km) also verified and kept as
    // secondary options.
    fromPlaceId: "mercat-sant-antoni",
    toPlaceId: "museu-maritim",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 18, durationMinutesMax: 18, distanceKm: 1.4 },
      { mode: "transit", durationMinutesMin: 18, durationMinutesMax: 18, note: "Bus V11, direct." },
      { mode: "car", durationMinutesMin: 14, durationMinutesMax: 14, distanceKm: 2.4 },
    ],
  },

  // ---- Route Patch Batch 3: 10 explicitly-approved routes only -------------------------------
  // One direction each, as explicitly approved -- no reverse-reuse, no reverse entry added.
  {
    // Google walk: 40min/2.7km -- Details panel confirms real elevation gain (~67m) and explicit
    // "use stairs" instructions climbing to Montjuïc -- not flat, kept as a real option but not
    // recommended. Google transit: 27min via Metro L3 direct from Liceu, every ~5min -- clearly
    // beats the 3 slower alternatives (34/41/42min) -- recommended. Google drive: 22min/4.2km,
    // fastest raw number but flagged with heavier-than-usual traffic at verification time.
    fromPlaceId: "satans-coffee-corner",
    toPlaceId: "mnac",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 40, durationMinutesMax: 40, distanceKm: 2.7, note: "Real elevation gain (~67m) and explicit stairs climbing to Montjuïc -- not flat." },
      { mode: "transit", durationMinutesMin: 27, durationMinutesMax: 27, note: "Metro L3, direct, from Liceu, every ~5 min." },
      { mode: "car", durationMinutesMin: 22, durationMinutesMax: 22, distanceKm: 4.2, note: "Fastest driving option but heavier-than-usual traffic at verification time." },
    ],
  },
  {
    // Google walk: 16min/1.1km, Google explicitly states the route is mostly flat -- short and
    // flat, recommended. Transit (10min, direct L3 from Paral·lel) is faster but the walk is
    // short and pleasant. Driving: 27min/2.8km, much heavier than usual traffic -- clearly worse
    // than both alternatives. Reverse direction (la-rambla -> quimet-y-quimet) was already
    // independently verified/pre-existing; not touched here.
    fromPlaceId: "quimet-y-quimet",
    toPlaceId: "la-rambla",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 16, durationMinutesMax: 16, distanceKm: 1.1 },
      { mode: "transit", durationMinutesMin: 10, durationMinutesMax: 10, note: "Metro L3, direct, from Paral·lel." },
      { mode: "car", durationMinutesMin: 27, durationMinutesMax: 27, distanceKm: 2.8, note: "Much heavier than usual traffic at verification time." },
    ],
  },
  {
    // Google walk: 5min/0.4km, flat -- trivially short, recommended. No separate transit route
    // was offered by Google (too short a distance) -- not fabricated. Driving: 12min/1.3km,
    // heavier than usual traffic and a one-way-street detour -- clearly worse than walking.
    fromPlaceId: "nomad-coffee",
    toPlaceId: "mercat-santa-caterina",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 5, durationMinutesMax: 5, distanceKm: 0.4 },
      { mode: "car", durationMinutesMin: 12, durationMinutesMax: 12, distanceKm: 1.3, note: "Heavier than usual traffic; one-way-street detour." },
    ],
  },
  {
    // Destination resolved via the project's stored El Born coordinate anchor (41.38473,
    // 2.18286, pinned to "Passeig del Born" in barcelona-guide.ts) -- a specific point, not the
    // whole neighborhood -- per explicit approval. Google walk: 2min/0.14km. No separate transit
    // route was offered (too short). Driving: 3min/0.35km -- no material advantage over walking.
    fromPlaceId: "cal-pep",
    toPlaceId: "el-born",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 2, durationMinutesMax: 2, distanceKm: 0.14 },
      { mode: "car", durationMinutesMin: 3, durationMinutesMax: 3, distanceKm: 0.35 },
    ],
  },
  {
    // Google walk: 40min/2.5km -- Details panel confirms real elevation gain (~101m) via Via
    // Augusta/Carrer de Balmes, a steady uphill climb toward Sarria -- no stairs, but not flat --
    // kept as a real option but not recommended. Google transit: 19min via FGC L7 direct from
    // Gracia, every ~8min -- clearly the fastest transit option (next best was 26min) --
    // recommended. Google drive: 15min/3.0km, normal traffic.
    fromPlaceId: "slowmov",
    toPlaceId: "cosmocaixa",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 40, durationMinutesMax: 40, distanceKm: 2.5, note: "Real elevation gain (~101m) via Via Augusta/Carrer de Balmes -- not flat, no stairs." },
      { mode: "transit", durationMinutesMin: 19, durationMinutesMax: 19, note: "FGC L7, direct, from Gracia, every ~8 min." },
      { mode: "car", durationMinutesMin: 15, durationMinutesMax: 15, distanceKm: 3.0 },
    ],
  },
  {
    // Google walk: 21min/1.6km, flat, via Passeig de Gracia -- short, flat, and scenic --
    // recommended despite transit/driving being a few minutes faster. Transit: 15min via Metro
    // L3 direct from Diagonal, every ~5min. Driving: 14min/2.3km, normal traffic.
    fromPlaceId: "placa-vila-gracia",
    toPlaceId: "el-nacional",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 21, durationMinutesMax: 21, distanceKm: 1.6 },
      { mode: "transit", durationMinutesMin: 15, durationMinutesMax: 15, note: "Metro L3, direct, from Diagonal, every ~5 min." },
      { mode: "car", durationMinutesMin: 14, durationMinutesMax: 14, distanceKm: 2.3 },
    ],
  },
  {
    // Google walk: 22min/1.4km -- Details panel confirms real elevation gain (~61m) and explicit
    // "use stairs" instructions climbing to Montjuïc (same Passeig de Santa Madrona staircase
    // section as satans-coffee-corner -> mnac above) -- not flat, kept as a real option but not
    // recommended. Google transit: no single dominant line -- three comparable bus routes
    // (121/X3/55) spanning 18-25min, range preserved rather than inventing one fake number.
    // Google drive: 9min/2.2km, normal traffic, clean and materially faster than every
    // alternative -- recommended.
    fromPlaceId: "federal-cafe",
    toPlaceId: "mnac",
    recommendedMode: "car",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 22, durationMinutesMax: 22, distanceKm: 1.4, note: "Real elevation gain (~61m) and explicit stairs climbing to Montjuïc -- not flat." },
      { mode: "transit", durationMinutesMin: 18, durationMinutesMax: 25, note: "Several comparable bus routes (121, X3, 55) -- no single dominant line." },
      { mode: "car", durationMinutesMin: 9, durationMinutesMax: 9, distanceKm: 2.2 },
    ],
  },
  {
    // Google walk: 4min/0.26km, mostly flat -- trivially short, recommended. No separate transit
    // route was offered (too short) -- not fabricated. Driving: 10min/1.6km, one-way streets
    // force a detour -- much slower than walking.
    fromPlaceId: "museu-picasso",
    toPlaceId: "cal-pep",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 4, durationMinutesMax: 4, distanceKm: 0.26 },
      { mode: "car", durationMinutesMin: 10, durationMinutesMax: 10, distanceKm: 1.6, note: "One-way streets force a detour; much slower than walking." },
    ],
  },
  {
    // Google walk: 10min/0.7km -- Details panel shows two short "use stairs" segments in the
    // Gothic Quarter's historic alleys near the Cathedral (small net elevation change, but real
    // stairs) -- kept as a real option but not recommended. Google transit: 8min via Metro L4
    // direct from Urquinaona, every ~5min -- single dominant, frequent -- recommended. Google
    // drive: 6min/0.7km, but the destination sits deep in the pedestrianized Gothic Quarter core
    // -- not a realistic driving choice for a customer despite Google's nominal time.
    fromPlaceId: "palau-musica",
    toPlaceId: "conesa-entrepans",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 10, durationMinutesMax: 10, distanceKm: 0.7, note: "Two short staircase segments in the Gothic Quarter's historic alleys." },
      { mode: "transit", durationMinutesMin: 8, durationMinutesMax: 8, note: "Metro L4, direct, from Urquinaona, every ~5 min." },
      { mode: "car", durationMinutesMin: 6, durationMinutesMax: 6, distanceKm: 0.7, note: "Destination is in the pedestrianized Gothic Quarter core -- not a realistic driving choice despite Google's nominal time." },
    ],
  },
  {
    // Google walk: 14min/1.1km, flat, via Passeig de Gracia -- recommended. Transit: bus 39,
    // 13min but only every ~15min (infrequent) -- no material advantage over walking. Driving:
    // 12min/2.0km, normal traffic -- no material advantage over walking, plus parking.
    fromPlaceId: "placa-vila-gracia",
    toPlaceId: "la-bodegueta",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 14, durationMinutesMax: 14, distanceKm: 1.1 },
      { mode: "transit", durationMinutesMin: 13, durationMinutesMax: 13, note: "Bus 39, infrequent (~every 15 min); no material advantage over walking." },
      { mode: "car", durationMinutesMin: 12, durationMinutesMax: 12, distanceKm: 2.0 },
    ],
  },

  // ---- Route Patch Batch 4: 7 explicitly-approved routes only --------------------------------
  // One direction each, as explicitly approved -- no reverse-reuse, no reverse entry added.
  {
    // Google walk: 16min/0.9km -- Details panel confirms real elevation gain (~74m) and explicit
    // "use stairs" on Carrer de Margarit, climbing the Montjuic hillside -- not flat, kept as a
    // real option but not recommended. Google transit: 16min via Funicular de Montjuic (FM)
    // direct from Paral·lel, every ~10min -- matches walking's raw time but avoids the climb --
    // recommended. Google drive: 6min/1.8km, normal traffic. Reverse direction
    // (teleferic-montjuic -> quimet-y-quimet) was already independently verified/pre-existing;
    // not touched here.
    fromPlaceId: "quimet-y-quimet",
    toPlaceId: "teleferic-montjuic",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 16, durationMinutesMax: 16, distanceKm: 0.9, note: "Real elevation gain (~74m) and explicit stairs climbing the Montjuic hillside -- not flat." },
      { mode: "transit", durationMinutesMin: 16, durationMinutesMax: 16, note: "Funicular de Montjuic (FM), direct, from Paral·lel, every ~10 min." },
      { mode: "car", durationMinutesMin: 6, durationMinutesMax: 6, distanceKm: 1.8 },
    ],
  },
  {
    // Google walk: 12min/0.85km, flat -- recommended. Google transit: 13min via bus D20/H14 --
    // no material advantage over walking. Google drive: 8min/1.0km, but the destination sits on a
    // narrow old-town Gothic Quarter street -- not a realistic driving choice for a customer
    // despite Google's nominal time.
    fromPlaceId: "museu-maritim",
    toPlaceId: "agut",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 12, durationMinutesMax: 12, distanceKm: 0.85 },
      { mode: "transit", durationMinutesMin: 13, durationMinutesMax: 13, note: "Bus D20/H14; no material advantage over walking." },
      { mode: "car", durationMinutesMin: 8, durationMinutesMax: 8, distanceKm: 1.0, note: "Destination is on a narrow old-town Gothic Quarter street -- not a realistic driving choice." },
    ],
  },
  {
    // Google walk: 6min/0.4km, mostly flat -- trivially short, recommended. No separate transit
    // route was offered (too short) -- not fabricated. The observed driving result (26min/4.8km)
    // was distorted by a temporary La Rambla road closure at verification time and is
    // deliberately NOT stored -- not a stable baseline.
    fromPlaceId: "agut",
    toPlaceId: "cook-and-taste-paella-class",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 6, durationMinutesMax: 6, distanceKm: 0.4 },
    ],
  },
  {
    // Google walk: 7min/0.5km, flat -- recommended. Google drive: 6min/0.6km -- no material
    // advantage over walking. No separate transit route was offered (too short).
    fromPlaceId: "cafes-el-magnifico",
    toPlaceId: "mercat-santa-caterina",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 7, durationMinutesMax: 7, distanceKm: 0.5 },
      { mode: "car", durationMinutesMin: 6, durationMinutesMax: 6, distanceKm: 0.6 },
    ],
  },
  {
    // Google walk: 14min/1.0km, flat -- recommended. Google transit: 20min via bus 120 -- worse
    // than walking. Google drive: 20min/1.8km, traffic-dependent, and Kiosko Universal sits
    // inside the pedestrianized Mercat de la Boqueria -- not a realistic driving choice.
    fromPlaceId: "santa-maria-del-mar",
    toPlaceId: "kiosko-universal",
    recommendedMode: "walking",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 14, durationMinutesMax: 14, distanceKm: 1.0 },
      { mode: "transit", durationMinutesMin: 20, durationMinutesMax: 20, note: "Bus 120; slower than walking." },
      { mode: "car", durationMinutesMin: 20, durationMinutesMax: 20, distanceKm: 1.8, note: "Traffic-dependent; destination is inside the pedestrianized Mercat de la Boqueria." },
    ],
  },
  {
    // Google walk: 35min/2.5km -- Details panel confirms real elevation gain (~59m) and an
    // explicit "use stairs" segment crossing the Montjuic hill park between these two opposite
    // sides -- not flat, kept as a real option but not recommended. Google transit: bus 150,
    // direct, single dominant line at ~19-20min (several visible departures), clearly ahead of
    // the 33-34min bus-combo alternatives -- recommended. Google drive: 12min/4.4km, normal
    // traffic, fastest raw number but not recommended per the steep/stairs+clean-transit
    // heuristic (same reasoning as slowmov -> cosmocaixa in Batch 3).
    fromPlaceId: "poble-espanyol",
    toPlaceId: "miramar-barcelona",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 35, durationMinutesMax: 35, distanceKm: 2.5, note: "Real elevation gain (~59m) and an explicit stairs segment crossing the Montjuic hill park -- not flat." },
      { mode: "transit", durationMinutesMin: 19, durationMinutesMax: 20, note: "Bus 150, direct, single dominant line with several visible departures." },
      { mode: "car", durationMinutesMin: 12, durationMinutesMax: 12, distanceKm: 4.4 },
    ],
  },
  {
    // Google walk: 32min/2.0km -- Details panel confirms real elevation gain (~81m) and two
    // explicit "use stairs" segments climbing to Fundacio Joan Miro -- not flat, kept as a real
    // option but not recommended. Google transit: 25min via Funicular de Montjuic (FM) direct
    // from Paral·lel, every ~10min -- the clear best transit option (next-best alternative was
    // 29min) -- recommended. The observed driving result (19min/3.5km) was flagged by Google with
    // an active road closure at verification time and is deliberately NOT stored -- not a stable
    // baseline.
    fromPlaceId: "canete",
    toPlaceId: "fundacio-joan-miro",
    recommendedMode: "transit",
    sourceStatus: "verified",
    options: [
      { mode: "walking", durationMinutesMin: 32, durationMinutesMax: 32, distanceKm: 2.0, note: "Real elevation gain (~81m) and two explicit stairs segments climbing to Fundacio Joan Miro -- not flat." },
      { mode: "transit", durationMinutesMin: 25, durationMinutesMax: 25, note: "Funicular de Montjuic (FM), direct, from Paral·lel, every ~10 min." },
    ],
  },
];



// PERMANENTLY guarded: the old vague "montjuic" placeId is forced unresolved no matter what,
// even if a future edit ever adds a table entry for it by mistake — it must never surface
// route-leg values from the Smart Planner (the Ready Plan's own "montjuic" usage is separate
// and untouched by this guard). "mnac" is intentionally NOT in this blanket set anymore: its
// 3 verified pairs above now resolve normally through the standard table lookup, and any
// OTHER "mnac" pair not in the table already falls through to the generic builder's own
// unresolved default — so unverified MNAC routes can never be mistaken for verified ones
// without needing a second special-case here. This is "verified-pair-first, unresolved
// fallback", not a blanket allow.
const PERMANENTLY_UNRESOLVED_PLACE_IDS = new Set(["montjuic"]);

/** Forces any leg touching a permanently-guarded place to unresolved, regardless of table contents — see the safety rule above. */
function enforceMontjuicSafetyRule(legs: PlannerRouteLeg[]): PlannerRouteLeg[] {
  return legs.map((leg) =>
    PERMANENTLY_UNRESOLVED_PLACE_IDS.has(leg.fromPlaceId) || PERMANENTLY_UNRESOLVED_PLACE_IDS.has(leg.toPlaceId)
      ? { fromPlaceId: leg.fromPlaceId, toPlaceId: leg.toPlaceId, recommendedMode: null, options: [], sourceStatus: "unresolved" as const }
      : leg
  );
}

export function buildBarcelonaPlannerRouteLegs(optimizedDay: PlannerDay): PlannerRouteLeg[] {
  return enforceMontjuicSafetyRule(buildPlannerRouteLegs(optimizedDay, BARCELONA_ROUTE_LEG_DATA));
}

export function buildBarcelonaPlannerPlanRouteLegs(optimizedPlan: GeneratedPlannerPlan): PlannerRouteLeg[][] {
  return buildPlannerPlanRouteLegs(optimizedPlan, BARCELONA_ROUTE_LEG_DATA).map(enforceMontjuicSafetyRule);
}

// Built once at module load, reused by every getBarcelonaVerifiedTravelMinutes call below --
// this table only has ~200 entries, but the Day Builder/Route Optimizer can call this function
// many times per generation (once per candidate pair considered), so the pair index is worth
// precomputing rather than rebuilding per call the way buildPlannerRouteLegs does per-day.
const BARCELONA_ROUTE_LEG_BY_PAIR = new Map<string, RouteLegDataEntry>(
  BARCELONA_ROUTE_LEG_DATA.map((entry) => [`${entry.fromPlaceId}::${entry.toPlaceId}`, entry])
);

/**
 * Route-First Planning Upgrade: real, verified/existing-project-data travel minutes between
 * two placeIds (directional), or null when no trustworthy data exists for that exact
 * direction/pair -- NEVER a guessed, straight-line, or cluster-derived number. Reuses the
 * EXACT SAME resolution rules as the customer-facing route legs (`resolveLeg`: exact match,
 * then opt-in reverse-walking-reuse, then unresolved) and the same permanent Montjuïc guard --
 * so a number this function returns to the Day Builder/Route Optimizer is always a number the
 * customer could also see rendered on the actual connector for that pair. Used only as an
 * optional selection tie-break and ordering-cost input; never influences which places exist in
 * the candidate pool or their scores.
 */
export function getBarcelonaVerifiedTravelMinutes(fromPlaceId: string, toPlaceId: string): number | null {
  if (PERMANENTLY_UNRESOLVED_PLACE_IDS.has(fromPlaceId) || PERMANENTLY_UNRESOLVED_PLACE_IDS.has(toPlaceId)) return null;

  const leg = resolveLeg(fromPlaceId, toPlaceId, BARCELONA_ROUTE_LEG_BY_PAIR);
  if (leg.sourceStatus === "unresolved" || !leg.recommendedMode) return null;

  const option = leg.options.find((candidate) => candidate.mode === leg.recommendedMode) ?? leg.options[0];
  if (!option) return null;

  return Math.round((option.durationMinutesMin + option.durationMinutesMax) / 2);
}

/**
 * Fix Meal-Adjacent Transport Connectors: the same resolution rules and permanent Montjuïc
 * guard as `getBarcelonaVerifiedTravelMinutes` above, but returns the full customer-facing
 * `PlannerRouteLeg` (walking/transit/car options + recommended mode) instead of a single
 * tie-break number. `buildBarcelonaPlanner(Plan)RouteLegs` above already resolves every
 * consecutive MAIN-STOP pair this way; this is the same lookup exposed for pairs that fall
 * outside that per-day consecutive-stop array -- specifically, a connector where one or both
 * sides is a meal stop (see barcelonaV2Resolve.ts's `buildMealAdjacentLegs`, the only caller).
 * Never a second data table, never a different resolution rule -- a pair resolved here is
 * exactly as real/verified as a pair resolved for an attraction-to-attraction leg.
 */
export function getBarcelonaRouteLeg(fromPlaceId: string, toPlaceId: string): PlannerRouteLeg {
  if (PERMANENTLY_UNRESOLVED_PLACE_IDS.has(fromPlaceId) || PERMANENTLY_UNRESOLVED_PLACE_IDS.has(toPlaceId)) {
    return { fromPlaceId, toPlaceId, recommendedMode: null, options: [], sourceStatus: "unresolved" };
  }
  return resolveLeg(fromPlaceId, toPlaceId, BARCELONA_ROUTE_LEG_BY_PAIR);
}
