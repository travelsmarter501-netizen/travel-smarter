import type { Area, Attraction, Experience, FoodCategory, FoodPlace, NightlifeVenue, ShoppingArea } from "../../guideTypes";
import type { HoursDateException, HoursInfo, RecurringMonthlyClosure, SeasonalSchedule, TimeRange, Weekday, WeeklySchedule } from "../../hours";
import type { CityPlaceData } from "../cityPlannerModule";

/**
 * Budapest -- PLANNER place data (local review prototype, 2026-11-13). NOT public: plannerDestinations.ts keeps Budapest
 * `available: false`; only the local preview switch enables it.
 *
 * Only data verified on the place's own (or its operator's) site on 2026-11-13 is stored as fact; the source and its period are on
 * each entry. Where the source publishes no hours for the trip's dates, hours are left out or stored as `variable` text, never
 * assumed. The full research record (sources, periods, gaps) is the review file budapest-research.md.
 *
 * NOT schedulable here on purpose (owner decisions 2026-11-13): activities whose eligibility the questionnaire cannot know (age limits,
 * single-gender sessions: Széchenyi, Rudas, Hospital in the Rock), activities without verified times for the trip's dates (Hospital
 * in the Rock tour slots, Matthias Church interior, Parliament interior, Dohány Synagogue on flexible dates). They are suggestions
 * with their information and official link (no planner metadata, so they are never scheduled or offered by the "add" button).
 * No photos yet (rights not checked): every card handles `image: ""`.
 */

const VERIFIED = "2026-11-13";

const ALL_WEEKDAYS: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const TUE_TO_SUN: Weekday[] = ["tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function everyDay(...ranges: [string, string][]): WeeklySchedule {
  const intervals = ranges.map(([open, close]) => ({ open, close }));
  return Object.fromEntries(ALL_WEEKDAYS.map((day) => [day, intervals])) as WeeklySchedule;
}
function days(list: Weekday[], ...ranges: [string, string][]): WeeklySchedule {
  const intervals = ranges.map(([open, close]) => ({ open, close }));
  return Object.fromEntries(list.map((day) => [day, intervals])) as WeeklySchedule;
}
function fixed(sched: WeeklySchedule, sourceUrl: string, source: string): HoursInfo {
  return { type: "fixed", schedule: sched, source, sourceUrl, lastVerified: VERIFIED };
}
function variable(display: string, sourceUrl: string, source: string, closedWeekdays?: Weekday[]): HoursInfo {
  return { type: "variable", display, ...(closedWeekdays ? { closedWeekdays } : {}), source, sourceUrl, lastVerified: VERIFIED };
}
function alwaysOpen(sourceUrl: string, source: string): HoursInfo {
  return { type: "always-open", source, sourceUrl, lastVerified: VERIFIED };
}
function maps(query: string) {
  const q = encodeURIComponent(`${query}, Budapest`).replace(/%20/g, "+");
  return { mapsUrl: `https://www.google.com/maps/search/?api=1&query=${q}`, appleMapsUrl: `https://maps.apple.com/?q=${q}` };
}

// ── Areas ──────────────────────────────────────────────────────────────────────────────────────────
export const BUDAPEST_AREAS: Area[] = [
  { id: "lipotvaros", name: "Lipótváros", description: "حي البرلمان والكاتدرائية على ضفة Pest.", image: "", ...maps("Lipótváros"), attractionIds: ["parliament-exterior", "shoes-on-the-danube", "st-stephens-basilica", "chain-bridge"] },
  { id: "belvaros", name: "Belváros", description: "وسط Pest القديم: Váci utca والسوق المركزي.", image: "", ...maps("Belváros"), attractionIds: [] },
  { id: "castle-hill", name: "Budavár", description: "تلة القلعة على ضفة Buda.", image: "", ...maps("Budavár"), attractionIds: ["fishermans-bastion", "matthias-church-exterior", "hungarian-national-gallery"] },
  { id: "gellert-hill", name: "Gellért-hegy", description: "تلة Gellért وCitadella فوق النهر.", image: "", ...maps("Gellért Hill"), attractionIds: ["citadella"] },
  { id: "terezvaros", name: "Terézváros", description: "شارع Andrássy ودار الأوبرا.", image: "", ...maps("Terézváros"), attractionIds: ["opera-house-tour"] },
  { id: "erzsebetvaros", name: "Erzsébetváros", description: "الحي اليهودي التاريخي.", image: "", ...maps("Erzsébetváros"), attractionIds: [] },
  { id: "palotanegyed", name: "Palotanegyed", description: "حي المتحف الوطني.", image: "", ...maps("Palotanegyed"), attractionIds: ["hungarian-national-museum"] },
  { id: "city-park", name: "Városliget", description: "حديقة المدينة وساحة الأبطال.", image: "", ...maps("Városliget"), attractionIds: ["heroes-square", "vajdahunyad-castle", "budapest-zoo", "house-of-music", "museum-of-fine-arts"] },
  { id: "margaret-island", name: "Margitsziget", description: "الجزيرة الخضرا بنص الدانوب.", image: "", ...maps("Margaret Island"), attractionIds: ["margaret-island"] },
];

type AttractionInput = Omit<Attraction, "image" | "mapsUrl" | "appleMapsUrl" | "lastVerified"> & { mapsQuery: string };
function attraction(input: AttractionInput): Attraction {
  const { mapsQuery, ...rest } = input;
  return { image: "", ...maps(mapsQuery), lastVerified: VERIFIED, ...rest };
}

