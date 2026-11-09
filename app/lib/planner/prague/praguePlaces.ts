import type { Area, Attraction, Experience, FoodCategory, FoodPlace, NightlifeVenue, ShoppingArea } from "../../guideTypes";
import type { HoursDateException, HoursInfo, SeasonalSchedule, TimeRange, Weekday, WeeklySchedule } from "../../hours";
import type { CityPlaceData } from "../cityPlannerModule";
import { withPhoto } from "./praguePhotos";

/**
 * Prague -- PLANNER place data (multi-city foundation, first new city). NOT a destination guide: nothing here is sold
 * or promised as a "Prague guide"; it only feeds the personalized-plan engine.
 *
 * Sources and verification (2026-11-05):
 * - Addresses, coordinates, opening hours and prices come from each place's page on prague.eu, the official tourism
 *   portal of the City of Prague (Prague City Tourism), unless another source is named on the entry. Coordinates are
 *   the destination point of the page's own "route" link.
 * - Jewish Museum hours / closures and price: jewishmuseum.cz (official). Strahov Library hours: strahovskyklaster.cz.
 * - Letná Park and Riegrovy sady coordinates: Wikidata (Q3500624, Q12049439).
 * - Where the official page shows no hours, `hours` is omitted (never assumed); where hours change by month, the entry
 *   is `variable` with the official monthly text, so the engine never hard-excludes it on a guessed weekday.
 * - Photos: only Wikimedia Commons files whose free license and author were checked (praguePhotos.ts, with the credit
 *   shown next to the photo). A place without such a photo keeps `image: ""` (every planner card handles that). Price levels for restaurants are omitted: no verified source was checked for them.
 * - Restaurants: prague.eu does not mark any of them halal. Traditional Czech kitchens usually serve pork; that is
 *   stated through `dietaryTags: ["pork-maybe"]`, never hidden.
 */

const VERIFIED = "2026-11-05";
const PRAGUE_EU = "prague.eu (Prague City Tourism, official)";

const ALL_WEEKDAYS: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function schedule(byDay: Partial<Record<Weekday, TimeRange[]>>): WeeklySchedule {
  return byDay;
}

function everyDay(...ranges: [string, string][]): WeeklySchedule {
  const intervals = ranges.map(([open, close]) => ({ open, close }));
  return Object.fromEntries(ALL_WEEKDAYS.map((day) => [day, intervals])) as WeeklySchedule;
}

function days(list: Weekday[], ...ranges: [string, string][]): WeeklySchedule {
  const intervals = ranges.map(([open, close]) => ({ open, close }));
  return Object.fromEntries(list.map((day) => [day, intervals])) as WeeklySchedule;
}

function fixed(sched: WeeklySchedule, sourceUrl: string, source = PRAGUE_EU): HoursInfo {
  return { type: "fixed", schedule: sched, source, sourceUrl, lastVerified: VERIFIED };
}

function variable(display: string, sourceUrl: string, closedWeekdays?: Weekday[], source = PRAGUE_EU): HoursInfo {
  return { type: "variable", display, ...(closedWeekdays ? { closedWeekdays } : {}), source, sourceUrl, lastVerified: VERIFIED };
}

function alwaysOpen(sourceUrl: string): HoursInfo {
  return { type: "always-open", source: PRAGUE_EU, sourceUrl, lastVerified: VERIFIED };
}

function maps(query: string) {
  const q = encodeURIComponent(`${query}, Prague`).replace(/%20/g, "+");
  return { mapsUrl: `https://www.google.com/maps/search/?api=1&query=${q}`, appleMapsUrl: `https://maps.apple.com/?q=${q}` };
}

