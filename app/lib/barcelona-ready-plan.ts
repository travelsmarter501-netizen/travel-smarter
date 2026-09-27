import type { ReadyPlan } from "./readyPlanTypes";

/**
 * Barcelona — 5-Day Ready Plan.
 *
 * Only references existing place ids from barcelona-guide.ts (attractions/foodPlaces/
 * experiences/nightlifeVenues/beaches/shoppingAreas). No place data (name/image/address/
 * hours/price/rating/links) is duplicated here — see app/lib/readyPlan.ts for how each
 * `placeId` is resolved against the real guide data at render time.
 *
 * ── Route distance/duration policy ──────────────────────────────────────────────────
 * Route distances and durations below are manually curated approximate values. They are
 * NOT generated from live routing APIs and must never be presented as live distance, live
 * traffic, or an exact current duration. Every leg marked "Verified 2026-08" below was
 * manually checked against real Google Maps and Apple Maps directions results (same
 * origin/destination points the app itself uses). These are still approximate: Google Maps
 * and Apple Maps may return different results depending on the exact route taken, traffic
 * conditions, which entrance/exit of a place is used, and time of departure — especially
 * public transit, which depends on schedules and walking connections. The UI must always
 * keep the existing user-facing "estimates only" disclaimer next to these values, and must
 * never claim live distance, live traffic, or an exact current duration.
 *
 * ── 5-Day Rebuild (2026-08) ────────────────────────────────────────────────────────────
 * Rebuilt from the previous 3-day plan (5/5/4 stops) into 5 full themed days (5/5/5/5/5
 * stops), so the product covers a complete first-trip Barcelona experience — Gaudí, the
 * historic center, a local market, football, Montjuïc, the beach/sea, and shopping streets —
 * without any day feeling like a thin afterthought. Day 1 (Gaudí + Gràcia) carries over
 * unchanged from the 3-day plan, already well-balanced. Day 2 is rebuilt around Passeig de
 * Gràcia + the city center only (casa-mila, casa-batllo, passeig-de-gracia, placa-catalunya,
 * portal-angel) — Camp Nou and Mercat de Sant Antoni move to a new Day 4 together with the
 * Pedralbes/Montjuïc sights, resolving the old plan's own documented Day 2 overload. Day 3 is
 * rebuilt as a pure Old City + Born day (la-rambla, boqueria, gothic-quarter,
 * barcelona-cathedral, santa-maria-del-mar) — Barceloneta Beach and Ciutadella move to a new
 * Day 5 built around the sea/port instead. Day 4 (mercat-sant-antoni, camp-nou,
 * jardins-palau-pedralbes, monestir-pedralbes, mnac) and Day 5 (arc-de-triomf, ciutadella,
 * museu-historia-catalunya, barceloneta-beach, maremagnum) are new. Every one of the 25 main
 * stops across the 5 days is unique — no place is used as a main stop twice.
 *
 * Per the project's architecture, Ready Plan's own route-leg data is a separate,
 * manually-curated dataset from the Smart Planner's (app/lib/planner/barcelona-planner-route-legs.ts)
 * — even where the Smart Planner already had a verified value for the same directional pair,
 * it was NOT copied over; every new pair introduced by this rebuild was independently
 * verified against live Google Maps and Apple Maps directions (2026-08). Two pairs
 * (camp-nou -> jardins-palau-pedralbes, monestir-pedralbes -> mnac) had their walking option
 * excluded after BOTH sources independently flagged the route as impractical: Camp Nou's
 * walking routes are restricted/private-road per Google, and Monestir Pedralbes -> MNAC is
 * over an hour on foot with an escalator required per Apple — matching this project's
 * existing convention for Camp Nou legs. Three pairs (casa-batllo -> passeig-de-gracia,
 * passeig-de-gracia -> placa-catalunya, placa-catalunya -> portal-angel) showed Google/Apple
 * geocoding disagreements caused by "passeig-de-gracia"/"portal-angel" being addresses for an
 * entire street rather than a single point — Google's numbers were used for these three, since
 * Apple's collapsed the distance to near-zero by geocoding the street address on top of the
 * other endpoint. No leg in this file is left as an unresolved placeholder.
 *
 * `priceILS` below is a commercial-UI display value only (Section B of the product-separation
 * task) — there is not yet a real `products` table row for the "barcelona-ready-plan" slug,
 * so this number is not enforced by any entitlement/payment logic yet.
 */