// ── Attractions (schedulable) ──────────────────────────────────────────────────────────────────────
export const BUDAPEST_ATTRACTIONS: Attraction[] = [
  attraction({
    id: "st-stephens-basilica",
    name: "St. Stephen's Basilica (Szent István-bazilika)",
    mapsQuery: "St. Stephen's Basilica",
    description: "أكبر كنيسة ببودابست. الزيارة بالخطة: الكنيسة مع التراس البانورامي فوق القبة (تذكرة مشتركة).",
    whyRecommend: "من أعلى الإطلالات على Pest، وجنب البرلمان مشيًا.",
    areaId: "lipotvaros",
    duration: "ساعة وربع تقريبًا",
    priceType: "paid",
    bookingStatus: "بدون حجز",
    bestTime: "الصبح",
    tip: "الكنيسة الإثنين–السبت 9:00–18:00 والأحد من 13:00 بس؛ التراس والخزنة كل يوم 9:00–19:00. التذكرة المشتركة 6,800 HUF للبالغ (الكنيسة لحالها 2,600). آخر دخول مش منشور.",
    officialUrl: "https://bazilikabudapest.hu",
    mustSee: true,
    address: "Szent István tér 1, 1051 Budapest",
    priceText: "6,800 HUF (بالغ، الكنيسة والتراس) · الكنيسة لحالها 2,600 HUF",
    // bazilikabudapest.hu/jegyarak (footer + price list "valid from 1 December 2025"): church Mon-Sat 9-18, Sun 13-18; terrace daily 9-19.
    // The combined visit is planned on the CHURCH hours (the narrower of the two).
    hours: fixed({ ...days(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"], ["09:00", "18:00"]), sunday: [{ open: "13:00", close: "18:00" }] }, "https://bazilikabudapest.hu/jegyarak/", "bazilikabudapest.hu (official)"),
    coordinates: { lat: 47.5007189, lng: 19.0533363 }, // OSM node/11172119967, entrance=yes (west façade)
  }),
  attraction({
    id: "parliament-exterior",
    name: "Hungarian Parliament (from outside, Kossuth tér)",
    mapsQuery: "Hungarian Parliament Building",
    description: "مبنى البرلمان من الخارج، من ساحة Kossuth وضفة الدانوب. الزيارة الداخلية بجولة وحجز، ومش ضمن الخطة.",
    whyRecommend: "أشهر مبنى ببودابست.",
    areaId: "lipotvaros",
    duration: "20 دقيقة تقريبًا",
    priceType: "free",
    bookingStatus: "بدون حجز",
    bestTime: "أي وقت",
    tip: "الجولة الداخلية بحجز مسبق من مركز الزوار؛ سعرها ومواعيدها ما قدرنا نتحقق منهم من المصدر الرسمي، فهي خيار إضافي إلك.",
    officialUrl: "https://www.parlament.hu",
    mustSee: true,
    address: "Kossuth Lajos tér 1-3, 1055 Budapest",
    locationLabel: "نقطة مقترحة للبدء",
    coordinates: { lat: 47.5057199, lng: 19.0449808 }, // OSM: Kossuth Lajos tér (square point), a public square
  }),
  attraction({
    id: "shoes-on-the-danube",
    name: "Shoes on the Danube Bank (Cipők a Duna-parton)",
    mapsQuery: "Shoes on the Danube Bank",
    description: "نصب تذكاري لضحايا 1944–1945 على ضفة الدانوب، جنب البرلمان.",
    whyRecommend: "محطة قصيرة ومؤثرة على طريق البرلمان.",
    areaId: "lipotvaros",
    duration: "10 دقائق",
    priceType: "free",
    bookingStatus: "بدون حجز",
    bestTime: "أي وقت",
    tip: "على الرصيف النهري، بين البرلمان وجسر السلاسل.",
    mustSee: false,
    address: "Id. Antall József rakpart, 1054 Budapest",
    coordinates: { lat: 47.5039715, lng: 19.0447906 }, // OSM node/260536715 historic=memorial
  }),
  attraction({
    id: "chain-bridge",
    name: "Széchenyi Chain Bridge (Széchenyi Lánchíd)",
    mapsQuery: "Széchenyi Chain Bridge",
    description: "أقدم جسر ثابت على الدانوب ببودابست، بين Pest وتلة القلعة.",
    whyRecommend: "المشي عليه طريق طبيعي من Pest للقلعة.",
    areaId: "lipotvaros",
    duration: "15 دقيقة",
    priceType: "free",
    bookingStatus: "بدون حجز",
    bestTime: "أي وقت",
    tip: "",
    mustSee: true,
    address: "Széchenyi István tér, 1051 Budapest",
    coordinates: { lat: 47.5000802, lng: 19.0466475 }, // OSM: Széchenyi István tér (Pest end of the bridge)
  }),
  attraction({
    id: "fishermans-bastion",
    name: "Fisherman's Bastion (Halászbástya)",
    mapsQuery: "Fisherman's Bastion",
    description: "تراسات وأبراج فوق تلة القلعة بإطلالة على البرلمان والدانوب.",
    whyRecommend: "أشهر إطلالة ببودابست.",
    areaId: "castle-hill",
    duration: "40 دقيقة تقريبًا",
    priceType: "paid",
    bookingStatus: "بدون حجز",
    bestTime: "الصبح بدري",
    tip: "التراسات مفتوحة كل السنة. الأبراج والتراسات العليا مدفوعة بس من 9:00 لـ19:00 (من 1 حزيران لـ30 أيلول لـ21:00)، وببلاش برّا هالساعات وبالأعياد الوطنية و24–31 كانون الأول (جدول 2026). الدفع بالكرت.",
    officialUrl: "https://fishermansbastion.com",
    mustSee: true,
    address: "Szentháromság tér, 1014 Budapest",
    priceText: "1,700 HUF (التراسات العليا بساعات الدفع؛ فئة السعر مش مكتوبة)",
    hours: alwaysOpen("https://fishermansbastion.com/", "fishermansbastion.com (operator)"),
    coordinates: { lat: 47.5023053, lng: 19.0346998 }, // OSM relation/17948384 (open terraces, no single entrance)
  }),
  attraction({
    id: "matthias-church-exterior",
    name: "Matthias Church (from outside, Szentháromság tér)",
    mapsQuery: "Matthias Church",
    description: "الكنيسة القوطية بسقفها الملون، من الساحة جنب حصن الصيادين. الدخول لجوا خيار إضافي.",
    whyRecommend: "من أجمل مباني تلة القلعة، وعلى بعد خطوات من الحصن.",
    areaId: "castle-hill",
    duration: "15 دقيقة",
    priceType: "free",
    bookingStatus: "بدون حجز",
    bestTime: "أي وقت",
    tip: "الدخول لجوا 3,400 HUF (بالغ). موقع الكنيسة بينشر ساعات «اليوم» بس (13 تشرين الثاني: 9:00–17:00، آخر دخول 16:45)، والطقوس والوفود لها أولوية، فما حطّينا الدخول بالجدول. البرج تذكرة بموعد (197 درجة).",
    officialUrl: "https://matyas-templom.hu",
    mustSee: false,
    address: "Szentháromság tér 2, 1014 Budapest",
    coordinates: { lat: 47.5020118, lng: 19.0342109 }, // OSM way/37135081
  }),
  attraction({
    id: "hungarian-national-gallery",
    name: "Hungarian National Gallery (Buda Castle)",
    mapsQuery: "Hungarian National Gallery",
    description: "الفن المجري من القرون الوسطى لليوم، بقصر بودا. التذكرة بتشمل القبة (54 درجة) حسب الطقس.",
    whyRecommend: "أكبر مجموعة فن مجري، ومن القبة إطلالة على المدينة.",
    areaId: "castle-hill",
    duration: "ساعتين تقريبًا (المتحف بيقترح 1.5–3 ساعات)",
    priceType: "paid",
    bookingStatus: "بدون حجز",
    bestTime: "بعد الظهر",
    tip: "القبة مفتوحة ضمن ساعات المتحف ولحد 17:00 بالأكثر، حسب الطقس، ولحد 15 شخص بالمرة. الدخول ببلاش للكل 15 مارس و20 أغسطس و23 أكتوبر.",
    officialUrl: "https://en.mng.hu",
    mustSee: false,
    address: "Szent György tér 2, 1014 Budapest",
    priceText: "5,800 HUF (بالغ، كامل) · مخفّض 2,900 حسب العمر",
    // `variable` (not `fixed`) so the plan can end visits at 17:30 (halls start closing) while the card shows the building's 10:00-18:00.
    // Customer text approved by the owner 2026-11-14 (holiday dates first, with their years; last entry per listed day; the 17:30 hall
    // closing only for regular days). English / Hebrew in planCatalog.ts (Hebrew not yet reviewed).
    hours: variable("مواعيد العطلة: 24–25 ديسمبر 2026 مسكّر · 26–30 ديسمبر 2026 (ومعها الإثنين 28) 10:00–18:00، آخر دخول 17:00 · 31 ديسمبر 2026 10:00–16:00، آخر دخول 15:00 · 1 يناير 2027 12:00–18:00، آخر دخول 17:00 — المواعيد العادية: الثلاثاء–الأحد 10:00–18:00، آخر دخول 17:00، والقاعات بتبلش تسكّر 17:30 · الإثنين مسكّر", "https://en.mng.hu/opening-hours/", "en.mng.hu (official)", ["monday"]),
    coordinates: { lat: 47.496282, lng: 19.039849 }, // OSM node/5842060882 entrance=main ref=C
  }),
  attraction({
    id: "hungarian-national-museum",
    name: "Hungarian National Museum",
    mapsQuery: "Hungarian National Museum",
    description: "تاريخ هنغاريا من العصور القديمة لليوم، بمبنى كلاسيكي.",
    whyRecommend: "أهم متحف تاريخي بالمدينة.",
    areaId: "palotanegyed",
    duration: "ساعة ونص تقريبًا",
    priceType: "paid",
    bookingStatus: "بدون حجز",
    bestTime: "أي وقت بالنهار",
    tip: "الشباك لحد 17:00. في قاعات مسكّرة للترميم من 2 كانون الأول 2025، ومعطف التتويج مسكّر حاليًا (حسب موقع المتحف).",
    officialUrl: "https://mnm.hu/en",
    mustSee: false,
    address: "Múzeum krt. 14-16, 1088 Budapest",
    priceText: "3,500 HUF (بالغ، كامل) · المخفّض لمواطني هنغاريا وEEA بس",
    hours: fixed(days(TUE_TO_SUN, ["10:00", "18:00"]), "https://mnm.hu/en", "mnm.hu (official)"),
    coordinates: { lat: 47.491101, lng: 19.062318 }, // OSM node/9195573290 entrance=main, Múzeum krt. 14-16
  }),
  attraction({
    id: "museum-of-fine-arts",
    name: "Museum of Fine Arts (Szépművészeti Múzeum)",
    mapsQuery: "Museum of Fine Arts Budapest",
    description: "مصر القديمة والعصور الكلاسيكية والفن الأوروبي لحد 1800، بساحة الأبطال.",
    whyRecommend: "من أكبر متاحف الفن بأوروبا الوسطى.",
    areaId: "city-park",
    duration: "ساعتين تقريبًا",
    priceType: "paid",
    bookingStatus: "بدون حجز",
    bestTime: "أي وقت بالنهار",
    tip: "الدخول لحد 17:00. جمعة واحدة بالشهر (Museum and Slow) من 12:00 والدخول لحد 19:00. مسكّر 24 و25 كانون الأول (جدول 2026).",
    officialUrl: "https://www.mfab.hu",
    mustSee: false,
    address: "Dózsa György út 41, 1146 Budapest",
    priceText: "5,800 HUF (بالغ، كامل) · المخفّض لمواطني EEA وأوكرانيا بس",
    hours: fixed(days(TUE_TO_SUN, ["10:00", "18:00"]), "https://www.mfab.hu/opening-hours-3/", "mfab.hu (official)"),
    coordinates: { lat: 47.515762, lng: 19.076938 }, // OSM node/10463806599 entrance=yes (museum way/25216718)
  }),
  attraction({
    id: "opera-house-tour",
    name: "Hungarian State Opera (OperaTour guided visit)",
    mapsQuery: "Hungarian State Opera House",
    description: "جولة مرشدة بالإنجليزي جوّا دار الأوبرا (60 دقيقة) مع حفلة قصيرة بالآخر.",
    whyRecommend: "من أجمل دور الأوبرا بأوروبا، والجولة بتورجيك القاعات من جوا.",
    areaId: "terezvaros",
    duration: "ساعة",
    priceType: "paid",
    bookingStatus: "يفضل مسبقًا",
    bestTime: "بعد الظهر",
    tip: "الجولات بالإنجليزي كل يوم 13:30 و15:00 و16:30، أقصى 30 شخص، وبتبدأ من مكتب المعلومات بالمدخل. التذاكر بتنزل قبل أسبوع. ما في جولات وقت العروض، والقاعة بتسكّر وقت البروفات (المسار بيتغير).",
    officialUrl: "https://www.opera.hu/en/services/operatour/",
    mustSee: false,
    address: "Andrássy út 22, 1061 Budapest",
    priceText: "12,000 HUF (للشخص، بالإنجليزي)",
    // opera.hu OperaTour: guided only at 13:30, 15:00, 16:30 (60 min). Planned as a window 13:30-17:30 with the start held to a tour slot.
    hours: fixed(everyDay(["13:30", "17:30"]), "https://www.opera.hu/en/services/operatour/", "opera.hu (official)"),
    coordinates: { lat: 47.502466, lng: 19.05868 }, // OSM node/12449555202 entrance=main (Andrássy út)
  }),
  attraction({
    id: "citadella",
    name: "Citadella & Liberty Statue (Gellért Hill)",
    mapsQuery: "Citadella Budapest",
    description: "الحديقة والإطلالات وتمثال الحرية فوق تلة Gellért. المعرض جوا تذكرة اختيارية.",
    whyRecommend: "إطلالة على الجسور والقلعة والبرلمان.",
    areaId: "gellert-hill",
    duration: "45 دقيقة",
    priceType: "free",
    bookingStatus: "بدون حجز",
    bestTime: "قبل الغروب",
    tip: "الحديقة ببلاش: تشرين الثاني–آذار 8:00–22:00، نيسان–تشرين الأول 6:00–24:00. معرض «A Szabadság Bástyája» 4,900 HUF للبالغ بموعد دخول، آخر دخول 16:40 (الجمعة 18:40).",
    officialUrl: "https://citadella.hu",
    mustSee: false,
    address: "Citadella sétány 1, 1118 Budapest",
    hours: variable("الحديقة: تشرين الثاني–آذار 8:00–22:00 · نيسان–تشرين الأول 6:00–24:00", "https://citadella.hu/hu/home", "citadella.hu (official, Várkapitányság)"),
    coordinates: { lat: 47.487191, lng: 19.046005 }, // OSM node/1488958235 entrance=yes (fortress way/829110605)
  }),
  attraction({
    id: "heroes-square",
    name: "Heroes' Square (Hősök tere)",
    mapsQuery: "Heroes' Square Budapest",
    description: "الساحة الكبيرة على مدخل حديقة المدينة، بنصب الألفية.",
    whyRecommend: "من أشهر ساحات المدينة، وبداية طبيعية لحديقة المدينة.",
    areaId: "city-park",
    duration: "20 دقيقة",
    priceType: "free",
    bookingStatus: "بدون حجز",
    bestTime: "أي وقت",
    tip: "",
    mustSee: true,
    address: "Hősök tere, 1146 Budapest",
    coordinates: { lat: 47.5152112, lng: 19.0764759 }, // OSM way/25217448 Hősök tere (square point)
  }),
  attraction({
    id: "vajdahunyad-castle",
    name: "Vajdahunyad Castle (from outside)",
    mapsQuery: "Vajdahunyad Castle",
    description: "قلعة رومانسية على بحيرة حديقة المدينة، من برا.",
    whyRecommend: "مشي جميل بالحديقة وصور.",
    areaId: "city-park",
    duration: "20 دقيقة",
    priceType: "free",
    bookingStatus: "بدون حجز",
    bestTime: "أي وقت",
    tip: "",
    mustSee: false,
    address: "Vajdahunyad sétány, 1146 Budapest",
    coordinates: { lat: 47.5153549, lng: 19.0818753 }, // OSM node/275019091 Vajdahunyad vára (attraction point)
  }),
  attraction({
    id: "budapest-zoo",
    name: "Budapest Zoo & Botanical Garden",
    mapsQuery: "Budapest Zoo",
    description: "من أقدم حدائق الحيوان بالعالم، وفيها Biodome وبيت النخيل وأكواريوم ضمن التذكرة.",
    whyRecommend: "نص يوم ممتع لكل الأعمار.",
    areaId: "city-park",
    duration: "ساعتين ونص تقريبًا",
    priceType: "paid",
    bookingStatus: "بدون حجز",
    bestTime: "الصبح",
    tip: "مفتوحة كل يوم من السنة. الساعات حسب الشهر (من 31 تشرين الأول لآخر شباط 9:00–16:00 وآخر دخول 15:00). تحت 14 سنة ما بيدخلوا بدون بالغ.",
    officialUrl: "https://zoobudapest.com/en",
    mustSee: false,
    address: "Állatkerti krt. 6-12, 1146 Budapest",
    priceText: "5,900 HUF (بالغ) · طفل 2–18: 4,200",
    hours: variable("كانون الثاني–شباط 9–16 · آذار 9–17 (ويكند 17:30) · نيسان 9–17:30 (ويكند 18) · أيار–آب 9–18 (ويكند 19) · أيلول 9–17:30 (ويكند 18) · تشرين الأول 9–17 (ويكند 17:30) · 31 تشرين الأول–كانون الأول 9–16 · آخر دخول قبل ساعة", "https://zoobudapest.com/en/for-visitors/opening-hours/", "zoobudapest.com (official)"),
    coordinates: { lat: 47.517311, lng: 19.07734 }, // OSM node/9104208377 entrance=main, Állatkerti krt. 2-4
  }),
  attraction({
    id: "house-of-music",
    name: "House of Music Hungary: Dimensions of Sound",
    mapsQuery: "House of Music Hungary",
    description: "معرض تفاعلي عن تاريخ الموسيقى الأوروبية والمجرية، بسماعات وبمسارك، تحت مبنى بيت الموسيقى بحديقة المدينة.",
    whyRecommend: "تجربة صوتية مختلفة، وبدون حدود عمر.",
    areaId: "city-park",
    duration: "ساعتين (المتحف بيقترح 2–3 ساعات)",
    priceType: "paid",
    bookingStatus: "يفضل مسبقًا",
    bestTime: "أي وقت بالنهار",
    tip: "الدخول بفترات كل نص ساعة (10:15، 10:45...)؛ آخر دخول 16:15 (الجمعة 17:45). مسكّر الإثنين وأول ثلاثاء بكل شهر. تذاكر الويكند بتخلص بسرعة. خزانة الملابس إلزامية.",
    officialUrl: "https://zenehaza.hu/en/occasion/dimensions-of-sound-musical-journey-through-space-and-time",
    mustSee: false,
    address: "Olof Palme sétány 3, 1146 Budapest",
    // zenehaza.hu (occasion page): Tue-Thu, Sat, Sun 10:15-17:50, last admission 16:15; Fri 10:15-19:50, last 17:45; closed Monday.
    // Location page: also closed the first Tuesday of each month (stricter rule kept, as date exceptions below).
    hours: fixed({ ...days(["tuesday", "wednesday", "thursday", "saturday", "sunday"], ["10:15", "17:50"]), friday: [{ open: "10:15", close: "19:50" }] }, "https://zenehaza.hu/en/occasion/dimensions-of-sound-musical-journey-through-space-and-time", "zenehaza.hu (official)"),
    coordinates: { lat: 47.512794, lng: 19.083528 }, // OSM node/9344029111 entrance=main
  }),
  attraction({
    id: "margaret-island",
    name: "Margaret Island (Margitsziget)",
    mapsQuery: "Margaret Island",
    description: "جزيرة خضرا بنص الدانوب: حدائق وممرات وبرج المي.",
    whyRecommend: "أكبر مساحة خضرا بوسط المدينة، ومشي هادي.",
    areaId: "margaret-island",
    duration: "ساعة ونص تقريبًا",
    priceType: "free",
    bookingStatus: "بدون حجز",
    bestTime: "بعد الظهر",
    tip: "النقطة بالخطة عند النافورة. مواعيد النافورة الموسيقية والحديقة اليابانية ما تحققنا منها.",
    mustSee: false,
    address: "Margitsziget, 1007 Budapest",
    locationLabel: "نقطة مقترحة للبدء",
    coordinates: { lat: 47.5187875, lng: 19.0448154 }, // OSM way/180740489 Zenélő szökőkút
  }),
  // ── Suggestions only (no planner metadata: never scheduled, never offered by "add") ──────────────
  attraction({
    id: "szechenyi-bath",
    name: "Széchenyi Thermal Bath (conditional)",
    mapsQuery: "Széchenyi Thermal Bath",
    description: "أشهر حمّام حراري ببودابست، مسابح داخلية وخارجية، مختلط بلباس سباحة.",
    whyRecommend: "تجربة الحمّامات الحرارية.",
    areaId: "city-park",
    duration: "2.5–3 ساعات",
    priceType: "paid",
    bookingStatus: "يفضل مسبقًا",
    bestTime: "بعد الظهر",
    tip: "⚠️ بشرط: ممنوع تحت 14 سنة من 1 آب 2025 (إلا بشهادة طبية موافق عليها مسبقًا). مختلط، بلباس سباحة مخصص بس (منه البوركيني). التذاكر الأونلاين ما بترجع ولا بتتغير.",
    officialUrl: "https://www.szechenyibath.hu",
    mustSee: false,
    address: "Állatkerti krt. 9-11, 1146 Budapest",
    priceText: "13,200 HUF (الإثنين–الخميس) · 14,800 (الجمعة والويكند) · 15,800 (الأعياد)",
    hours: fixed({ ...days(["monday", "tuesday", "wednesday", "thursday"], ["07:00", "20:00"]), friday: [{ open: "07:00", close: "22:00" }], ...days(["saturday", "sunday"], ["08:00", "20:00"]) }, "https://www.szechenyibath.hu/", "szechenyibath.hu (official)"),
    coordinates: { lat: 47.519251, lng: 19.081139 }, // OSM node/2753450424 entrance=main
  }),
  attraction({
    id: "hospital-in-the-rock",
    name: "Hospital in the Rock (conditional)",
    mapsQuery: "Hospital in the Rock",
    description: "مستشفى وملجأ نووي تحت تلة القلعة، بجولة مرشدة 60 دقيقة.",
    whyRecommend: "تاريخ الحرب العالمية الثانية والحرب الباردة.",
    areaId: "castle-hill",
    duration: "ساعة",
    priceType: "paid",
    bookingStatus: "يفضل مسبقًا",
    bestTime: "أي وقت بالنهار",
    tip: "⚠️ بشرط: ممنوع تحت 6 سنين، ومش منصوح فيه تحت 12. بجولة بس، كل يوم 10:00–19:00 وآخر جولة 18:00؛ مواعيد الجولات بالضبط ما تحققنا منها، فما انحطت بالجدول. البرنامج بالإنجليزي 30 EUR للبالغ بيندفع بالفورنت.",
    officialUrl: "https://www.sziklakorhaz.eu/en",
    mustSee: false,
    address: "Lovas út 4/c, 1012 Budapest",
    priceText: "30 EUR (بالغ، بالإنجليزي، بيندفع بالفورنت)",
    coordinates: { lat: 47.500722, lng: 19.031529 }, // OSM node/5124313362 entrance=main
  }),
];

// ── Experiences ────────────────────────────────────────────────────────────────────────────────────
export const BUDAPEST_EXPERIENCES: Experience[] = [
  {
    id: "danube-legend-cruise",
    name: "Danube Legend evening cruise (Legenda)",
    image: "",
    categoryId: "river",
    tags: ["river", "views", "evening"],
    description: "رحلة مسائية ساعة على الدانوب بدليل صوتي، فيها مشروب واحد (منها مي أو مشروب غازي).",
    area: "Belváros (Jane Haining rakpart)",
    address: "Jane Haining rakpart, Dock 7, 1052 Budapest",
    duration: "ساعة",
    priceText: "25 EUR (بالغ) · تحت 10 ببلاش",
    priceVaries: false,
    bookingRequired: false,
    lastVerified: VERIFIED,
    // legenda.hu timetable 2026: evening departures every 20 minutes from a first departure that changes by period, last 21:00 or 22:00.
    hours: variable("رحلات مسائية كل 20 دقيقة (جدول 2026 حسب الفترة): 25 تشرين الأول–22 تشرين الثاني من 16:20 لـ21:00 · 23 تشرين الثاني–31 كانون الأول من 15:40 لـ21:00 · 24 كانون الأول بدون رحلات مسائية · 2027 مش منشور", "https://legenda.hu/en/timetable", "legenda.hu (operator)"),
    ...maps("Legenda kikötő Jane Haining rakpart"),
    officialUrl: "https://legenda.hu/en/danube-legend",
  },
];

// ── Food (official hours only) ───────────────────────────────────────────────────────────────────────
export const BUDAPEST_FOOD_CATEGORIES: FoodCategory[] = [
  { id: "cafes", icon: "☕", label: "مقاهي" },
  { id: "local", icon: "🍲", label: "مطبخ هنغاري" },
  { id: "restaurants", icon: "🍴", label: "مطاعم" },
];

/**
 * hoursSchedule: the restaurant's own opening hours (what the customer sees). planningSchedule (optional): a narrower window the
 * planner keeps meals inside (e.g. the kitchen closes before the doors), never shown as the restaurant's hours (same pattern as
 * Prague's mlynec; tripHours.ts keeps it).
 */
type FoodInput = Omit<FoodPlace, "mapsUrl" | "appleMapsUrl" | "lastVerified" | "hours"> & { hoursSchedule: WeeklySchedule; planningSchedule?: WeeklySchedule; sourceUrl: string; hoursSource: string; verified?: string };
function food(input: FoodInput): FoodPlace {
  const { hoursSchedule, planningSchedule, sourceUrl, hoursSource, verified = VERIFIED, ...rest } = input;
  return { ...maps(input.name), lastVerified: verified, hours: { type: "fixed", schedule: hoursSchedule, ...(planningSchedule ? { planningSchedule } : {}), source: hoursSource, sourceUrl, lastVerified: verified }, ...rest };
}

export const BUDAPEST_FOOD_PLACES: FoodPlace[] = [
  food({ id: "hungarikum-bisztro", name: "Hungarikum Bisztró", categoryId: "local", area: "Lipótváros (near Parliament)", address: "Steindl Imre u. 13, 1051 Budapest", why: "مطبخ هنغاري بيتي قرب البرلمان، بحجز من موقعه.", officialUrl: "https://hungarikumbisztro.hu", dietaryTags: ["meat", "pork-maybe"], hoursSchedule: everyDay(["12:00", "14:30"], ["18:00", "22:00"]), sourceUrl: "https://hungarikumbisztro.hu/", hoursSource: "hungarikumbisztro.hu (official)" }),
  food({ id: "menza", name: "Menza", categoryId: "restaurants", area: "Terézváros (Liszt Ferenc tér)", address: "Liszt Ferenc tér 2, 1061 Budapest", why: "مطعم هنغاري وعالمي بساحة Liszt Ferenc، وقائمة غدا يومية.", officialUrl: "https://menzaetterem.hu", dietaryTags: ["meat", "pork-maybe"], hoursSchedule: everyDay(["11:30", "22:30"]), sourceUrl: "https://menzaetterem.hu/", hoursSource: "menzaetterem.hu (official; kitchen 11:30-22:30)" }),
  food({ id: "frici-papa", name: "Frici Papa", categoryId: "local", area: "Erzsébetváros (Király utca)", address: "Király u. 55, 1077 Budapest", why: "أكل هنغاري بيتي بسيط.", officialUrl: "https://www.fricipapa.hu", dietaryTags: ["meat", "pork-maybe"], hoursSchedule: days(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"], ["11:00", "22:00"]), sourceUrl: "https://www.fricipapa.hu/", hoursSource: "fricipapa.hu (official; Sunday not listed)" }),
  food({ id: "21-restaurant", name: "21 Restaurant", categoryId: "local", area: "Budavár (Fortuna utca)", address: "Fortuna u. 21, 1014 Budapest", why: "مطبخ هنغاري معاصر بتلة القلعة.", officialUrl: "https://zsidai.com/hu/21-restaurant/", dietaryTags: ["meat", "pork-maybe"], hoursSchedule: everyDay(["11:30", "23:00"]), sourceUrl: "https://zsidai.com/hu/21-restaurant/", hoursSource: "zsidai.com (official group site)" }),
  food({ id: "pierrot", name: "Pierrot", categoryId: "local", area: "Budavár (Fortuna utca)", address: "Fortuna u. 14, 1014 Budapest", why: "مطعم هنغاري عائلي بتلة القلعة.", officialUrl: "https://zsidai.com/hu/pierrot/", dietaryTags: ["meat", "pork-maybe"], hoursSchedule: days(["wednesday", "thursday", "friday", "saturday", "sunday"], ["11:30", "23:00"]), sourceUrl: "https://zsidai.com/hu/pierrot/", hoursSource: "zsidai.com (official group site)" }),
  food({ id: "new-york-cafe", name: "New York Café", categoryId: "restaurants", area: "Erzsébetváros (Blaha Lujza tér)", address: "Erzsébet krt. 9-11, 1073 Budapest", why: "مقهى تاريخي فخم، وفيه مطبخ ساخن من 12:00.", officialUrl: "https://newyorkcafe.hu", dietaryTags: ["meat", "pork-maybe", "dessert"], hoursSchedule: { ...days(["monday", "tuesday", "wednesday"], ["12:00", "23:00"]), ...days(["thursday", "friday", "saturday", "sunday"], ["12:00", "23:59"]) }, sourceUrl: "https://newyorkcafe.hu/", hoursSource: "newyorkcafe.hu (official; hot kitchen)" }),
  // City Park (Városliget), added 2026-11-15 for the museum days there (Museum of Fine Arts, House of Music, Heroes' Square).
  // Evidence of LUNCH service from the official sites, read 2026-11-15. Arabic "why" texts approved by the owner (2026-11-15).
  // Gundel: shown hours = the restaurant's (every day 11:30-22:00); the kitchen closes at 21:00, so meals are PLANNED to end by 21:00
  // (planningSchedule), which is never shown as the closing time.
  // Robinson (official site: lunch 12:00-16:00, dinner 18:00-23:00) is NOT added: its page publishes no days, and days are not assumed.
  food({ id: "gundel", name: "Gundel", categoryId: "local", area: "Városliget (City Park, next to the Zoo)", address: "Gundel Károly út 4, 1146 Budapest", why: "مطعم للمأكولات الهنغارية قرب حديقة الحيوانات في حديقة المدينة، يقدّم قائمة غداء يومية.", officialUrl: "https://gundel.hu/en/", dietaryTags: ["meat", "pork-maybe"], hoursSchedule: everyDay(["11:30", "22:00"]), planningSchedule: everyDay(["11:30", "21:00"]), sourceUrl: "https://gundel.hu/en/", hoursSource: "gundel.hu (official): open every day 11:30-22:00; lunch menu 11:30-18:00, dinner menu 18:00-22:00; kitchen closes 21:00", verified: "2026-11-15" }),
  food({ id: "varosliget-cafe", name: "Városliget Café", categoryId: "restaurants", area: "Városliget (City Park, by the lake)", address: "Olof Palme sétány 5, 1146 Budapest", why: "مطعم ومقهى قرب البحيرة وقلعة فاجداهونياد في حديقة المدينة، يقدّم شوربات وأطباقًا رئيسية.", officialUrl: "https://varosligetcafe.hu/", dietaryTags: ["meat", "pork-maybe"], hoursSchedule: everyDay(["12:00", "22:00"]), sourceUrl: "https://varosligetcafe.hu/etlap/", hoursSource: "varosligetcafe.hu (official): Monday to Sunday 12:00-22:00; menu autumn / winter 2026 with soups and main courses (a meal, not only a cafe)", verified: "2026-11-15" }),
  food({ id: "gerbeaud", name: "Gerbeaud", categoryId: "cafes", area: "Belváros (Vörösmarty tér)", address: "Vörösmarty tér 7-8, 1051 Budapest", why: "مقهى وحلويات تاريخي من القرن 19.", officialUrl: "https://gerbeaud.hu/en/", dietaryTags: ["coffee", "dessert"], hoursSchedule: { ...days(["monday", "tuesday", "wednesday", "thursday", "sunday"], ["09:00", "20:00"]), ...days(["friday", "saturday"], ["09:00", "21:00"]) }, sourceUrl: "https://gerbeaud.hu/en/", hoursSource: "gerbeaud.hu (official)" }),
];

// ── Shopping ─────────────────────────────────────────────────────────────────────────────────────────
export const BUDAPEST_SHOPPING_AREAS: ShoppingArea[] = [
  { id: "great-market-hall", name: "Great Market Hall (Központi Vásárcsarnok)", image: "", bestFor: "منتجات مجرية: فلفل أحمر وحلويات وتذكارات", description: "السوق المركزي الكبير: طابق أرضي للمنتجات وطابق علوي للتذكارات.", ...maps("Great Market Hall"), officialUrl: "https://piaconline.hu/en/", address: "Vámház krt. 1-3, 1093 Budapest", hours: fixed({ monday: [{ open: "06:00", close: "17:00" }], ...days(["tuesday", "wednesday", "thursday", "friday"], ["06:00", "18:00"]), saturday: [{ open: "06:00", close: "15:00" }] }, "https://piaconline.hu/en/opening-hours", "piaconline.hu (official, Budapest Market Halls)") },
  { id: "vaci-utca", name: "Váci utca", image: "", bestFor: "شارع مشاة ومحلات", description: "أشهر شارع مشاة للتسوق بوسط Pest.", ...maps("Váci utca"), address: "Váci utca, 1052 Budapest", locationLabel: "نقطة مقترحة للبدء" },
  { id: "andrassy-avenue", name: "Andrássy út", image: "", bestFor: "ماركات عالمية", description: "الجادة الكبيرة من وسط المدينة لساحة الأبطال، فيها محلات ماركات بأولها.", ...maps("Andrássy út"), address: "Andrássy út, 1061 Budapest", locationLabel: "نقطة مقترحة للبدء" },
  { id: "gozsdu-udvar", name: "Gozsdu Udvar", image: "", bestFor: "ممر محلات ومقاهي", description: "ممر بين Király utca وDob utca بالحي اليهودي.", ...maps("Gozsdu udvar"), officialUrl: "https://www.gozsduudvar.hu", address: "Király u. 13 – Dob u. 16, 1075 Budapest" },
  { id: "arena-mall", name: "Arena Mall", image: "", bestFor: "مول كبير بمكان واحد", description: "مركز تسوق كبير جنب محطة Keleti.", ...maps("Arena Mall Budapest"), officialUrl: "https://www.arenamall.hu", address: "Kerepesi út 9, 1087 Budapest", hours: fixed({ ...days(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"], ["10:00", "21:00"]), sunday: [{ open: "10:00", close: "19:00" }] }, "https://www.arenamall.hu/", "arenamall.hu (official, shops)") },
];

export const BUDAPEST_NIGHTLIFE_VENUES: NightlifeVenue[] = [];

// ── Planning hours: seasons, dated exceptions, last entry (official sources, 2026-11-13) ─────────────────
type PlanningHours = { seasonalSchedules?: SeasonalSchedule[]; dateExceptions?: HoursDateException[]; recurringClosures?: RecurringMonthlyClosure[]; startsAtOpening?: true; lastEntry?: string; conflict?: string };
const R = (open: string, close: string): TimeRange[] => [{ open, close }];
const season = (from: string, to: string, schedule: WeeklySchedule, lastEntry?: string): SeasonalSchedule => ({ from, to, schedule, ...(lastEntry ? { lastEntry } : {}) });
const WEEKDAYS: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const WEEKEND: Weekday[] = ["saturday", "sunday"];
/** Each departure is its own interval [departure, departure + 60 min] (startsAtOpening: the visit starts exactly at one of them). */
const departures = (...times: string[]): WeeklySchedule => everyDay(...times.map((t): [string, string] => { const [h, m] = t.split(":").map(Number); const end = h * 60 + m + 60; return [t, `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`]; }));
/** Every 20 minutes from `first` to `last` inclusive, "HH:MM". */
const every20 = (first: string, last: string): string[] => {
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const out: string[] = [];
  for (let m = toMin(first); m <= toMin(last); m += 20) out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  return out;
};

const PLANNING_HOURS: Record<string, PlanningHours> = {
  "hungarian-national-gallery": {
    // Planning hours: the building is open 10:00-18:00, but the halls start closing at 17:30 (top floor), so a visit is planned to END by
    // 17:30; last entry 17:00 (en.mng.hu/opening-hours/, read by us 2026-11-13). Customers see the hours text of the place.
    seasonalSchedules: [season("01-01", "12-31", days(TUE_TO_SUN, ["10:00", "17:30"]), "17:00")],
    // Holidays 2026/27: https://en.mng.hu/opening-hours-during-holidays/ AS READ BY THE INDEPENDENT REVIEWER on 2026-11-14 (relayed by the owner).
    // Our own tool could not open the page (HTTP 520 on 13 and 14 Nov 2026); we did not read it ourselves. 26-30 Dec includes Monday 28 Dec
    // (normally closed): `override` opens it. The 17:30 hall closing is applied to the published 18:00 days; for 31 Dec (building 10:00-16:00)
    // the source gives no hall-closing time, so the plan uses 16:00.
    dateExceptions: [
      { from: "2026-12-24", to: "2026-12-25", closed: true, note: "official (reviewer's reading 2026-11-14)" },
      { from: "2026-12-26", to: "2026-12-30", hours: R("10:00", "17:30"), lastEntry: "17:00", override: true, note: "official 10:00-18:00, last entry 17:00 (reviewer's reading); halls close from 17:30" },
      { from: "2026-12-31", to: "2026-12-31", hours: R("10:00", "16:00"), lastEntry: "15:00", override: true, note: "official 10:00-16:00, last entry 15:00 (reviewer's reading)" },
      { from: "2027-01-01", to: "2027-01-01", hours: R("12:00", "17:30"), lastEntry: "17:00", override: true, note: "official 12:00-18:00, last entry 17:00 (reviewer's reading); halls close from 17:30" },
    ],
    conflict: "Holiday dates 24 Dec 2026 - 1 Jan 2027 come from the reviewer's reading of the official holidays page (14 Nov 2026), relayed by the owner; our direct access failed (Cloudflare 520, 13 and 14 Nov). Regular hours and the 17:30 hall closing: en.mng.hu/opening-hours/, read by us 13 Nov.",
  },
  "hungarian-national-museum": { lastEntry: "17:00", conflict: "mnm.hu: ticket office closes 17:00, exhibitions close from 17:30. Holiday hours page not read." },
  "museum-of-fine-arts": {
    lastEntry: "17:00",
    dateExceptions: [
      { from: "2026-11-13", to: "2026-11-13", hours: R("12:00", "20:00"), lastEntry: "19:00", note: "Museum and Slow Friday" },
      { from: "2026-12-11", to: "2026-12-11", hours: R("12:00", "20:00"), lastEntry: "19:00", note: "Museum and Slow Friday" },
      { from: "2026-12-24", to: "2026-12-25", closed: true },
      { from: "2026-12-26", to: "2026-12-26", hours: R("10:00", "18:00"), lastEntry: "17:00" },
      { from: "2026-12-31", to: "2026-12-31", hours: R("10:00", "16:00"), lastEntry: "15:00", note: "last entry not published for 31 Dec: one hour before closing assumed" },
      { from: "2027-01-01", to: "2027-01-01", hours: R("12:00", "18:00"), lastEntry: "17:00", note: "permanent exhibitions limited" },
    ],
  },
  "opera-house-tour": { lastEntry: "16:30", conflict: "opera.hu: tours only at 13:30, 15:00, 16:30 (60 min); no tours during performances (per date, not published here)." },
  "house-of-music": {
    // The RULE "closed the first Tuesday of each month" was read on the location page on 2026-11-13; it is computed for the trip's own dates.
    // Individual future first Tuesdays are not confirmed one by one by the source (only the rule is).
    recurringClosures: [{ nth: 1, weekday: "tuesday", note: "rule read 2026-11-13 on zenehaza.hu/en/location/permanent-exhibition" }],
    seasonalSchedules: [season("01-01", "12-31", { ...days(["tuesday", "wednesday", "thursday", "saturday", "sunday"], ["10:15", "17:50"]), friday: R("10:15", "19:50") })],
    lastEntry: "16:15",
    conflict: "zenehaza.hu occasion page: last admission 16:15 (Friday 17:45). The planner stores 16:15 for every day (Friday's later entry not used). Location page lists 10:00-18:00 and adds 'closed first Tuesday': the occasion page's 10:15 slots and the first-Tuesday closure are both kept.",
  },
  "budapest-zoo": {
    seasonalSchedules: [
      season("01-01", "02-28", everyDay(["09:00", "16:00"]), "15:00"),
      season("03-01", "03-31", { ...days(WEEKDAYS, ["09:00", "17:00"]), ...days(WEEKEND, ["09:00", "17:30"]) }, "16:00"),
      season("04-01", "04-30", { ...days(WEEKDAYS, ["09:00", "17:30"]), ...days(WEEKEND, ["09:00", "18:00"]) }, "16:30"),
      season("05-01", "08-31", { ...days(WEEKDAYS, ["09:00", "18:00"]), ...days(WEEKEND, ["09:00", "19:00"]) }, "17:00"),
      season("09-01", "09-30", { ...days(WEEKDAYS, ["09:00", "17:30"]), ...days(WEEKEND, ["09:00", "18:00"]) }, "16:30"),
      season("10-01", "10-30", { ...days(WEEKDAYS, ["09:00", "17:00"]), ...days(WEEKEND, ["09:00", "17:30"]) }, "16:00"),
      season("10-31", "12-31", everyDay(["09:00", "16:00"]), "15:00"),
    ],
    dateExceptions: [
      { from: "2026-12-24", to: "2026-12-24", hours: R("09:00", "13:00"), lastEntry: "12:00" },
      { from: "2026-12-31", to: "2026-12-31", hours: R("09:00", "13:00"), lastEntry: "12:00" },
    ],
    conflict: "Weekend last entry differs from weekday in Mar/Apr/May-Aug/Sep/Oct (one hour before closing); the season records the WEEKDAY (earlier) last entry, the safe side. Public holidays use weekend hours (not modelled).",
  },
  citadella: {
    seasonalSchedules: [season("11-01", "03-31", everyDay(["08:00", "22:00"])), season("04-01", "10-31", everyDay(["06:00", "23:59"]))],
  },
  "szechenyi-bath": { conflict: "Suggestion only (age 14+). Pools vacated 20 min before closing." },
  // STAGE 2 -- legenda.hu/en/timetable, Danube Legend evening cruise, timetable for the year 2026 (read 2026-11-13/14). Every published
  // departure is stored as it is (including :20 / :40 and the irregular summer list); each departure is one interval [departure, +60 min]
  // and `startsAtOpening` makes the plan start the cruise EXACTLY at one of them (never moved by the quarter-hour rounding, never between).
  // Last entry = the period's last departure. The month-day periods below are the 2026 timetable only (see the exclusions).
  // Arrival before sailing: the operator's FAQ publishes NO check-in / arrival time (read 2026-11-14); the plan keeps only its own shared
  // 15-minute margin before a visit (a planning margin, not an operator rule).
  "danube-legend-cruise": {
    startsAtOpening: true,
    seasonalSchedules: [
      season("01-01", "01-04", departures("15:40", ...every20("16:20", "21:00")), "21:00"),
      season("01-05", "02-11", departures(...every20("16:20", "21:00")), "21:00"),
      season("02-12", "02-24", departures(...every20("16:40", "21:00")), "21:00"),
      season("02-25", "03-09", departures(...every20("17:00", "21:00")), "21:00"),
      season("03-10", "03-28", departures(...every20("17:40", "21:00")), "21:00"),
      season("03-29", "04-05", departures(...every20("19:00", "22:00")), "22:00"),
      season("04-06", "05-21", departures(...every20("19:20", "22:00")), "22:00"),
      // 22 May - 23 Jul: the published list is irregular (not every 20 minutes): stored departure by departure.
      season("05-22", "07-23", departures("19:30", "20:15", "20:20", "20:30", "20:45", "21:30", "21:40", "21:45", "22:00"), "22:00"),
      season("07-24", "09-03", departures(...every20("19:20", "22:00")), "22:00"),
      season("09-04", "09-13", departures(...every20("19:00", "22:00")), "22:00"),
      season("09-14", "09-22", departures(...every20("18:40", "22:00")), "22:00"),
      season("09-23", "10-02", departures(...every20("18:20", "22:00")), "22:00"),
      season("10-03", "10-24", departures(...every20("17:40", "22:00")), "22:00"),
      season("10-25", "11-22", departures(...every20("16:20", "21:00")), "21:00"),
      season("11-23", "12-31", departures("15:40", ...every20("16:20", "21:00")), "21:00"),
    ],
    dateExceptions: [
      // Published: on 24 December only daytime cruises run (11:00, 12:30, 14:00, 15:30); the evening product has no departure that day.
      { from: "2026-12-24", to: "2026-12-24", closed: true, note: "published: daytime cruises only on 24 December" },
      // PLANNING EXCLUSIONS, NOT CLOSURES: the operator says the 20 August timetable "might change", and has published no timetable for 2027
      // or later. The planner does not put a departure on the clock for those dates (unknown time = not scheduled); nothing tells the
      // customer the cruise is closed. These entries bind the 2026 periods above to the year 2026.
      { from: "2026-08-20", to: "2026-08-20", closed: true, note: "PLANNING EXCLUSION (not a closure): timetable 'might change' on 20 August" },
      { from: "2027-01-01", to: "2099-12-31", closed: true, note: "PLANNING EXCLUSION (not a closure): no timetable published after 2026" },
    ],
    conflict: "A published departure is not a guaranteed seat (online booking by availability; reservations 'not required' but recommended). Boarding point (checked 2026-11-14): the operator's address is 'Dock 7 Jane Haining rakpart' (legenda.hu/en/contact); OSM names that floating pontoon 'Vigadó 7. ponton' (name:en Vigadó Dock 7, way/375465291), and the stored point (node/4816567424 'Legenda kikötő', Jane Haining rakpart 7) is its shore end, 21-25 m from the pontoon's nodes. Walking routes end there on the riverside sidewalk (way/246187225). Open: the FAQ says ~50 m from the signal crossing below Vigadó tér; the nearest signal crossing (node/2532573591) is ~124 m away in a straight line. Which gangway on the pontoon is used is not published.",
  },
};

function withPlanningHours<T extends { id: string; hours?: HoursInfo }>(items: T[]): T[] {
  for (const item of items) {
    const extra = PLANNING_HOURS[item.id];
    if (extra && item.hours) item.hours = { ...item.hours, ...extra } as HoursInfo;
  }
  return items;
}
withPlanningHours(BUDAPEST_ATTRACTIONS);
withPlanningHours(BUDAPEST_EXPERIENCES);

export const BUDAPEST_PLACES: CityPlaceData = {
  attractions: BUDAPEST_ATTRACTIONS,
  experiences: BUDAPEST_EXPERIENCES,
  areas: BUDAPEST_AREAS,
  foodPlaces: BUDAPEST_FOOD_PLACES,
  foodCategories: BUDAPEST_FOOD_CATEGORIES,
  nightlifeVenues: BUDAPEST_NIGHTLIFE_VENUES,
  shoppingAreas: BUDAPEST_SHOPPING_AREAS,
};

/**
 * Coordinates of every Budapest place id: OpenStreetMap (Nominatim / Overpass, 2026-11-13). Entrance nodes where the review pinned
 * one (marked), otherwise the OSM object's point. Used for transfers and accommodation proximity only, never shown as exact data.
 */
export const BUDAPEST_PLACE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  ...Object.fromEntries(BUDAPEST_ATTRACTIONS.filter((a) => a.coordinates).map((a) => [a.id, a.coordinates!])),
  "danube-legend-cruise": { lat: 47.4941437, lng: 19.0488902 }, // OSM node/4816567424 "Legenda kikötő", Jane Haining rakpart 7: shore end of Dock 7 (way/375465291 "Vigadó 7. ponton"); operator address "Dock 7"
  "hungarikum-bisztro": { lat: 47.5034621, lng: 19.0480568 }, // OSM node/3074802455
  menza: { lat: 47.5039614, lng: 19.0627699 }, // OSM node/419017260
  "frici-papa": { lat: 47.5024568, lng: 19.0639715 }, // OSM address node Király u. 55
  "21-restaurant": { lat: 47.5041419, lng: 19.0312808 }, // OSM building Fortuna u. 21
  pierrot: { lat: 47.503897, lng: 19.0309623 }, // OSM node/2330643555 Restaurant Pierrot
  "new-york-cafe": { lat: 47.4986468, lng: 19.0707893 }, // OSM way/1267688599 (New York Palace)
  gerbeaud: { lat: 47.4972059, lng: 19.0505484 }, // OSM address node Vörösmarty tér 7
  gundel: { lat: 47.5174498, lng: 19.0770866 }, // OSM way/25227262 "Gundel Restaurant" (Nominatim 2026-11-15)
  "varosliget-cafe": { lat: 47.5144894, lng: 19.0801818 }, // OSM node/3409063948 "Városliget Cafe & Restaurant" (Nominatim 2026-11-15; OSM address no. 6, official site no. 5)
  "great-market-hall": { lat: 47.487212, lng: 19.058966 }, // OSM node/2508882191 entrance=main (Fővám tér side)
  "vaci-utca": { lat: 47.4921923, lng: 19.0534903 }, // OSM way/246920614 (a point on the street)
  "andrassy-avenue": { lat: 47.50287, lng: 19.05816 }, // the Opera end of the avenue (OSM, Andrássy út 22)
  "gozsdu-udvar": { lat: 47.4980304, lng: 19.0601215 }, // OSM way/348493867
  "arena-mall": { lat: 47.4984954, lng: 19.0918628 }, // OSM way/25268421
};
