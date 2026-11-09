import type { Language } from "../homepageTranslations";
import type { Weekday } from "../hours";
import { hebrewPrefixed } from "./hebrew";

/**
 * Plan view (saved personalized plan) + place-details cards: fixed interface wording and formatters in Arabic, English and
 * Hebrew. Display only. The plan's own content (place texts, day titles, reasons, warnings) is translated separately by
 * lib/i18n/localizePlan.ts from the reviewed catalog; nothing here changes plan data.
 *
 * Arabic strings are the exact wording the plan view used before languages were added, so Arabic output is unchanged.
 */

export type PlanLanguage = Language;

const WEEKDAYS: Record<PlanLanguage, Record<Weekday, string>> = {
  ar: { monday: "الاثنين", tuesday: "الثلاثاء", wednesday: "الأربعاء", thursday: "الخميس", friday: "الجمعة", saturday: "السبت", sunday: "الأحد" },
  en: { monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday" },
  he: { monday: "יום שני", tuesday: "יום שלישי", wednesday: "יום רביעי", thursday: "יום חמישי", friday: "יום שישי", saturday: "שבת", sunday: "יום ראשון" },
};

const MONTHS: Record<PlanLanguage, string[]> = {
  ar: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  he: ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"],
};

export function weekdayLabel(lang: PlanLanguage, weekday: Weekday): string {
  return WEEKDAYS[lang][weekday];
}

export function monthName(lang: PlanLanguage, month: number): string {
  return MONTHS[lang][month - 1] ?? "";
}

/** "الأحد، 7 ديسمبر" / "Sunday, 7 December" / "יום ראשון, 7 בדצמבר" */
export function formatDayHeader(lang: PlanLanguage, isoDate: string, weekday: Weekday): string {
  const [, month, day] = isoDate.split("-").map(Number);
  if (lang === "ar") return `${WEEKDAYS.ar[weekday]}، ${day} ${monthName("ar", month)}`;
  if (lang === "he") return `${WEEKDAYS.he[weekday]}, ${day} ב${monthName("he", month)}`;
  return `${WEEKDAYS.en[weekday]}, ${day} ${monthName("en", month)}`;
}

/** "7 ديسمبر" / "7 December" / "7 בדצמבר" */
export function formatDayMonth(lang: PlanLanguage, isoDate: string): string {
  const [, month, day] = isoDate.split("-").map(Number);
  if (lang === "he") return `${day} ב${monthName("he", month)}`;
  return `${day} ${monthName(lang, month)}`;
}

/**
 * Same thresholds as readyPlan.ts formatMinutesAr (Arabic output identical). Display only: minutes are shown as whole
 * minutes, rounded to the nearest one (15.6 -> 16); the value the caller computed with is not changed.
 */
export function formatMinutes(lang: PlanLanguage, rawMinutes: number): string {
  const minutes = Math.round(rawMinutes);
  if (lang === "ar") {
    if (minutes === 1) return "دقيقة واحدة";
    if (minutes === 2) return "دقيقتان";
    if (minutes >= 3 && minutes <= 10) return `${minutes} دقائق`;
    return `${minutes} دقيقة`;
  }
  if (lang === "he") return minutes === 1 ? "דקה אחת" : minutes === 2 ? "שתי דקות" : `${minutes} דקות`;
  return minutes === 1 ? "1 minute" : `${minutes} minutes`;
}

/** A range of whole minutes ("14–17 دقيقة"); display-only rounding as in formatMinutes. */
export function formatMinutesRange(lang: PlanLanguage, rawMin: number, rawMax: number): string {
  const min = Math.round(rawMin);
  const max = Math.round(rawMax);
  if (min === max) return formatMinutes(lang, min);
  return lang === "ar" ? `${min}–${max} دقيقة` : lang === "he" ? `${min}–${max} דקות` : `${min}–${max} min`;
}

/** Same rounding as geo.ts formatDistanceAr. */
export function formatDistance(lang: PlanLanguage, km: number): string {
  const unitM = lang === "ar" ? "م" : lang === "he" ? "מ׳" : "m";
  const unitKm = lang === "ar" ? "كم" : lang === "he" ? "ק״מ" : "km";
  if (km < 1) return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} ${unitM}`;
  if (km < 10) {
    const rounded = Math.round(km * 10) / 10;
    return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)} ${unitKm}`;
  }
  return `${Math.round(km)} ${unitKm}`;
}

