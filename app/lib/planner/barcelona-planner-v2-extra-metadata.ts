import type { PlannerPlaceMetadata } from "./plannerTypes";

/**
 * Smart Planner V2 Phase 4 -- the V2-only expansion to the planner candidate pool. V1
 * continues using ONLY the original 29 entries in barcelona-planner-metadata.ts, completely
 * unmodified -- this file is additive, never merged into or read by that file, and never
 * touched by generateBarcelonaSmartPlan.ts (V1's adapter). See barcelonaV2Metadata.ts for the
 * composition (legacy 29 + these 7 = 36), used only by the V2 Server Action.
 *
 * Long-Trip Content Expansion (Phase 5): added 2 more entries (teleferic-montjuic,
 * gothic-quarter-tapas-wine-tour) after a full audit of every Barcelona Guide place NOT
 * already a planner candidate. Every OTHER Guide-only place considered was rejected with a
 * specific, evidence-based reason -- see that task's own report for the full rejected-
 * candidate list (Guide Areas duplicate their own already-pooled attractions; PhotoSpots
 * duplicate existing attractions outright; shopping malls/outlet villages compete with the
 * existing supplementary-suggestion mechanism or sit outside any Barcelona cluster; the
 * Montserrat/PortAventura day trips and a live-match-ticket experience don't fit this
 * architecture's per-day cluster/time-budget model or have no reliable per-day availability
 * signal; a casino reads as nightlife, not a main sightseeing stop; jetski/paddleboard rentals
 * were skipped to avoid stacking a third near-duplicate on-water-activity candidate next to
 * the already-approved sunset-catamaran-sail).
 *
 * NOTE ON THE "29" COUNT: earlier phases' reports (and this file's own first draft) referred
 * to the legacy pool as "~30 entries" -- a miscount from an early audit agent's own tally that
 * was never independently re-verified against the actual array length until this phase, when
 * a short-trip regression test caught it. The real, and always-was-real, count is 29. This
 * doesn't change any prior phase's functional correctness (V1 behavior is whatever the real
 * 29-entry array has always produced) -- it's a documentation correction only, made here for
 * honesty rather than silently carrying the wrong number forward.
 *
 * Every entry below is a REAL, verified Barcelona Guide placeId (barcelona-guide.ts) that
 * passed a full audit for main-visit-stop suitability -- no restaurant/nightlife venue is
 * promoted here (that stays supplementary, see barcelonaV2Supplementary.ts), no external/
 * unverified place, no invented duration (each visitDurationMinutes is a conservative value
 * within the Guide's own stated duration range), no invented hours (hours are resolved live
 * from the Guide at generation/render time via the existing resolvers, never duplicated here).
 *
 * PRIORITY/WEIGHT CALIBRATION -- REVISED after a caught short-trip regression: an initial,
 * less conservative pass (priority 4-7, popular weight up to 6) let "sunset-catamaran-sail"
 * (a Tier C experience) displace "ciutadella" (an existing Tier B icon) in a 3-day
 * popular-only trip -- a real violation of "new Tier C candidates must not crowd out
 * established content in short trips". Fixed by lowering priority to 1-4 (well below every
 * Tier A/B icon) AND lowering `popular` weights specifically (1-4, since that's the interest
 * most likely to be selected alone and most exposed to this risk) -- verified by re-running
 * the short-trip regression until 1/2/3-day output for a representative case became byte-for-
 * byte identical to the original 29-entry pool's own output (see the Phase 4 task report's own
 * regression proof). None of these 5 receive a coverage-goal boost or tier-coverage guarantee
 * (BARCELONA_COVERAGE_GOALS/BARCELONA_REQUIRED_COVERAGE_GOALS/BARCELONA_TIER_COVERAGE_GOALS
 * are untouched and reference none of these ids) -- they can ONLY ever be pulled in via normal
 * greedy fill once the day-builder has already run out of stronger candidates, which in
 * practice means longer trips only.
 *
 * All 5 map onto EXISTING cluster ids (old-city, montjuic, seafront) -- none invents a new
 * cluster, so BARCELONA_CLUSTER_COMPATIBILITY / BARCELONA_SIMILARITY_GROUPS / the iconic-tier
 * and coverage-goal constants are all reused completely unchanged for V2 (see
 * barcelonaV2DestinationConfig.ts) -- no new DayBuilderConfig variant was needed.
 *
 * ── FLAGGED RISK: "montjuic" placeId reuse ─────────────────────────────────────────────
 * `barcelona-planner-route-legs.ts` and `barcelona-planner-presentation.ts` both permanently
 * guard the placeId "montjuic" (`PERMANENTLY_UNRESOLVED_PLACE_IDS` / `PRESENTATION_EXCLUDED_
 * PLACE_IDS`) -- a historical planner-metadata id for this exact hill that was deliberately
 * retired in favor of the more precise "mnac" id, per that guard's own comment ("even if a
 * future edit ever adds a table entry for it by mistake"). The REAL Barcelona Guide attraction
 * (barcelona-guide.ts) still uses `id: "montjuic"` for the genuine castle/gardens/hill visit
 * (distinct from `mnac`, which is specifically the museum) -- this file intentionally reuses
 * that real Guide id. Functionally this is safe (no crash, no invented data): every route leg
 * touching "montjuic" will always resolve as unresolved regardless of future verified data
 * (a real limitation, not a new one -- no verified leg data exists for this pairing anyway),
 * and it will never appear as an optionalNearby suggestion (irrelevant here, since this is a
 * MAIN stop candidate, not competing for that separate mechanism). Flagged explicitly per the
 * task's own "report any risk/ambiguity" instruction rather than silently reusing a guarded id.
 *
 * Content Expansion task's own audit of this guard (see barcelona-planner-route-legs.ts's
 * `PERMANENTLY_UNRESOLVED_PLACE_IDS`) concluded the guard itself should stay exactly as-is:
 * removing "montjuic" from this pool would lose a real, substantial, mustSee:true 180-minute
 * stop for zero route-integrity gain (the guard exists because the id was historically
 * ambiguous with "mnac", not because the place itself lacks content value). Recommendation:
 * KEEP "montjuic" (accept its permanently-unresolved routing, exactly as the honest map-link
 * fallback UI already handles) and ADD "teleferic-montjuic" (a different, real, unguarded
 * Guide id -- the cable-car ride itself, not the hill/castle visit) as a complementary, not a
 * replacement, candidate -- see its own entry below. The two are genuinely distinct
 * experiences at very different durations (180min substantial visit vs. a ~20min ride), the
 * same way this pool already allows several distinct same-cluster stops elsewhere (e.g.
 * eixample-north already holds 3 -- sagrada-familia, sant-pau, mercat-sagrada-familia), so
 * this is not a duplicate-in-spirit under the same rule that rejected the Guide's own
 * Area/PhotoSpot entries (those literally re-describe the SAME physical spot as an existing
 * pooled Attraction; this does not).
 */
