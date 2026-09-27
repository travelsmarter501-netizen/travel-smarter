import type { ReadyPlan } from "./readyPlanTypes";

/**
 * Barcelona — 1-Day Ready Plan.
 *
 * A separate, standalone product from the 5-day Ready Plan (app/lib/barcelona-ready-plan.ts) —
 * for travelers who only have one day in the city. Only references existing place ids from
 * barcelona-guide.ts. No place data (name/image/address/hours/price/rating/links) is
 * duplicated here — see app/lib/readyPlan.ts for how each `placeId` is resolved against the
 * real guide data at render time.
 *
 * ── Route distance/duration policy ──────────────────────────────────────────────────
 * Route distances and durations below are manually curated approximate values, NOT generated
 * from live routing APIs. Every leg marked "Verified 2026-08" was manually checked against
 * real Google Maps and Apple Maps directions results. The UI must always keep the existing
 * user-facing "estimates only" disclaimer next to these values.
 *
 * ── Stop selection & pacing (2026-08) ────────────────────────────────────────────────
 * Starting proposal was audited against real geography, opening-time practicality, and
 * visitor fatigue: sagrada-familia -> casa-batllo -> gothic-quarter -> la-rambla -> boqueria
 * -> barceloneta-beach. All 6 stops were kept (not trimmed to 5) — the route follows a clean
 * north-to-south sweep from Sagrada Família through the Eixample and Old City down to the sea,
 * with no backtracking, and total estimated time (visit + transport, midpoint estimates) is
 * ~7.4h, comfortably inside the 7-9h practical target and under any unrealistic-day threshold.
 * Durations are deliberately tightened from the 5-day Ready Plan more leisurely ranges for
 * a few stops (Gothic Quarter, La Rambla, Boqueria) to fit a single-day pace — each such stop
 * carries an honest note about the condensed pacing rather than silently shrinking. Sagrada
 * Família itself keeps its full established visit-time range (90-120 min): it is the single
 * major landmark of the day and must not be understated even under a tight schedule.
 *
 * Per the project architecture, this file route-leg data is independently verified and
 * NOT copied from either the Smart Planner dataset or the 5-day Ready Plan dataset, even
 * for an identical directional pair — e.g. la-rambla -> boqueria reuses the already-verified
 * value from barcelona-ready-plan.ts Day 3 only because it is the exact same directional
 * pair with no reason to differ, not as a blanket policy. The 4 genuinely new pairs
 * (sagrada-familia -> casa-batllo, casa-batllo -> gothic-quarter, gothic-quarter -> la-rambla,
 * boqueria -> barceloneta-beach) were freshly verified against live Google Maps and Apple Maps
 * directions (2026-08). The casa-batllo -> gothic-quarter driving option is omitted: Google
 * flagged its fastest route as "restricted use / includes private roads" through the
 * pedestrianized Gothic Quarter core, matching this project established convention for
 * old-town legs. No leg in this file is left as an unresolved placeholder.
 *
 * ── Targeted Fixes (2026-08, post-launch audit) ───────────────────────────────────────
 * Three narrow fixes from a completed audit -- stop order, all 5 transport legs, and every
 * other duration/note were deliberately left untouched. (1) Sagrada Familia duration cut
 * from 90-120 to 30-45 min: this product defaults to an EXTERIOR visit, so a full-interior
 * duration overstated the default customer experience; a note now says entry is optional
 * and to add ~90 min if booking inside. (2) Boqueria note now warns about its real Sunday
 * closure (see its own hours data -- sunday: []) and points at a verified, geographically
 * exact Sunday alternative: cafe-de-lopera (added to optionalNearby), a real Guide entry
 * literally on La Rambla (same address as the La Rambla stop, zero detour) open every day
 * including Sunday 08:30-02:30 -- chosen over the other Sunday-open Gothic Quarter
 * restaurants found (can-culleretes, els-quatre-gats, agut) because their Sunday windows
 * are narrow lunch-only slots (12:00-17:00 or 13:00-15:45) while this cafe's hours
 * comfortably cover whenever the itinerary actually reaches that point in the day; also
 * notes Kiosko Universal (inside Boqueria) is unavailable the same day. Same note also
 * carries the 45-60 min food-break allowance this fix set requires, anchored at Boqueria
 * per instruction, without adding a new main stop. (3) Barceloneta duration changed from
 * 60-90 to the requested flexible "90+"; its note no longer promises "sunset" unconditionally
 * (sunset time is seasonal) and instead frames it as a flexible, weather/timing-dependent
 * close to the day.
 *
 * ── Pricing (2026-08) ──────────────────────────────────────────────────────────────
 * `priceILS: 19` is this product real customer-facing price, set independently from the
 * 5-day Ready Package (39ILS), the Guide (29ILS), and the Smart Planner (59ILS) -- none of
 * which this file touches. `app/lib/content.ts` `Destination` type still has only one
 * `packagePrice`/`packageDays` pair per destination (the 5-day product) -- this 1-day
 * product price is not wired into that shared model and is not shown on the homepage; it
 * is read directly from `barcelonaReadyPlan1Day.priceILS` by the Ready Plan UI itself (see
 * BarcelonaReadyPlan.tsx). The entitlement check on this product page is currently
 * bypassed the same way the 5-day page is, under its own distinct product slug
 * ("barcelona-ready-plan-1day") so the two products can be priced/gated independently.
 */