export function formatPlaceCount(lang: PlanLanguage, count: number): string {
  if (lang === "ar") return count === 1 ? "مكان واحد" : count === 2 ? "مكانين" : `${count} أماكن`;
  if (lang === "he") return count === 1 ? "מקום אחד" : `${count} מקומות`;
  return count === 1 ? "1 place" : `${count} places`;
}

export function formatMealCount(lang: PlanLanguage, count: number): string {
  if (lang === "ar") return count === 1 ? "وجبة" : count === 2 ? "وجبتين" : `${count} وجبات`;
  if (lang === "he") return count === 1 ? "ארוחה אחת" : `${count} ארוחות`;
  return count === 1 ? "1 meal" : `${count} meals`;
}

export function formatDays(lang: PlanLanguage, count: number): string {
  if (lang === "ar") return `${count} ${count === 1 ? "يوم" : "أيام"}`;
  if (lang === "he") return count === 1 ? "יום אחד" : `${count} ימים`;
  return count === 1 ? "1 day" : `${count} days`;
}

export const PLAN_TEXT = {
  ar: {
    title: (city: string) => `خطتك المخصصة ل${city} ✨`,
    daysIn: (days: string, city: string) => `${days} في ${city}`,
    surpriseMe: "فاجئني ✨",
    accommodation: (text: string) => `السكن: ${text}`,
    orderedByStay: "رتبنا بداية رحلتك حسب مكان سكنك 📍",
    stayUnresolved: "ما قدرنا نتعرف على موقع سكنك من النص المدخل، فخططنا رحلتك بدون هالمعلومة.",
    routeFirst: "رتبنا يومك حتى تقلّل وقت التنقل بين الأماكن 📍",
    editSelections: "تعديل الاختيارات",
    regenerating: "عم نعيد البناء...",
    regenerate: "إعادة بناء الخطة",
    dayTab: (n: number) => `اليوم ${n}`,
    dayStart: "البداية",
    dayEnd: "النهاية",
    approximate: "تقريبي",
    totalTransit: (minutes: number) => `تنقل ~${minutes} د`,
    // Editing a saved plan with buttons (plan page).
    editDay: "✎ تعديل",
    doneEditing: "تم",
    resetDay: "↺ الأصلية",
    chooseStart: "بداية اليوم",
    moveUp: "لفوق",
    moveDown: "لتحت",
    removeStop: "شيل",
    dragHint: "اضغط مطوّلًا على المكان واسحبه لتغيّر ترتيبه.",
    addToDay: "+ أضف",
    addPlaces: "أماكن قريبة تقدر تضيفها",
    addPlaceType: "قريب",
    noAddPlaces: "ما في مكان قريب بيلحق بهاليوم.",
    shorter: "أقصر",
    longer: "أطول",
    saving: "عم نحفظ…",
    saveFailed: "ما انحفظ التعديل. جرّب كمان مرة.",
    edited: "معدّلة",
    freeTime: "🕒 وقت حر",
    freeTimeNote: "استراحة",
    foodSuggestions: "اقتراحات أكل",
    shopping: "تسوق",
    nightlife: "اقتراح سهرة",
    nightlifeReason: "عادة بعد الساعة 22:00",
    nearby: "اقتراحات قريبة منك",
    outsideOnly: "👀 من برا بس",
    suggestionType: { food: "اقتراح أكل", cafe: "كافيه", nightlife: "اقتراح سهرة", experience: "تجربة", photo: "بقعة تصوير", local: "تجربة محلية" },
    foodMeal: { lunch: "اقتراح غداء", dinner: "اقتراح عشاء" },
    mealType: { breakfast: "فطور", lunch: "غداء", tapas: "تاباس", dinner: "عشاء" },
    placeDetails: "تفاصيل المكان",
    transportUnknown: "التنقل بين هالمكانين غير محسوب بدقة",
    estimate: "· تقدير تقريبي",
    transportTitle: "طريقة التنقل",
    transportNoOptions: "تقدر تشوف خيارات التنقل المباشرة على الخرائط. افتح الطريق من خرائط جوجل أو أبل بالأسفل.",
    suggested: "مقترح",
    openGoogle: "فتح الطريق في Google Maps",
    openApple: "فتح الطريق في Apple Maps",
    openRouteSource: "المسار اللي انحسبت منه المسافة (OpenStreetMap)",
    transportDisclaimer: "أوقات التنقل تقريبية وقد تتغير حسب الزحمة ووقت الانتظار.",
    modes: { walking: "مشي", transit: "مواصلات عامة", car: "سيارة / تاكسي" },
  },
  en: {
    title: (city: string) => `Your personalized plan for ${city} ✨`,
    daysIn: (days: string, city: string) => `${days} in ${city}`,
    surpriseMe: "Surprise me ✨",
    accommodation: (text: string) => `Accommodation: ${text}`,
    orderedByStay: "We arranged the start of your trip around where you're staying 📍",
    stayUnresolved: "We couldn't identify where you're staying from the text you entered, so we planned your trip without it.",
    routeFirst: "We arranged your day to cut the travel time between places 📍",
    editSelections: "Edit choices",
    regenerating: "Rebuilding...",
    regenerate: "Rebuild the plan",
    dayTab: (n: number) => `Day ${n}`,
    dayStart: "Start",
    dayEnd: "End",
    approximate: "approx.",
    totalTransit: (minutes: number) => `~${minutes} min travel`,
    // Editing a saved plan with buttons (plan page).
    editDay: "✎ Edit",
    doneEditing: "Done",
    resetDay: "↺ Original",
    chooseStart: "Day starts",
    moveUp: "Move up",
    moveDown: "Move down",
    removeStop: "Remove",
    dragHint: "Press and hold a place, then drag it to change the order.",
    addToDay: "+ Add",
    addPlaces: "Nearby places you can add",
    addPlaceType: "Nearby",
    noAddPlaces: "No nearby place fits this day.",
    shorter: "Shorter",
    longer: "Longer",
    saving: "Saving…",
    saveFailed: "The change wasn't saved. Try again.",
    edited: "Edited",
    freeTime: "🕒 Free time",
    freeTimeNote: "Break",
    foodSuggestions: "Food suggestions",
    shopping: "Shopping",
    nightlife: "Evening suggestion",
    nightlifeReason: "Usually after 22:00",
    nearby: "Suggestions near you",
    outsideOnly: "👀 Outside only",
    suggestionType: { food: "Food suggestion", cafe: "Café", nightlife: "Evening suggestion", experience: "Experience", photo: "Photo spot", local: "Local experience" },
    foodMeal: { lunch: "Lunch suggestion", dinner: "Dinner suggestion" },
    mealType: { breakfast: "Breakfast", lunch: "Lunch", tapas: "Tapas", dinner: "Dinner" },
    placeDetails: "Place details",
    transportUnknown: "Travel time between these two places isn't calculated precisely",
    estimate: "· estimate",
    transportTitle: "Getting there",
    transportNoOptions: "You can see live travel options on the maps. Open the route in Google or Apple Maps below.",
    suggested: "Suggested",
    openGoogle: "Open the route in Google Maps",
    openApple: "Open the route in Apple Maps",
    openRouteSource: "The route the distance was measured on (OpenStreetMap)",
    transportDisclaimer: "Travel times are approximate and may change with traffic and waiting time.",
    modes: { walking: "Walking", transit: "Public transport", car: "Car / taxi" },
  },
  he: {
    title: (city: string) => `התוכנית האישית שלכם ${hebrewPrefixed("ל", city)} ✨`,
    daysIn: (days: string, city: string) => `${days} ${hebrewPrefixed("ב", city)}`,
    surpriseMe: "תפתיעו אותי ✨",
    accommodation: (text: string) => `לינה: ${text}`,
    orderedByStay: "סידרנו את תחילת הטיול לפי מקום הלינה שלכם 📍",
    stayUnresolved: "לא הצלחנו לזהות את מקום הלינה מהטקסט שהוזן, אז תכננו את הטיול בלי המידע הזה.",
    routeFirst: "סידרנו את היום כדי לקצר את זמן הנסיעה בין המקומות 📍",
    editSelections: "עריכת הבחירות",
    regenerating: "בונים מחדש...",
    regenerate: "בנייה מחדש של התוכנית",
    dayTab: (n: number) => `יום ${n}`,
    dayStart: "התחלה",
    dayEnd: "סיום",
    approximate: "משוער",
    totalTransit: (minutes: number) => `~${minutes} דק׳ נסיעה`,
    // Editing a saved plan with buttons (plan page).
    editDay: "✎ עריכה",
    doneEditing: "סיום",
    resetDay: "↺ המקור",
    chooseStart: "תחילת היום",
    moveUp: "למעלה",
    moveDown: "למטה",
    removeStop: "הסרה",
    dragHint: "לחצו לחיצה ארוכה על מקום וגררו אותו כדי לשנות את הסדר.",
    addToDay: "+ הוספה",
    addPlaces: "מקומות קרובים שאפשר להוסיף",
    addPlaceType: "קרוב",
    noAddPlaces: "אין מקום קרוב שמתאים ליום הזה.",
    shorter: "קצר יותר",
    longer: "ארוך יותר",
    saving: "שומר…",
    saveFailed: "השינוי לא נשמר. נסו שוב.",
    edited: "נערך",
    freeTime: "🕒 זמן חופשי",
    freeTimeNote: "הפסקה",
    foodSuggestions: "הצעות לאוכל",
    shopping: "קניות",
    nightlife: "הצעה לערב",
    nightlifeReason: "בדרך כלל אחרי 22:00",
    nearby: "הצעות קרובות אליכם",
    outsideOnly: "👀 רק מבחוץ",
    suggestionType: { food: "הצעה לאוכל", cafe: "בית קפה", nightlife: "הצעה לערב", experience: "חוויה", photo: "נקודת צילום", local: "חוויה מקומית" },
    foodMeal: { lunch: "הצעה לצהריים", dinner: "הצעה לארוחת ערב" },
    mealType: { breakfast: "ארוחת בוקר", lunch: "צהריים", tapas: "טאפאס", dinner: "ארוחת ערב" },
    placeDetails: "פרטי המקום",
    transportUnknown: "זמן הנסיעה בין שני המקומות האלה לא מחושב במדויק",
    estimate: "· הערכה",
    transportTitle: "איך מגיעים",
    transportNoOptions: "אפשר לראות אפשרויות נסיעה עדכניות במפות. פתחו את המסלול ב־Google או ב־Apple Maps למטה.",
    suggested: "מומלץ",
    openGoogle: "פתיחת המסלול ב־Google Maps",
    openApple: "פתיחת המסלול ב־Apple Maps",
    openRouteSource: "המסלול שלפיו נמדד המרחק (OpenStreetMap)",
    transportDisclaimer: "זמני הנסיעה משוערים ועשויים להשתנות לפי עומסי תנועה וזמני המתנה.",
    modes: { walking: "הליכה", transit: "תחבורה ציבורית", car: "רכב / מונית" },
  },
} as const;

