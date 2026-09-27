import type { ReadyPlan } from "./readyPlanTypes";

/**
 * Barcelona — 3-Day Ready Plan.
 *
 * ── Provenance (2026-08, "Restore the Removed Barcelona 3-Day Plan" task) ────────────────
 * This project has no git repository (verified: `git status` reports "not a git repository"),
 * so there is no commit history to recover a previous 3-day plan from. Investigation found
 * that the Barcelona Guide UI never contained real 3-day itinerary data -- only a promotional
 * link/label ("خطة برشلونة الجاهزة" / "مسار جاهز 3 أيام") pointing at what is actually the
 * 5-day plan, already stale before this task (a leftover from an even earlier task that
 * rebuilt the old 3-day plan into 5 days without updating that one label).
 *
 * That earlier 5-day rebuild's own header comment (still in barcelona-ready-plan.ts) records
 * exactly what happened to the ORIGINAL 3-day plan: "Day 1 (Gaudí + Gràcia) carries over
 * unchanged from the 3-day plan... Day 2 is rebuilt... Day 3 is rebuilt... Day 4 and Day 5
 * are new." So only Day 1 was genuinely recoverable -- it is reproduced byte-for-byte below,
 * including its own already-verified legs, straight from barcelona-ready-plan.ts's current
 * Day 1. Days 2 and 3 of the original 3-day plan are not recoverable from any source (no git,
 * no surviving data file) and were NOT reconstructed from memory, since that would not be
 * genuine recovery. Per explicit instruction after this was reported, Days 2 and 3 below are
 * NEW content, designed with the same process as the 1-day and 5-day plans (real Guide
 * places, independently verified transport) -- not a restoration. See this task's final
 * report for the full recovery-vs-new breakdown.
 *
 * Only references existing place ids from barcelona-guide.ts. No place data (name/image/
 * address/hours/price/rating/links) is duplicated here — see app/lib/readyPlan.ts for how
 * each `placeId` is resolved against the real guide data at render time.
 *
 * ── Route distance/duration policy ──────────────────────────────────────────────────
 * Route distances and durations below are manually curated approximate values, NOT generated
 * from live routing APIs. Every leg marked "Verified 2026-08" was manually checked against
 * real Google Maps and Apple Maps directions results. The UI must always keep the existing
 * user-facing "estimates only" disclaimer next to these values.
 *
 * Per the project's architecture, Ready Plan's own route-leg data is a separate,
 * manually-curated dataset from the Smart Planner's. Day 1's legs are reused verbatim from
 * barcelona-ready-plan.ts (identical directional pairs, no reason to re-verify). Day 2/Day 3
 * reuse three more already-verified pairs where the exact same directional pair already
 * exists (casa-mila -> casa-batllo, gothic-quarter -> barcelona-cathedral, la-rambla ->
 * boqueria, all from barcelona-ready-plan.ts) and independently verify four genuinely new
 * pairs (casa-batllo -> placa-catalunya, placa-catalunya -> gothic-quarter, boqueria ->
 * santa-maria-del-mar, santa-maria-del-mar -> barceloneta-beach) against live Google Maps and
 * Apple Maps directions (2026-08). No leg in this file is left as an unresolved placeholder.
 *
 * `priceILS: 34` is the confirmed final price for this standalone 3-day product (updated from
 * the original 39 -- see the "Update Barcelona 3-Day Product Price" task's final report).
 */