export const barcelonaReadyPlan1Day: ReadyPlan = {
  slug: "barcelona-1day",
  title: "برشلونة بيوم واحد",
  subtitle: "أهم برشلونة بيوم واحد — مسار مرتب بدون تضييع وقت.",
  priceILS: 19,
  days: [
    {
      id: "day-1",
      label: "اليوم 1",
      theme: "أفضل يوم واحد في برشلونة ☀️",
      summary: "من Sagrada Família صباحًا، مرورًا بقلب المدينة والحي القوطي، وصولًا لراحة على شاطئ Barceloneta.",
      stops: [
        {
          placeId: "sagrada-familia",
          placeType: "attraction",
          suggestedDuration: "30–45 دقيقة",
          note: "الخطة الأساسية بتفترض مشاهدة Sagrada Família من الخارج. إذا بدك تدخل، احجز مسبقًا وأضف حوالي 90 دقيقة إضافية للخطة.",
        },
        { placeId: "casa-batllo", placeType: "attraction", suggestedDuration: "60–75 دقيقة" },
        { placeId: "gothic-quarter", placeType: "attraction", suggestedDuration: "60–90 دقيقة", note: "نسخة مختصرة — أبرز الأزقة والميادين فقط" },
        { placeId: "la-rambla", placeType: "attraction", suggestedDuration: "20–30 دقيقة", note: "مشي سريع باتجاه Boqueria" },
        {
          placeId: "boqueria",
          placeType: "attraction",
          suggestedDuration: "30–40 دقيقة",
          note: "⚠️ يوم الأحد: La Boqueria (وKiosko Universal بداخلها) مغلقة. استخدم البديل المقترح في الخطة بدل السوق — ووقت منيح لاستراحة أكل 45–60 دقيقة.",
        },
        { placeId: "barceloneta-beach", placeType: "beach", suggestedDuration: "90+ دقيقة", note: "راحة على البحر، وممكن تختم اليوم بالغروب إذا التوقيت والموسم مناسبين." },
      ],
      legs: [
        {
          // Verified 2026-08 vs Google Maps (walk 26min/1.9km, mostly flat; transit 12-15min
          // best via direct L2 metro from Sagrada Familia station, 5-min headway; drive
          // 7-8min/1.8km) and Apple Maps (walk 28-29min/1.2mi(~1.9km), mostly flat/gentle hill;
          // drive 7-8min/1.1mi, matching Google driving figure closely; transit not exposed,
          // falls back to driving). Transit chosen: meaningfully faster than the ~27min walk,
          // useful for a tight single-day pace.
          fromPlaceId: "sagrada-familia",
          toPlaceId: "casa-batllo",
          recommendedMode: "transit",
          options: {
            walking: { mode: "walking", durationLabel: "26–29 دقيقة", distanceKm: 1.9 },
            transit: { mode: "transit", durationLabel: "12–15 دقيقة", details: "مترو L2 مباشر من محطة Sagrada Familia" },
            car: { mode: "car", durationLabel: "7–8 دقائق" },
          },
        },
        {
          // Verified 2026-08 vs Google Maps (walk 22min/1.6km, mostly flat; transit 12min best
          // via direct L3 metro from Passeig de Gracia station, 5-min headway; fastest DRIVING
          // route flagged "restricted use / private roads" through the pedestrianized old-town
          // core) and Apple Maps (walk 20min/0.9mi(~1.45km), gentle hill; drive 13-17min/1.1-2.3mi
          // -- not used, matching the restricted-route flag; transit not exposed). Transit chosen:
          // meaningfully faster than the ~20-22min walk; car omitted per the restricted-route flag.
          fromPlaceId: "casa-batllo",
          toPlaceId: "gothic-quarter",
          recommendedMode: "transit",
          options: {
            walking: { mode: "walking", durationLabel: "20–22 دقيقة", distanceKm: 1.5 },
            transit: { mode: "transit", durationLabel: "12–14 دقيقة", details: "مترو L3 مباشر من محطة Passeig de Gràcia" },
          },
        },
        {
          // Verified 2026-08 vs Google Maps (walk 6-8min/500-600m, mostly flat) and Apple Maps
          // (walk 5min/0.3mi(~480m), mostly flat). Sources agreed closely -- a short walk from
          // the Gothic Quarter core out to La Rambla edge.
          fromPlaceId: "gothic-quarter",
          toPlaceId: "la-rambla",
          recommendedMode: "walking",
          options: { walking: { mode: "walking", durationLabel: "5–8 دقائق", distanceKm: 0.55 } },
        },
        {
          // Verified 2026-08 (reused -- same directional pair already verified in the 5-day
          // Ready Plan Day 3, no reason to differ) vs Google Maps (walk 2min/130m, drive
          // 1min/99m) and Apple Maps (walk 2min/350ft(~107m), mostly flat). Boqueria market
          // sits directly on La Rambla.
          fromPlaceId: "la-rambla",
          toPlaceId: "boqueria",
          recommendedMode: "walking",
          options: { walking: { mode: "walking", durationLabel: "1–2 دقيقة", distanceKm: 0.13 } },
        },
        {
          // Verified 2026-08 vs Google Maps (walk 25-28min/1.8-2.0km, mostly flat; transit
          // 22-28min, best via direct-ish L4 metro (~22min); drive 25-29min/2.9-5.4km -- barely
          // faster than walking due to La Rambla road-closure detours) and Apple Maps (walk
          // 25-26min/1.1mi(~1.8km), mostly flat; drive 22-28min/1.8-3.4mi, reasonably close
          // match to Google fastest driving figure; transit not exposed). Transit (L4) chosen:
          // the only meaningfully faster option after a long day of walking, though walking
          // remains a scenic Born-to-port alternative for those who prefer it.
          fromPlaceId: "boqueria",
          toPlaceId: "barceloneta-beach",
          recommendedMode: "transit",
          options: {
            walking: { mode: "walking", durationLabel: "25–28 دقيقة", distanceKm: 1.9 },
            transit: { mode: "transit", durationLabel: "22–28 دقيقة", details: "مترو L4" },
            car: { mode: "car", durationLabel: "25–29 دقيقة" },
          },
        },
      ],
      optionalNearby: [
        { placeId: "kiosko-universal", placeType: "food" },
        { placeId: "placa-reial", placeType: "attraction" },
        { placeId: "shoko-barcelona", placeType: "nightlife" },
        { placeId: "cafe-de-lopera", placeType: "food" },
      ],
    },
  ],
};