/** Booking status / location label are stored as Arabic enum values (cards style themselves on them); translated only for display. */
const BOOKING_STATUS: Record<string, { en: string; he: string }> = {
  "ضروري مسبقًا": { en: "Required in advance", he: "חובה מראש" },
  "يفضل مسبقًا": { en: "Better in advance", he: "עדיף מראש" },
  "مش ضروري عادةً": { en: "Not usually needed", he: "בדרך כלל לא צריך" },
  "بدون حجز": { en: "No booking", he: "בלי הזמנה" },
};
const LOCATION_LABEL: Record<string, { en: string; he: string }> = {
  "الموقع": { en: "Location", he: "מיקום" },
  "نقطة الوصول": { en: "Access point", he: "נקודת גישה" },
  "نقطة التصوير": { en: "Photo spot", he: "נקודת צילום" },
  "نقطة مقترحة للبدء": { en: "Suggested starting point", he: "נקודת התחלה מומלצת" },
  "نقطة مقترحة": { en: "Suggested point", he: "נקודה מומלצת" },
};
export function bookingStatusText(status: string, lang: PlanLanguage): string {
  return lang === "ar" ? status : (BOOKING_STATUS[status]?.[lang] ?? status);
}
export function locationLabelText(label: string, lang: PlanLanguage): string {
  return lang === "ar" ? label : (LOCATION_LABEL[label]?.[lang] ?? label);
}