const TUE_TO_SUN: Weekday[] = ["tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

// ── Areas ──────────────────────────────────────────────────────────────────────────────────────────
export const PRAGUE_AREAS: Area[] = [
  { id: "hradcany", name: "Hradčany", description: "حي القلعة فوق التلة.", image: "", ...maps("Hradčany"), attractionIds: ["prague-castle", "strahov-monastery", "loreta"] },
  { id: "mala-strana", name: "Malá Strana", description: "الحي الباروكي تحت القلعة على الضفة الغربية للنهر.", image: "", ...maps("Malá Strana"), attractionIds: ["st-nicholas-mala-strana", "john-lennon-wall", "kampa-island", "franz-kafka-museum", "museum-kampa", "petrin-tower", "petrin-gardens"] },
  { id: "stare-mesto", name: "Staré Město", description: "البلدة القديمة وساحتها.", image: "", ...maps("Staré Město"), attractionIds: ["old-town-square", "old-town-hall", "tyn-church", "clementinum", "charles-bridge", "old-town-bridge-tower", "municipal-house", "powder-tower"] },
  { id: "josefov", name: "Josefov", description: "الحي اليهودي التاريخي داخل البلدة القديمة.", image: "", ...maps("Josefov"), attractionIds: ["jewish-museum", "convent-st-agnes"] },
  { id: "nove-mesto", name: "Nové Město", description: "المدينة الجديدة وساحة فاتسلاف.", image: "", ...maps("Nové Město"), attractionIds: ["wenceslas-square", "national-museum", "mucha-museum", "franciscan-garden", "dancing-house", "naplavka"] },
  { id: "vysehrad", name: "Vyšehrad", description: "قلعة تاريخية جنوب المركز على النهر.", image: "", ...maps("Vyšehrad"), attractionIds: ["vysehrad"] },
  { id: "zizkov-vinohrady", name: "Žižkov / Vinohrady", description: "أحياء سكنية شرق المركز فيها تلال وإطلالات.", image: "", ...maps("Žižkov"), attractionIds: ["zizkov-tower", "vitkov-memorial", "riegrovy-sady", "havlicek-gardens"] },
  { id: "letna-holesovice", name: "Letná / Holešovice", description: "تلة حديقة Letná ومتحف التقنية شمال النهر.", image: "", ...maps("Letná"), attractionIds: ["letna-park", "national-technical-museum", "trade-fair-palace", "dox", "stromovka"] },
  { id: "troja", name: "Troja", description: "شمال المدينة: حديقة الحيوان وقصر Troja.", image: "", ...maps("Troja"), attractionIds: ["prague-zoo", "troja-chateau", "botanical-garden"] },
];

// ── Attractions ────────────────────────────────────────────────────────────────────────────────────
type AttractionInput = Omit<Attraction, "image" | "mapsUrl" | "appleMapsUrl" | "lastVerified"> & { mapsQuery: string };

function attraction(input: AttractionInput): Attraction {
  const { mapsQuery, ...rest } = input;
  return { image: "", ...maps(mapsQuery), lastVerified: VERIFIED, ...rest };
}

export const PRAGUE_ATTRACTIONS: Attraction[] = [
  attraction({
    id: "prague-castle",
    outsideView: true,
    name: "Prague Castle (Pražský hrad)",
    mapsQuery: "Prague Castle",
    description: "مجمع القلعة التاريخي، وفيه كاتدرائية St. Vitus والقصر الملكي القديم وGolden Lane.",
    whyRecommend: "أهم معلم في براغ؛ تذكرة «الجولة الرئيسية» بتشمل كاتدرائية St. Vitus والقصر الملكي القديم وبازيليكا St. George وGolden Lane.",
    areaId: "hradcany",
    duration: "ساعتين ونص تقريبًا",
    priceType: "paid",
    bookingStatus: "مش ضروري عادةً",
    bestTime: "الصبح بدري",
    tip: "الساحات ببلاش ومفتوحة 6:00–22:00؛ التذكرة للمباني بس، وصالحة يومين.",
    officialUrl: "https://www.hrad.cz",
    mustSee: true,
    address: "Pražský hrad, 119 08 Praha 1 – Hradčany",
    priceText: "450 CZK (الجولة الرئيسية: 4 مباني؛ المعارض الدائمة بتذكرة منفصلة)",
    // Historical buildings by season (structured in PLANNING_HOURS below): hrad.cz winter season 9:00–16:00 (Nov–Mar), 9:00–17:00
    // April–October; prague.eu shows 9:00–17:00 all year (conflict noted there).
    hours: variable("أبريل–أكتوبر 9:00–17:00 · نوفمبر–مارس 9:00–16:00 (كل الأيام) · مغلق 24 ديسمبر", "https://www.hrad.cz/en/prague-castle-for-visitors/opening-hours/winter-tourist-season-10349", undefined, "hrad.cz (official)"),
    coordinates: { lat: 50.0903447, lng: 14.3995402 },
  }),
  attraction({
    id: "strahov-monastery",
    outsideView: true,
    name: "Strahov Monastery & Library",
    mapsQuery: "Strahov Monastery Library",
    description: "دير تاريخي فوق Hradčany، مشهور بقاعات مكتبته الباروكية.",
    whyRecommend: "من أجمل المكتبات التاريخية، وقريب من القلعة مشيًا.",
    areaId: "hradcany",
    duration: "ساعة تقريبًا",
    priceType: "paid",
    bookingStatus: "مش ضروري عادةً",
    bestTime: "قبل الظهر",
    tip: "قاعات المكتبة بتتشاف من عتبة الباب، مش من جوّا. آخر دخول 16:30.",
    officialUrl: "https://www.strahovskyklaster.cz",
    mustSee: false,
    address: "Strahovské nádvoří 1/132, 118 00 Praha 1",
    priceText: "220 CZK للمكتبة · 390 CZK للجولة المشتركة",
    hours: fixed(everyDay(["09:00", "17:00"]), "https://www.strahovskyklaster.cz/en/for-visitors/what-you-can-visit/strahov-library", "strahovskyklaster.cz (official)"),
    coordinates: { lat: 50.086150261346, lng: 14.389251465474 },
  }),
  attraction({
    id: "loreta",
    outsideView: true,
    name: "Loreta (Prague Loreto)",
    mapsQuery: "Loreta Prague",
    description: "مجمع ديني باروكي قريب من القلعة، معروف ببرج الأجراس.",
    whyRecommend: "محطة هادية وقريبة إذا كنت بمنطقة القلعة.",
    areaId: "hradcany",
    duration: "45 دقيقة تقريبًا",
    priceType: "paid",
    bookingStatus: "بدون حجز",
    bestTime: "أي وقت بالنهار",
    tip: "بين القلعة ودير Strahov، فبتمشي عليه بطريقك.",
    officialUrl: "https://www.loreta.cz",
    mustSee: false,
    address: "Loretánské náměstí 7, 118 00 Praha 1",
    priceText: "280 CZK",
    hours: fixed(everyDay(["10:00", "17:00"]), "https://prague.eu/en/objevujte/loreto-loreta/"),
    coordinates: { lat: 50.089279, lng: 14.3918614 },
  }),
  attraction({
    id: "charles-bridge",
    name: "Charles Bridge (Karlův most)",
    mapsQuery: "Charles Bridge",
    description: "الجسر الحجري التاريخي بين البلدة القديمة وMalá Strana، عليه تماثيل على الجانبين.",
    whyRecommend: "أشهر مشهد في براغ، والمشي عليه جزء من أي زيارة.",
    areaId: "stare-mesto",
    duration: "30 دقيقة تقريبًا",
    priceType: "free",
    bookingStatus: "بدون حجز",
    bestTime: "الصبح بدري قبل الزحمة",
    tip: "الجسر مفتوح دايمًا؛ الصبح بدري أو آخر الليل أهدى بكثير.",
    mustSee: true,
    address: "Karlův most, Praha 1",
    hours: alwaysOpen("https://prague.eu/en/objevujte/charles-bridge-karluv-most/"),
    coordinates: { lat: 50.086500914579, lng: 14.411723613739 },
  }),
  attraction({
    id: "old-town-bridge-tower",
    outsideView: true,
    name: "Old Town Bridge Tower",
    mapsQuery: "Old Town Bridge Tower",
    description: "البرج القوطي عند طرف Charles Bridge من جهة البلدة القديمة، وفوقه إطلالة.",
    whyRecommend: "إطلالة على الجسر والقلعة من فوق، بخطوة من الجسر.",
    areaId: "stare-mesto",
    duration: "30 دقيقة تقريبًا",
    priceType: "paid",
    bookingStatus: "بدون حجز",
    bestTime: "قبل الغروب",
    tip: "الدرج ضيق وطويل.",
    mustSee: false,
    address: "Karlův most, 110 00 Praha 1",
    priceText: "250 CZK (أسعار جديدة من 1 مارس 2027)",
    hours: variable(
      "يناير–مارس 10:00–18:00 · أبريل–مايو 10:00–19:00 · يونيو–سبتمبر 9:00–20:30 · أكتوبر–نوفمبر 10:00–18:00 · ديسمبر 10:00–19:30 (كل الأيام)",
      "https://prague.eu/en/objevujte/old-town-bridge-tower-staromestska-mostecka-vez/"
    ),
    coordinates: { lat: 50.086161, lng: 14.41358 },
  }),
  attraction({
    id: "old-town-square",
    name: "Old Town Square (Staroměstské náměstí)",
    mapsQuery: "Old Town Square",
    description: "الساحة الرئيسية للبلدة القديمة، حواليها كنيسة Týn ودار البلدية والساعة الفلكية.",
    whyRecommend: "قلب براغ التاريخي ونقطة بداية طبيعية لأغلب الأيام.",
    areaId: "stare-mesto",
    duration: "30 دقيقة تقريبًا",
    priceType: "free",
    bookingStatus: "بدون حجز",
    bestTime: "أي وقت",
    tip: "الساحة مفتوحة دايمًا؛ الدخول لدار البلدية بتذكرة منفصلة.",
    mustSee: true,
    address: "Staroměstské náměstí, 110 00 Praha 1",
    hours: alwaysOpen("https://prague.eu/en/objevujte/old-town-square-staromestske-namesti/"),
    coordinates: { lat: 50.087524890749, lng: 14.421104907924 },
  }),
  attraction({
    id: "old-town-hall",
    outsideView: true,
    name: "Old Town Hall & Astronomical Clock",
    mapsQuery: "Old Town Hall Astronomical Clock",
    description: "دار البلدية القديمة مع الساعة الفلكية (Orloj) وبرج بإطلالة على الساحة.",
    whyRecommend: "الساعة الفلكية من رموز المدينة، والبرج من أحلى إطلالات البلدة القديمة.",
    areaId: "stare-mesto",
    duration: "ساعة تقريبًا",
    priceType: "paid",
    bookingStatus: "مش ضروري عادةً",
    bestTime: "قبل رأس الساعة لمشاهدة عرض الساعة",
    tip: "عرض الرسل على الساعة بيصير على رأس كل ساعة بالنهار.",
    officialUrl: "https://www.prague.eu/staromestskaradnice",
    mustSee: true,
    address: "Staroměstské náměstí 1/3, 110 00 Praha 1",
    priceText: "350 CZK",
    hours: variable("يناير–مارس 10:00–19:00 · أبريل–ديسمبر 9:00–20:00 (كل الأيام)", "https://prague.eu/en/objevujte/old-town-hall-with-astronomical-clock-staromestska-radnice-s-orlojem/"),
    coordinates: { lat: 50.086952, lng: 14.420634 },
  }),
  attraction({
    id: "tyn-church",
    name: "Church of Our Lady before Týn",
    mapsQuery: "Church of Our Lady before Tyn",
    description: "الكنيسة القوطية ذات البرجين المطلة على ساحة البلدة القديمة.",
    whyRecommend: "أبراجها أشهر خلفية لصور الساحة؛ الدخول مجاني.",
    areaId: "stare-mesto",
    duration: "20 دقيقة تقريبًا",
    priceType: "free",
    bookingStatus: "بدون حجز",
    bestTime: "قبل الظهر",
    tip: "ما في زيارة وقت القداس: الجمعة 15:00 (سبتمبر–يونيو)، ويوليو–أغسطس الاثنين–الجمعة 12:15. التبرع المقترح 50 CZK.",
    mustSee: false,
    address: "Staroměstské náměstí 604, 110 00 Praha 1",
    // prague.eu: Dec–Feb Tue–Sat 10:00–13:00 & 15:00–17:00, Sun 10:30–12:00; Mar–Nov Tue–Sat the same, Sunday and Monday closed.
    // Stored as the schedule common to every month (fixed, so the engine checks the time windows and never plans a Sunday
    // visit in a closed month); the short winter Sunday opening is in the tip. Review 2026-11-07: as "variable" the engine
    // planned it on a July Sunday at 09:00.
    hours: variable("ديسمبر–فبراير: الاثنين مغلق، الثلاثاء–الخميس والسبت 10:00–13:00 و15:00–17:00، الجمعة 10:00–13:00 و15:30–17:00، الأحد 10:30–12:00 · مارس–نوفمبر: الاثنين والأحد مغلق، الثلاثاء–السبت 10:00–13:00 و15:00–17:00", "https://prague.eu/en/objevujte/church-of-our-lady-before-tyn-chram-matky-bozi-pred-tynem/", ["monday"]),
    coordinates: { lat: 50.087594106741, lng: 14.422563348549 },
  }),
  attraction({
    id: "clementinum",
    outsideView: true,
    name: "Clementinum (Baroque Library & Astronomical Tower)",
    mapsQuery: "Clementinum",
    description: "مجمع تاريخي فيه قاعة مكتبة باروكية والبرج الفلكي، بجولة مع مرشد.",
    whyRecommend: "قاعة المكتبة من أجمل القاعات في براغ، والبرج بيطل على البلدة القديمة.",
    areaId: "stare-mesto",
    duration: "ساعة تقريبًا",
    priceType: "paid",
    bookingStatus: "يفضل مسبقًا",
    bestTime: "أي وقت بالنهار",
    tip: "جولة مرشدة 45 دقيقة تقريبًا، 25 شخص بالجولة. التذاكر بتنزل أونلاين كل اثنين للأسبوع اللي بعد أسبوعين، والشباك مش مضمون.",
    officialUrl: "https://www.prague.eu/klementinum",
    mustSee: false,
    address: "Mariánské náměstí 190/5, 110 00 Praha 1",
    priceText: "380 CZK (أسعار جديدة من 1 مارس 2027)",
    hours: fixed(everyDay(["08:00", "21:00"]), "https://prague.eu/en/objevujte/the-clementinum-astronomical-tower-and-baroque-library/"),
    coordinates: { lat: 50.086666739281, lng: 14.416533584131 },
  }),
  attraction({
    id: "municipal-house",
    outsideView: true,
    name: "Municipal House (Obecní dům)",
    mapsQuery: "Municipal House Obecni dum",
    description: "مبنى Art Nouveau فخم بساحة Republiky، والزيارة الداخلية بجولة مع مرشد.",
    whyRecommend: "من أجمل مباني الآرت نوفو، وفيه زخارف لـ Alfons Mucha.",
    areaId: "stare-mesto",
    duration: "ساعة تقريبًا",
    priceType: "paid",
    bookingStatus: "يفضل مسبقًا",
    bestTime: "بعد الظهر",
    tip: "جدول الجولات منشور لكل يوم على obecnidum.cz/en/tours: من 2 لـ5 جولات بين 11:00 و17:00، أغلبها بالإنجليزي.",
    officialUrl: "https://www.obecnidum.cz",
    mustSee: false,
    address: "náměstí Republiky 5, 111 21 Praha 1",
    priceText: "320 CZK",
    // 10:00–19:00 is the box office; the halls are only seen on guided tours at set times (structured in PLANNING_HOURS below).
    hours: variable("القاعات بجولة مرشدة (ساعة)، الجولات بتبدأ بين 11:00 و17:00 حسب جدول اليوم · شباك التذاكر يوميًا 10:00–19:00", "https://www.obecnidum.cz/en/tours/", undefined, "obecnidum.cz (official)"),
    coordinates: { lat: 50.087595264849, lng: 14.428034123279 },
  }),
  attraction({
    id: "powder-tower",
    outsideView: true,
    name: "Powder Tower (Prašná brána)",
    mapsQuery: "Powder Tower",
    description: "بوابة قوطية قديمة جنب Municipal House، ومن فوقها إطلالة.",
    whyRecommend: "محطة قصيرة على طريق البلدة القديمة.",
    areaId: "stare-mesto",
    duration: "30 دقيقة تقريبًا",
    priceType: "paid",
    bookingStatus: "بدون حجز",
    bestTime: "أي وقت",
    tip: "الأطفال تحت 15 سنة بيدخلوا مع شخص بالغ فقط.",
    mustSee: false,
    address: "Na Příkopě / náměstí Republiky 5, 110 00 Praha 1",
    priceText: "200 CZK (أسعار جديدة من 1 مارس 2027)",
    hours: variable(
      "يناير–مارس 10:00–18:00 · أبريل–مايو 10:00–19:00 · يونيو–سبتمبر 9:00–20:30 · أكتوبر–نوفمبر 10:00–18:00 · ديسمبر 10:00–19:30 (كل الأيام)",
      "https://prague.eu/en/objevujte/powder-gate-tower-prasna-brana/"
    ),
    coordinates: { lat: 50.087262, lng: 14.427792 },
  }),
  attraction({
    id: "jewish-museum",
    outsideView: true,
    name: "Jewish Museum in Prague (Josefov)",
    mapsQuery: "Jewish Museum in Prague",
    description: "مجموعة كُنُس تاريخية والمقبرة القديمة في حي Josefov، بتذكرة واحدة.",
    whyRecommend: "جزء أساسي من تاريخ البلدة القديمة لمن يحب الثقافة والتاريخ.",
    areaId: "josefov",
    duration: "ساعتين تقريبًا",
    priceType: "paid",
    bookingStatus: "مش ضروري عادةً",
    bestTime: "قبل الظهر",
    tip: "التذكرة صالحة 3 أيام فتح.",
    officialUrl: "https://www.jewishmuseum.cz",
    mustSee: false,
    address: "Dušní 12, 110 00 Praha 1 – Josefov",
    priceText: "600 CZK",
    hours: variable(
      "الأحد–الجمعة: يناير–مارس 9:00–16:30 · أبريل 9:00–18:00 · مايو–أغسطس 9:00–19:00 · 1 سبتمبر–17 أكتوبر 9:00–18:00 · 18 أكتوبر–ديسمبر 9:00–16:30 · مغلق السبت والأعياد اليهودية",
      "https://www.jewishmuseum.cz/en/info/visit/opening-hours/",
      ["saturday"],
      "jewishmuseum.cz (official)"
    ),
    coordinates: { lat: 50.0902065, lng: 14.420791 },
  }),
  attraction({
    id: "st-nicholas-mala-strana",
    outsideView: true,
    name: "St. Nicholas Church (Malá Strana)",
    mapsQuery: "St. Nicholas Church Mala Strana",
    description: "كنيسة باروكية ضخمة في ساحة Malostranské náměstí.",
    whyRecommend: "من أهم الأمثلة على الباروك في براغ، وعلى الطريق بين الجسر والقلعة.",
    areaId: "mala-strana",
    duration: "30 دقيقة تقريبًا",
    priceType: "paid",
    bookingStatus: "بدون حجز",
    bestTime: "أي وقت بالنهار",
    tip: "آخر دخول قبل الإغلاق بربع ساعة.",
    officialUrl: "https://www.stnicholas.cz",
    mustSee: false,
    address: "Malostranské náměstí, 118 00 Praha 1",
    priceText: "150 CZK",
    hours: variable(
      "يناير 9:00–16:00 (1–4 يناير لحد 17:00) · فبراير–مارس 9:00–17:00 · أبريل ويوليو–أكتوبر 9:00–18:00 (الجمعة والسبت لحد 17:00) · مايو–يونيو 9:00–18:00 (الجمعة لحد 17:00) · نوفمبر 9:00–17:00 · ديسمبر 9:00–17:00 (الجمعة والسبت لحد 16:00) · 3 ديسمبر 2026: 9:00–13:30 · 17 ديسمبر 2026: 13:00–17:00 · آخر دخول قبل الإغلاق بربع ساعة",
      "https://prague.eu/en/objevujte/st-nicholas-church-at-mala-strana-kostel-sv-mikulase-mala-strana/"
    ),
    coordinates: { lat: 50.087991947521, lng: 14.403133622476 },
  }),
  attraction({
    id: "john-lennon-wall",
    name: "John Lennon Wall",
    mapsQuery: "John Lennon Wall",
    description: "جدار مليان رسومات وكتابات ملونة في Malá Strana.",
    whyRecommend: "محطة صور سريعة بين الجسر وجزيرة Kampa.",
    areaId: "mala-strana",
    duration: "15 دقيقة تقريبًا",
    priceType: "free",
    bookingStatus: "بدون حجز",
    bestTime: "أي وقت",
    tip: "قريب جدًا من Kampa، فبتجمعهم بمشوار واحد.",
    mustSee: false,
    address: "Velkopřevorské náměstí, 118 00 Praha 1",
    hours: alwaysOpen("https://prague.eu/en/objevujte/john-lennon-wall-zed-johna-lennona/"),
    coordinates: { lat: 50.086147720001, lng: 14.406606713492 },
  }),
  attraction({
    id: "kampa-island",
    name: "Kampa Island",
    mapsQuery: "Kampa Island",
    description: "جزيرة صغيرة خضرا على النهر تحت Charles Bridge.",
    whyRecommend: "استراحة هادية على النهر مع إطلالة على الجسر.",
    areaId: "mala-strana",
    duration: "30 دقيقة تقريبًا",
    priceType: "free",
    bookingStatus: "بدون حجز",
    bestTime: "العصر",
    tip: "قريبة من John Lennon Wall، فبتجمعهم بمشوار واحد.",
    mustSee: false,
    address: "Ostrov Kampa, 118 00 Praha 1",
    hours: alwaysOpen("https://prague.eu/en/objevujte/kampa/"),
    coordinates: { lat: 50.0836715, lng: 14.4075176 },
  }),
  attraction({
    id: "franz-kafka-museum",
    name: "Franz Kafka Museum",
    mapsQuery: "Franz Kafka Museum",
    description: "متحف عن الكاتب Franz Kafka وعلاقته ببراغ، على ضفة النهر في Malá Strana.",
    whyRecommend: "مناسب لمحبي الأدب، وقريب من Charles Bridge.",
    areaId: "mala-strana",
    duration: "ساعة تقريبًا",
    priceType: "paid",
    bookingStatus: "بدون حجز",
    bestTime: "أي وقت بالنهار",
    tip: "قريب من الجسر وكامبا، بيتجمعوا بسهولة.",
    officialUrl: "https://kafkamuseum.cz",
    mustSee: false,
    address: "Cihelná 2b, 118 00 Praha 1",
    priceText: "300 CZK",
    hours: fixed(everyDay(["10:00", "18:00"]), "https://prague.eu/en/objevujte/franz-kafka-museum/"),
    coordinates: { lat: 50.0881279, lng: 14.4103086 },
  }),
  attraction({
    id: "petrin-tower",
    outsideView: true,
    name: "Petřín Lookout Tower",
    mapsQuery: "Petrin Lookout Tower",
    description: "برج إطلالة معدني فوق تلة Petřín، 299 درجة لفوق.",
    whyRecommend: "إطلالة كاملة على المدينة والقلعة.",
    areaId: "mala-strana",
    duration: "ساعة تقريبًا",
    priceType: "paid",
    bookingStatus: "بدون حجز",
    bestTime: "قبل الغروب",
    tip: "⚠️ مغلق من 7 لـ 14 نوفمبر 2026. في مصعد بسعر إضافي.",
    mustSee: false,
    address: "Petřínské sady 633, 118 00 Praha 1",
    priceText: "250 CZK (أسعار جديدة من 1 مارس 2027)",
    hours: variable("يناير–مارس 10:00–18:00 · أبريل–سبتمبر 9:00–19:00 · أكتوبر 9:00–18:00 · نوفمبر–ديسمبر 10:00–18:00 (كل الأيام)", "https://prague.eu/en/objevujte/petrin-tower-petrinska-rozhledna/"),
    coordinates: { lat: 50.083543041143, lng: 14.395043251282 },
  }),
  attraction({
    id: "petrin-gardens",
    name: "Petřín Gardens (Petřínské sady)",
    mapsQuery: "Petrin Gardens",
    description: "حدائق على تلة Petřín بين Malá Strana والقلعة.",
    whyRecommend: "مشي أخضر مع إطلالات، ومدخل طبيعي لبرج Petřín.",
    areaId: "mala-strana",
    duration: "45 دقيقة تقريبًا",
    priceType: "free",
    bookingStatus: "بدون حجز",
    bestTime: "العصر",
    tip: "في تلفريك (funicular) من Újezd لفوق التلة.",
    mustSee: false,
    address: "Petřínské sady, 118 00 Praha 1",
    coordinates: { lat: 50.082687516604, lng: 14.39876088532 },
  }),
  attraction({
    id: "wenceslas-square",
    name: "Wenceslas Square (Václavské náměstí)",
    mapsQuery: "Wenceslas Square",
    description: "الساحة/الشارع العريض في قلب المدينة الجديدة، وفي آخره المتحف الوطني.",
    whyRecommend: "مركز المدينة الحديث، وبيوصلك على المتحف الوطني وشارع Na Příkopě.",
    areaId: "nove-mesto",
    duration: "30 دقيقة تقريبًا",
    priceType: "free",
    bookingStatus: "بدون حجز",
    bestTime: "أي وقت",
    tip: "امشِ من تحت لفوق لتوصل المتحف الوطني.",
    mustSee: false,
    address: "Václavské náměstí, 110 00 Praha 1",
    hours: alwaysOpen("https://prague.eu/en/objevujte/wenceslas-square-vaclavske-namesti/"),
    coordinates: { lat: 50.080840251046, lng: 14.428099791016 },
  }),
  attraction({
    id: "national-museum",
    outsideView: true,
    name: "National Museum (Národní muzeum)",
    mapsQuery: "National Museum Prague",
    description: "المبنى التاريخي فوق ساحة فاتسلاف، فيه معارض تاريخ وطبيعة.",
    whyRecommend: "مبنى فخم وقاعات كبيرة، مناسب ليوم ثقافة أو جو ماطر.",
    areaId: "nove-mesto",
    duration: "ساعتين تقريبًا",
    priceType: "paid",
    bookingStatus: "مش ضروري عادةً",
    bestTime: "قبل الظهر",
    tip: "مناسب كخيار داخلي إذا الجو برد أو مطر.",
    officialUrl: "https://www.nm.cz",
    mustSee: false,
    address: "Václavské náměstí, 110 00 Praha 1",
    priceText: "360 CZK",
    hours: fixed(everyDay(["10:00", "18:00"]), "https://prague.eu/en/objevujte/national-museum-museum-complex-of-the-national-museum/"),
    coordinates: { lat: 50.0791835, lng: 14.4296863 },
  }),
  attraction({
    id: "mucha-museum",
    name: "Mucha Museum",
    mapsQuery: "Mucha Museum",
    description: "متحف صغير لأعمال الفنان Alfons Mucha، رائد الآرت نوفو.",
    whyRecommend: "زيارة قصيرة ومركّزة لمحبي الفن والتصميم.",
    areaId: "nove-mesto",
    duration: "ساعة تقريبًا",
    priceType: "paid",
    bookingStatus: "بدون حجز",
    bestTime: "أي وقت بالنهار",
    tip: "قريب من Wenceslas Square وNa Příkopě.",
    officialUrl: "https://www.mucha.cz",
    mustSee: false,
    address: "Panská 7, 110 00 Praha 1",
    priceText: "300 CZK",
    hours: fixed(everyDay(["10:00", "18:00"]), "https://prague.eu/en/objevujte/mucha-museum/"),
    coordinates: { lat: 50.084324541368, lng: 14.427520137434 },
  }),
  attraction({
    id: "dancing-house",
    name: "Dancing House (Tančící dům)",
    mapsQuery: "Dancing House",
    description: "مبنى حديث بشكل راقص على ضفة النهر.",
    whyRecommend: "صورة معمارية مختلفة عن باقي براغ القديمة، على طريق النهر.",
    areaId: "nove-mesto",
    duration: "15 دقيقة تقريبًا",
    priceType: "free",
    bookingStatus: "بدون حجز",
    bestTime: "أي وقت",
    tip: "الوقفة هون من برّا للصور.",
    mustSee: false,
    address: "Rašínovo nábřeží 80 / Jiráskovo náměstí 6, 120 00 Praha 2",
    hours: alwaysOpen("https://prague.eu/en/objevujte/dancing-house-tancici-dum/"),
    coordinates: { lat: 50.075472668038, lng: 14.41414284418 },
  }),
  attraction({
    id: "naplavka",
    name: "Náplavka (Rašínovo nábřeží)",
    mapsQuery: "Naplavka Rasinovo nabrezi",
    description: "رصيف النهر تحت Rašínovo nábřeží، مكان مشي وجلسات على الماء.",
    whyRecommend: "مشي هادئ على النهر بين Dancing House وVyšehrad.",
    areaId: "nove-mesto",
    duration: "45 دقيقة تقريبًا",
    priceType: "free",
    bookingStatus: "بدون حجز",
    bestTime: "العصر",
    tip: "سوق مزارعين كل سبت 8:00–14:00 (فبراير–ديسمبر).",
    mustSee: false,
    address: "Rašínovo nábřeží, 128 00 Praha 2",
    hours: alwaysOpen("https://prague.eu/en/objevujte/naplavka-rasinovo-embankment/"),
    coordinates: { lat: 50.070389948511, lng: 14.4140990295 },
  }),
  attraction({
    id: "vysehrad",
    name: "Vyšehrad",
    mapsQuery: "Vysehrad",
    description: "قلعة تاريخية على تلة فوق النهر، فيها كنيسة St. Peter and Paul وحدائق.",
    whyRecommend: "إطلالات على النهر وجو أهدى من المركز.",
    areaId: "vysehrad",
    duration: "ساعة ونص تقريبًا",
    priceType: "free",
    bookingStatus: "بدون حجز",
    bestTime: "العصر وقبل الغروب",
    tip: "المنطقة الخارجية مفتوحة طول السنة ومجانية؛ بعض الأجزاء (مثل الكازمات) بتذاكر.",
    officialUrl: "https://www.praha-vysehrad.cz",
    mustSee: false,
    address: "V Pevnosti 159/5b, 128 00 Praha 2",
    hours: alwaysOpen("https://prague.eu/en/objevujte/vysehrad/"),
    coordinates: { lat: 50.064450139585, lng: 14.42005289892 },
  }),
  attraction({
    id: "zizkov-tower",
    outsideView: true,
    name: "Žižkov Television Tower",
    mapsQuery: "Zizkov Television Tower",
    description: "برج التلفزيون العالي في Žižkov، وفيه منصة مشاهدة.",
    whyRecommend: "إطلالة عالية على كل المدينة، ومفتوح لحد آخر الليل.",
    areaId: "zizkov-vinohrady",
    duration: "ساعة تقريبًا",
    priceType: "paid",
    bookingStatus: "بدون حجز",
    bestTime: "المسا",
    tip: "على البرج تماثيل أطفال زاحفين للفنان David Černý.",
    officialUrl: "https://www.towerpark.cz",
    mustSee: false,
    address: "Mahlerovy sady 1, 130 00 Praha 3",
    priceText: "350 CZK",
    hours: fixed(everyDay(["09:00", "00:00"]), "https://prague.eu/en/objevujte/prague-tv-tower-zizkov-television-tower/"),
    coordinates: { lat: 50.081076057412, lng: 14.451184272766 },
  }),
  attraction({
    id: "vitkov-memorial",
    name: "National Memorial on Vítkov Hill",
    mapsQuery: "National Memorial on Vitkov Hill",
    description: "نصب وطني على تلة Vítkov فوق Žižkov.",
    whyRecommend: "تلة بإطلالة على المدينة، والدخول مجاني.",
    areaId: "zizkov-vinohrady",
    duration: "ساعة تقريبًا",
    priceType: "free",
    bookingStatus: "بدون حجز",
    bestTime: "العصر",
    tip: "آخر دخول 17:30.",
    officialUrl: "https://www.vhu.cz",
    mustSee: false,
    address: "U Památníku 1900, 130 00 Praha 3",
    hours: fixed(days(TUE_TO_SUN, ["10:00", "18:00"]), "https://prague.eu/en/objevujte/national-memorial-on-vitkov-hill/"),
    coordinates: { lat: 50.0885394, lng: 14.4500316 },
  }),
  attraction({
    id: "riegrovy-sady",
    name: "Riegrovy sady",
    mapsQuery: "Riegrovy sady",
    description: "حديقة على تلة في Vinohrady بإطلالة على القلعة.",
    whyRecommend: "حديقة محلية هادية بإطلالة على القلعة وMalá Strana.",
    areaId: "zizkov-vinohrady",
    duration: "45 دقيقة تقريبًا",
    priceType: "free",
    bookingStatus: "بدون حجز",
    bestTime: "الغروب",
    tip: "قريبة من برج Žižkov، فبتجمعهم بمشوار مسائي.",
    mustSee: false,
    address: "Riegrovy sady, 120 00 Praha 2 – Vinohrady",
    coordinates: { lat: 50.08014444444444, lng: 14.440458333333334 },
  }),
  attraction({
    id: "letna-park",
    name: "Letná Park (Letenské sady)",
    mapsQuery: "Letna Park",
    description: "حديقة كبيرة على تلة شمال النهر، بإطلالة على الجسور والبلدة القديمة.",
    whyRecommend: "إطلالة كلاسيكية على جسور براغ، ومشي أخضر.",
    areaId: "letna-holesovice",
    duration: "45 دقيقة تقريبًا",
    priceType: "free",
    bookingStatus: "بدون حجز",
    bestTime: "العصر",
    tip: "قريبة من متحف التقنية الوطني.",
    mustSee: false,
    address: "Letenské sady, 170 00 Praha 7",
    coordinates: { lat: 50.093736, lng: 14.412533 },
  }),
  attraction({
    id: "national-technical-museum",
    name: "National Technical Museum",
    mapsQuery: "National Technical Museum Prague",
    description: "متحف كبير للتقنية فيه 16 معرض دائم، جنب حديقة Letná.",
    whyRecommend: "ممتع للعائلات ومحبي التقنية، وخيار داخلي ممتاز.",
    areaId: "letna-holesovice",
    duration: "ساعتين تقريبًا",
    priceType: "paid",
    bookingStatus: "بدون حجز",
    bestTime: "أي وقت بالنهار",
    tip: "",
    officialUrl: "https://www.ntm.cz",
    mustSee: false,
    address: "Kostelní 42, 170 87 Praha 7",
    priceText: "290 CZK",
    hours: fixed(days(TUE_TO_SUN, ["09:00", "18:00"]), "https://prague.eu/en/objevujte/national-technical-museum-narodni-technicke-muzeum/"),
    coordinates: { lat: 50.0974431, lng: 14.4253258 },
  }),
  attraction({
    id: "prague-zoo",
    name: "Prague Zoo",
    mapsQuery: "Prague Zoo",
    description: "حديقة حيوان كبيرة في Troja شمال المدينة.",
    whyRecommend: "يوم أو نص يوم ممتع للعائلات.",
    areaId: "troja",
    duration: "3 ساعات تقريبًا",
    priceType: "paid",
    bookingStatus: "مش ضروري عادةً",
    bestTime: "الصبح",
    tip: "",
    officialUrl: "https://www.zoopraha.cz",
    mustSee: false,
    address: "U Trojského zámku 3/120, 171 00 Praha 7",
    priceText: "330 CZK",
    hours: variable("نوفمبر–فبراير 9:00–16:00 · مارس 9:00–17:00 · أبريل–مايو 9:00–18:00 · يونيو–أغسطس 9:00–19:00 · سبتمبر 9:00–18:00 · أكتوبر 9:00–17:00 (كل الأيام)", "https://prague.eu/en/objevujte/prague-zoo-zoologicka-zahrada-hl-m-prahy/"),
    coordinates: { lat: 50.116815579056, lng: 14.411054272739 },
  }),
  attraction({
    id: "troja-chateau",
    name: "Troja Château",
    mapsQuery: "Troja Chateau",
    description: "قصر باروكي (معرض Prague City Gallery) مع حدائق، جنب حديقة الحيوان.",
    whyRecommend: "إضافة هادية لنفس المشوار مع حديقة الحيوان.",
    areaId: "troja",
    duration: "ساعة تقريبًا",
    priceType: "paid",
    bookingStatus: "بدون حجز",
    bestTime: "بعد الظهر",
    tip: "برّا موسمه (2026: 1 أبريل–29 أكتوبر) القصر مسكّر والحدائق بس مفتوحة، وبتسكر وقت الصقيع.",
    officialUrl: "https://www.ghmp.cz",
    mustSee: false,
    address: "U Trojského zámku 1, 171 00 Praha 7",
    priceText: "200 CZK",
    hours: variable(
      "الموسم (2026: 1 أبريل–29 أكتوبر): الثلاثاء–الخميس 10:00–18:00، الجمعة 13:00–18:00، السبت–الأحد 10:00–18:00، الاثنين مغلق · برّا الموسم: القصر مغلق، والحدائق الثلاثاء–الخميس 10:00–16:00، الجمعة 13:00–16:00، السبت–الأحد 10:00–16:00",
      "https://prague.eu/en/objevujte/prague-city-gallery-troja-chateau-zamek-troja/",
      ["monday"]
    ),
    coordinates: { lat: 50.11647328527, lng: 14.412853305835 },
  }),
  attraction({
    id: "museum-kampa",
    name: "Museum Kampa",
    mapsQuery: "Museum Kampa",
    description: "متحف فن حديث لوسط أوروبا داخل طاحونة قديمة على جزيرة Kampa.",
    whyRecommend: "فن حديث بموقع جميل على النهر، جنب Charles Bridge.",
    areaId: "mala-strana",
    duration: "ساعة تقريبًا",
    priceType: "paid",
    bookingStatus: "بدون حجز",
    bestTime: "أي وقت بالنهار",
    tip: "آخر دخول قبل الإغلاق بنص ساعة.",
    officialUrl: "https://www.museumkampa.cz",
    mustSee: false,
    address: "U Sovových mlýnů 2, 118 00 Praha 1",
    priceText: "280 CZK",
    hours: fixed(everyDay(["10:00", "18:00"]), "https://prague.eu/en/objevujte/museum-kampa/"),
    coordinates: { lat: 50.0840345, lng: 14.4084767 },
  }),
  attraction({
    id: "convent-st-agnes",
    name: "Convent of St Agnes of Bohemia (National Gallery)",
    mapsQuery: "Convent of St Agnes of Bohemia",
    description: "دير قوطي قديم فيه معرض للمعرض الوطني، بالطرف الشمالي للبلدة القديمة.",
    whyRecommend: "مكان هادي لمحبي الفن والتاريخ، قريب من Josefov.",
    areaId: "josefov",
    duration: "ساعة تقريبًا",
    priceType: "paid",
    bookingStatus: "بدون حجز",
    bestTime: "أي وقت بالنهار",
    tip: "",
    officialUrl: "https://www.ngprague.cz",
    mustSee: false,
    address: "Anežská 12, 110 00 Praha 1",
    priceText: "250 CZK",
    hours: fixed(days(TUE_TO_SUN, ["10:00", "18:00"]), "https://prague.eu/en/objevujte/national-gallery-prague-convent-of-st-agnes-of-bohemia-klaster-sv-anezky-ceske/"),
    coordinates: { lat: 50.0922339, lng: 14.424077 },
  }),
  attraction({
    id: "franciscan-garden",
    name: "Franciscan Garden (Františkánská zahrada)",
    mapsQuery: "Franciscan Garden",
    description: "حديقة صغيرة هادية وسط المدينة الجديدة، جنب ساحة فاتسلاف.",
    whyRecommend: "استراحة خضرا قصيرة بنص المركز.",
    areaId: "nove-mesto",
    duration: "20 دقيقة تقريبًا",
    priceType: "free",
    bookingStatus: "بدون حجز",
    bestTime: "أي وقت",
    tip: "المدخل من Jungmannovo náměstí.",
    mustSee: false,
    address: "Jungmannovo náměstí, 110 00 Praha 1",
    hours: variable("15 أبريل–14 سبتمبر 7:00–22:00 · 15 سبتمبر–14 أكتوبر 7:00–20:00 · 15 أكتوبر–14 أبريل 8:00–19:00", "https://prague.eu/en/objevujte/franciscan-garden-frantiskanska-zahrada/"),
    coordinates: { lat: 50.082169519262, lng: 14.423870625934 },
  }),
  attraction({
    id: "havlicek-gardens",
    name: "Havlíček Gardens (Grébovka)",
    mapsQuery: "Havlickovy sady Grebovka",
    description: "حديقة كبيرة على منحدر في Vinohrady.",
    whyRecommend: "مشي أخضر هادي بعيد عن زحمة المركز.",
    areaId: "zizkov-vinohrady",
    duration: "45 دقيقة تقريبًا",
    priceType: "free",
    bookingStatus: "بدون حجز",
    bestTime: "العصر",
    tip: "",
    mustSee: false,
    address: "Havlíčkovy sady, 120 00 Praha 2 – Vinohrady",
    hours: variable("نوفمبر–مارس 6:00–22:00 · أبريل–أكتوبر 6:00–24:00 (كل الأيام)", "https://prague.eu/en/objevujte/havlicek-gardens-grebovka-havlickovy-sady/"),
    coordinates: { lat: 50.069081150685, lng: 14.445300580908 },
  }),
  attraction({
    id: "trade-fair-palace",
    name: "Trade Fair Palace (National Gallery Prague)",
    mapsQuery: "Trade Fair Palace National Gallery Prague",
    description: "مبنى وظيفي من العشرينات فيه مجموعات الفن الحديث والمعاصر للمعرض الوطني.",
    whyRecommend: "أكبر مكان للفن الحديث في براغ، وخيار داخلي ممتاز.",
    areaId: "letna-holesovice",
    duration: "ساعتين تقريبًا",
    priceType: "paid",
    bookingStatus: "بدون حجز",
    bestTime: "أي وقت بالنهار",
    tip: "",
    officialUrl: "https://www.ngprague.cz",
    mustSee: false,
    address: "Dukelských hrdinů 47, 170 00 Praha 7",
    priceText: "250 CZK",
    hours: fixed(days(TUE_TO_SUN, ["10:00", "18:00"]), "https://prague.eu/en/objevujte/national-gallery-prague-trade-fair-palace-veletrzni-palac/"),
    coordinates: { lat: 50.1010757, lng: 14.4327945 },
  }),
  attraction({
    id: "dox",
    name: "DOX Centre for Contemporary Art",
    mapsQuery: "DOX Centre for Contemporary Art",
    description: "مركز فن معاصر في Holešovice بمعارض متغيرة.",
    whyRecommend: "لمحبي الفن المعاصر والمعارض المختلفة.",
    areaId: "letna-holesovice",
    duration: "ساعة ونص تقريبًا",
    priceType: "paid",
    bookingStatus: "بدون حجز",
    bestTime: "بعد الظهر",
    tip: "",
    officialUrl: "https://www.dox.cz",
    mustSee: false,
    address: "Poupětova 1, 170 00 Praha 7",
    priceText: "330 CZK",
    hours: fixed(days(TUE_TO_SUN, ["11:00", "19:00"]), "https://prague.eu/en/objevujte/dox-centre-for-contemporary-art/"),
    coordinates: { lat: 50.1067812, lng: 14.4470411 },
  }),
  attraction({
    id: "stromovka",
    name: "Stromovka (Royal Game Reserve)",
    mapsQuery: "Stromovka park",
    description: "حديقة واسعة شمال المركز، مساحات خضرا للمشي.",
    whyRecommend: "مشي طويل بالطبيعة جوا المدينة.",
    areaId: "letna-holesovice",
    duration: "ساعة تقريبًا",
    priceType: "free",
    bookingStatus: "بدون حجز",
    bestTime: "العصر",
    tip: "بين Holešovice وTroja.",
    mustSee: false,
    address: "Stromovka, 170 00 Praha 7 – Bubeneč",
    coordinates: { lat: 50.106494451475, lng: 14.419288404199 },
  }),
  attraction({
    id: "botanical-garden",
    name: "Prague Botanical Garden (Fata Morgana greenhouse)",
    mapsQuery: "Prague Botanical Garden Troja",
    description: "الحديقة النباتية في Troja مع بيت زجاجي (Fata Morgana).",
    whyRecommend: "تكملة طبيعية ليوم Troja مع حديقة الحيوان.",
    areaId: "troja",
    duration: "ساعة ونص تقريبًا",
    priceType: "paid",
    bookingStatus: "بدون حجز",
    bestTime: "بعد الظهر",
    tip: "البيت الزجاجي مغلق كل اثنين؛ الحديقة نفسها مفتوحة كل يوم.",
    officialUrl: "https://www.botanicka.cz",
    mustSee: false,
    address: "Trojská 800/196, 171 00 Praha 7",
    priceText: "180 CZK",
    hours: variable("الحديقة: يناير–فبراير 9:00–16:00 · مارس–أكتوبر 9:00–19:00 · نوفمبر–ديسمبر 9:00–16:00 (كل الأيام) · البيت الزجاجي مغلق الاثنين", "https://prague.eu/en/objevujte/prague-botanical-garden-fata-morgana-greenhouse-botanicka-zahrada-sklenik-fata-morgana/"),
    coordinates: { lat: 50.1219347, lng: 14.4125195 },
  }),
];

// ── Experiences (main-stop eligible) ────────────────────────────────────────────────────────────────
export const PRAGUE_EXPERIENCES: Experience[] = [
  {
    id: "vltava-one-hour-cruise",
    name: "One-hour Vltava cruise (Prague Steamboat Company)",
    image: "",
    categoryId: "river",
    tags: ["river", "views"],
    description: "رحلة نهرية حوالي ساعة على نهر Vltava، من رصيف Rašínovo nábřeží.",
    area: "Nové Město",
    address: "Rašínovo nábřeží, 120 00 Praha 2",
    duration: "ساعة تقريبًا",
    priceText: "فحصنا موقع الشركة (8 نوفمبر 2026): أسعار 2027 لسا مش منشورة",
    priceVaries: true,
    bookingRequired: false,
    lastVerified: VERIFIED,
    hours: variable("موسمية: أبريل–سبتمبر يوميًا 10:00–18:00 · أكتوبر السبت والأحد فقط · مغلق نوفمبر–مارس", "https://prague.eu/en/objevujte/prague-steamboat-company-prazska-paroplavebni-spolecnost/"),
    ...maps("Prague Steamboat Company Rasinovo nabrezi"),
    officialUrl: "https://www.paroplavba.cz",
  },
];

// ── Food ────────────────────────────────────────────────────────────────────────────────────────────
export const PRAGUE_FOOD_CATEGORIES: FoodCategory[] = [
  { id: "breakfast", icon: "🥐", label: "فطور" },
  { id: "cafes", icon: "☕", label: "مقاهي" },
  { id: "local", icon: "🍲", label: "مطبخ تشيكي" },
  { id: "middle-eastern", icon: "🧆", label: "مطبخ شرقي" },
  { id: "restaurants", icon: "🍴", label: "مطاعم" },
];

type FoodInput = Omit<FoodPlace, "mapsUrl" | "appleMapsUrl" | "lastVerified" | "hours"> & {
  hoursSchedule: WeeklySchedule;
  sourceUrl: string;
  /** Source name when it is not prague.eu (e.g. the restaurant's own site), and the date it was read when later than VERIFIED. */
  hoursSource?: string;
  verifiedOn?: string;
};

function food(input: FoodInput): FoodPlace {
  const { hoursSchedule, sourceUrl, hoursSource, verifiedOn, ...rest } = input;
  const hours: HoursInfo =
    hoursSource || verifiedOn
      ? { type: "fixed", schedule: hoursSchedule, source: hoursSource ?? PRAGUE_EU, sourceUrl, lastVerified: verifiedOn ?? VERIFIED }
      : fixed(hoursSchedule, sourceUrl);
  return { ...maps(input.name), lastVerified: verifiedOn ?? VERIFIED, hours, ...rest };
}

const MON_TO_FRI: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const WEEKEND: Weekday[] = ["saturday", "sunday"];

export const PRAGUE_FOOD_PLACES: FoodPlace[] = [
  food({ id: "cafe-louvre", name: "Café Louvre", categoryId: "breakfast", area: "Nové Město", address: "Národní 22, 110 00 Praha 1", why: "مقهى تاريخي من 1902، مناسب للفطور.", officialUrl: "https://www.cafelouvre.cz", dietaryTags: ["coffee", "dessert", "pork-maybe"], hoursSchedule: { ...days(MON_TO_FRI, ["08:00", "23:30"]), ...days(WEEKEND, ["09:00", "23:30"]) }, sourceUrl: "https://prague.eu/en/objevujte/cafe-louvre/" }),
  food({ id: "cafe-savoy", name: "Café Savoy", categoryId: "breakfast", area: "Malá Strana", address: "Vítězná 5, 150 00 Praha 5", why: "مقهى ومطعم بديكور آرت نوفو، مشهور بالفطور والحلويات التشيكية.", officialUrl: "https://cafesavoy.ambi.cz", dietaryTags: ["coffee", "dessert", "pork-maybe"], hoursSchedule: { ...days(MON_TO_FRI, ["08:00", "22:00"]), ...days(WEEKEND, ["09:00", "22:00"]) }, sourceUrl: "https://prague.eu/en/objevujte/cafe-savoy/" }),
  food({ id: "cafe-imperial", name: "Café Imperial", categoryId: "breakfast", area: "Nové Město (Na Poříčí)", address: "Na Poříčí 15, 110 00 Praha 1", why: "مشهور بالـ Eggs Benedict للفطور، ومطبخ تشيكي حديث للغدا والعشا.", officialUrl: "https://www.cafeimperial.cz", dietaryTags: ["coffee", "meat", "pork-maybe"], hoursSchedule: everyDay(["07:00", "23:00"]), sourceUrl: "https://prague.eu/en/objevujte/cafe-imperial/" }),
  food({ id: "mansson-bakery", name: "Mansson Bakery", categoryId: "breakfast", area: "Josefov", address: "Bílkova 8, 110 00 Praha 1", why: "مخبز دنماركي: معجنات وفطور خفيف وسندويشات.", officialUrl: "https://www.mansson-bakery.com", dietaryTags: ["coffee", "dessert"], hoursSchedule: { ...days(MON_TO_FRI, ["07:00", "19:00"]), ...days(WEEKEND, ["08:00", "19:00"]) }, sourceUrl: "https://prague.eu/en/objevujte/mansson-bakery/" }),
  food({ id: "kavarna-slavia", name: "Café Slavia", categoryId: "cafes", area: "Staré Město", address: "Národní 1 / Smetanovo nábřeží 2, 110 00 Praha 1", why: "مقهى تاريخي مقابل المسرح الوطني، بإطلالة على النهر والقلعة.", officialUrl: "https://www.cafeslavia.cz", dietaryTags: ["coffee", "dessert"], hoursSchedule: { ...days([...MON_TO_FRI, "saturday"], ["09:00", "23:00"]), sunday: [{ open: "09:00", close: "22:00" }] }, sourceUrl: "https://www.cafeslavia.cz/", hoursSource: "cafeslavia.cz (official)", verifiedOn: "2026-11-08" }),
  food({ id: "grand-cafe-orient", name: "Grand Café Orient", categoryId: "cafes", area: "Staré Město (Ovocný trh)", address: "Ovocný trh 19, 110 00 Praha 1", why: "مقهى بالبلدة القديمة، مشهور بحلوى věneček.", officialUrl: "https://www.grandcafeorient.cz", dietaryTags: ["coffee", "dessert"], hoursSchedule: { ...days(MON_TO_FRI, ["09:00", "21:00"]), ...days(WEEKEND, ["10:00", "21:00"]) }, sourceUrl: "https://www.grandcafeorient.cz/", hoursSource: "grandcafeorient.cz (official)", verifiedOn: "2026-11-08" }),
  food({ id: "kavarna-obecni-dum", name: "Kavárna Obecní dům", categoryId: "cafes", area: "Staré Město (náměstí Republiky)", address: "náměstí Republiky 5, 110 00 Praha 1", why: "مقهى داخل Municipal House بقاعة آرت نوفو وكيكات.", officialUrl: "https://www.kavarnaod.cz", dietaryTags: ["coffee", "dessert"], hoursSchedule: everyDay(["08:00", "23:00"]), sourceUrl: "https://prague.eu/en/objevujte/kavarna-obecni-dum/" }),
  food({ id: "lobkowicz-palace-cafe", name: "Lobkowicz Palace Café", categoryId: "cafes", area: "Hradčany (Prague Castle)", address: "Jiřská 1, 110 00 Praha 1", why: "داخل مجمع القلعة: شوربات وسلطات وسندويشات وحلويات بيتية.", officialUrl: "https://www.lobkowicz.cz/lobkowicz-palace-cafe", dietaryTags: ["coffee", "dessert", "vegetarian"], hoursSchedule: everyDay(["10:00", "18:00"]), sourceUrl: "https://prague.eu/en/objevujte/lobkowicz-palace-cafe-lobkowiczky-palac/" }),
  food({ id: "kavarna-novy-svet", name: "Kavárna Nový Svět", categoryId: "cafes", area: "Hradčany (Nový Svět)", address: "Nový Svět 2, 118 00 Praha 1", why: "مقهى صغير بشارع Nový Svět الهادي قرب Loreta.", dietaryTags: ["coffee"], hoursSchedule: { ...days(["tuesday", "wednesday", "thursday", "friday", "saturday"], ["10:00", "19:00"]), sunday: [{ open: "10:00", close: "18:00" }] }, sourceUrl: "https://prague.eu/en/objevujte/kavarna-novy-svet-new-world-cafe/" }),
  food({ id: "cafe-kupka", name: "Café Kupka", categoryId: "cafes", area: "Žižkov (Vítkov)", address: "U Památníku 1600/2, 130 00 Praha 3", why: "مقهى نصب Vítkov: قهوة وحلويات بيتية وسناكات، مع تراس بإطلالة.", dietaryTags: ["coffee", "dessert"], hoursSchedule: days(TUE_TO_SUN, ["10:00", "18:00"]), sourceUrl: "https://prague.eu/en/objevujte/cafe-kupka/" }),
  food({ id: "kavarna-lucerna", name: "Kavárna Lucerna", categoryId: "cafes", area: "Nové Město (Lucerna Palace)", address: "Vodičkova 36, 110 00 Praha 1", why: "مقهى تاريخي داخل ممر Lucerna قرب ساحة فاتسلاف.", officialUrl: "https://kavarna.lucerna.cz", dietaryTags: ["coffee", "dessert"], hoursSchedule: { ...days(MON_TO_FRI, ["11:00", "23:00"]), ...days(WEEKEND, ["12:00", "23:00"]) }, sourceUrl: "https://prague.eu/en/objevujte/kavarna-lucerna/" }),
  food({ id: "kuchyn", name: "Kuchyň", categoryId: "local", area: "Hradčany (Hradčanské náměstí)", address: "Hradčanské náměstí 1, 118 00 Praha 1", why: "مطبخ تشيكي تقليدي من وصفات قديمة، جنب بوابة القلعة.", officialUrl: "https://kuchyn.ambi.cz", dietaryTags: ["meat", "pork-maybe"], hoursSchedule: everyDay(["11:30", "23:00"]), sourceUrl: "https://prague.eu/en/objevujte/kitchen-kuchyn/" }),
  food({ id: "mlynec", name: "Mlýnec", categoryId: "restaurants", area: "Staré Město (Charles Bridge)", address: "Novotného lávka 9, 110 00 Praha 1", why: "أطباق تشيكية بأسلوب حديث جنب Charles Bridge.", officialUrl: "https://www.mlynec.cz", dietaryTags: ["meat", "pork-maybe"], hoursSchedule: { ...days(MON_TO_FRI, ["11:30", "15:00"], ["17:00", "22:00"]), ...days(WEEKEND, ["11:30", "15:00"], ["17:30", "22:00"]) }, sourceUrl: "https://www.mlynec.cz/en/", hoursSource: "mlynec.cz (official)", verifiedOn: "2026-11-08" }),
  food({ id: "u-modre-kachnicky-mala-strana", name: "U Modré kachničky (Malá Strana)", categoryId: "local", area: "Malá Strana", address: "Nebovidská 6, 118 00 Praha 1", why: "مطعم تشيكي متخصص بالبط والطرائد.", officialUrl: "https://www.umodrekachnicky.cz", dietaryTags: ["meat", "pork-maybe"], hoursSchedule: everyDay(["12:00", "23:00"]), sourceUrl: "https://prague.eu/en/objevujte/u-modre-kachnicky-i/" }),
  food({ id: "u-modre-kachnicky-old-town", name: "U Modré kachničky (Old Town)", categoryId: "local", area: "Staré Město", address: "Michalská 16, 110 00 Praha 1", why: "فرع البلدة القديمة: بط وطرائد ومطبخ تشيكي تقليدي.", officialUrl: "https://www.umodrekachnicky.cz", dietaryTags: ["meat", "pork-maybe"], hoursSchedule: everyDay(["11:30", "23:00"]), sourceUrl: "https://prague.eu/en/objevujte/u-modre-kachnicky-ii/" }),
  food({ id: "petrinske-terasy", name: "Petřínské terasy", categoryId: "local", area: "Petřín", address: "Petřínské sady 393, 118 00 Praha 1", why: "مطعم على تلة Petřín بتراس مطل على المدينة.", officialUrl: "https://www.petrinsketerasy.cz", dietaryTags: ["meat", "pork-maybe"], hoursSchedule: { ...days(["tuesday", "wednesday", "thursday", "friday"], ["12:00", "22:00"]), saturday: [{ open: "11:00", close: "23:00" }], sunday: [{ open: "11:00", close: "21:00" }] }, sourceUrl: "https://www.petrinsketerasy.cz/", hoursSource: "petrinsketerasy.cz (official)", verifiedOn: "2026-11-08" }),
  food({ id: "restaurant-obecni-dum", name: "Restaurant Obecní dům", categoryId: "local", area: "Staré Město (náměstí Republiky)", address: "náměstí Republiky 5, 110 00 Praha 1", why: "مطبخ تشيكي حديث داخل Municipal House.", officialUrl: "https://www.restauraceod.cz", dietaryTags: ["meat", "pork-maybe"], hoursSchedule: { ...days(MON_TO_FRI, ["11:30", "15:00"], ["17:30", "23:00"]), ...days(WEEKEND, ["17:30", "23:00"]) }, sourceUrl: "https://www.restauraceod.cz/", hoursSource: "restauraceod.cz (official)", verifiedOn: "2026-11-08" }),
  food({ id: "hostinec-na-vytoni", name: "Hostinec Na Výtoni", categoryId: "local", area: "Nové Město (Výtoň, riverside)", address: "Rašínovo nábřeží 30, 128 00 Praha 2", why: "مطبخ تشيكي مع تركيز على البط المشوي على الفحم، على النهر قرب Vyšehrad.", officialUrl: "https://www.kachna.cz", dietaryTags: ["meat", "pork-maybe"], hoursSchedule: everyDay(["11:30", "23:00"]), sourceUrl: "https://prague.eu/en/objevujte/hostinec-na-vytoni/" }),
  food({ id: "u-kroka", name: "U Kroka", categoryId: "local", area: "Vyšehrad", address: "Vratislavova 28, 128 00 Praha 2", why: "مطعم تشيكي تحت قلعة Vyšehrad.", officialUrl: "https://www.ukroka.cz", dietaryTags: ["meat", "pork-maybe"], hoursSchedule: everyDay(["11:30", "16:00"], ["17:00", "23:00"]), sourceUrl: "https://www.ukroka.cz/", hoursSource: "ukroka.cz (official; kitchen hours)", verifiedOn: "2026-11-08" }),
  // Added 2026-11-07 from the restaurants' own sites (not prague.eu). Halal: stated only as the restaurant states it, never as a certificate.
  // Habibi (habibipraguecafe.cz): "100% halal certified meat", "100% non-alcoholic"; no certifying body is named. Hours on the site read
  // Mon-Sun 11:00-02:00 in one place and "dinner till 1 AM" in another, so the stored window is the conservative 11:00-00:00.
  food({ id: "habibi-prague", name: "Habibi Prague (Restaurant & Shisha Lounge)", categoryId: "middle-eastern", area: "Nové Město (Na Příkopě)", address: "Na Příkopě 23, 110 00 Praha 1 (Pánská pasáž)", why: "مطعم لبناني بممر Pánská pasáž، على اليمين تحت الدرج (مش Bistro Habibi بـVyšehrad). بيعلن على موقعه إن لحمه حلال 100% ومن غير كحول، بدون ما يذكر جهة الشهادة، وفيه أرجيلة.", officialUrl: "https://www.habibipraguecafe.cz/", phone: "+420 777 858 990", dietaryTags: ["meat"], hoursSchedule: everyDay(["11:00", "02:00"]), sourceUrl: "https://www.habibipraguecafe.cz/home", hoursSource: "habibipraguecafe.cz (restaurant's own site)", verifiedOn: "2026-11-08" }),
  // Jaffa (jaffa-restaurant.cz, its own ordering site): Panská 894/4, daily 11:00-21:00 for the ordering location (11:00-22:00 in another
  // field of the same site; Tripadvisor / Wanderlog say 10:00-22:00), so 11:00-21:00 is stored. Halal: only 13 of 49 dishes carry the
  // site's own "Halal" label (grilled lamb/beef 4/4, chicken 4/7, mix grill 2/4, specialities 3/7), no certificate is published, and
  // Mustakshif lists it as not verified: so the restaurant is NOT classed halal, and the card says exactly that. It closes at 21:00
  // (30 minutes before a 20:00-21:30 dinner slot ends): dated plans cap the window at the closing time, flexible-date plans cannot
  // check it, and the card always shows the hours.
  food({ id: "jaffa-restaurant", name: "Jaffa Restaurant", categoryId: "middle-eastern", area: "Nové Město (Panská)", address: "Panská 4 (Panská 894/4), 110 00 Praha 1", why: "مطعم عربي مشاوي (كباب وحمص وأسماك) بآخر الطابق الأرضي لمركز Černá růže. فحصنا: قائمته بتعلّم 13 من 49 طبق «حلال» بس، وما لقينا شهادة حلال للمطعم.", officialUrl: "https://www.jaffa-restaurant.cz/", phone: "+420 720 262 202", dietaryTags: ["meat", "seafood"], hoursSchedule: everyDay(["11:00", "22:00"]), sourceUrl: "https://www.jaffa-restaurant.cz/", hoursSource: "jaffa-restaurant.cz (restaurant's own site)", verifiedOn: "2026-11-08" }),
  food({ id: "u-cedru", name: "U Cedru", categoryId: "middle-eastern", area: "Bubeneč", address: "Národní obrany 27, 160 00 Praha 6", why: "من أول المطاعم اللبنانية في براغ: مازات وأطباق لحم وسمك.", officialUrl: "https://www.ucedru.cz", dietaryTags: ["meat", "seafood"], hoursSchedule: everyDay(["11:00", "22:00"]), sourceUrl: "https://prague.eu/en/objevujte/u-cedru/" }),
  food({ id: "bredovsky-dvur", name: "Bredovský dvůr", categoryId: "local", area: "Nové Město", address: "Politických vězňů 13, 110 00 Praha 1", why: "مطبخ تشيكي تقليدي قرب ساحة فاتسلاف.", officialUrl: "https://www.restauracebredovskydvur.cz", dietaryTags: ["meat", "pork-maybe"], hoursSchedule: { ...days(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"], ["11:00", "00:00"]), sunday: [{ open: "11:00", close: "23:00" }] }, sourceUrl: "https://prague.eu/en/objevujte/bredovsky-dvur-restaurant/" }),
  food({ id: "u-pinkasu", name: "U Pinkasů", categoryId: "local", area: "Nové Město (Jungmannovo náměstí)", address: "Jungmannovo náměstí 16, 110 00 Praha 1", why: "أطباق تشيكية تقليدية بوصفات قديمة، جنب Franciscan Garden.", officialUrl: "https://www.upinkasu.cz", dietaryTags: ["meat", "pork-maybe"], hoursSchedule: everyDay(["10:00", "22:30"]), sourceUrl: "https://prague.eu/en/objevujte/u-pinkasu-restaurant/" }),
  food({ id: "cestr", name: "Čestr", categoryId: "restaurants", area: "Vinohrady (by the National Museum)", address: "Legerova 57/75, 110 00 Praha 1", why: "مطعم جنب المتحف الوطني.", officialUrl: "https://cestr.ambi.cz/en", dietaryTags: ["meat", "pork-maybe"], hoursSchedule: { ...days(MON_TO_FRI, ["11:30", "23:00"]), saturday: [{ open: "12:00", close: "23:00" }], sunday: [{ open: "12:00", close: "22:00" }] }, sourceUrl: "https://prague.eu/en/objevujte/cestr/" }),
  food({ id: "vinohradsky-parlament", name: "Vinohradský Parlament", categoryId: "local", area: "Vinohrady", address: "Korunní 1, 120 00 Praha 2", why: "مطبخ تشيكي تقليدي بأسلوب حديث (منه لحم بقر وخنزير بري).", officialUrl: "https://www.vinohradskyparlament.cz", dietaryTags: ["meat", "pork-maybe"], hoursSchedule: { monday: [{ open: "10:45", close: "23:00" }], ...days(["tuesday", "wednesday"], ["10:45", "23:30"]), ...days(["thursday", "friday"], ["10:45", "00:00"]), saturday: [{ open: "11:30", close: "00:00" }], sunday: [{ open: "11:30", close: "23:00" }] }, sourceUrl: "https://prague.eu/en/objevujte/vinohradsky-parlament-restaurant/" }),
  food({ id: "spravovna", name: "Spravovna", categoryId: "local", area: "Žižkov", address: "Ondříčkova 1, 130 00 Praha 3", why: "مطبخ تشيكي مشبع في Žižkov.", officialUrl: "https://www.spravovna.cz", dietaryTags: ["meat", "pork-maybe"], hoursSchedule: { ...days(["monday", "tuesday", "wednesday"], ["11:00", "00:00"]), ...days(["thursday", "friday"], ["11:00", "01:00"]), saturday: [{ open: "11:30", close: "00:00" }], sunday: [{ open: "11:30", close: "23:00" }] }, sourceUrl: "https://prague.eu/en/objevujte/spravovna/" }),
  food({ id: "kolkovna-v-kolkovne", name: "Kolkovna v Kolkovně", categoryId: "restaurants", area: "Staré Město (by Josefov)", address: "V Kolkovně 8, 110 00 Praha 1", why: "مطبخ عالمي وأطباق تشيكية تقليدية، على طرف Josefov.", officialUrl: "https://vkolkovne.kolkovna.cz", dietaryTags: ["meat", "pork-maybe"], hoursSchedule: everyDay(["11:00", "00:00"]), sourceUrl: "https://prague.eu/en/objevujte/kolkovna-v-kolkovne/" }),
  food({ id: "u-mecenase", name: "U Mecenáše", categoryId: "local", area: "Malá Strana (Malostranské náměstí)", address: "Malostranské náměstí 10, 118 00 Praha 1", why: "أطباق تشيكية إقليمية بساحة Malá Strana.", officialUrl: "https://www.restauraceumecenase.com", dietaryTags: ["meat", "pork-maybe"], hoursSchedule: everyDay(["11:00", "23:00"]), sourceUrl: "https://prague.eu/en/objevujte/restaurant-u-mecenase/" }),
  food({ id: "lvi-dvur", name: "Lví dvůr", categoryId: "local", area: "Hradčany (Prague Castle, north gate)", address: "U Prašného mostu 6, 118 00 Praha 1", why: "مطبخ تشيكي مستوحى من زمن Rudolf II، عند البوابة الشمالية للقلعة.", officialUrl: "https://www.restaurant-lvidvur.cz", dietaryTags: ["meat", "pork-maybe"], hoursSchedule: everyDay(["11:00", "19:00"]), sourceUrl: "https://prague.eu/en/objevujte/lvi-dvur/" }),
  food({ id: "letensky-zamecek", name: "Letenský zámeček", categoryId: "restaurants", area: "Letná", address: "Letenské sady 341, 170 00 Praha 7", why: "مطعم داخل حديقة Letná.", officialUrl: "https://www.letenskyzamecek.cz", dietaryTags: ["meat", "pork-maybe"], hoursSchedule: everyDay(["11:00", "23:00"]), sourceUrl: "https://prague.eu/en/objevujte/letensky-zamecek-restaurant/" }),
  {
    ...food({ id: "cafe-ornament", name: "Café Ornament (Botanical Garden)", categoryId: "cafes", area: "Troja", address: "Trojská 800/196, 171 00 Praha 7", why: "مقهى الحديقة النباتية في Troja، مع تراسين.", officialUrl: "https://www.botanicka.cz", dietaryTags: ["coffee", "dessert"], hoursSchedule: everyDay(["10:00", "16:30"]), sourceUrl: "https://prague.eu/en/objevujte/cafe-ornament/" }),
    hours: variable("مارس–أكتوبر 10:00–19:30 · نوفمبر–فبراير 10:00–16:30 (كل الأيام)", "https://prague.eu/en/objevujte/cafe-ornament/"),
  },
];

// ── Shopping (main-stop eligible + supplementary) ───────────────────────────────────────────────────
export const PRAGUE_SHOPPING_AREAS: ShoppingArea[] = [
  { id: "na-prikope", name: "Na Příkopě", image: "", bestFor: "ماركات عالمية ومشي", description: "أشهر شارع مشاة للتسوق، من آخر ساحة فاتسلاف (Můstek) لساحة Republiky.", ...maps("Na Prikope"), address: "Na Příkopě, 110 00 Praha 1", locationLabel: "نقطة مقترحة للبدء" },
  { id: "palladium", name: "Palladium", image: "", bestFor: "مول كبير بمكان واحد", description: "مركز تسوق بساحة Republiky، أكثر من 180 محل ومطعم على 5 طوابق.", ...maps("Palladium shopping centre"), officialUrl: "https://www.palladiumpraha.cz", address: "náměstí Republiky 1, 110 00 Praha 1", hours: fixed(everyDay(["09:00", "21:00"]), "https://prague.eu/en/objevujte/palladium/") },
  { id: "havelske-market", name: "Havelské tržiště (Havel's Market)", image: "", bestFor: "سوق صغير: فواكه وتذكارات", description: "السوق الوحيد المحفوظ في البلدة القديمة (من 1232)؛ خضرة وفواكه، وبالويكند تذكارات أكثر.", ...maps("Havelske trziste"), address: "Havelská 13, 110 00 Praha 1", hours: fixed({ ...days(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"], ["07:00", "19:00"]), sunday: [{ open: "08:00", close: "18:30" }] }, "https://prague.eu/en/objevujte/havelsky-market/") },
];

// ── Nightlife / evening ─────────────────────────────────────────────────────────────────────────────
export const PRAGUE_NIGHTLIFE_VENUES: NightlifeVenue[] = [
  {
    id: "reduta-jazz-club",
    name: "Reduta Jazz Club",
    categoryId: "live-music",
    area: "Nové Město",
    address: "Národní 20, 110 00 Praha 1",
    description: "نادي جاز تاريخي في براغ: جاز حديث وفانك وبلوز وديكسيلاند.",
    officialUrl: "https://www.redutajazzclub.cz",
    ...maps("Reduta Jazz Club"),
    tags: ["live-music", "jazz"],
    lastVerified: VERIFIED,
    hours: fixed(
      schedule({
        ...days(["monday", "tuesday", "wednesday"], ["19:00", "23:30"]),
        ...days(["thursday", "friday", "saturday"], ["18:00", "23:30"]),
        sunday: [{ open: "19:00", close: "23:30" }],
      }),
      "https://prague.eu/en/objevujte/reduta-jazz-club/"
    ),
  },
];

/** Everything the planner resolves for Prague, in the CityPlaceData shape (see cityPlannerModule.ts). */
// ── Planning hours: structured seasons, dated exceptions, last entry and source conflicts ─────────────────────────────
// Customers keep seeing each place's own text; the planner (tripHours.ts) resolves these per trip. Re-checked against each
// official source on 2026-11-08 (after the Perplexity audit of 2026-11-07); "conflict" records where sources disagree.
type PlanningHours = { seasonalSchedules?: SeasonalSchedule[]; dateExceptions?: HoursDateException[]; lastEntry?: string; conflict?: string };
const R = (open: string, close: string): TimeRange[] => [{ open, close }];
const season = (from: string, to: string, schedule: WeeklySchedule, lastEntry?: string): SeasonalSchedule => ({ from, to, schedule, ...(lastEntry ? { lastEntry } : {}) });
const TOWERS: SeasonalSchedule[] = [
  season("01-01", "03-31", everyDay(["10:00", "18:00"])),
  season("04-01", "05-31", everyDay(["10:00", "19:00"])),
  season("06-01", "09-30", everyDay(["09:00", "20:30"])),
  season("10-01", "11-30", everyDay(["10:00", "18:00"])),
  season("12-01", "12-31", everyDay(["10:00", "19:30"])),
];
const SUN_TO_FRI: Weekday[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];
const TYN_MAR_JUN_SEP_NOV: WeeklySchedule = { ...days(["tuesday", "wednesday", "thursday", "saturday"], ["10:00", "13:00"], ["15:00", "17:00"]), friday: R("10:00", "13:00") };

const PLANNING_HOURS: Record<string, PlanningHours> = {
  "prague-castle": {
    seasonalSchedules: [season("04-01", "10-31", everyDay(["09:00", "17:00"])), season("11-01", "03-31", everyDay(["09:00", "16:00"]))],
    dateExceptions: [
      { from: "2026-11-16", to: "2026-11-16", hours: R("09:00", "16:00"), lastEntry: "15:40", note: "St. Vitus Cathedral limited opening for liturgical reasons (hrad.cz/tickets notice)" },
      { from: "2026-12-24", to: "2026-12-24", closed: true, note: "historical buildings closed on 24 December (prague.eu); the castle complex stays open" },
    ],
    conflict: "prague.eu: buildings 9:00-17:00 all year; hrad.cz winter-season page: 9:00-16:00 Nov-Mar (stored by season). The 15:40 last entry is a one-day cathedral notice for 16 Nov 2026, not a winter rule. Price list 1.3.2024: Main circuit 450 CZK = Old Royal Palace, St. George's Basilica, Golden Lane, St. Vitus Cathedral; the permanent exhibitions are a separate 300 CZK ticket (the audit said they were included).",
  },
  "strahov-monastery": {
    lastEntry: "16:30",
    dateExceptions: [
      { from: "2026-12-24", to: "2026-12-25", closed: true },
      { from: "2026-12-31", to: "2026-12-31", hours: R("09:00", "12:00") },
      { from: "2027-01-01", to: "2027-01-01", hours: R("12:00", "17:00") },
      { from: "2027-03-28", to: "2027-03-28", closed: true, note: "Easter Sunday" },
    ],
    conflict: "strahovskyklaster.cz lists the New Year's Day hours under '1 Jan 2026' next to the December 2026 dates (read as 1 Jan 2027).",
  },
  "tyn-church": {
    seasonalSchedules: [
      season("12-01", "02-29", { ...days(["tuesday", "wednesday", "thursday", "saturday"], ["10:00", "13:00"], ["15:00", "17:00"]), friday: [{ open: "10:00", close: "13:00" }, { open: "15:30", close: "17:00" }], sunday: R("10:30", "12:00") }),
      season("03-01", "06-30", TYN_MAR_JUN_SEP_NOV),
      season("07-01", "08-31", { ...days(["tuesday", "wednesday", "thursday", "friday"], ["10:00", "12:15"], ["15:00", "17:00"]), saturday: [{ open: "10:00", close: "13:00" }, { open: "15:00", close: "17:00" }] }),
      season("09-01", "11-30", TYN_MAR_JUN_SEP_NOV),
    ],
    conflict: "prague.eu opening hours include Friday 15:00-17:00 (Mar-Nov) and weekday mornings to 13:00 (Jul-Aug), but masses are held then (Friday 15:00 Sep-Jun; Mon-Fri 12:15 Jul-Aug) and sightseeing is not possible during mass; mass length is not published, so those windows are left out of planning.",
  },
  clementinum: {
    dateExceptions: [
      { from: "2026-12-24", to: "2026-12-24", hours: R("08:00", "15:00") },
      { from: "2026-12-25", to: "2026-12-25", hours: R("11:00", "21:00") },
      { from: "2026-12-31", to: "2026-12-31", hours: R("08:00", "16:00") },
      { from: "2027-01-01", to: "2027-01-01", hours: R("11:00", "21:00") },
    ],
    conflict: "prague.eu gives no last-tour time and no arrival instruction; the audit's '18:00 last tour' (read from the booking calendar) and 'arrive 10 minutes early' are unconfirmed. The planner adds its own 15-minute arrival margin.",
  },
  "municipal-house": {
    seasonalSchedules: [season("01-01", "12-31", everyDay(["11:00", "18:00"]), "17:00")],
    conflict: "Stored before as 10:00-19:00 (prague.eu): that is the box office. obecnidum.cz/en/tours lists guided tours (about 1 h) at set times, 8-21 Nov 2026 between 11:00 and 17:00 (e.g. 20 Nov 13:00, 15:00, 16:00 EN; 13:30 FR; 17:00), published a few weeks ahead. Planning window 11:00-18:00, last start 17:00; the visit stays 'subject to booking'.",
  },
  "old-town-bridge-tower": { seasonalSchedules: TOWERS },
  "powder-tower": { seasonalSchedules: TOWERS },
  "old-town-hall": { seasonalSchedules: [season("01-01", "03-31", everyDay(["10:00", "19:00"])), season("04-01", "12-31", everyDay(["09:00", "20:00"]))] },
  "jewish-museum": {
    seasonalSchedules: [
      season("01-01", "03-31", days(SUN_TO_FRI, ["09:00", "16:30"])),
      season("04-01", "04-30", days(SUN_TO_FRI, ["09:00", "18:00"])),
      season("05-01", "08-31", days(SUN_TO_FRI, ["09:00", "19:00"])),
      season("09-01", "10-17", days(SUN_TO_FRI, ["09:00", "18:00"])),
      season("10-18", "12-31", days(SUN_TO_FRI, ["09:00", "16:30"])),
    ],
  },
  // St. Nicholas Church, Malostranské náměstí (Malá Strana; not the Old Town church): stnicholas.cz/en/tours/opening-hours,
  // checked 2026-11-09. "The last entry is always 15 minutes before closing": the planned visit (30 min) must end by closing,
  // so its start is always earlier than the last entry.
  "st-nicholas-mala-strana": {
    seasonalSchedules: [
      season("01-01", "01-04", everyDay(["09:00", "17:00"])),
      season("01-05", "01-31", everyDay(["09:00", "16:00"])),
      season("02-01", "03-31", everyDay(["09:00", "17:00"])),
      season("04-01", "04-30", { ...days(["sunday", "monday", "tuesday", "wednesday", "thursday"], ["09:00", "18:00"]), ...days(["friday", "saturday"], ["09:00", "17:00"]) }),
      season("05-01", "06-30", { ...days(["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday"], ["09:00", "18:00"]), friday: R("09:00", "17:00") }),
      season("07-01", "10-31", { ...days(["sunday", "monday", "tuesday", "wednesday", "thursday"], ["09:00", "18:00"]), ...days(["friday", "saturday"], ["09:00", "17:00"]) }),
      season("11-01", "11-30", everyDay(["09:00", "17:00"])),
      season("12-01", "12-31", { ...days(["sunday", "monday", "tuesday", "wednesday", "thursday"], ["09:00", "17:00"]), ...days(["friday", "saturday"], ["09:00", "16:00"]) }),
    ],
    dateExceptions: [
      { from: "2026-12-03", to: "2026-12-03", hours: R("09:00", "13:30"), note: "stnicholas.cz" },
      { from: "2026-12-17", to: "2026-12-17", hours: R("13:00", "17:00"), note: "stnicholas.cz" },
    ],
  },
  // Troja Château (Prague City Gallery): ghmp.cz/en/buildings/troja-chateau, checked 2026-11-09. The CHÂTEAU (the planned visit)
  // opens only in its season, 2026: 1 Apr - 29 Oct, Tue-Thu 10-18, Fri 13-18, Sat-Sun 10-18 (Monday not listed); "in the
  // off-season, the château is closed and the gardens are open" (gardens Tue-Thu 10-16, Fri 13-16, Sat-Sun 10-16, closed in
  // frost). The 2027 season dates are not published yet: the 2026 dates are used for 2027 too. No last entry is published.
  "troja-chateau": {
    seasonalSchedules: [
      season("04-01", "10-29", { ...days(["tuesday", "wednesday", "thursday", "saturday", "sunday"], ["10:00", "18:00"]), friday: R("13:00", "18:00") }),
      season("10-30", "03-31", {}),
    ],
  },
  "petrin-tower": {
    seasonalSchedules: [
      season("01-01", "03-31", everyDay(["10:00", "18:00"])),
      season("04-01", "09-30", everyDay(["09:00", "19:00"])),
      season("10-01", "10-31", everyDay(["09:00", "18:00"])),
      season("11-01", "12-31", everyDay(["10:00", "18:00"])),
    ],
    dateExceptions: [{ from: "2026-11-07", to: "2026-11-14", closed: true, note: "closed for operational reasons (prague.eu)" }],
  },
  "prague-zoo": {
    seasonalSchedules: [
      season("11-01", "02-29", everyDay(["09:00", "16:00"])),
      season("03-01", "03-31", everyDay(["09:00", "17:00"])),
      season("04-01", "05-31", everyDay(["09:00", "18:00"])),
      season("06-01", "08-31", everyDay(["09:00", "19:00"])),
      season("09-01", "09-30", everyDay(["09:00", "18:00"])),
      season("10-01", "10-31", everyDay(["09:00", "17:00"])),
    ],
  },
  "franciscan-garden": {
    seasonalSchedules: [season("04-15", "09-14", everyDay(["07:00", "22:00"])), season("09-15", "10-14", everyDay(["07:00", "20:00"])), season("10-15", "04-14", everyDay(["08:00", "19:00"]))],
  },
  "havlicek-gardens": { seasonalSchedules: [season("11-01", "03-31", everyDay(["06:00", "22:00"])), season("04-01", "10-31", everyDay(["06:00", "00:00"]))] },
  "botanical-garden": {
    seasonalSchedules: [season("01-01", "02-29", everyDay(["09:00", "16:00"])), season("03-01", "10-31", everyDay(["09:00", "19:00"])), season("11-01", "12-31", everyDay(["09:00", "16:00"]))],
  },
  "vltava-one-hour-cruise": {
    seasonalSchedules: [season("04-01", "09-30", everyDay(["10:00", "18:00"])), season("10-01", "03-31", {})],
    conflict: "prague.eu: April-September daily 10:00-18:00, October weekends only (no hours given), closed November-March. October is left out of planning rather than guessing its hours. praguesteamboats.com (8 Nov 2026): 2026 season over, 2027 times and prices not published.",
  },
  "cafe-ornament": { seasonalSchedules: [season("03-01", "10-31", everyDay(["10:00", "19:30"])), season("11-01", "02-29", everyDay(["10:00", "16:30"]))] },
  "kavarna-slavia": { conflict: "prague.eu: Monday-Friday from 10:00; cafeslavia.cz: Monday-Saturday 9:00-23:00, Sunday 9:00-22:00 (stored)." },
  "grand-cafe-orient": { conflict: "prague.eu and a commented-out block on grandcafeorient.cz: until 22:00; the visible hours on grandcafeorient.cz: until 21:00 (stored)." },
  mlynec: { conflict: "13:30 (weekdays) / 13:00 (weekends) is the last lunch reservation, not the end of lunch (mlynec.cz: lunch 11:30-15:00 every day)." },
  "petrinske-terasy": {
    dateExceptions: [
      { from: "2026-11-24", to: "2026-11-24", closed: true },
      { from: "2026-12-01", to: "2026-12-01", closed: true },
      { from: "2026-12-08", to: "2026-12-08", closed: true },
      { from: "2026-12-15", to: "2026-12-15", closed: true },
      { from: "2026-12-22", to: "2026-12-22", closed: true },
    ],
    conflict: "prague.eu: Saturday until 22:00; petrinsketerasy.cz: Saturday until 23:00 (stored), and 'opening hours change with the season and the weather'.",
  },
  "restaurant-obecni-dum": {
    dateExceptions: [
      { from: "2026-11-19", to: "2026-11-19", hours: R("11:30", "14:00"), note: "private event from 14:00" },
      { from: "2026-11-26", to: "2026-11-26", closed: true, note: "private event" },
      { from: "2026-11-27", to: "2026-11-27", hours: R("17:30", "23:00"), note: "private event 11:30-15:00" },
    ],
    conflict: "prague.eu: every day 11:00-15:00 & 17:30-23:00; restauraceod.cz: lunch Monday-Friday 11:30-15:00 only, dinner every day 17:30-23:00 (stored).",
  },
  "u-kroka": { conflict: "prague.eu address: Vratislavova 12, 120 00; ukroka.cz: Vratislavova 28, 128 00 (stored; coordinates still from prague.eu). Open 11:30-23:00, kitchen closed 16:00-17:00: the kitchen hours are stored." },
  "jaffa-restaurant": { conflict: "jaffa-restaurant.cz: restaurant hours 11:00-22:00 (stored); 11:00-21:00 on the same site is the delivery window. Last kitchen order not published." },
  "habibi-prague": { conflict: "habibipraguecafe.cz (8 Nov 2026): Mon-Sun 11:00-02:00 (stored). An earlier read of the same site also said 'dinner till 1 AM'; not visible on 8 Nov. Not the same place as Bistro Habibi (Vratislavova 21, Vyšehrad)." },
};

function withPlanningHours<T extends { id: string; hours?: HoursInfo }>(items: T[]): T[] {
  for (const item of items) {
    const extra = PLANNING_HOURS[item.id];
    if (extra && item.hours) item.hours = { ...item.hours, ...extra } as HoursInfo;
  }
  return items;
}
withPlanningHours(PRAGUE_ATTRACTIONS);
withPlanningHours(PRAGUE_EXPERIENCES);
withPlanningHours(PRAGUE_FOOD_PLACES);

function addPhotos<T extends { id: string; image?: string }>(items: T[]): void {
  items.forEach((item, i) => {
    items[i] = withPhoto(item);
  });
}
addPhotos(PRAGUE_ATTRACTIONS);
addPhotos(PRAGUE_EXPERIENCES);
addPhotos(PRAGUE_FOOD_PLACES);
addPhotos(PRAGUE_SHOPPING_AREAS);
addPhotos(PRAGUE_NIGHTLIFE_VENUES);

export const PRAGUE_PLACES: CityPlaceData = {
  attractions: PRAGUE_ATTRACTIONS,
  experiences: PRAGUE_EXPERIENCES,
  areas: PRAGUE_AREAS,
  foodPlaces: PRAGUE_FOOD_PLACES,
  foodCategories: PRAGUE_FOOD_CATEGORIES,
  nightlifeVenues: PRAGUE_NIGHTLIFE_VENUES,
  shoppingAreas: PRAGUE_SHOPPING_AREAS,
};

/**
 * Coordinates for EVERY Prague place id (attractions carry theirs above; the rest come from the same prague.eu route
 * links). Used only for distance-based transport estimates and accommodation proximity -- never shown as exact data.
 */
export const PRAGUE_PLACE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  ...Object.fromEntries(PRAGUE_ATTRACTIONS.filter((a) => a.coordinates).map((a) => [a.id, a.coordinates!])),
  "vltava-one-hour-cruise": { lat: 50.073392087388, lng: 14.413590431213 },
  "na-prikope": { lat: 50.085555555556, lng: 14.425694444444 }, // Wikidata Q1841356
  palladium: { lat: 50.0891861, lng: 14.4287219 },
  "havelske-market": { lat: 50.0850787, lng: 14.4207661 },
  "reduta-jazz-club": { lat: 50.082016409673, lng: 14.418574223348 },
  "cafe-louvre": { lat: 50.0819951, lng: 14.4187884 },
  "cafe-savoy": { lat: 50.080959, lng: 14.4072187 },
  "cafe-imperial": { lat: 50.0898464, lng: 14.4328659 },
  "mansson-bakery": { lat: 50.0909331, lng: 14.4201208 },
  "kavarna-slavia": { lat: 50.0815599, lng: 14.413298389549 },
  "grand-cafe-orient": { lat: 50.0870457, lng: 14.4253888 },
  "kavarna-obecni-dum": { lat: 50.0876228, lng: 14.4282487 },
  "lobkowicz-palace-cafe": { lat: 50.0917112, lng: 14.4050683 },
  "kavarna-novy-svet": { lat: 50.0911765, lng: 14.3905105 },
  "cafe-kupka": { lat: 50.08739957163, lng: 14.444733954867 },
  "kavarna-lucerna": { lat: 50.0814607, lng: 14.4252148 },
  kuchyn: { lat: 50.089143803066, lng: 14.397912883467 },
  mlynec: { lat: 50.0856545, lng: 14.4135791 },
  "u-modre-kachnicky-mala-strana": { lat: 50.0847467, lng: 14.4057164 },
  "u-modre-kachnicky-old-town": { lat: 50.0855769, lng: 14.4201431 },
  "petrinske-terasy": { lat: 50.0837835, lng: 14.3984849 },
  "restaurant-obecni-dum": { lat: 50.0876228, lng: 14.427819546558 },
  "hostinec-na-vytoni": { lat: 50.0678574, lng: 14.4153899 },
  "u-kroka": { lat: 50.0665822, lng: 14.4178374 },
  "u-cedru": { lat: 50.1003572, lng: 14.3981385 },
  // Habibi: OpenStreetMap address node Na Příkopě 957/23; Jaffa: the coordinates on its own site (Panská 894/4).
  "habibi-prague": { lat: 50.0859234, lng: 14.4258818 },
  "jaffa-restaurant": { lat: 50.0846801, lng: 14.4264542 },
  "letensky-zamecek": { lat: 50.0963753, lng: 14.4255511 },
  "cafe-ornament": { lat: 50.119165788607, lng: 14.414755611436 },
  "bredovsky-dvur": { lat: 50.0824806, lng: 14.430021 },
  "u-pinkasu": { lat: 50.083223489942, lng: 14.423427524537 },
  cestr: { lat: 50.080433636675, lng: 14.433307593918 },
  "vinohradsky-parlament": { lat: 50.075478084272, lng: 14.438338756484 },
  spravovna: { lat: 50.079156482035, lng: 14.448361344775 },
  "kolkovna-v-kolkovne": { lat: 50.089972821571, lng: 14.421219598148 },
  "u-mecenase": { lat: 50.0886429, lng: 14.4027749 },
  "lvi-dvur": { lat: 50.0929069, lng: 14.3986006 },
};