export const barcelonaReadyPlan: ReadyPlan = {
  slug: "barcelona",
  title: "برشلونة — خطة 5 أيام",
  subtitle: "خطة برشلونة جاهزة لـ5 أيام — مرتبة يوم بيوم وبمسارات قريبة من بعض.",
  priceILS: 39,
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
          // Updated 2026-08 (targeted pre-launch fix task): a fresh spot-check found 26-28min
          // for this walk, running past the top of the previously stored 20-25 range. Widened
          // to 25-30 دقيقة as a safer customer-facing range; mode/recommendation unchanged.
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
      theme: "قلب برشلونة ✨",
      summary: "نزهة على أشهر شارع بأوروبا، بين تحف Gaudí ومحلات التسوق حتى Plaça Catalunya.",
      stops: [
        { placeId: "casa-mila", placeType: "attraction", suggestedDuration: "60–90 دقيقة" },
        { placeId: "casa-batllo", placeType: "attraction", suggestedDuration: "60–90 دقيقة" },
        { placeId: "passeig-de-gracia", placeType: "shopping", suggestedDuration: "20–30 دقيقة", note: "تمشية على أشهر شارع تسوق في برشلونة" },
        { placeId: "placa-catalunya", placeType: "attraction" },
        { placeId: "portal-angel", placeType: "shopping", suggestedDuration: "20–30 دقيقة", note: "شارع تسوق رئيسي قرب الميدان" },
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
          // Verified 2026-08 vs Google Maps (walk 11min/850m, transit 4-6min via direct L3 metro
          // or ~10min bus 22/24, drive 9min/1.3km). Apple Maps geocoded "Passeig de Gracia" as
          // an address essentially on top of Casa Batlló (walk 3min/0.1mi) — a geocoding
          // artifact from treating a whole-street address as a point, not a real second
          // measurement; Google's numbers (a real walk further up the avenue) are used instead.
          fromPlaceId: "casa-batllo",
          toPlaceId: "passeig-de-gracia",
          recommendedMode: "walking",
          options: {
            walking: { mode: "walking", durationLabel: "10–12 دقيقة", distanceKm: 0.85 },
            transit: { mode: "transit", durationLabel: "4–6 دقائق", details: "مترو L3 مباشر" },
            car: { mode: "car", durationLabel: "8–10 دقائق" },
          },
        },
        {
          // Verified 2026-08 vs Google Maps (walk 3min/200m, drive 3min/850m). Apple Maps again
          // showed a geocoding artifact for the "Passeig de Gracia" street address (walk
          // 10min/0.4mi) — since this stop represents a stroll along the avenue rather than one
          // fixed point, a moderate range covering both a short and a longer starting point on
          // the street is used rather than picking a single number.
          fromPlaceId: "passeig-de-gracia",
          toPlaceId: "placa-catalunya",
          recommendedMode: "walking",
          options: {
            walking: { mode: "walking", durationLabel: "5–10 دقائق", distanceKm: 0.5 },
            car: { mode: "car", durationLabel: "3–6 دقائق" },
          },
        },
        {
          // Verified 2026-08 vs Google Maps (walk 4min/300m, drive 4min/800m). Apple Maps showed
          // another geocoding artifact for "Portal de l'Angel" (walk 2min, drive essentially 0 —
          // collapsed onto Plaça Catalunya itself); Google's numbers (the real shopping street a
          // few hundred meters north) are used instead.
          fromPlaceId: "placa-catalunya",
          toPlaceId: "portal-angel",
          recommendedMode: "walking",
          options: {
            walking: { mode: "walking", durationLabel: "3–5 دقائق", distanceKm: 0.3 },
            car: { mode: "car", durationLabel: "3–4 دقائق" },
          },
        },
      ],
      optionalNearby: [
        { placeId: "el-nacional", placeType: "food" },
        { placeId: "cerveceria-catalana", placeType: "food" },
        { placeId: "dry-martini", placeType: "nightlife" },
      ],
    },
    {
      id: "day-3",
      label: "اليوم 3",
      theme: "برشلونة القديمة وEl Born 🏛️",
      summary: "أزقة الحي القوطي الضيقة، سوق Boqueria الحيوي، وكنيسة Santa Maria del Mar في El Born.",
      stops: [
        { placeId: "la-rambla", placeType: "attraction", suggestedDuration: "45–60 دقيقة" },
        {
          placeId: "boqueria",
          placeType: "attraction",
          suggestedDuration: "45–60 دقيقة",
          note: "⚠️ يوم الأحد: La Boqueria مغلقة. استخدم البديل المقترح بدل السوق.",
        },
        { placeId: "gothic-quarter", placeType: "attraction", suggestedDuration: "90–120 دقيقة", note: "وقت مرن للتجول بين الأزقة" },
        {
          placeId: "barcelona-cathedral",
          placeType: "attraction",
          suggestedDuration: "45–60 دقيقة",
          note: "⚠️ يوم الأحد ساعات الزيارة السياحية محدودة تقريبًا 14:00–16:30. إذا تأخرت بالخطة، افحص الساعات قبل ما توصل.",
        },
        { placeId: "santa-maria-del-mar", placeType: "attraction", suggestedDuration: "30–40 دقيقة" },
      ],
      legs: [
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
          // Verified 2026-08 vs Google Maps (walk 9min/650m; fastest DRIVING route flagged
          // "restricted use / private roads" — old-town pedestrian zone) and Apple Maps (walk
          // 7min/0.3mi(~480m), mostly flat). Sources agreed reasonably on walking; car excluded
          // given the restricted-route flag, matching this project's convention for old-town hops.
          fromPlaceId: "boqueria",
          toPlaceId: "gothic-quarter",
          recommendedMode: "walking",
          options: { walking: { mode: "walking", durationLabel: "7–10 دقائق", distanceKm: 0.65 } },
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
        {
          // Verified 2026-08 vs Google Maps (walk 7min/550m) and Apple Maps (walk 7min/0.3mi
          // (~480m), gently downhill). Sources agreed closely — a short walk east from the
          // Gothic Quarter into El Born. Driving times diverged sharply between sources (Google
          // 17min/2.7km vs Apple 8min/~1km) and are irrelevant since walking is the clear choice
          // for this flat, central, pedestrian-friendly hop — car not offered.
          fromPlaceId: "barcelona-cathedral",
          toPlaceId: "santa-maria-del-mar",
          recommendedMode: "walking",
          options: { walking: { mode: "walking", durationLabel: "7–9 دقائق", distanceKm: 0.55 } },
        },
      ],
      optionalNearby: [
        { placeId: "palau-musica", placeType: "attraction" },
        { placeId: "can-culleretes", placeType: "food" },
        { placeId: "el-xampanyet", placeType: "food" },
        { placeId: "cook-and-taste-paella-class", placeType: "experience" },
        // Added as the verified Sunday alternative for the closed Boqueria market -- same
        // choice already used in the 1-Day and 3-Day Ready Plans: a real Guide entry directly
        // on La Rambla (zero detour), open every day including Sunday 08:30-02:30.
        { placeId: "cafe-de-lopera", placeType: "food" },
      ],
    },
    {
      id: "day-4",
      label: "اليوم 4",
      theme: "كرة القدم وMontjuïc ⚽",
      summary: "جولة في ملعب Camp Nou الأسطوري، ثم قصور وحدائق Pedralbes وMontjuïc.",
      stops: [
        {
          placeId: "mercat-sant-antoni",
          placeType: "attraction",
          suggestedDuration: "30–45 دقيقة",
          note: "ℹ️ يوم الأحد التجربة مختلفة: السوق الغذائي غير فعال كالمعتاد، وبتكون منطقة السوق معروفة أكثر بسوق الكتب والمقتنيات.",
        },
        {
          placeId: "camp-nou",
          placeType: "attraction",
          suggestedDuration: "90–150 دقيقة",
          note: "الحجز ضروري مسبقًا. ⚠️ Camp Nou ما زال ضمن أعمال Espai Barça، لذلك نوع الجولة والتجربة المتاحة ممكن يتغير. افحص التوفر والتفاصيل قبل الحجز.",
        },
        { placeId: "jardins-palau-pedralbes", placeType: "attraction", suggestedDuration: "30–35 دقيقة" },
        { placeId: "monestir-pedralbes", placeType: "attraction", suggestedDuration: "45–60 دقيقة" },
        {
          placeId: "mnac",
          placeType: "attraction",
          suggestedDuration: "90–120 دقيقة",
          note: "تكفي التذكرة الأساسية + إطلالة الـ Rooftop لتوفير وقت. ⚠️ يوم الاثنين: MNAC مغلق. ⚠️ يوم الأحد: MNAC يغلق حوالي 15:00. إذا كانت خطتك بطيئة أو تأخرت في Camp Nou، افحص الوقت قبل ما تكمل إلى المتحف.",
        },
      ],
      legs: [
        {
          // Verified 2026-08 INDEPENDENTLY in this direction vs Google Maps (walk 62min/4.4km —
          // "restricted route/private roads" near the stadium, walking excluded from options;
          // transit 31-42min best via L2+L3 with one transfer from Sant Antoni station; drive
          // 18-19min/5.0-6.2km) and Apple Maps (walk 69-73min/2.6-2.8mi, ~150ft/46m climb — also
          // impractical; drive 15-16min/3.1-3.8mi). Car chosen: meaningfully faster than transit.
          fromPlaceId: "mercat-sant-antoni",
          toPlaceId: "camp-nou",
          recommendedMode: "car",
          options: {
            transit: { mode: "transit", durationLabel: "31–42 دقيقة", details: "الأسرع: مترو L2 ثم L3 (تبديل واحد) من محطة Sant Antoni" },
            car: { mode: "car", durationLabel: "15–19 دقيقة" },
          },
        },
        {
          // Verified 2026-08 vs Google Maps (walk 20min/1.3km — ALL walking route alternatives
          // explicitly flagged "restricted use / private roads" near the stadium; transit
          // ~19-21min via bus 113; drive 6-7min/1.6-1.9km) and Apple Maps (walk 23-25min/0.9-1mi
          // with a noted "100 ft climb" — corroborating the walk being impractical for such a
          // short straight-line distance; drive 10-14min/1.2-1.6mi). Walking excluded per both
          // sources, matching this project's established Camp Nou convention.
          fromPlaceId: "camp-nou",
          toPlaceId: "jardins-palau-pedralbes",
          recommendedMode: "car",
          options: {
            transit: { mode: "transit", durationLabel: "19–21 دقيقة", details: "باص خط 113" },
            car: { mode: "car", durationLabel: "6–10 دقائق" },
          },
        },
        {
          // Verified 2026-08 vs Google Maps (walk 21min/1.3-1.4km, "mostly flat" per Google;
          // transit 15-16min via direct bus V5 from Pl. Pius XII, best option, or 20min via bus
          // H4; drive 5-6min/1.5km) and Apple Maps (walk 20min/0.8mi(~1.3km) with a "150 ft
          // climb" noted — a minor elevation disagreement with Google; drive 6-9min/1.1-1.7mi).
          // Transit (bus V5) chosen: meaningfully faster than the borderline ~20-21min walk and
          // avoids the noted climb; walking still offered as an easy self-guided alternative.
          fromPlaceId: "jardins-palau-pedralbes",
          toPlaceId: "monestir-pedralbes",
          recommendedMode: "transit",
          options: {
            walking: { mode: "walking", durationLabel: "20–21 دقيقة", distanceKm: 1.35, details: "طلوع خفيف" },
            transit: { mode: "transit", durationLabel: "15–17 دقيقة", details: "باص V5 مباشر" },
            car: { mode: "car", durationLabel: "5–6 دقائق" },
          },
        },
        {
          // Verified 2026-08 vs Google Maps (walk 71min/5.2km — clearly not viable; transit
          // 43-47min best via metro L3 with connections; drive 21min/7.6-8.0km) and Apple Maps
          // (walk 83min/3.2mi(~5.1km) with a "200 ft climb" AND "Escalator required" noted —
          // strongly confirming the walk is impractical; drive 21min/4.7mi(~7.6km), matching
          // Google's driving figure closely). Walking excluded per both sources. Car chosen:
          // meaningfully faster than transit (20-22min vs 43-47min).
          fromPlaceId: "monestir-pedralbes",
          toPlaceId: "mnac",
          recommendedMode: "car",
          options: {
            transit: { mode: "transit", durationLabel: "43–47 دقيقة", details: "مترو L3 مع تبديل" },
            car: { mode: "car", durationLabel: "20–22 دقيقة" },
          },
        },
      ],
      optionalNearby: [
        { placeId: "teleferic-montjuic", placeType: "experience" },
        { placeId: "fc-barcelona-match-tickets", placeType: "experience" },
        { placeId: "miramar-barcelona", placeType: "food" },
      ],
    },
    {
      id: "day-5",
      label: "اليوم 5",
      theme: "البحر وPort Vell 🌊",
      summary: "حديقة Ciutadella الهادئة، متحف تاريخ Catalunya، واسترخاء على شاطئ Barceloneta.",
      stops: [
        { placeId: "arc-de-triomf", placeType: "attraction", suggestedDuration: "20–30 دقيقة" },
        { placeId: "ciutadella", placeType: "attraction", suggestedDuration: "60–90 دقيقة", note: "نزهة في الحديقة" },
        {
          placeId: "museu-historia-catalunya",
          placeType: "attraction",
          suggestedDuration: "60–75 دقيقة",
          note: "⚠️ يوم الاثنين: Museu d'Història de Catalunya مغلق.",
        },
        { placeId: "barceloneta-beach", placeType: "beach", suggestedDuration: "90+ دقيقة", note: "وقت مرن — استرخاء عالشاطئ بلا استعجال" },
        { placeId: "maremagnum", placeType: "shopping", suggestedDuration: "45–60 دقيقة", note: "تسوق ونزهة على واجهة الميناء" },
      ],
      legs: [
        {
          // Verified 2026-08 vs Google Maps (walk 10min/800m, "mostly flat"; drive 12min/2.2km,
          // routing around the park perimeter on public roads) and Apple Maps (walk 11min/0.5mi
          // (~800m), mostly flat). Walking sources agreed closely. Apple's driving figure
          // (1min/50ft) is a clear routing artifact — likely cutting through park interior paths
          // not open to traffic — and is not used; Google's figure reflects the real public-road
          // route. Walking remains the recommended, and only offered, mode for this short hop.
          fromPlaceId: "arc-de-triomf",
          toPlaceId: "ciutadella",
          recommendedMode: "walking",
          options: { walking: { mode: "walking", durationLabel: "10–11 دقيقة", distanceKm: 0.8 } },
        },
        {
          // Verified 2026-08 vs Google Maps (walk 17min/1.2km, "mostly flat"; transit 14-15min
          // via bus V19 or H14; drive 7min/1.1km) and Apple Maps (walk 16min/0.7mi(~1.13km),
          // mostly flat — close match). Walking chosen: only marginally slower than transit for a
          // pleasant, flat park-to-waterfront route.
          fromPlaceId: "ciutadella",
          toPlaceId: "museu-historia-catalunya",
          recommendedMode: "walking",
          options: {
            walking: { mode: "walking", durationLabel: "16–17 دقيقة", distanceKm: 1.15 },
            transit: { mode: "transit", durationLabel: "14–16 دقيقة", details: "باص V19" },
          },
        },
        {
          // Verified 2026-08 vs Google Maps (walk 7min/450-500m, "mostly flat") and Apple Maps
          // (walk 7min/0.3mi(~480m), mostly flat). Sources agreed closely.
          fromPlaceId: "museu-historia-catalunya",
          toPlaceId: "barceloneta-beach",
          recommendedMode: "walking",
          options: { walking: { mode: "walking", durationLabel: "7–8 دقائق", distanceKm: 0.48 } },
        },
        {
          // Verified 2026-08 vs Google Maps (walk 19min/1.4km, "mostly flat"; transit ~17min via
          // bus V17, best option; drive 7min/1.8km) and Apple Maps (walk 16min/0.7mi(~1.13km),
          // mostly flat; drive 9min/1mi(~1.6km), a reasonably close match to Google). Walking
          // chosen: a scenic, flat marina-front route with only a small time gap vs transit.
          fromPlaceId: "barceloneta-beach",
          toPlaceId: "maremagnum",
          recommendedMode: "walking",
          options: {
            walking: { mode: "walking", durationLabel: "16–19 دقيقة", distanceKm: 1.25 },
            transit: { mode: "transit", durationLabel: "15–17 دقيقة", details: "باص V17" },
          },
        },
      ],
      optionalNearby: [
        { placeId: "la-cova-fumada", placeType: "food" },
        { placeId: "paddleboard-kayak-barceloneta", placeType: "experience" },
        { placeId: "1881-sagardi", placeType: "food" },
        { placeId: "cdlc-barcelona", placeType: "nightlife" },
      ],
    },
  ],
};
