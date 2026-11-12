import type { PlanLanguage } from "./planText";

/**
 * Customer wording for the transport notes stored with Barcelona route legs (barcelona-planner-route-legs.ts).
 *
 * The route data keeps its original English research notes (sources, verification remarks, internal reuse markers);
 * this table decides what a customer sees, in Arabic, English and Hebrew. `null` = internal note, never shown.
 * Display only: routes, modes and minutes are not touched. Line names (L3, V19, H16, FGC L7...) and station names stay
 * as written so they match the signs and the maps apps.
 *
 * Keyed by the exact stored note, so old saved plans (which carry the same notes) get the same wording. A stored note
 * not listed here is shown as stored and logged (never guessed).
 */
type NoteText = { en: string; ar: string; he: string };

const N = (en: string, ar: string, he: string): NoteText => ({ en, ar, he });

export const TRANSPORT_NOTES: Record<string, NoteText | null> = {
  // Walks / car distances measured on a real route (barcelonaRoutedLegs.ts, 2026-11-12).
  "Distance: a walking route on the street network (OpenStreetMap) between the points used for the two places, plus a short straight-line estimate from each point to the street. Time estimated at 4.5 km/h. Not checked on Google or Apple Maps.": N("Walking route on the street network (OpenStreetMap), plus a short straight-line estimate to the street. Time estimated at 4.5 km/h; not checked on Google or Apple Maps.", "المسافة: مسار مشي فعلي على شبكة الشوارع (OpenStreetMap) بين نقطتي المكانين، مع تقدير قصير بخط مستقيم من كل نقطة للشارع. الوقت محسوب على مشي 4.5 كم بالساعة. ما انفحص على Google أو Apple Maps.", "מרחק: מסלול הליכה ברשת הרחובות (OpenStreetMap) בין הנקודות של שני המקומות, ועוד הערכה קצרה בקו ישר מכל נקודה לרחוב. הזמן מחושב לפי הליכה של 4.5 קמ\"ש. לא נבדק ב־Google או Apple Maps."),
  "Distance: a walking route on the street network (OpenStreetMap) between the points used for the two places, plus a short straight-line estimate from each point to the street. Time estimated at 4.5 km/h, plus 20% for the climb. Not checked on Google or Apple Maps.": N("Walking route on the street network (OpenStreetMap), plus a short straight-line estimate to the street. Time estimated at 4.5 km/h, plus 20% for the climb; not checked on Google or Apple Maps.", "المسافة: مسار مشي فعلي على شبكة الشوارع (OpenStreetMap) بين نقطتي المكانين، مع تقدير قصير بخط مستقيم من كل نقطة للشارع. الوقت محسوب على مشي 4.5 كم بالساعة مع 20% زيادة للطلعة. ما انفحص على Google أو Apple Maps.", "מרחק: מסלול הליכה ברשת הרחובות (OpenStreetMap) בין הנקודות של שני המקומות, ועוד הערכה קצרה בקו ישר מכל נקודה לרחוב. הזמן מחושב לפי הליכה של 4.5 קמ\"ש, ועוד 20% בגלל העלייה. לא נבדק ב־Google או Apple Maps."),
  // Estimates for pairs with no checked or routed value (barcelonaRoutedLegs.ts, 2026-11-12).
  "Estimate: the straight-line distance between the two places x 1.3 for the streets, walking at 4.5 km/h. Not a checked route: check a maps app before you go.": N("Estimate: straight-line distance x 1.3 for the streets, walking at 4.5 km/h. Not a checked route: check a maps app before you go.", "تقدير: المسافة بخط مستقيم بين المكانين × 1.3 للشوارع، ومشي 4.5 كم بالساعة. مش طريق مفحوص: شوف تطبيق الخرائط قبل ما تتحرك.", "הערכה: המרחק בקו ישר בין שני המקומות × 1.3 בגלל הרחובות, הליכה של 4.5 קמ\"ש. זה לא מסלול שנבדק: בדקו באפליקציית מפות לפני שיוצאים."),
  "Estimate from the distance: 18 km/h plus 10 minutes to reach and wait at the stop, x 1.25 (the gap measured against Barcelona's checked times). The line is not checked: look it up in a maps app.": N("Estimate from the distance: 18 km/h plus 10 minutes to reach and wait at the stop, x 1.25 (the gap measured against Barcelona's checked times). The line is not checked: look it up in a maps app.", "تقدير حسب المسافة: 18 كم بالساعة و10 دقائق للوصول للمحطة والانتظار، × 1.25 (الفرق اللي طلع بالمقارنة مع أوقات برشلونة المفحوصة). الخط مش مفحوص: شوفه بتطبيق الخرائط.", "הערכה לפי המרחק: 18 קמ\"ש ועוד 10 דקות להגיע לתחנה ולחכות, × 1.25 (הפער שנמדד מול הזמנים שנבדקו בברצלונה). הקו לא נבדק: חפשו אותו באפליקציית מפות."),
  "Rough estimate: one of the two is a large place (park, beach, quarter...) with no single entrance point, so only a time is given, measured to a central point. Check a maps app.": N("Rough estimate: one of the two is a large place (park, beach, quarter…) with no single entrance point, so only a time is given, measured to a central point. Check a maps app.", "تقدير تقريبي: واحد من المكانين مكان كبير (حديقة، شط، حي…) ما إله مدخل واحد، فبنعطي وقت بس، محسوب لنقطة بالنص. شوف تطبيق الخرائط.", "הערכה גסה: אחד משני המקומות גדול (פארק, חוף, שכונה…) בלי נקודת כניסה אחת, ולכן מוצג רק זמן, שנמדד לנקודה מרכזית. בדקו באפליקציית מפות."),
  "Same building: a few minutes inside, no street route.": N("Same building: a few minutes inside, no street route.", "نفس المبنى: كم دقيقة جوّا، بدون طريق بالشارع.", "אותו בניין: כמה דקות בפנים, בלי מסלול ברחוב."),
  "Car distance from the road network (OpenStreetMap) between the points used for the two places; the car time is the checked one.": N("Car distance from the road network (OpenStreetMap); the car time is the checked one.", "مسافة السيارة من شبكة الطرق (OpenStreetMap)؛ ووقت السيارة هو المفحوص.", "מרחק הנסיעה מרשת הכבישים (OpenStreetMap); זמן הנסיעה הוא הזמן שנבדק."),
  "Direct L5->L4, one-stop change, every 5-6min.": N("Metro L5 then L4, one change; trains every 5–6 min.", "مترو L5 ثم L4، تبديل واحد؛ قطار كل 5–6 دقائق.", "מטרו L5 ואז L4, החלפה אחת; רכבת כל 5–6 דקות."),
  "Uphill route.": N("Uphill route.", "الطريق صاعد.", "הדרך בעלייה."),
  "Direct bus — range includes wait time, not just ride time.": N("Direct bus; the time includes waiting for it.", "باص مباشر؛ الوقت يشمل الانتظار.", "אוטובוס ישיר; הזמן כולל המתנה."),
  "Uphill, some stairs.": N("Uphill, with some stairs.", "الطريق صاعد وفيه بعض الدرج.", "בעלייה, עם כמה מדרגות."),
  "Time varies a lot due to Park Güell's limited vehicle access and one-way restrictions.": N("Time varies a lot: cars have limited access around Park Güell and the streets are one-way.", "الوقت بيتغيّر كثير: دخول السيارات حول Park Güell محدود والشوارع باتجاه واحد.", "הזמן משתנה מאוד: הגישה לרכבים סביב Park Güell מוגבלת והרחובות חד־סטריים."),
  "Fastest: direct L1/L3 metro from Arc de Triomf station.": N("Fastest: metro L1/L3 from Arc de Triomf station.", "الأسرع: مترو L1/L3 من محطة Arc de Triomf.", "הכי מהיר: מטרו L1/L3 מתחנת Arc de Triomf."),
  "Flat seafront promenade (Passeig Marítim).": N("Flat walk along the seafront promenade (Passeig Marítim).", "مشي مستوٍ على كورنيش البحر (Passeig Marítim).", "הליכה מישורית לאורך הטיילת (Passeig Marítim)."),
  "Bus only; not materially faster than walking.": N("Bus only, and not much faster than walking.", "باص فقط، ومش أسرع بكثير من المشي.", "רק אוטובוס, ולא הרבה יותר מהיר מהליכה."),
  "Requires a bus/tram leg plus the Funicular Cuca de Llum — no direct route.": N("No direct route: a bus or tram, then the Funicular Cuca de Llum.", "ما في طريق مباشر: باص أو ترام، ثم Funicular Cuca de Llum.", "אין קו ישיר: אוטובוס או חשמלית, ואז Funicular Cuca de Llum."),
  "Fastest: direct L5/L3 metro, ~29-30min.": N("Fastest: metro L5/L3, about 30 min.", "الأسرع: مترو L5/L3، حوالي 30 دقيقة.", "הכי מהיר: מטרו L5/L3, כ־30 דקות."),
  "Gentle hill noted by one source.": N("A gentle hill on part of the way.", "في طلعة خفيفة بجزء من الطريق.", "יש עלייה קלה בחלק מהדרך."),
  "Direct L4 metro.": N("Metro L4, direct.", "مترو L4 مباشر.", "מטרו L4 ישיר."),
  "Meaningful uphill toward Palau Nacional (~70-130m gain).": N("A real climb toward Palau Nacional (about 70–130 m up).", "طلعة واضحة باتجاه Palau Nacional (حوالي 70–130 م صعود).", "עלייה משמעותית לכיוון Palau Nacional (כ־70–130 מ׳ טיפוס)."),
  "Fastest: direct L3 metro from Liceu to Espanya.": N("Fastest: metro L3 from Liceu to Espanya.", "الأسرع: مترو L3 من Liceu إلى Espanya.", "הכי מהיר: מטרו L3 מ־Liceu ל־Espanya."),
  "Meaningful uphill toward Palau Nacional (~65-125m gain).": N("A real climb toward Palau Nacional (about 65–125 m up).", "طلعة واضحة باتجاه Palau Nacional (حوالي 65–125 م صعود).", "עלייה משמעותית לכיוון Palau Nacional (כ־65–125 מ׳ טיפוס)."),
  "Fastest: direct L3 metro from Liceu.": N("Fastest: metro L3 from Liceu.", "الأسرع: مترو L3 من Liceu.", "הכי מהיר: מטרו L3 מ־Liceu."),
  "Meaningful uphill toward Palau Nacional (~65-135m gain).": N("A real climb toward Palau Nacional (about 65–135 m up).", "طلعة واضحة باتجاه Palau Nacional (حوالي 65–135 م صعود).", "עלייה משמעותית לכיוון Palau Nacional (כ־65–135 מ׳ טיפוס)."),
  "Fastest: direct L1/L3 metro straight from Plaça Catalunya station.": N("Fastest: metro L1/L3 from Plaça Catalunya station.", "الأسرع: مترو L1/L3 من محطة Plaça Catalunya.", "הכי מהיר: מטרו L1/L3 מתחנת Plaça Catalunya."),
  "Fastest: direct L3 metro from Passeig de Gracia.": N("Fastest: metro L3 from Passeig de Gràcia.", "الأسرع: مترو L3 من Passeig de Gràcia.", "הכי מהיר: מטרו L3 מ־Passeig de Gràcia."),
  "Mostly flat, with a gentle hill on some routes.": N("Mostly flat, with a gentle hill on some ways.", "غالبًا مستوٍ، مع طلعة خفيفة ببعض الطرق.", "רובה מישורית, עם עלייה קלה בחלק מהדרכים."),
  "Fastest: bus 47 or direct L5/L3 metro.": N("Fastest: bus 47 or metro L5/L3.", "الأسرع: باص 47 أو مترو L5/L3.", "הכי מהיר: אוטובוס 47 או מטרו L5/L3."),
  "Fastest: direct L3 metro from Palau Reial.": N("Fastest: metro L3 from Palau Reial.", "الأسرع: مترو L3 من Palau Reial.", "הכי מהיר: מטרו L3 מ־Palau Reial."),
  "Final stretch is pedestrian-only near the destination.": N("The last part near the destination is pedestrian-only.", "آخر جزء قرب المكان للمشاة فقط.", "הקטע האחרון ליד היעד מיועד להולכי רגל בלבד."),
  "Downhill (net descent) -- notably easier than the uphill reverse direction.": N("Mostly downhill; much easier than the opposite direction.", "غالبًا نزول؛ أسهل بكثير من الاتجاه المعاكس.", "בעיקר בירידה; קל בהרבה מהכיוון ההפוך."),
  "Fastest: bus 4759 direct from Platja de la Barceloneta.": N("Fastest: bus 4759, direct from Platja de la Barceloneta.", "الأسرع: باص 4759 مباشر من Platja de la Barceloneta.", "הכי מהיר: אוטובוס 4759 ישיר מ־Platja de la Barceloneta."),
  "Undulating terrain (moderate hills), net descent.": N("Up-and-down streets (moderate hills), ending lower.", "طريق فيه طلعات ونزلات خفيفة، وبالمجمل نزول.", "דרך עם עליות וירידות מתונות, ובסך הכול ירידה."),
  "Fastest: direct L3 metro.": N("Fastest: metro L3, direct.", "الأسرع: مترو L3 مباشر.", "הכי מהיר: מטרו L3 ישיר."),
  "Gently uphill per one source.": N("Gently uphill.", "طلعة خفيفة.", "עלייה קלה."),
  "Mostly flat; best of 3 routes shown.": N("Mostly flat.", "غالبًا مستوٍ.", "רובה מישורית."),
  "Direct L3 metro, Passeig de Gracia -> Liceu; trains ~every 7min.": N("Metro L3 from Passeig de Gràcia to Liceu; trains about every 7 min.", "مترو L3 من Passeig de Gràcia إلى Liceu؛ قطار كل 7 دقائق تقريبًا.", "מטרו L3 מ־Passeig de Gràcia ל־Liceu; רכבת בערך כל 7 דקות."),
  "Destination is pedestrian-only; short walk from parking/drop-off.": N("The destination is pedestrian-only: a short walk from where the car stops.", "المكان للمشاة فقط: مشي قصير من مكان نزولك من السيارة.", "היעד מיועד להולכי רגל בלבד: הליכה קצרה מהמקום שבו יורדים מהרכב."),
  "Requires a transfer (e.g. L3 then L4) -- no direct line covers this distance.": N("No direct line: one change (for example L3, then L4).", "ما في خط مباشر: تبديل واحد (مثلًا L3 ثم L4).", "אין קו ישיר: החלפה אחת (למשל L3 ואז L4)."),
  "Gently downhill.": N("Gently downhill.", "نزلة خفيفة.", "ירידה קלה."),
  "Fastest: direct L5 metro from Badal.": N("Fastest: metro L5 from Badal.", "الأسرع: مترو L5 من Badal.", "הכי מהיר: מטרו L5 מ־Badal."),
  "Fastest: L5+L3 combo, or direct L3 from Palau Reial.": N("Fastest: metro L5 then L3, or L3 direct from Palau Reial.", "الأسرع: مترو L5 ثم L3، أو L3 مباشر من Palau Reial.", "הכי מהיר: מטרו L5 ואז L3, או L3 ישיר מ־Palau Reial."),
  "Fastest: direct L4 metro.": N("Fastest: metro L4, direct.", "الأسرع: مترو L4 مباشر.", "הכי מהיר: מטרו L4 ישיר."),
  "Fastest: direct L3 metro from Plaça Catalunya.": N("Fastest: metro L3 from Plaça Catalunya.", "الأسرع: مترو L3 من Plaça Catalunya.", "הכי מהיר: מטרו L3 מ־Plaça Catalunya."),
  "Direct bus V19.": N("Bus V19, direct.", "باص V19 مباشر.", "אוטובוס V19 ישיר."),
  "Direct bus D20.": N("Bus D20, direct.", "باص D20 مباشر.", "אוטובוס D20 ישיר."),
  "Flat seafront promenade.": N("Flat walk along the seafront promenade.", "مشي مستوٍ على كورنيش البحر.", "הליכה מישורית לאורך הטיילת."),
  "Direct L3 metro from Palau Reial.": N("Metro L3, direct from Palau Reial.", "مترو L3 مباشر من Palau Reial.", "מטרו L3 ישיר מ־Palau Reial."),
  "Requires a bus leg plus the Funicular Cuca de Llum -- no direct route.": N("No direct route: a bus, then the Funicular Cuca de Llum.", "ما في طريق مباشر: باص ثم Funicular Cuca de Llum.", "אין קו ישיר: אוטובוס ואז Funicular Cuca de Llum."),
  "Meaningful uphill (~200m elevation gain).": N("A real climb (about 200 m up).", "طلعة قوية (حوالي 200 م صعود).", "עלייה משמעותית (כ־200 מ׳ טיפוס)."),
  "Fastest: bus 114.": N("Fastest: bus 114.", "الأسرع: باص 114.", "הכי מהיר: אוטובוס 114."),
  "Fastest: direct L5 metro from Sagrada Familia station.": N("Fastest: metro L5 from Sagrada Família station.", "الأسرع: مترو L5 من محطة Sagrada Família.", "הכי מהיר: מטרו L5 מתחנת Sagrada Família."),
  "Fastest: bus X1.": N("Fastest: bus X1.", "الأسرع: باص X1.", "הכי מהיר: אוטובוס X1."),
  "Direct L3 metro, bus 24, or L3+D40.": N("Metro L3, bus 24, or L3 then bus D40.", "مترو L3، أو باص 24، أو L3 ثم باص D40.", "מטרו L3, אוטובוס 24, או L3 ואז אוטובוס D40."),
  "Some walking needed to reach the entrance from parking.": N("You'll still walk a bit from the car to the entrance.", "رح تمشي شوي من السيارة للمدخل.", "עדיין צריך ללכת קצת מהרכב עד הכניסה."),
  "Requires a bus transfer (V21+H6) -- no direct route.": N("No direct route: bus V21, then H6.", "ما في طريق مباشر: باص V21 ثم H6.", "אין קו ישיר: אוטובוס V21 ואז H6."),
  "Walking required at destination (Park Güell's restricted entrance access).": N("You'll walk the last part: cars can't reach Park Güell's entrance.", "رح تمشي آخر جزء: السيارات ما بتوصل لمدخل Park Güell.", "את הקטע האחרון הולכים ברגל: רכבים לא מגיעים לכניסה של Park Güell."),
  "Fastest: direct L3 metro from Passeig de Gràcia.": N("Fastest: metro L3 from Passeig de Gràcia.", "الأسرع: مترو L3 من Passeig de Gràcia.", "הכי מהיר: מטרו L3 מ־Passeig de Gràcia."),
  "Fastest: direct bus H16 from Plaça Catalunya.": N("Fastest: bus H16, direct from Plaça Catalunya.", "الأسرع: باص H16 مباشر من Plaça Catalunya.", "הכי מהיר: אוטובוס H16 ישיר מ־Plaça Catalunya."),
  "Fastest: direct L5 metro.": N("Fastest: metro L5, direct.", "الأسرع: مترو L5 مباشر.", "הכי מהיר: מטרו L5 ישיר."),
  "Minor uphill (~30m).": N("A small climb (about 30 m).", "طلعة صغيرة (حوالي 30 م).", "עלייה קטנה (כ־30 מ׳)."),
  "Fastest: direct L5 metro from Collblanc.": N("Fastest: metro L5 from Collblanc.", "الأسرع: مترو L5 من Collblanc.", "הכי מהיר: מטרו L5 מ־Collblanc."),
  "Fastest: bus V19.": N("Fastest: bus V19.", "الأسرع: باص V19.", "הכי מהיר: אוטובוס V19."),
  "Fastest: direct bus V19.": N("Fastest: bus V19, direct.", "الأسرع: باص V19 مباشر.", "הכי מהיר: אוטובוס V19 ישיר."),
  "Requires a bus+train transfer (e.g. H16+S2) -- no direct route.": N("No direct route: a bus, then a train (for example H16, then S2).", "ما في طريق مباشر: باص ثم قطار (مثلًا H16 ثم S2).", "אין קו ישיר: אוטובוס ואז רכבת (למשל H16 ואז S2)."),
  "Fastest: direct bus 24 from CAP Larrard.": N("Fastest: bus 24, direct from CAP Larrard.", "الأسرع: باص 24 مباشر من CAP Larrard.", "הכי מהיר: אוטובוס 24 ישיר מ־CAP Larrard."),
  "Undulating terrain.": N("Up-and-down streets.", "طريق فيه طلعات ونزلات.", "דרך עם עליות וירידות."),
  "Fastest: direct L3 metro from Espanya.": N("Fastest: metro L3 from Espanya.", "الأسرع: مترو L3 من Espanya.", "הכי מהיר: מטרו L3 מ־Espanya."),
  "Fastest: L5+L3 metro combo.": N("Fastest: metro L5, then L3.", "الأسرع: مترو L5 ثم L3.", "הכי מהיר: מטרו L5 ואז L3."),
  "Fastest: L5+R4 combo, or direct L3 from Palau Reial.": N("Fastest: metro L5, then train R4, or L3 direct from Palau Reial.", "الأسرع: مترو L5 ثم قطار R4، أو L3 مباشر من Palau Reial.", "הכי מהיר: מטרו L5 ואז רכבת R4, או L3 ישיר מ־Palau Reial."),
  "Destination is a pedestrian-only shopping street; a short walk from parking/drop-off is still required.": N("A pedestrian-only shopping street: a short walk from where the car stops.", "شارع تسوّق للمشاة فقط: مشي قصير من مكان نزولك من السيارة.", "רחוב קניות להולכי רגל בלבד: הליכה קצרה מהמקום שבו יורדים מהרכב."),
  "Fastest: bus 47 from Pepe Rubianes.": N("Fastest: bus 47 from Pepe Rubianes.", "الأسرع: باص 47 من Pepe Rubianes.", "הכי מהיר: אוטובוס 47 מ־Pepe Rubianes."),
  "Fastest: L5+L3 metro combo from Sant Pau | Dos de Maig.": N("Fastest: metro L5, then L3, from Sant Pau | Dos de Maig.", "الأسرع: مترو L5 ثم L3 من Sant Pau | Dos de Maig.", "הכי מהיר: מטרו L5 ואז L3, מ־Sant Pau | Dos de Maig."),
  "Fastest: L3+L5 metro combo.": N("Fastest: metro L3, then L5.", "الأسرع: مترو L3 ثم L5.", "הכי מהיר: מטרו L3 ואז L5."),
  "Meaningful uphill toward Palau Nacional (~65-130m gain).": N("A real climb toward Palau Nacional (about 65–130 m up).", "طلعة واضحة باتجاه Palau Nacional (حوالي 65–130 م صعود).", "עלייה משמעותית לכיוון Palau Nacional (כ־65–130 מ׳ טיפוס)."),
  "Fastest: direct L1/L3 metro from Plaça Catalunya - Pg de Gràcia.": N("Fastest: metro L1/L3 from Plaça Catalunya or Passeig de Gràcia.", "الأسرع: مترو L1/L3 من Plaça Catalunya أو Passeig de Gràcia.", "הכי מהיר: מטרו L1/L3 מ־Plaça Catalunya או מ־Passeig de Gràcia."),
  "Meaningful uphill toward Palau Nacional (~75-130m gain).": N("A real climb toward Palau Nacional (about 75–130 m up).", "طلعة واضحة باتجاه Palau Nacional (حوالي 75–130 م صعود).", "עלייה משמעותית לכיוון Palau Nacional (כ־75–130 מ׳ טיפוס)."),
  "Fastest: direct L1 metro from Urquinaona.": N("Fastest: metro L1 from Urquinaona.", "الأسرع: مترو L1 من Urquinaona.", "הכי מהיר: מטרו L1 מ־Urquinaona."),
  "Undulating terrain; one route requires Montjuïc's outdoor escalators.": N("Up-and-down streets; one way uses Montjuïc's outdoor escalators.", "طريق فيه طلعات ونزلات؛ أحد الطرق بيستخدم السلالم الكهربائية المكشوفة في Montjuïc.", "דרך עם עליות וירידות; אחת הדרכים עוברת במדרגות הנעות הפתוחות של Montjuïc."),
  "Fastest: direct L1/L3 metro from Espanya.": N("Fastest: metro L1/L3 from Espanya.", "الأسرع: مترو L1/L3 من Espanya.", "הכי מהיר: מטרו L1/L3 מ־Espanya."),
  "Fastest route avoids a current road closure.": null,
  "Gently uphill.": N("Gently uphill.", "طلعة خفيفة.", "עלייה קלה."),
  "Fastest: L4+H6 bus/metro combo -- no direct route.": N("No direct route: metro L4, then bus H6.", "ما في طريق مباشر: مترو L4 ثم باص H6.", "אין קו ישיר: מטרו L4 ואז אוטובוס H6."),
  "Park Güell's restricted entrance access means a walk from parking is still required.": N("Cars can't reach Park Güell's entrance, so you'll still walk from the car.", "السيارات ما بتوصل لمدخل Park Güell، فرح تمشي من السيارة.", "רכבים לא מגיעים לכניסה של Park Güell, אז עדיין צריך ללכת מהרכב."),
  "Requires a transfer (e.g. L5+24) -- no direct route.": N("No direct route: one change (for example metro L5, then bus 24).", "ما في طريق مباشر: تبديل واحد (مثلًا مترو L5 ثم باص 24).", "אין קו ישיר: החלפה אחת (למשל מטרו L5 ואז אוטובוס 24)."),
  "Fastest: direct L4 metro; alt bus 4759/V15.": N("Fastest: metro L4; or bus 4759/V15.", "الأسرع: مترو L4؛ أو باص 4759/V15.", "הכי מהיר: מטרו L4; או אוטובוס 4759/V15."),
  "Fastest: direct L3 from Plaça Catalunya, or L1+D20/L3+L5 combos.": N("Fastest: metro L3 from Plaça Catalunya, or L1 then bus D20, or L3 then L5.", "الأسرع: مترو L3 من Plaça Catalunya، أو L1 ثم باص D20، أو L3 ثم L5.", "הכי מהיר: מטרו L3 מ־Plaça Catalunya, או L1 ואז אוטובוס D20, או L3 ואז L5."),
  "Fastest: direct L3 metro or bus 24 from Pl Catalunya - Rambla Catalunya.": N("Fastest: metro L3 or bus 24 from Plaça Catalunya / Rambla de Catalunya.", "الأسرع: مترو L3 أو باص 24 من Plaça Catalunya / Rambla de Catalunya.", "הכי מהיר: מטרו L3 או אוטובוס 24 מ־Plaça Catalunya / Rambla de Catalunya."),
  "Bus M12 or V1, every 10min.": N("Bus M12 or V1, about every 10 min.", "باص M12 أو V1، كل 10 دقائق تقريبًا.", "אוטובוס M12 או V1, בערך כל 10 דקות."),
  "Fastest: bus H4+113 combo.": N("Fastest: bus H4, then bus 113.", "الأسرع: باص H4 ثم باص 113.", "הכי מהיר: אוטובוס H4 ואז אוטובוס 113."),
  "Fastest: direct L3+L5 metro combo.": N("Fastest: metro L3, then L5.", "الأسرع: مترو L3 ثم L5.", "הכי מהיר: מטרו L3 ואז L5."),
  "Heavy traffic noted on 2 of 3 routes.": N("Traffic is often heavy on this trip.", "الزحمة غالبًا قوية على هالطريق.", "בדרך הזו יש לרוב עומסי תנועה."),
  "Fastest: bus 47 -- not materially faster than walking.": N("Fastest: bus 47, but not much faster than walking.", "الأسرع: باص 47، بس مش أسرع بكثير من المشي.", "הכי מהיר: אוטובוס 47, אבל לא הרבה יותר מהיר מהליכה."),
  "Minor uphill (~45m gain).": N("A small climb (about 45 m).", "طلعة صغيرة (حوالي 45 م).", "עלייה קטנה (כ־45 מ׳)."),
  "Fastest route avoids a La Rambla closure.": null,
  "Fastest: L3+V19 bus/metro combo, or direct L4.": N("Fastest: metro L3, then bus V19, or metro L4 direct.", "الأسرع: مترو L3 ثم باص V19، أو مترو L4 مباشر.", "הכי מהיר: מטרו L3 ואז אוטובוס V19, או מטרו L4 ישיר."),
  "Net descent (downhill), but a long walk -- transit/car both faster.": N("Mostly downhill, but a long walk; public transport or a car are faster.", "غالبًا نزول بس المشي طويل؛ المواصلات أو السيارة أسرع.", "בעיקר ירידה, אבל הליכה ארוכה; תחבורה ציבורית או רכב מהירים יותר."),
  "Fastest: direct bus D20 -- not materially faster than walking.": N("Fastest: bus D20, but not much faster than walking.", "الأسرع: باص D20، بس مش أسرع بكثير من المشي.", "הכי מהיר: אוטובוס D20, אבל לא הרבה יותר מהיר מהליכה."),
  "Fastest: direct L3+D20 combo.": N("Fastest: metro L3, then bus D20.", "الأسرع: مترو L3 ثم باص D20.", "הכי מהיר: מטרו L3 ואז אוטובוס D20."),
  "Fastest: L3 metro from Liceu plus a bus/metro combo.": N("Fastest: metro L3 from Liceu, then another bus or metro.", "الأسرع: مترو L3 من Liceu ثم باص أو مترو ثاني.", "הכי מהיר: מטרו L3 מ־Liceu ואז אוטובוס או מטרו נוסף."),
  "Fastest: direct L4 metro from Passeig de Gràcia.": N("Fastest: metro L4 from Passeig de Gràcia.", "الأسرع: مترو L4 من Passeig de Gràcia.", "הכי מהיר: מטרו L4 מ־Passeig de Gràcia."),
  "Fastest: direct L4+L1 metro combo.": N("Fastest: metro L4, then L1.", "الأسرع: مترو L4 ثم L1.", "הכי מהיר: מטרו L4 ואז L1."),
  "Fastest: direct L3+L1 metro combo from Liceu.": N("Fastest: metro L3, then L1, from Liceu.", "الأسرع: مترو L3 ثم L1 من Liceu.", "הכי מהיר: מטרו L3 ואז L1, מ־Liceu."),
  "Fastest: direct L4 metro from Barceloneta.": N("Fastest: metro L4 from Barceloneta.", "الأسرع: مترو L4 من Barceloneta.", "הכי מהיר: מטרו L4 מ־Barceloneta."),
  "Direct L3 metro, Passeig de Gracia -> Liceu; trains ~every 5min.": N("Metro L3 from Passeig de Gràcia to Liceu; trains about every 5 min.", "مترو L3 من Passeig de Gràcia إلى Liceu؛ قطار كل 5 دقائق تقريبًا.", "מטרו L3 מ־Passeig de Gràcia ל־Liceu; רכבת בערך כל 5 דקות."),
  "Meaningful uphill toward Palau Nacional (~65-130m gain); some routes require Montjuïc's outdoor escalators.": N("A real climb toward Palau Nacional (about 65–130 m up); some ways use Montjuïc's outdoor escalators.", "طلعة واضحة باتجاه Palau Nacional (حوالي 65–130 م صعود)؛ بعض الطرق بتستخدم السلالم الكهربائية المكشوفة في Montjuïc.", "עלייה משמעותית לכיוון Palau Nacional (כ־65–130 מ׳ טיפוס); חלק מהדרכים עוברות במדרגות הנעות הפתוחות של Montjuïc."),
  "Fastest: direct L1+L3 metro combo.": N("Fastest: metro L1, then L3.", "الأسرع: مترو L1 ثم L3.", "הכי מהיר: מטרו L1 ואז L3."),
  "Fastest: direct L1+L4 metro combo.": N("Fastest: metro L1, then L4.", "الأسرع: مترو L1 ثم L4.", "הכי מהיר: מטרו L1 ואז L4."),
  "Gently uphill on the direct route; a flatter alternative is slightly longer.": N("Gently uphill the direct way; a flatter way is a little longer.", "الطريق المباشر فيه طلعة خفيفة؛ في طريق أكثر استواءً وأطول شوي.", "בדרך הישירה יש עלייה קלה; דרך מישורית יותר ארוכה קצת."),
  "Some uphill on the longer alternate route.": N("The longer alternative has some uphill.", "الطريق البديل الأطول فيه شوية طلعة.", "בדרך החלופית הארוכה יש קצת עלייה."),
  "Route crosses university (UPC Campus Nord) grounds, which may be gated at night.": N("The walk crosses a university campus (UPC Campus Nord), which may be closed at night.", "المشي بيمرّ بحرم جامعي (UPC Campus Nord) ممكن يكون مسكّر بالليل.", "ההליכה עוברת בקמפוס אוניברסיטה (UPC Campus Nord), שעשוי להיות סגור בלילה."),
  "Fastest: direct L2 metro from Sagrada Família station.": N("Fastest: metro L2 from Sagrada Família station.", "الأسرع: مترو L2 من محطة Sagrada Família.", "הכי מהיר: מטרו L2 מתחנת Sagrada Família."),
  "Destination anchored to the general Port Olímpic area -- no exact departure point stored.": N("Time is to the Port Olímpic area in general; your exact spot may add a few minutes.", "الوقت محسوب لمنطقة Port Olímpic بشكل عام؛ مكانك بالضبط ممكن يزيد كم دقيقة.", "הזמן מחושב לאזור Port Olímpic באופן כללי; המקום המדויק עשוי להוסיף כמה דקות."),
  "Transit is impractical for this pair (51min+ via funicular + bus transfer).": N("Public transport isn't practical here (over 50 min with a funicular and a bus change).", "المواصلات العامة مش عملية هون (أكثر من 50 دقيقة مع تلفريك وتبديل باص).", "תחבורה ציבורית לא משתלמת כאן (יותר מ־50 דקות עם רכבל והחלפת אוטובוס)."),
  "Direct L2+L4, transfer at Sant Antoni station.": N("Metro L2, then L4; change at Sant Antoni station.", "مترو L2 ثم L4؛ التبديل بمحطة Sant Antoni.", "מטרו L2 ואז L4; החלפה בתחנת Sant Antoni."),
  "Net downhill this direction.": N("Mostly downhill in this direction.", "غالبًا نزول بهالاتجاه.", "בעיקר ירידה בכיוון הזה."),
  "Fastest: direct L2/L4 metro from Sagrada Família station.": N("Fastest: metro L2/L4 from Sagrada Família station.", "الأسرع: مترو L2/L4 من محطة Sagrada Família.", "הכי מהיר: מטרו L2/L4 מתחנת Sagrada Família."),
  "Fastest: L2/L1 metro, one change at Passeig de Gràcia.": N("Fastest: metro L2 and L1, one change at Passeig de Gràcia.", "الأسرع: مترو L2 وL1، تبديل واحد بـ Passeig de Gràcia.", "הכי מהיר: מטרו L2 ו־L1, החלפה אחת ב־Passeig de Gràcia."),
  "Metro L4 from Jaume I station.": N("Metro L4 from Jaume I station.", "مترو L4 من محطة Jaume I.", "מטרו L4 מתחנת Jaume I."),
  "Real-time traffic; can vary.": N("Depends on traffic.", "حسب الزحمة.", "תלוי בתנועה."),
  "Fastest: L5/L4 metro from Sant Pau | Dos de Maig station.": N("Fastest: metro L5/L4 from Sant Pau | Dos de Maig station.", "الأسرع: مترو L5/L4 من محطة Sant Pau | Dos de Maig.", "הכי מהיר: מטרו L5/L4 מתחנת Sant Pau | Dos de Maig."),
  "Fastest: bus 47 from Platja de la Barceloneta.": N("Fastest: bus 47 from Platja de la Barceloneta.", "الأسرع: باص 47 من Platja de la Barceloneta.", "הכי מהיר: אוטובוס 47 מ־Platja de la Barceloneta."),
  "Direct L3 metro from Palau Reial station.": N("Metro L3, direct from Palau Reial station.", "مترو L3 مباشر من محطة Palau Reial.", "מטרו L3 ישיר מתחנת Palau Reial."),
  "Fastest: L3 metro from Lesseps station.": N("Fastest: metro L3 from Lesseps station.", "الأسرع: مترو L3 من محطة Lesseps.", "הכי מהיר: מטרו L3 מתחנת Lesseps."),
  "Fastest: L2/L4 metro.": N("Fastest: metro L2/L4.", "الأسرع: مترو L2/L4.", "הכי מהיר: מטרו L2/L4."),
  "Fastest: direct L3 metro from Plaça Catalunya station.": N("Fastest: metro L3 from Plaça Catalunya station.", "الأسرع: مترو L3 من محطة Plaça Catalunya.", "הכי מהיר: מטרו L3 מתחנת Plaça Catalunya."),
  "Fastest: bus 24, single line.": N("Fastest: bus 24, no change.", "الأسرع: باص 24 بدون تبديل.", "הכי מהיר: אוטובוס 24, בלי החלפה."),
  "Fastest: direct L3 metro from Palau Reial station.": N("Fastest: metro L3 from Palau Reial station.", "الأسرع: مترو L3 من محطة Palau Reial.", "הכי מהיר: מטרו L3 מתחנת Palau Reial."),
  "L3 metro from Lesseps station; schedule-dependent wait.": N("Metro L3 from Lesseps station; waiting time depends on the timetable.", "مترو L3 من محطة Lesseps؛ الانتظار حسب المواعيد.", "מטרו L3 מתחנת Lesseps; זמן ההמתנה תלוי בלוח הזמנים."),
  "L4 metro from Urquinaona station; schedule-dependent wait.": N("Metro L4 from Urquinaona station; waiting time depends on the timetable.", "مترو L4 من محطة Urquinaona؛ الانتظار حسب المواعيد.", "מטרו L4 מתחנת Urquinaona; זמן ההמתנה תלוי בלוח הזמנים."),
  "L4 metro from Jaume I station; schedule-dependent wait.": N("Metro L4 from Jaume I station; waiting time depends on the timetable.", "مترو L4 من محطة Jaume I؛ الانتظار حسب المواعيد.", "מטרו L4 מתחנת Jaume I; זמן ההמתנה תלוי בלוח הזמנים."),
  "Uphill.": N("Uphill.", "طلعة.", "בעלייה."),
  "Metro L3 + Montjuïc Funicular from Paral·lel station.": N("Metro L3, then the Montjuïc funicular from Paral·lel station.", "مترو L3 ثم تلفريك Montjuïc (Funicular) من محطة Paral·lel.", "מטרו L3 ואז הפוניקולר של Montjuïc מתחנת Paral·lel."),
  "L3/L5 or L4/L5 metro, one change.": N("Metro L3 or L4, then L5; one change.", "مترو L3 أو L4 ثم L5؛ تبديل واحد.", "מטרו L3 או L4 ואז L5; החלפה אחת."),
  "L2/L1 metro, one change.": N("Metro L2 and L1, one change.", "مترو L2 وL1، تبديل واحد.", "מטרו L2 ו־L1, החלפה אחת."),
  "Fastest: direct L2 metro.": N("Fastest: metro L2, direct.", "الأسرع: مترو L2 مباشر.", "הכי מהיר: מטרו L2 ישיר."),
  "L4 or L3 metro.": N("Metro L4 or L3.", "مترو L4 أو L3.", "מטרו L4 או L3."),
  "L4 metro, one change.": N("Metro L4, one change.", "مترو L4، تبديل واحد.", "מטרו L4, החלפה אחת."),
  "Direct L3 from Palau Reial station.": N("Metro L3, direct from Palau Reial station.", "مترو L3 مباشر من محطة Palau Reial.", "מטרו L3 ישיר מתחנת Palau Reial."),
  "No single fast line -- several metro+bus combos, e.g. L3+113 or L3+V5.": N("No single fast line: metro plus bus, for example L3 then bus 113 or V5.", "ما في خط واحد سريع: مترو ثم باص، مثلًا L3 ثم باص 113 أو V5.", "אין קו מהיר אחד: מטרו ואז אוטובוס, למשל L3 ואז אוטובוס 113 או V5."),
  "L5+L1 or L3 combo, several viable routes.": N("Several good options, for example metro L5 then L1, or L3.", "في أكثر من خيار مناسب، مثلًا مترو L5 ثم L1، أو L3.", "יש כמה אפשרויות טובות, למשל מטרו L5 ואז L1, או L3."),
  "Google flagged heavier-than-usual traffic on every route checked -- treat as approximate.": N("Traffic is often heavy here, so treat the time as approximate.", "الزحمة غالبًا قوية هون، فاعتبر الوقت تقريبي.", "יש כאן לרוב עומסי תנועה, אז הזמן משוער."),
  "Fastest: direct L3 from Liceu station.": N("Fastest: metro L3 from Liceu station.", "الأسرع: مترو L3 من محطة Liceu.", "הכי מהיר: מטרו L3 מתחנת Liceu."),
  "Direct L2, or L1/L3+L5 combos, from Passeig de Gràcia station.": N("From Passeig de Gràcia station: metro L2 direct, or L1/L3 then L5.", "من محطة Passeig de Gràcia: مترو L2 مباشر، أو L1/L3 ثم L5.", "מתחנת Passeig de Gràcia: מטרו L2 ישיר, או L1/L3 ואז L5."),
  "Resolved from the tour's own Plaça Reial meeting point.": N("Measured from the tour's meeting point at Plaça Reial.", "محسوب من نقطة تجمّع الجولة في Plaça Reial.", "מחושב מנקודת המפגש של הסיור ב־Plaça Reial."),
  "Fastest: L4+L2 metro combo.": N("Fastest: metro L4, then L2.", "الأسرع: مترو L4 ثم L2.", "הכי מהיר: מטרו L4 ואז L2."),
  "L1 direct from Arc de Triomf station, or L1+L2.": N("Metro L1 direct from Arc de Triomf station, or L1 then L2.", "مترو L1 مباشر من محطة Arc de Triomf، أو L1 ثم L2.", "מטרו L1 ישיר מתחנת Arc de Triomf, או L1 ואז L2."),
  "Montjuïc funicular + direct L3 metro.": N("The Montjuïc funicular, then metro L3.", "تلفريك Montjuïc (Funicular) ثم مترو L3.", "הפוניקולר של Montjuïc ואז מטרו L3."),
  "L3 metro + Montjuïc funicular from Palau Reial station.": N("Metro L3 from Palau Reial station, then the Montjuïc funicular.", "مترو L3 من محطة Palau Reial ثم تلفريك Montjuïc (Funicular).", "מטרו L3 מתחנת Palau Reial ואז הפוניקולר של Montjuïc."),
  "Bus + Montjuïc funicular, or L3 + funicular.": N("A bus or metro L3, then the Montjuïc funicular.", "باص أو مترو L3، ثم تلفريك Montjuïc (Funicular).", "אוטובוס או מטרו L3, ואז הפוניקולר של Montjuïc."),
  "Fastest: L4+L2 metro combo, or direct bus D20.": N("Fastest: metro L4 then L2, or bus D20 direct.", "الأسرع: مترو L4 ثم L2، أو باص D20 مباشر.", "הכי מהיר: מטרו L4 ואז L2, או אוטובוס D20 ישיר."),
  "Direct L1, L2, or L3 metro.": N("Metro L1, L2 or L3, direct.", "مترو L1 أو L2 أو L3 مباشر.", "מטרו L1, L2 או L3 ישיר."),
  "Direct L2 or L3 metro from Sant Antoni station.": N("Metro L2 or L3, direct from Sant Antoni station.", "مترو L2 أو L3 مباشر من محطة Sant Antoni.", "מטרו L2 או L3 ישיר מתחנת Sant Antoni."),
  "Direct L3 from Liceu station.": N("Metro L3, direct from Liceu station.", "مترو L3 مباشر من محطة Liceu.", "מטרו L3 ישיר מתחנת Liceu."),
  "No single fast line -- commuter rail (L6/S1/S2) + L12 bus, or L3 + bus combos.": N("No single fast line: a local train (L6/S1/S2) then bus, or metro L3 then a bus.", "ما في خط واحد سريع: قطار محلي (L6/S1/S2) ثم باص، أو مترو L3 ثم باص.", "אין קו מהיר אחד: רכבת פרברים (L6/S1/S2) ואז אוטובוס, או מטרו L3 ואז אוטובוס."),
  "Fastest: direct L4+L5 metro combo from Barceloneta station.": N("Fastest: metro L4, then L5, from Barceloneta station.", "الأسرع: مترو L4 ثم L5 من محطة Barceloneta.", "הכי מהיר: מטרו L4 ואז L5, מתחנת Barceloneta."),
  "Resolved to the tour's own Plaça Reial meeting point.": N("Measured to the tour's meeting point at Plaça Reial.", "محسوب لنقطة تجمّع الجولة في Plaça Reial.", "מחושב עד נקודת המפגש של הסיור ב־Plaça Reial."),
  "Direct L3 or L4 metro.": N("Metro L3 or L4, direct.", "مترو L3 أو L4 مباشر.", "מטרו L3 או L4 ישיר."),
  "Fastest: direct L5+L3 metro combo.": N("Fastest: metro L5, then L3.", "الأسرع: مترو L5 ثم L3.", "הכי מהיר: מטרו L5 ואז L3."),
  "L3 metro + Montjuïc funicular from Plaça Catalunya.": N("Metro L3 from Plaça Catalunya, then the Montjuïc funicular.", "مترو L3 من Plaça Catalunya ثم تلفريك Montjuïc (Funicular).", "מטרו L3 מ־Plaça Catalunya ואז הפוניקולר של Montjuïc."),
  "Fastest: direct L5 metro from Verdaguer station.": N("Fastest: metro L5 from Verdaguer station.", "الأسرع: مترو L5 من محطة Verdaguer.", "הכי מהיר: מטרו L5 מתחנת Verdaguer."),
  "No single fast line -- direct bus 22 or 114.": N("No fast metro line: bus 22 or 114, direct.", "ما في مترو سريع: باص 22 أو 114 مباشر.", "אין קו מטרו מהיר: אוטובוס 22 או 114 ישיר."),
  "No fast rail option -- direct bus 63 is fastest.": N("No fast metro or train: bus 63 direct is fastest.", "ما في مترو أو قطار سريع: باص 63 المباشر هو الأسرع.", "אין מטרו או רכבת מהירים: אוטובוס 63 הישיר הוא המהיר ביותר."),
  "~62-74m elevation loss (downhill from Montjuïc).": N("Downhill from Montjuïc (about 62–74 m down).", "نزول من Montjuïc (حوالي 62–74 م).", "ירידה מ־Montjuïc (כ־62–74 מ׳)."),
  "Direct bus 55 or 121.": N("Bus 55 or 121, direct.", "باص 55 أو 121 مباشر.", "אוטובוס 55 או 121 ישיר."),
  "Fastest: L2+L4 metro combo.": N("Fastest: metro L2, then L4.", "الأسرع: مترو L2 ثم L4.", "הכי מהיר: מטרו L2 ואז L4."),
  "No simple direct line -- fastest is a rail (S2/L6/S1) combo.": N("No simple direct line: fastest is a local train (S2/L6/S1) with a change.", "ما في خط مباشر بسيط: الأسرع قطار محلي (S2/L6/S1) مع تبديل.", "אין קו ישיר פשוט: הכי מהיר רכבת פרברים (S2/L6/S1) עם החלפה."),
  "Fastest: L7 metro + Funicular Cuca de Llum (Tramvia Blau).": N("Fastest: train L7, then the Funicular Cuca de Llum.", "الأسرع: قطار L7 ثم Funicular Cuca de Llum.", "הכי מהיר: רכבת L7 ואז Funicular Cuca de Llum."),
  "Fastest: bus L9/5X9/5 or L1+L3 metro combo.": N("Fastest: bus L9 or metro L1 then L3.", "الأسرع: باص L9 أو مترو L1 ثم L3.", "הכי מהיר: אוטובוס L9 או מטרו L1 ואז L3."),
  "~62-74m elevation gain (uphill to Montjuïc).": N("Uphill to Montjuïc (about 62–74 m up).", "طلعة لـ Montjuïc (حوالي 62–74 م صعود).", "עלייה ל־Montjuïc (כ־62–74 מ׳ טיפוס)."),
  "Fastest: direct bus 55.": N("Fastest: bus 55, direct.", "الأسرع: باص 55 مباشر.", "הכי מהיר: אוטובוס 55 ישיר."),
  "Fastest: direct L3 metro from Diagonal station.": N("Fastest: metro L3 from Diagonal station.", "الأسرع: مترو L3 من محطة Diagonal.", "הכי מהיר: מטרו L3 מתחנת Diagonal."),
  "Fastest: bus 59 or direct L4 metro.": N("Fastest: bus 59 or metro L4 direct.", "الأسرع: باص 59 أو مترو L4 مباشر.", "הכי מהיר: אוטובוס 59 או מטרו L4 ישיר."),
  "No single fast line -- fastest is an L3+bus 119 combo.": N("No single fast line: fastest is metro L3, then bus 119.", "ما في خط واحد سريع: الأسرع مترو L3 ثم باص 119.", "אין קו מהיר אחד: הכי מהיר מטרו L3 ואז אוטובוס 119."),
  "~93-105m elevation loss (downhill from Montjuïc).": N("Downhill from Montjuïc (about 93–105 m down).", "نزول من Montjuïc (حوالي 93–105 م).", "ירידה מ־Montjuïc (כ־93–105 מ׳)."),
  "No fast rail option -- direct bus 22 is fastest.": N("No fast metro or train: bus 22 direct is fastest.", "ما في مترو أو قطار سريع: باص 22 المباشر هو الأسرع.", "אין מטרו או רכבת מהירים: אוטובוס 22 הישיר הוא המהיר ביותר."),
  "Direct L3 metro from Liceu station.": N("Metro L3, direct from Liceu station.", "مترو L3 مباشر من محطة Liceu.", "מטרו L3 ישיר מתחנת Liceu."),
  "Fastest: direct L3 metro from Liceu station.": N("Fastest: metro L3 from Liceu station.", "الأسرع: مترو L3 من محطة Liceu.", "הכי מהיר: מטרו L3 מתחנת Liceu."),
  "Fastest: direct bus D50.": N("Fastest: bus D50, direct.", "الأسرع: باص D50 مباشر.", "הכי מהיר: אוטובוס D50 ישיר."),
  "Fastest: direct L4 metro from Barceloneta station.": N("Fastest: metro L4 from Barceloneta station.", "الأسرع: مترو L4 من محطة Barceloneta.", "הכי מהיר: מטרו L4 מתחנת Barceloneta."),
  "Fastest: direct bus D40 or 27.": N("Fastest: bus D40 or 27, direct.", "الأسرع: باص D40 أو 27 مباشر.", "הכי מהיר: אוטובוס D40 או 27 ישיר."),
  "Fastest: L3+L2 metro combo.": N("Fastest: metro L3, then L2.", "الأسرع: مترو L3 ثم L2.", "הכי מהיר: מטרו L3 ואז L2."),
  "Fastest: direct L3 metro from Poble Sec station.": N("Fastest: metro L3 from Poble Sec station.", "الأسرع: مترو L3 من محطة Poble Sec.", "הכי מהיר: מטרו L3 מתחנת Poble Sec."),
  "Fastest: direct L4 metro from Urquinaona station.": N("Fastest: metro L4 from Urquinaona station.", "الأسرع: مترو L4 من محطة Urquinaona.", "הכי מהיר: מטרו L4 מתחנת Urquinaona."),
  "Metro L4, direct, from Barceloneta.": N("Metro L4, direct from Barceloneta.", "مترو L4 مباشر من Barceloneta.", "מטרו L4 ישיר מ־Barceloneta."),
  "Real elevation gain and stairs along the route -- not flat.": N("A real climb with stairs; not flat.", "طلعة حقيقية وفيها درج؛ مش مستوية.", "עלייה של ממש עם מדרגות; לא מישורי."),
  "Funicular de Montjuïc from Paral·lel; several comparable bus alternatives exist.": N("The Montjuïc funicular from Paral·lel; several buses take about as long.", "تلفريك Montjuïc (Funicular) من Paral·lel؛ وفي باصات بتاخد وقت قريب.", "הפוניקולר של Montjuïc מ־Paral·lel; כמה אוטובוסים לוקחים זמן דומה."),
  "Bus V11, direct.": N("Bus V11, direct.", "باص V11 مباشر.", "אוטובוס V11 ישיר."),
  "Real elevation gain (~67m) and explicit stairs climbing to Montjuïc -- not flat.": N("A real climb to Montjuïc (about 67 m) with stairs; not flat.", "طلعة حقيقية لـ Montjuïc (حوالي 67 م) وفيها درج؛ مش مستوية.", "עלייה של ממש ל־Montjuïc (כ־67 מ׳) עם מדרגות; לא מישורי."),
  "Metro L3, direct, from Liceu, every ~5 min.": N("Metro L3, direct from Liceu; trains about every 5 min.", "مترو L3 مباشر من Liceu؛ قطار كل 5 دقائق تقريبًا.", "מטרו L3 ישיר מ־Liceu; רכבת בערך כל 5 דקות."),
  "Fastest driving option but heavier-than-usual traffic at verification time.": N("Fastest by car, but traffic can be heavy.", "الأسرع بالسيارة، بس ممكن تكون الزحمة قوية.", "הכי מהיר ברכב, אבל עלולים להיות עומסי תנועה."),
  "Metro L3, direct, from Paral·lel.": N("Metro L3, direct from Paral·lel.", "مترو L3 مباشر من Paral·lel.", "מטרו L3 ישיר מ־Paral·lel."),
  "Much heavier than usual traffic at verification time.": N("Traffic can be much heavier than usual.", "الزحمة ممكن تكون أقوى بكثير من العادة.", "התנועה עלולה להיות כבדה בהרבה מהרגיל."),
  "Heavier than usual traffic; one-way-street detour.": N("Traffic can be heavy, and one-way streets mean a detour.", "ممكن تكون الزحمة قوية، والشوارع باتجاه واحد بتطوّل الطريق.", "עלולים להיות עומסים, ורחובות חד־סטריים מאריכים את הדרך."),
  "Real elevation gain (~101m) via Via Augusta/Carrer de Balmes -- not flat, no stairs.": N("A real climb (about 101 m) via Via Augusta / Carrer de Balmes; no stairs.", "طلعة حقيقية (حوالي 101 م) عبر Via Augusta / Carrer de Balmes؛ بدون درج.", "עלייה של ממש (כ־101 מ׳) דרך Via Augusta / Carrer de Balmes; בלי מדרגות."),
  "FGC L7, direct, from Gracia, every ~8 min.": N("FGC train L7, direct from Gràcia; about every 8 min.", "قطار FGC L7 مباشر من Gràcia؛ كل 8 دقائق تقريبًا.", "רכבת FGC L7 ישירה מ־Gràcia; בערך כל 8 דקות."),
  "Metro L3, direct, from Diagonal, every ~5 min.": N("Metro L3, direct from Diagonal; trains about every 5 min.", "مترو L3 مباشر من Diagonal؛ قطار كل 5 دقائق تقريبًا.", "מטרו L3 ישיר מ־Diagonal; רכבת בערך כל 5 דקות."),
  "Real elevation gain (~61m) and explicit stairs climbing to Montjuïc -- not flat.": N("A real climb to Montjuïc (about 61 m) with stairs; not flat.", "طلعة حقيقية لـ Montjuïc (حوالي 61 م) وفيها درج؛ مش مستوية.", "עלייה של ממש ל־Montjuïc (כ־61 מ׳) עם מדרגות; לא מישורי."),
  "Several comparable bus routes (121, X3, 55) -- no single dominant line.": N("Several buses take about as long (121, X3, 55).", "في أكثر من باص بياخد وقت قريب (121، X3، 55).", "כמה אוטובוסים לוקחים זמן דומה (121, X3, 55)."),
  "One-way streets force a detour; much slower than walking.": N("One-way streets mean a detour; much slower than walking.", "الشوارع باتجاه واحد بتطوّل الطريق؛ أبطأ بكثير من المشي.", "רחובות חד־סטריים מאריכים את הדרך; הרבה יותר איטי מהליכה."),
  "Two short staircase segments in the Gothic Quarter's historic alleys.": N("Two short flights of stairs in the old alleys of the Gothic Quarter.", "في درجين قصار بأزقة الحي القوطي (Gothic Quarter) القديمة.", "שני קטעי מדרגות קצרים בסמטאות העתיקות של הרובע הגותי (Gothic Quarter)."),
  "Metro L4, direct, from Urquinaona, every ~5 min.": N("Metro L4, direct from Urquinaona; trains about every 5 min.", "مترو L4 مباشر من Urquinaona؛ قطار كل 5 دقائق تقريبًا.", "מטרו L4 ישיר מ־Urquinaona; רכבת בערך כל 5 דקות."),
  "Destination is in the pedestrianized Gothic Quarter core -- not a realistic driving choice despite Google's nominal time.": N("The destination is in the pedestrian heart of the Gothic Quarter; driving there isn't practical.", "المكان بقلب الحي القوطي المخصّص للمشاة؛ السواقة لهناك مش عملية.", "היעד בלב הרובע הגותי המיועד להולכי רגל; נסיעה ברכב לשם לא מעשית."),
  "Bus 39, infrequent (~every 15 min); no material advantage over walking.": N("Bus 39 runs about every 15 min and isn't much faster than walking.", "باص 39 بيمرّ كل 15 دقيقة تقريبًا ومش أسرع بكثير من المشي.", "אוטובוס 39 עובר בערך כל 15 דקות ולא הרבה יותר מהיר מהליכה."),
  "Real elevation gain (~74m) and explicit stairs climbing the Montjuic hillside -- not flat.": N("A real climb up the Montjuïc hillside (about 74 m) with stairs; not flat.", "طلعة حقيقية على تلة Montjuïc (حوالي 74 م) وفيها درج؛ مش مستوية.", "עלייה של ממש במדרון Montjuïc (כ־74 מ׳) עם מדרגות; לא מישורי."),
  "Funicular de Montjuic (FM), direct, from Paral·lel, every ~10 min.": N("The Montjuïc funicular, direct from Paral·lel; about every 10 min.", "تلفريك Montjuïc (Funicular) مباشر من Paral·lel؛ كل 10 دقائق تقريبًا.", "הפוניקולר של Montjuïc, ישיר מ־Paral·lel; בערך כל 10 דקות."),
  "Bus D20/H14; no material advantage over walking.": N("Bus D20 or H14; not much faster than walking.", "باص D20 أو H14؛ مش أسرع بكثير من المشي.", "אוטובוס D20 או H14; לא הרבה יותר מהיר מהליכה."),
  "Destination is on a narrow old-town Gothic Quarter street -- not a realistic driving choice.": N("The destination is on a narrow old street in the Gothic Quarter; driving there isn't practical.", "المكان بشارع ضيّق وقديم بالحي القوطي؛ السواقة لهناك مش عملية.", "היעד ברחוב צר ועתיק ברובע הגותי; נסיעה ברכב לשם לא מעשית."),
  "Bus 120; slower than walking.": N("Bus 120; slower than walking.", "باص 120؛ أبطأ من المشي.", "אוטובוס 120; איטי יותר מהליכה."),
  "Traffic-dependent; destination is inside the pedestrianized Mercat de la Boqueria.": N("Depends on traffic; the market (Mercat de la Boqueria) is pedestrian-only inside.", "حسب الزحمة؛ والسوق (Mercat de la Boqueria) للمشاة من جوّا.", "תלוי בתנועה; השוק (Mercat de la Boqueria) מיועד להולכי רגל בפנים."),
  "Real elevation gain (~59m) and an explicit stairs segment crossing the Montjuic hill park -- not flat.": N("A real climb through the Montjuïc park (about 59 m) with stairs; not flat.", "طلعة حقيقية عبر حديقة Montjuïc (حوالي 59 م) وفيها درج؛ مش مستوية.", "עלייה של ממש דרך הפארק של Montjuïc (כ־59 מ׳) עם מדרגות; לא מישורי."),
  "Bus 150, direct, single dominant line with several visible departures.": N("Bus 150, direct; it runs often.", "باص 150 مباشر وبيمرّ كثير.", "אוטובוס 150 ישיר; עובר לעיתים קרובות."),
  "Real elevation gain (~81m) and two explicit stairs segments climbing to Fundacio Joan Miro -- not flat.": N("A real climb to Fundació Joan Miró (about 81 m) with two flights of stairs; not flat.", "طلعة حقيقية لـ Fundació Joan Miró (حوالي 81 م) وفيها درجين؛ مش مستوية.", "עלייה של ממש עד Fundació Joan Miró (כ־81 מ׳) עם שני קטעי מדרגות; לא מישורי."),
};