/** Place-details cards (shared with the Barcelona guide, which always passes Arabic). */
export const PLACE_CARD_TEXT = {
  ar: {
    noImage: "لا توجد صورة موثقة",
    noImageFood: "بدون صورة موثقة",
    favoriteAdd: "حفظ في المفضلة",
    favoriteRemove: "إزالة من المفضلة",
    openOfficial: (name: string) => `افتح الموقع الرسمي لـ ${name}`,
    openMaps: (name: string) => `افتح ${name} في خرائط جوجل`,
    openBooking: (name: string) => `افتح صفحة حجز ${name}`,
    official: "🌐 الموقع الرسمي",
    officialInstagram: "Instagram الرسمي",
    tickets: "🎟 التذاكر الرسمية",
    bookNow: "🎟 احجز الآن",
    duration: "⏱ المدة",
    booking: "📅 الحجز",
    bookingRequired: "ضروري مسبقًا",
    bookingUsuallyNot: "غالبًا بدون حجز",
    age: "🔞 العمر",
    priceVaries: "⚠️ السعر يتغير",
    priceVariesNote: "حسب الموسم/الباقة",
    entry: "💰 الدخول",
    music: "🎵 الموسيقى",
    crowd: { low: "🟢 هادئ", medium: "🟡 متوسط", high: "🔴 مزدحم" },
    accessPoint: "نقطة الوصول",
    location: "الموقع",
    price: "السعر",
    openingHours: "ساعات العمل",
    lastVerified: (date: string) => `آخر تحقق: ${date}`,
    readReviews: (source: string) => `قراءة المراجعات على ${source}`,
    mapFallback: "الخريطة",
    copyAddress: "نسخ الموقع",
    copied: "تم نسخ العنوان ✓",
    close: "إغلاق",
    photo: "صورة",
    photoCredit: "حقوق الصورة",
    outsideFree: "من برا: ببلاش وبدون حجز",
    insideLabel: "للدخول:",
    entryBookingRequired: "لازم تحجز مسبقًا",
    entryBookingRecommended: "الحجز المسبق مستحسن",
    photoCredits: "حقوق الصور",
    tip: "Travel Smarter Tip",
    dressCode: "👕 Dress code",
    hours: {
      open24: "مفتوح 24 ساعة",
      byEvent: "حسب الفعالية",
      seasonalAria: "عرض الساعات الموسمية",
      tempClosed: "مغلق مؤقتًا",
      weekAria: "عرض ساعات العمل للأسبوع",
      closed: "مغلق",
      openThisDay: "مفتوح هذا اليوم",
      closedThisDay: "مغلق هذا اليوم",
      openNow: "مفتوح الآن",
      closedNow: "مغلق الآن",
      plannedDay: (weekday: string) => `🕒 ساعات يوم ${weekday}: `,
      today: "🕒 اليوم: ",
      yourTripDay: "يوم رحلتك",
      todayBadge: "اليوم",
    },
  },
  en: {
    noImage: "No verified photo",
    noImageFood: "No verified photo",
    favoriteAdd: "Save to favourites",
    favoriteRemove: "Remove from favourites",
    openOfficial: (name: string) => `Open the official website of ${name}`,
    openMaps: (name: string) => `Open ${name} in Google Maps`,
    openBooking: (name: string) => `Open the booking page for ${name}`,
    official: "🌐 Official website",
    officialInstagram: "Official Instagram",
    tickets: "🎟 Official tickets",
    bookNow: "🎟 Book now",
    duration: "⏱ Duration",
    booking: "📅 Booking",
    bookingRequired: "Required in advance",
    bookingUsuallyNot: "Usually no booking",
    age: "🔞 Age",
    priceVaries: "⚠️ Price varies",
    priceVariesNote: "By season / package",
    entry: "💰 Entry",
    music: "🎵 Music",
    crowd: { low: "🟢 Quiet", medium: "🟡 Moderate", high: "🔴 Crowded" },
    accessPoint: "Access point",
    location: "Location",
    price: "Price",
    openingHours: "Opening hours",
    lastVerified: (date: string) => `Last checked: ${date}`,
    readReviews: (source: string) => `Read the reviews on ${source}`,
    mapFallback: "the map",
    copyAddress: "Copy the address",
    copied: "Address copied ✓",
    close: "Close",
    photo: "Photo",
    photoCredit: "Photo credit",
    outsideFree: "From outside: free, no booking",
    insideLabel: "To go inside:",
    entryBookingRequired: "Booking in advance is required",
    entryBookingRecommended: "Booking in advance is recommended",
    photoCredits: "Photo credits",
    tip: "Travel Smarter Tip",
    dressCode: "👕 Dress code",
    hours: {
      open24: "Open 24 hours",
      byEvent: "Depends on the event",
      seasonalAria: "Show seasonal hours",
      tempClosed: "Temporarily closed",
      weekAria: "Show the week's opening hours",
      closed: "Closed",
      openThisDay: "Open this day",
      closedThisDay: "Closed this day",
      openNow: "Open now",
      closedNow: "Closed now",
      plannedDay: (weekday: string) => `🕒 Hours on ${weekday}: `,
      today: "🕒 Today: ",
      yourTripDay: "Your trip day",
      todayBadge: "Today",
    },
  },
  he: {
    noImage: "אין תמונה מאומתת",
    noImageFood: "אין תמונה מאומתת",
    favoriteAdd: "שמירה במועדפים",
    favoriteRemove: "הסרה מהמועדפים",
    openOfficial: (name: string) => `פתיחת האתר הרשמי של ${name}`,
    openMaps: (name: string) => `פתיחת ${name} ב־Google Maps`,
    openBooking: (name: string) => `פתיחת דף ההזמנה של ${name}`,
    official: "🌐 האתר הרשמי",
    officialInstagram: "Instagram הרשמי",
    tickets: "🎟 כרטיסים רשמיים",
    bookNow: "🎟 להזמנה עכשיו",
    duration: "⏱ משך",
    booking: "📅 הזמנה",
    bookingRequired: "חובה מראש",
    bookingUsuallyNot: "בדרך כלל בלי הזמנה",
    age: "🔞 גיל",
    priceVaries: "⚠️ המחיר משתנה",
    priceVariesNote: "לפי עונה / חבילה",
    entry: "💰 כניסה",
    music: "🎵 מוזיקה",
    crowd: { low: "🟢 שקט", medium: "🟡 בינוני", high: "🔴 צפוף" },
    accessPoint: "נקודת גישה",
    location: "מיקום",
    price: "מחיר",
    openingHours: "שעות פתיחה",
    lastVerified: (date: string) => `נבדק לאחרונה: ${date}`,
    readReviews: (source: string) => `קריאת הביקורות ב־${source}`,
    mapFallback: "המפה",
    copyAddress: "העתקת הכתובת",
    copied: "הכתובת הועתקה ✓",
    close: "סגירה",
    photo: "צילום",
    photoCredit: "קרדיט לתמונה",
    outsideFree: "מבחוץ: בחינם ובלי הזמנה",
    insideLabel: "כדי להיכנס:",
    entryBookingRequired: "חובה להזמין מראש",
    entryBookingRecommended: "מומלץ להזמין מראש",
    photoCredits: "קרדיטים לתמונות",
    tip: "Travel Smarter Tip",
    dressCode: "👕 קוד לבוש",
    hours: {
      open24: "פתוח 24 שעות",
      byEvent: "לפי האירוע",
      seasonalAria: "הצגת השעות העונתיות",
      tempClosed: "סגור זמנית",
      weekAria: "הצגת שעות הפתיחה בשבוע",
      closed: "סגור",
      openThisDay: "פתוח ביום הזה",
      closedThisDay: "סגור ביום הזה",
      openNow: "פתוח עכשיו",
      closedNow: "סגור עכשיו",
      plannedDay: (weekday: string) => `🕒 השעות ב${weekday}: `,
      today: "🕒 היום: ",
      yourTripDay: "יום הטיול שלכם",
      todayBadge: "היום",
    },
  },
} as const;

/** Food badges are shown in English in the Arabic and English plan (unchanged); Hebrew gets Hebrew labels. */
const FOOD_BADGE_HE: Record<string, string> = {
  "best-overall": "⭐ הכי טוב בסך הכול",
  "great-value": "💸 תמורה מצוינת",
  popular: "📸 פופולרי",
  "local-experience": "🥘 חוויה מקומית",
  trending: "🔥 טרנדי",
  "less-touristy": "🤫 פחות תיירותי",
  "best-atmosphere": "🌅 האווירה הכי טובה",
};
export function foodBadgeText(badge: string, english: string, lang: PlanLanguage): string {
  return lang === "he" ? (FOOD_BADGE_HE[badge] ?? english) : english;
}

/**
 * Direction for a stored plan text: an Arabic text that has no translation yet (shown as stored) keeps right-to-left
 * order inside the English (LTR) page. Everything else follows the page direction (undefined).
 */
export function storedTextDir(text: string | undefined, lang: PlanLanguage): "rtl" | undefined {
  return lang === "en" && !!text && /[\u0600-\u06FF]/.test(text) ? "rtl" : undefined;
}