export const BARCELONA_V2_EXTRA_PLANNER_METADATA: PlannerPlaceMetadata[] = [
  {
    // Real 1882 cast-iron market building, Sunday book market -- distinct authentic-market
    // experience from Boqueria (already in the pool). Guide duration: "30–45 دقيقة"; using the
    // upper bound (45) since a market visit benefits from unhurried browsing time.
    placeId: "mercat-sant-antoni",
    weights: { popular: 2, cultureLocal: 5, viewsNature: 0, beachRelax: 0, footballExperiences: 0, foodShoppingNightlife: 6 },
    priority: 2,
    preferredTime: "morning",
    cluster: "old-city",
    visitDurationMinutes: 45,
  },
  {
    // mustSee:true in the Guide; the hill itself (castle, gardens, musical fountain) --
    // distinct from mnac (the museum), same cluster. Guide duration: "3–4 ساعات"; using the
    // conservative lower bound (180 = 3h) rather than the full range. See file header for the
    // flagged "montjuic" placeId / permanent-unresolved-guard interaction. Kept the highest
    // priority of the 5 new entries (still below every Tier A/B icon) given its mustSee status
    // and substantial, genuinely distinct content from mnac.
    placeId: "montjuic",
    weights: { popular: 4, cultureLocal: 2, viewsNature: 7, beachRelax: 0, footballExperiences: 0, foodShoppingNightlife: 0 },
    priority: 4,
    preferredTime: "afternoon",
    cluster: "montjuic",
    visitDurationMinutes: 180,
  },
  {
    // Real bookable 2-2.5hr sunset catamaran sail with BCN skyline views, departs Port Olímpic
    // -- geographically the Poblenou/Port Olímpic waterfront, not Barceloneta itself, so this
    // uses "seafront-east" (the existing cluster already used for Bogatell/Nova Icaria, the
    // real Port Olímpic-area beaches -- see barcelona-planner-metadata.ts), not "seafront"
    // (Barceloneta). This is also a real regression fix, not just a geography nicety: an
    // earlier draft used cluster="seafront", which gave this candidate an EXACT cluster match
    // against barceloneta-beach in short trips -- and the day builder's fill loop ranks exact-
    // cluster matches ahead of cross-cluster "strong"-compatible matches (e.g. ciutadella's
    // born<->seafront link) REGARDLESS of priority/score. That let this candidate (priority 1,
    // the lowest of the 5) silently displace ciutadella (an existing Tier B icon, score ~12) in
    // a 3-day trip -- confirmed by instrumenting the day builder's post-greedy-fill state
    // directly. "seafront-east" carries the same "strong" compatibility tier with "seafront" as
    // "born" does (see BARCELONA_CLUSTER_COMPATIBILITY), so this candidate now competes with
    // ciutadella on equal geographic footing, and priority/score correctly decides the winner.
    // Duration is the tour's own fixed length (2.5h), not an estimate.
    placeId: "sunset-catamaran-sail",
    weights: { popular: 1, cultureLocal: 0, viewsNature: 6, beachRelax: 2, footballExperiences: 0, foodShoppingNightlife: 0 },
    priority: 1,
    preferredTime: "sunset",
    cluster: "seafront-east",
    visitDurationMinutes: 150,
  },
  {
    // Real, long-running (since 1970), highly-rated flamenco venue on La Rambla -- a ticketed
    // cultural performance, never treated as a dining/nightlife venue (foodShoppingNightlife
    // weight kept minimal). Guide duration: "~1 hour" (the show itself).
    placeId: "tablao-cordobes-flamenco",
    weights: { popular: 1, cultureLocal: 5, viewsNature: 0, beachRelax: 0, footballExperiences: 0, foodShoppingNightlife: 1 },
    priority: 1,
    preferredTime: "evening",
    cluster: "old-city",
    visitDurationMinutes: 60,
  },
  {
    // Real guided 3-4hr small-group bike tour covering multiple Gaudí landmarks, starts
    // Plaça Reial. cultureLocal kept well below 9 so this deliberately does NOT qualify for
    // the long-experience reservation preference (plannerDayBuilder.ts's
    // LONG_EXPERIENCE_MIN_WEIGHT=9) -- a Tier C candidate should compete on normal greedy-fill
    // priority only, never preempt ahead of Tier A/B icons via that mechanism. Guide duration:
    // "3–4 ساعات"; using the midpoint (210 = 3.5h).
    placeId: "gaudi-bike-tour",
    weights: { popular: 2, cultureLocal: 4, viewsNature: 1, beachRelax: 0, footballExperiences: 0, foodShoppingNightlife: 0 },
    priority: 2,
    preferredTime: "morning",
    cluster: "old-city",
    visitDurationMinutes: 210,
  },
  {
    // Long-Trip Content Expansion: real, unguarded Guide id (barcelona-guide.ts's
    // "experiences" array) -- the Montjuïc cable car itself, complementary to (not a
    // duplicate of) the "montjuic" hill/castle stop above -- see this file's header for the
    // full reasoning. Guide duration: "10 دقائق (اتجاه واحد)" (10min one-way); the ticket
    // price itself is explicitly round-trip ("€15 ذهاب وعودة"), so 20min (2x the stated
    // one-way ride) is the responsible, source-traceable figure -- deliberately NOT padded
    // with any assumed dwell/viewpoint time beyond the ride itself, since that isn't
    // separately quantified in the Guide. Kept priority at the lowest tier (1) given its very
    // short duration relative to every other candidate.
    placeId: "teleferic-montjuic",
    weights: { popular: 2, cultureLocal: 1, viewsNature: 6, beachRelax: 0, footballExperiences: 0, foodShoppingNightlife: 0 },
    priority: 1,
    preferredTime: "daytime/sunset",
    cluster: "montjuic",
    visitDurationMinutes: 20,
  },
  {
    // Long-Trip Content Expansion: real Guide "experiences" entry -- a guided evening
    // tapas/wine walking tour through the Gothic Quarter, distinct from cook-and-taste's
    // cooking CLASS and from simply visiting gothic-quarter itself (this is a ticketed,
    // booking-required tasting tour with a local guide, not a sightseeing walk). Guide
    // duration: "حوالي 3 ساعات" (about 3 hours) -- used directly, no rounding/estimation
    // needed. foodShoppingNightlife kept as the dominant weight (it's fundamentally a
    // food/wine tour); cultureLocal reflects the guide's stated city-history narration.
    // Kept well under LONG_EXPERIENCE_MIN_WEIGHT (9) on every axis despite the 180min
    // duration, so it never qualifies for the long-experience reservation preference --
    // same deliberate calibration as gaudi-bike-tour above.
    placeId: "gothic-quarter-tapas-wine-tour",
    weights: { popular: 1, cultureLocal: 3, viewsNature: 0, beachRelax: 0, footballExperiences: 0, foodShoppingNightlife: 6 },
    priority: 1,
    preferredTime: "evening",
    cluster: "old-city",
    visitDurationMinutes: 180,
  },

  // ---- Barcelona Candidate Pool Expansion (36 -> 44), implemented after live-web research ----
  // (see the task's own research report for full source citations). Every place below is a real
  // Guide attraction (app/lib/barcelona-guide.ts) promoted here with a fresh interest-weight
  // mapping onto the SAME legacy 6-key model every other candidate already uses -- no new scoring
  // axis, no new architecture. Visit durations are explicit PLANNER ESTIMATES (documented as such
  // in the Guide entry's own "duration" string too) -- no official duration figure exists for any
  // of these 8 places; only real, source-verified hours/address/closed-day facts are treated as
  // verified data. Deliberately excluded from BARCELONA_ICONIC_TIER_A/B and the Must-See policy
  // (barcelonaMustSeePolicy.ts) -- they compete purely on ordinary weights/priority, exactly like
  // most of the original 36.
  {
    // Real museum, Monday-closed (verified museupicassobcn.cat). Dominant cultureLocal (major
    // single-artist collection); moderate popular (world-famous name, but a narrower draw than
    // Sagrada Família/Park Güell-tier icons). cluster="born" places it alongside the existing
    // Born anchors (Ciutadella/Palau Música/Santa Maria del Mar) plus the new Santa Caterina
    // market -- see this task's own note on monitoring Born-cluster density.
    placeId: "museu-picasso",
    weights: { popular: 8, cultureLocal: 10, viewsNature: 1, beachRelax: 0, footballExperiences: 0, foodShoppingNightlife: 1 },
    priority: 8,
    preferredTime: "daytime",
    cluster: "born",
    visitDurationMinutes: 105,
  },
  {
    // Real museum, Monday-closed (verified fmirobcn.org). viewsNature reflects the rooftop
    // sculpture terrace's real Montjuïc panoramic view (a genuine, verifiable feature of the
    // building itself, not invented) -- otherwise dominant cultureLocal, matching the task's own
    // "culture, some views/nature affinity" mapping instruction.
    placeId: "fundacio-joan-miro",
    weights: { popular: 7, cultureLocal: 9, viewsNature: 6, beachRelax: 0, footballExperiences: 0, foodShoppingNightlife: 0 },
    priority: 8,
    preferredTime: "daytime",
    cluster: "montjuic",
    visitDurationMinutes: 120,
  },
  {
    // Real open-air architecture village, no weekly closed day (verified poble-espanyol.com).
    // Small foodShoppingNightlife weight reflects the real on-site craft workshops/food stalls,
    // never the dominant axis. Long visitDurationMinutes (150) makes it a genuine long-trip
    // anchor for thinner Montjuïc days, per this task's own "long-duration anchors" goal.
    placeId: "poble-espanyol",
    weights: { popular: 7, cultureLocal: 6, viewsNature: 1, beachRelax: 0, footballExperiences: 0, foodShoppingNightlife: 2 },
    priority: 6,
    preferredTime: "daytime/evening",
    cluster: "montjuic",
    visitDurationMinutes: 150,
  },
  {
    // Real interactive science museum, open every day of the week, no weekly closure (verified
    // cosmocaixa.org) -- unusually flexible for date-safety among museums in this pool.
    // footballExperiences carries the "general interactive/family experience" signal here, the
    // same broader-than-football usage this axis already has for tibidabo (8) and mnac (7) in
    // the existing 36 -- not a new interpretation of the model.
    placeId: "cosmocaixa",
    weights: { popular: 6, cultureLocal: 3, viewsNature: 2, beachRelax: 0, footballExperiences: 7, foodShoppingNightlife: 0 },
    priority: 6,
    preferredTime: "daytime",
    cluster: "tibidabo",
    visitDurationMinutes: 150,
  },
  {
    // Real maritime museum in the medieval Drassanes Reials (royal shipyards) building, open
    // every day of the week per the official source (mmb.cat) -- see that Guide entry's own
    // comment on the minor cross-source uncertainty about the exact closing hour (the
    // no-weekly-closure fact itself is solid). cluster="old-city" reflects its real location at
    // the bottom of La Rambla/edge of the Gothic Quarter.
    placeId: "museu-maritim",
    weights: { popular: 5, cultureLocal: 9, viewsNature: 2, beachRelax: 0, footballExperiences: 0, foodShoppingNightlife: 0 },
    priority: 6,
    preferredTime: "daytime",
    cluster: "old-city",
    visitDurationMinutes: 105,
  },
  {
    // Real local market (distinct from Boqueria -- authentically local, not the touristy
    // flagship), closed Sunday (verified mercatdesantacaterina.com). Short, deliberately modest
    // visitDurationMinutes/priority -- a genuine but minor stop, same tier logic already applied
    // to mercat-sant-antoni/mercat-sagrada-familia in the original 36.
    placeId: "mercat-santa-caterina",
    weights: { popular: 4, cultureLocal: 7, viewsNature: 0, beachRelax: 0, footballExperiences: 0, foodShoppingNightlife: 7 },
    priority: 4,
    preferredTime: "morning",
    cluster: "born",
    visitDurationMinutes: 40,
  },
  {
    // AREA EXPERIENCE, not a ticketed POI -- see barcelona-guide.ts's own "placa-vila-gracia"
    // entry comment for the full honesty rationale (always-open hours, no fabricated business
    // schedule, duration is an explicit planner estimate for a self-guided walk). cluster
    // "gracia-north" reinforces the existing Park Güell/Bunkers del Carmel pairing with a genuine
    // walkable-neighborhood anchor, filling a real gap the original 36 never had.
    placeId: "placa-vila-gracia",
    weights: { popular: 3, cultureLocal: 7, viewsNature: 1, beachRelax: 0, footballExperiences: 0, foodShoppingNightlife: 2 },
    priority: 4,
    preferredTime: "daytime/evening",
    cluster: "gracia-north",
    visitDurationMinutes: 90,
  },
  {
    // AREA EXPERIENCE, same honest modeling as placa-vila-gracia. "modern/relaxed affinity"
    // (this task's own wording) is expressed using ONLY existing weight axes -- no new "modern"
    // category was invented -- via a real beachRelax value (the promenade's genuine relaxed,
    // waterfront-adjacent character, pairing naturally with the existing Bogatell/Nova Icària
    // beaches in the same seafront-east cluster) alongside a moderate cultureLocal (authentic
    // local/post-industrial neighborhood feel, distinct from Gothic Quarter's medieval character).
    placeId: "rambla-poblenou",
    weights: { popular: 3, cultureLocal: 5, viewsNature: 2, beachRelax: 3, footballExperiences: 0, foodShoppingNightlife: 3 },
    priority: 3,
    preferredTime: "daytime/evening",
    cluster: "seafront-east",
    visitDurationMinutes: 60,
  },

  // ---- Round 2 Fix: Shopping Personalization -- El Born promotion --------------------------
  // Promotes the Guide's OWN existing "el-born" shoppingArea entry (barcelona-guide.ts's
  // shoppingAreas array -- real name, description, address, mapsUrl already there, no new data
  // invented) into a real main-stop candidate, exactly mirroring how passeig-de-gracia and
  // portal-angel were promoted before it: same Guide category (shoppingAreas, not attractions),
  // same "AREA EXPERIENCE" honesty model as placa-vila-gracia/rambla-poblenou above (no
  // fabricated hours -- a whole neighborhood has no single opening time, per that Guide entry's
  // own comment). foodShoppingNightlife=7 reflects its real, Guide-described identity ("حي أنيق
  // فيه محلات مستقلة وماركات محلية صغيرة" -- an elegant neighborhood of independent boutiques and
  // small local brands) -- genuinely shopping-dominant, placed below Passeig de Gràcia/Portal de
  // l'Àngel's 9 (a boutique neighborhood, not a major shopping boulevard) but above the "mixed"
  // tier (see barcelonaV2PersonalizationScoring.ts's curated STRONG/MIXED sets). cluster "born"
  // matches its real location (Passeig del Born) and joins the existing born-cluster candidates
  // (santa-maria-del-mar, arc-de-triomf, ciutadella, palau-musica, museu-picasso,
  // mercat-santa-caterina) -- see that file's own report on born-cluster density.
  {
    placeId: "el-born",
    weights: { popular: 3, cultureLocal: 5, viewsNature: 0, beachRelax: 0, footballExperiences: 0, foodShoppingNightlife: 7 },
    priority: 4,
    preferredTime: "daytime/evening",
    cluster: "born",
    visitDurationMinutes: 60,
  },
];