/** Internal marker appended by plannerRouteLegs.resolveLeg when a walking time is reused in the other direction. */
const INTERNAL_REVERSE = /\s*Reverse-direction reuse of \S+ -> \S+ \(walking only, short\/flat path\)\.\s*/g;

const ARABIC = /[؀-ۿ]/;
const HEBREW = /[֐-׿]/;
const inLanguageScript = (text: string, lang: PlanLanguage) => (lang === "ar" ? ARABIC.test(text) : lang === "he" ? HEBREW.test(text) : !ARABIC.test(text) && !HEBREW.test(text));
const missing = new Set<string>();
export function getMissingTransportNotes(): string[] {
  return [...missing];
}

/**
 * The note a customer sees for a transport option, or null when there is nothing useful to show.
 * `note` is the value from the plan (already translated for Prague's Arabic notes by localizePlan).
 */
export function transportNoteText(note: string | undefined, lang: PlanLanguage): string | null {
  if (!note) return null;
  const cleaned = note.replace(INTERNAL_REVERSE, " ").trim();
  if (!cleaned) return null;
  if (Object.prototype.hasOwnProperty.call(TRANSPORT_NOTES, cleaned)) {
    const entry = TRANSPORT_NOTES[cleaned];
    return entry ? entry[lang] : null;
  }
  // Not a Barcelona research note: Prague's estimate note (Arabic source, already translated by localizePlan) is shown as is.
  // A note whose script does not match the page language has no reviewed wording: shown as stored and logged, never guessed.
  if (!inLanguageScript(cleaned, lang) && !missing.has(cleaned)) {
    missing.add(cleaned);
    if (typeof console !== "undefined") console.warn("[plan-i18n] missing transport note:", cleaned);
  }
  return cleaned;
}