export const barcelonaReadyPlan3Day: ReadyPlan = {
  slug: "barcelona-3day",
  title: "برشلونة — خطة 3 أيام",
  subtitle: "خطة برشلونة جاهزة لـ3 أيام — أهم المعالم بمسارات مرتبة وقريبة من بعض.",
  priceILS: 34,
  days: [
    {
      id: "day-1",
      label: "اليوم 1",
      theme: "Gaudí والمناظر 🌇",
      summary: "روائع Gaudí المعمارية في الصباح، وغروب من فوق برشلونة في Bunkers del Carmel مساءً.",
      stops: [
        { placeId: "sagrada-familia", placeType: "attraction", suggestedDuration: "90–120 دقيقة" },
        { placeId: "sant-pau", placeType: "attraction", suggestedDuration: "45–60 دقيقة" },
        { placeId: "mercat-sagrada-familia", placeType: "attraction", suggestedDuration: "15–20 دقيقة" },
        { placeId: "park-guell", placeType: "attraction", suggestedDuration: "90–120 دقيقة", note: "يفضل الحجز مسبقًا" },
        { placeId: "bunkers-carmel", placeType: "attraction", suggestedDuration: "60–90 دقيقة", note: "أفضل وقت: قبل الغروب" },
      ],
      legs: [
        {
          // Verified 2026-08 vs Google Maps (walk 16min/1.1km, transit 11min, drive 11min) and
          // Apple Maps (walk 17min/1.1km, drive 10-12min; Apple's web directions don't expose
          // transit for this route). Sources agreed closely — rounded ranges based on both.
          fromPlaceId: "sagrada-familia",
          toPlaceId: "sant-pau",
          recommendedMode: "walking",
          options: {
            walking: { mode: "walking", durationLabel: "15–20 دقيقة", distanceKm: 1.1 },
            transit: { mode: "transit", durationLabel: "10–15 دقيقة" },
            car: { mode: "car", durationLabel: "10–15 دقيقة" },
          },
        },
        {
          // Verified 2026-08 vs Google Maps (walk 13min/1.1km, transit 12-14min via bus D50/19,
          // drive 7-9min/1.6-2.1km) and Apple Maps (walk 12min/0.5mi(~0.8km), gently downhill;
          // drive 6-7min/0.7-1mi). Sources agreed closely; Apple transit not exposed (falls back
          // to driving). Walking is barely different from transit once bus-wait time is counted.
          fromPlaceId: "sant-pau",
          toPlaceId: "mercat-sagrada-familia",
          recommendedMode: "walking",
          options: {
            walking: { mode: "walking", durationLabel: "12–15 دقيقة", distanceKm: 1.1 },
            transit: { mode: "transit", durationLabel: "12–14 دقيقة" },
            car: { mode: "car", durationLabel: "7–9 دقائق" },
          },
        },
        {
          // Verified 2026-08 vs Google Maps (walk 41min/2.6km, elevation ~+106m net climb per
          // Google's own profile; transit 28-32min via 2-bus V21+H6 combo; drive 11-13min/2.6-3.0km)
          // and Apple Maps (walk 43-44min/1.7mi(~2.7km), "350-400 ft climb" (~107-122m); drive
          // 10-13min/1.7-1.9mi). Meaningful, real uphill confirmed by both sources. Transit chosen:
          // materially faster than the ~41-44min uphill walk.
          fromPlaceId: "mercat-sagrada-familia",
          toPlaceId: "park-guell",
          recommendedMode: "transit",
          options: {
            walking: { mode: "walking", durationLabel: "41–44 دقيقة", distanceKm: 2.6, details: "طلوع واضح — حوالي 100-120م ارتفاع" },
            transit: { mode: "transit", durationLabel: "28–32 دقيقة", details: "باص مزدوج — الوقت شامل الانتظار" },
            car: { mode: "car", durationLabel: "10–13 دقيقة" },
          },
        },
        {
          // Verified 2026-08 vs Google Maps (walk 26min/1.6km, transit 22min, drive 7min) and
          // Apple Maps (walk 24min/~1.5km, drive 20min). Walking/transit sources agreed closely.
          // Driving DIFFERED SIGNIFICANTLY between sources (Google 7min vs Apple 20min for the
          // same two points) — likely due to Park Güell's limited vehicle access. Stored as a
          // wide range reflecting both rather than picking one; walking remains recommended.
          // Updated 2026-08 (targeted quality-fix task): a fresh spot-check against live Google
          // Maps found 26-28min for this walk, running past the top of the previously stored
          // 20-25 range. Widened to 25-30 دقيقة as a safer customer-facing range covering the
          // fresh result; mode/recommendation unchanged.
          fromPlaceId: "park-guell",
          toPlaceId: "bunkers-carmel",
          recommendedMode: "walking",
          options: {
            walking: { mode: "walking", durationLabel: "25–30 دقيقة", distanceKm: 1.5, details: "فيه طلوع/درج" },
            transit: { mode: "transit", durationLabel: "20–25 دقيقة" },
            car: {
              mode: "car",
              durationLabel: "7–20 دقيقة",
              details: "تفاوت كبير بين المصادر لهذا المسار — تاكسي يوصلك لأقرب نقطة، وتبقى مسافة مشي قصيرة للإطلالة",
            },
          },
        },
      ],
      optionalNearby: [
        { placeId: "el-noa-noa", placeType: "food" },
        { placeId: "slowmov", placeType: "food" },
        { placeId: "vinilo-bar", placeType: "nightlife" },
      ],
    },
    {
      id: "day-2",
      label: "اليوم 2",
      theme: "قلب برشلونة والحي القوطي ✨",
      summary: "بيوت Gaudí الشهيرة على Passeig de Gràcia، ثم نزول لقلب الحي القوطي التاريخي.",
      stops: [
        { placeId: "casa-mila", placeType: "attraction", suggestedDuration: "60–90 دقيقة" },
        { placeId: "casa-batllo", placeType: "attraction", suggestedDuration: "60–90 دقيقة" },
        { placeId: "placa-catalunya", placeType: "attraction" },
        { placeId: "gothic-quarter", placeType: "attraction", suggestedDuration: "90–120 دقيقة", note: "وقت مرن للتجول بين الأزقة" },
        {
          placeId: "barcelona-cathedral",
          placeType: "attraction",
          suggestedDuration: "45–60 دقيقة",
          note: "⚠️ يوم الأحد ساعات الزيارة السياحية محدودة تقريبًا 14:00–16:30. إذا تأخرت بالخطة، افحص الساعات قبل ما توصل.",
        },
      ],
      legs: [
        {
          // Verified 2026-08 vs Google Maps (walk 7min/500m, drive 4min — no transit suggested)
          // and Apple Maps (walk 9min/~0.5km, drive 8min). Sources agreed closely on walking.
          fromPlaceId: "casa-mila",
          toPlaceId: "casa-batllo",
          recommendedMode: "walking",
          options: { walking: { mode: "walking", durationLabel: "7–9 دقائق", distanceKm: 0.5 } },
        },
        {
          // Verified 2026-08 vs Google Maps (walk 11min/850m, mostly flat; transit 6min direct
          // L3 metro from Passeig de Gràcia station, 7-min headway, or ~11-14min via bus 22/24;
          // drive not checked) and Apple Maps (walk 12min/0.5mi(~800m), gently downhill —
          // agrees closely with Google). Walking chosen: a short, flat, central stroll straight
          // down the avenue, matching this project's established preference for comparable hops.
          fromPlaceId: "casa-batllo",
          toPlaceId: "placa-catalunya",
          recommendedMode: "walking",
          options: {
            walking: { mode: "walking", durationLabel: "11–12 دقيقة", distanceKm: 0.85 },
            transit: { mode: "transit", durationLabel: "6 دقائق", details: "مترو L3 مباشر من محطة Passeig de Gràcia" },
          },
        },
        {
          // Verified 2026-08 vs Google Maps (walk 11-14min/800m-1.0km, mostly flat; fastest
          // DRIVING route flagged "restricted use / private roads" through the pedestrianized
          // old-town core) and Apple Maps (walk 10min/0.5mi(~800m), gentle hill — agrees closely
          // with Google). Walking chosen; car excluded per the restricted-route flag, matching
          // this project's convention for old-town hops.
          fromPlaceId: "placa-catalunya",
          toPlaceId: "gothic-quarter",
          recommendedMode: "walking",
          options: { walking: { mode: "walking", durationLabel: "10–14 دقيقة", distanceKm: 0.9 } },
        },
        {
          // Verified 2026-08 vs Google Maps (walk 2min/140m) and Apple Maps (walk 2min/450ft
          // (~137m), mostly flat). Sources agreed closely — Barcelona Cathedral sits at the edge
          // of the Gothic Quarter core.
          fromPlaceId: "gothic-quarter",
          toPlaceId: "barcelona-cathedral",
          recommendedMode: "walking",
          options: { walking: { mode: "walking", durationLabel: "1–2 دقيقة", distanceKm: 0.14 } },
        },
      ],
      optionalNearby: [
        { placeId: "el-nacional", placeType: "food" },
        { placeId: "satans-coffee-corner", placeType: "food" },
        { placeId: "placa-reial", placeType: "attraction" },
      ],
    },
    {
      id: "day-3",
      label: "اليوم 3",
      theme: "كرة القدم، المدينة القديمة والبحر ⚽🌊",
      summary: "جولة في ملعب Camp Nou الأسطوري صباحًا، ثم سوق Boqueria الحيوي وكنيسة Santa Maria del Mar، وختام على شاطئ Barceloneta.",
      stops: [
        {
          placeId: "camp-nou",
          placeType: "attraction",
          suggestedDuration: "90–150 دقيقة",
          note: "الحجز ضروري مسبقًا. ⚠️ Camp Nou ما زال ضمن أعمال Espai Barça، لذلك نوع الجولة والتجربة المتاحة ممكن يتغير. افحص التوفر والتفاصيل قبل الحجز.",
        },
        { placeId: "la-rambla", placeType: "attraction", suggestedDuration: "45–60 دقيقة" },
        {
          placeId: "boqueria",
          placeType: "attraction",
          suggestedDuration: "45–60 دقيقة",
          note: "⚠️ يوم الأحد: La Boqueria مغلقة. استخدم البديل المقترح في الخطة بدل السوق.",
        },
        { placeId: "santa-maria-del-mar", placeType: "attraction", suggestedDuration: "30–40 دقيقة" },
        { placeId: "barceloneta-beach", placeType: "beach", suggestedDuration: "90+ دقيقة", note: "وقت مرن — استرخاء عالشاطئ بلا استعجال" },
      ],
      legs: [
        {
          // Verified 2026-08 (targeted itinerary-change task, adding Camp Nou to Day 3) vs
          // Google Maps: walking 1h9min/5.1km flagged "restricted use/private roads" (excluded,
          // same as this project's established Camp Nou convention); transit 30min via a
          // DIRECT single-line L3 metro from Palau Reial station, no transfer required (the
          // train reaches Liceu, right on La Rambla); driving 16-17min/5.2-5.6km. Apple Maps
          // transit (dirflg=r) fell back to driving numbers again (18min/~5.3-6.1mi) --
          // consistent with this project's established finding that Apple's web transit routing
          // is unreliable for Barcelona. Transit chosen over car here (unlike the 5-day plan's
          // other Camp Nou legs, which use car because their best transit needs a transfer):
          // this route is a single direct line, simple and efficient enough for a paid Ready
          // Plan; car is still offered as a faster paid alternative.
          fromPlaceId: "camp-nou",
          toPlaceId: "la-rambla",
          recommendedMode: "transit",
          options: {
            transit: { mode: "transit", durationLabel: "28–32 دقيقة", details: "مترو L3 مباشر من محطة Palau Reial" },
            car: { mode: "car", durationLabel: "16–19 دقيقة" },
          },
        },
        {
          // Verified 2026-08 vs Google Maps (walk 2min/130m, drive 1min/99m — La Rambla itself
          // partly pedestrianized) and Apple Maps (walk 2min/350ft(~107m), mostly flat). Sources
          // agreed closely — Boqueria market sits directly on La Rambla.
          fromPlaceId: "la-rambla",
          toPlaceId: "boqueria",
          recommendedMode: "walking",
          options: { walking: { mode: "walking", durationLabel: "1–2 دقيقة", distanceKm: 0.13 } },
        },
        {
          // Verified 2026-08 vs Google Maps (walk 15-16min/1.1-1.2km, mostly flat) and Apple
          // Maps (walk 13min/0.6mi(~1.0km), gentle hill — agrees closely). Walking-only,
          // matching this project's convention for old-town/Born pedestrian hops.
          fromPlaceId: "boqueria",
          toPlaceId: "santa-maria-del-mar",
          recommendedMode: "walking",
          options: { walking: { mode: "walking", durationLabel: "13–16 دقيقة", distanceKm: 1.1 } },
        },
        {
          // Verified 2026-08 vs Google Maps (walk 13-14min/900-950m, mostly flat) and Apple Maps
          // (walk 13-14min/0.6mi(~950m), mostly flat — agrees closely). Walking-only, a flat
          // waterfront-adjacent walk from El Born down to the beach.
          fromPlaceId: "santa-maria-del-mar",
          toPlaceId: "barceloneta-beach",
          recommendedMode: "walking",
          options: { walking: { mode: "walking", durationLabel: "13–14 دقيقة", distanceKm: 0.93 } },
        },
      ],
      optionalNearby: [
        { placeId: "can-culleretes", placeType: "food" },
        { placeId: "palau-musica", placeType: "attraction" },
        { placeId: "la-cova-fumada", placeType: "food" },
        // Added as the verified Sunday alternative for the closed Boqueria market -- same
        // choice already used in the 1-Day Ready Plan's fix: a real Guide entry directly on
        // La Rambla (zero detour), open every day including Sunday 08:30-02:30.
        { placeId: "cafe-de-lopera", placeType: "food" },
      ],
    },
  ],
};
