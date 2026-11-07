/**
 * Arabic + English copy for the whole Personalized Plan flow: the questionnaire wizard, the checkout summary,
 * the payment CTA, the post-payment states and "My Personalized Plans".
 *
 * Wired into the site's existing language system: `HomepageCopy.planner` (homepageTranslations.ts) holds one
 * of these per language and components read it through `useLanguage().t.planner`. Plain data + one tiny
 * placeholder helper -- no "use client", no server-only imports.
 *
 * What is deliberately NOT here: the generated plan's own content (place names, descriptions, timeline). That
 * comes from the planner engine and the Barcelona guide data in Arabic and is out of scope for this flow.
 */

export type PlannerComplimentaryErrorCode = "login_required" | "not_available" | "invalid_planner_answers" | "create_failed";

export type PlannerGenerateErrorCode =
  | "login_required"
  | "not_found"
  | "not_paid"
  /** The signed-in account does not own the Personalized Plan (nothing is generated for free). */
  | "not_owner"
  /** At most 30 saved plans per customer. */
  | "limit"
  | "invalid_answers"
  | "in_progress"
  | "plan_deleted"
  | "unsupported_destination"
  | "generation_failed"
  | "save_failed"
  | "unexpected";

export type PlannerCopy = {
  page: {
    title: string;
    subtitle: string;
    tagline: string;
    ownerTagline: string;
    backHome: string;
    /** Shown to signed-out visitors who already bought a plan as a guest. */
    alreadyBought: string;
  };
  wizard: {
    progressAria: string;
    /** Placeholders: {step} {total} {label} */
    stepOf: string;
    stepLabels: [string, string, string, string];
    destinationTitle: string;
    comingSoon: string;
    availableNote: string;
    destinationNames: Record<string, string>;
    whenTitle: string;
    flexible: string;
    specificDates: string;
    howManyDays: string;
    dayOne: string;
    dayMany: string;
    arrivalDate: string;
    departureDate: string;
    dateFormatHint: string;
    /** Placeholder: {n} */
    tripLength: string;
    errDepartureBeforeArrival: string;
    errMaxDays: string;
    interestsTitle: string;
    /** Placeholder: {n} */
    interestsSelectedCount: string;
    surpriseSelected: string;
    surpriseMe: string;
    interestGroups: Record<string, string>;
    interestsHint: string;
    accommodationTitle: string;
    hotel: string;
    apartment: string;
    notBooked: string;
    accommodationTextLabel: string;
    accommodationHint: string;
    back: string;
    next: string;
    continueToCheckout: string;
    /** Under the questionnaire's last button for someone who has not bought yet. Placeholder: {price} */
    priceNote: string;
    draftSaveFailed: string;
    /** An owner's last step: no payment -- the plan is created straight away. */
    createMyPlan: string;
    updateMyPlan: string;
    /** Friendly line on top of an owner's questionnaire. */
    ownerIntro: string;
    /** Placeholders: none. Shown above the answers when an existing plan is being edited. */
    editingNote: string;
  };
  /** Compact summary on /checkout?plan=personalized. */
  checkoutSummary: {
    /** Placeholder: {destination} */
    title: string;
    /** Placeholder: {interests} */
    interests: string;
    /** Placeholder: {accommodation} */
    accommodation: string;
    accommodationNotBooked: string;
    includesHeading: string;
    includedPlan: string;
    /** One more line under "Includes": more than one plan, the saved-plan limit. */
    includedPlans: string;
    /** Placeholder: {destination}. Shown only for destinations that include a guide. */
    includedGuide: string;
    price: string;
    emailLabel: string;
    emailHint: string;
    editAnswers: string;
    missingTitle: string;
    missingBody: string;
    backToPlanner: string;
    /** Allowlisted accounts only (server-decided): the pay button is replaced by this neutral action. */
    complimentaryCta: string;
    /** Headline of the "building your plan" screen. */
    generatingTitle: string;
  };
  mine: {
    title: string;
    subtitle: string;
    createNew: string;
    plansHeading: string;
    openPlan: string;
    /** Placeholders: {destination} */
    planTitle: string;
    /** Placeholder: {n} */
    daysCount: string;
    /** Placeholder: {date} */
    createdOn: string;
    readyBadge: string;
    readyTitle: string;
    /** Placeholders: {destination} {days} */
    readyBody: string;
    buildPlan: string;
    building: string;
    buildingPhrases: [string, string, string];
    pendingBadge: string;
    pendingTitle: string;
    pendingBody: string;
    newPlanNote: string;
    /** Empty state for an owner with no saved plan. */
    emptyOwner: string;
    complimentaryBadge: string;
    complimentaryBody: string;
  };
  generateErrors: Record<PlannerGenerateErrorCode, string>;
  complimentaryErrors: Record<PlannerComplimentaryErrorCode, string>;
};

import { hebrewPrefixed } from "./i18n/hebrew";

/** Fills {placeholders}; a Hebrew one-letter prefix right before a placeholder follows hebrewPrefixed (לווינה). */
export function fillCopy(template: string, values: Record<string, string | number>): string {
  return template.replace(/(?:(^|[\s("'״])([לבמשכ]))?\{(\w+)\}/g, (match, lead: string | undefined, prefix: string | undefined, key: string) => {
    if (!(key in values)) return match;
    const value = String(values[key]);
    return prefix ? (lead ?? "") + hebrewPrefixed(prefix, value) : value;
  });
}

export const plannerCopyAr: PlannerCopy = {
  page: {
    title: "خطة مخصصة إلك ✨",
    subtitle: "جاوب على 4 أسئلة قصيرة وبنبني لك خطة مرتّبة يوم بيوم.",
    tagline: "الأسئلة مجانًا، والدفع بعد ما تخلّص.",
    ownerTagline: "الخطط الجديدة بدون دفع إضافي.",
    backHome: "← الرئيسية",
    alreadyBought: "اشتريت من قبل؟ سجّل دخولك",
  },
  wizard: {
    progressAria: "خطوات إنشاء الرحلة",
    stepOf: "الخطوة {step} من {total} · {label}",
    stepLabels: ["وين مسافر؟", "متى؟", "شو بتحب؟", "السكن"],
    destinationTitle: "وين مسافر؟",
    comingSoon: "قريبًا",
    availableNote: "برشلونة متاحة الآن.",
    destinationNames: {
      barcelona: "برشلونة",
      rome: "روما",
      prague: "براغ",
      budapest: "بودابست",
      dubai: "دبي",
      batumi: "باتومي",
      istanbul: "إسطنبول",
      vienna: "فيينا",
      paris: "باريس",
      london: "لندن",
    },
    whenTitle: "متى؟",
    flexible: "مرن",
    specificDates: "تواريخ محددة",
    howManyDays: "كم يوم رحلتك؟",
    dayOne: "يوم",
    dayMany: "أيام",
    arrivalDate: "تاريخ الوصول",
    departureDate: "تاريخ المغادرة",
    dateFormatHint: "صيغة التاريخ في الحقل: الشهر / اليوم / السنة",
    tripLength: "مدة الرحلة: {n} أيام",
    errDepartureBeforeArrival: "تاريخ المغادرة لازم يكون بعد أو بنفس تاريخ الوصول.",
    errMaxDays: "أقصى مدة مدعومة حاليًا 10 أيام. اختار تواريخ أقرب.",
    interestsTitle: "شو بتحب بالرحلة؟",
    interestsSelectedCount: "{n} مختارة",
    surpriseSelected: "فاجئني مختارة",
    surpriseMe: "فاجئني ✨",
    interestGroups: {
      popular: "أشهر الأماكن",
      cultureHistory: "ثقافة وتاريخ",
      natureBeaches: "طبيعة وشواطئ",
      food: "أكل ومطاعم",
      shopping: "تسوّق",
      experiences: "تجارب وترفيه",
    },
    interestsHint: "اختار اهتمامًا واحدًا على الأقل، أو اضغط «فاجئني».",
    accommodationTitle: "السكن",
    hotel: "فندق",
    apartment: "شقة",
    notBooked: "لسا ما حجزت",
    accommodationTextLabel: "اسم الفندق، الشقة أو العنوان",
    accommodationHint: "اختار وضع السكن، وأدخل الاسم أو العنوان إذا حجزت.",
    back: "رجوع",
    next: "التالي",
    continueToCheckout: "المتابعة للدفع",
    priceNote: "{price} مرة واحدة · أكثر من خطة · حتى 30 خطة محفوظة",
    draftSaveFailed: "تعذّر حفظ إجاباتك على هذا المتصفح. فعّل التخزين المؤقت أو جرّب متصفحًا آخر.",
    createMyPlan: "أنشئ خطتي ✨",
    updateMyPlan: "حدّث خطتي ✨",
    ownerIntro: "",
    editingNote: "إجاباتك الحالية محمّلة. عدّلها ثم حدّث الخطة — بدون أي دفع.",
  },
  checkoutSummary: {
    title: "خطة مخصصة إلى {destination}",
    interests: "الاهتمامات: {interests}",
    accommodation: "السكن: {accommodation}",
    accommodationNotBooked: "لسا ما حجزت",
    includesHeading: "يشمل:",
    includedPlan: "خطة سفر مخصصة مبنية على إجاباتك",
    includedPlans: "أكثر من خطة بدون دفع إضافي، حتى 30 خطة محفوظة",
    includedGuide: "دليل {destination} الكامل",
    price: "السعر",
    emailLabel: "البريد الإلكتروني",
    emailHint: "استخدم نفس البريد عند تسجيل الدخول عشان تفتح خطتك.",
    editAnswers: "تعديل الإجابات",
    missingTitle: "ما لقينا تفاصيل خطتك",
    missingBody: "ابدأ من صفحة المخطط: جاوب على الأسئلة وبترجع لهون لإتمام الدفع.",
    backToPlanner: "ابدأ من المخطط",
    complimentaryCta: "إنشاء خطتي المخصصة",
    generatingTitle: "عم نجهّز خطتك المخصصة...",
  },
  mine: {
    title: "خططي المخصصة",
    subtitle: "عدّل تفاصيل رحلتك وأنشئ خطتك بالطريقة التي تناسبك.",
    createNew: "إنشاء خطة جديدة",
    plansHeading: "خططك",
    openPlan: "افتح الخطة",
    planTitle: "خطة {destination}",
    daysCount: "{n} أيام",
    createdOn: "أُنشئت في {date}",
    readyBadge: "تم تأكيد الدفع ✅",
    readyTitle: "خطتك جاهزة للبناء",
    readyBody: "دفعتك لخطة {destination} ({days} أيام) مؤكدة. اضغط لنبني خطتك من إجاباتك اللي أرسلتها.",
    buildPlan: "ابنِ خطتي ✨",
    building: "عم نبني رحلتك...",
    buildingPhrases: ["عم نبني رحلتك...", "عم نرتّب الأماكن حسب الأيام والمناطق...", "عم نراجع مواعيد الأماكن..."],
    pendingBadge: "بانتظار تأكيد الدفع",
    pendingTitle: "عم نتأكد من دفعتك",
    pendingBody: "بمجرد تأكيد الدفع بتظهر هنا خطتك جاهزة للبناء. الصفحة بتتحدّث لحالها.",
    newPlanNote: "أنشئ ما تشاء من الخطط — بدون دفع إضافي.",
    emptyOwner: "ما عندك خطط محفوظة حاليًا. أنشئ خطتك الأولى متى بدك.",
    complimentaryBadge: "✨ جاهزة للبناء",
    complimentaryBody: "طلب خطتك لـ {destination} ({days} أيام) جاهز. اضغط لنبني خطتك من إجاباتك.",
  },
  generateErrors: {
    login_required: "لازم تسجّل الدخول عشان نبني خطتك.",
    not_found: "ما لقينا هذا الطلب ضمن حسابك.",
    not_paid: "ما قدرنا نتأكد من الدفع بعد. جرّب بعد قليل.",
    not_owner: "إنشاء الخطط المخصصة متاح لمن اشترى الخطة المخصصة فقط.",
    limit: "وصلت للحد الأقصى من الخطط المحفوظة (30). احذف خطة قديمة ثم حاول مرة أخرى.",
    invalid_answers: "بيانات الخطة غير صالحة. راجع إجاباتك وحاول مرة أخرى.",
    in_progress: "خطتك قيد البناء حاليًا. انتظر لحظات وحدّث الصفحة.",
    plan_deleted: "هذه الخطة انبنت وانحذفت من حسابك سابقًا. تقدر تنشئ خطة جديدة متى بدك بدون دفع.",
    unsupported_destination: "هذه الوجهة غير مدعومة بعد. تواصل معنا وبنساعدك.",
    generation_failed: "تعذّر بناء الخطة حاليًا. دفعتك محفوظة، وتقدر تحاول مرة ثانية بدون أي رسوم إضافية.",
    save_failed: "بنينا الخطة بس ما قدرنا نحفظها. حاول مرة ثانية بدون أي رسوم إضافية.",
    unexpected: "صار خطأ غير متوقع. حاول مرة أخرى.",
  },
  complimentaryErrors: {
    login_required: "لازم تسجّل الدخول.",
    not_available: "تعذّر إنشاء الخطة لهذا الحساب.",
    invalid_planner_answers: "بيانات الخطة غير صالحة. راجع إجاباتك وحاول مرة أخرى.",
    create_failed: "تعذّر تجهيز الطلب. حاول مرة أخرى.",
  },
};

export const plannerCopyEn: PlannerCopy = {
  page: {
    title: "Your Personalized Plan ✨",
    subtitle: "Answer 4 short questions and we’ll build you a plan arranged day by day.",
    tagline: "The questions are free; payment comes after you finish.",
    ownerTagline: "New plans cost nothing extra.",
    backHome: "← Home",
    alreadyBought: "Already bought? Sign in",
  },
  wizard: {
    progressAria: "Trip planning steps",
    stepOf: "Step {step} of {total} · {label}",
    stepLabels: ["Where to?", "When?", "What do you like?", "Accommodation"],
    destinationTitle: "Where are you going?",
    comingSoon: "Coming soon",
    availableNote: "Barcelona is available now.",
    destinationNames: {
      barcelona: "Barcelona",
      rome: "Rome",
      prague: "Prague",
      budapest: "Budapest",
      dubai: "Dubai",
      batumi: "Batumi",
      istanbul: "Istanbul",
      vienna: "Vienna",
      paris: "Paris",
      london: "London",
    },
    whenTitle: "When?",
    flexible: "Flexible",
    specificDates: "Specific dates",
    howManyDays: "How many days is your trip?",
    dayOne: "day",
    dayMany: "days",
    arrivalDate: "Arrival date",
    departureDate: "Departure date",
    dateFormatHint: "Date field format follows your browser (usually month / day / year)",
    tripLength: "Trip length: {n} days",
    errDepartureBeforeArrival: "The departure date must be on or after the arrival date.",
    errMaxDays: "The maximum supported trip length is 10 days. Please choose closer dates.",
    interestsTitle: "What do you like on a trip?",
    interestsSelectedCount: "{n} selected",
    surpriseSelected: "Surprise me selected",
    surpriseMe: "Surprise me ✨",
    interestGroups: {
      popular: "Top attractions",
      cultureHistory: "Culture & history",
      natureBeaches: "Nature & beaches",
      food: "Food & restaurants",
      shopping: "Shopping",
      experiences: "Experiences & entertainment",
    },
    interestsHint: "Pick at least one interest, or choose “Surprise me”.",
    accommodationTitle: "Accommodation",
    hotel: "Hotel",
    apartment: "Apartment",
    notBooked: "Not booked yet",
    accommodationTextLabel: "Hotel, apartment name or address",
    accommodationHint: "Choose your accommodation status, and enter the name or address if you’ve booked.",
    back: "Back",
    next: "Next",
    continueToCheckout: "Continue to checkout",
    priceNote: "{price} once · more than one plan · up to 30 saved plans",
    draftSaveFailed: "We couldn’t save your answers in this browser. Enable site storage or try another browser.",
    createMyPlan: "Create my plan ✨",
    updateMyPlan: "Update my plan ✨",
    ownerIntro: "",
    editingNote: "Your current answers are loaded. Change them and update the plan — no payment.",
  },
  checkoutSummary: {
    title: "Personalized Plan to {destination}",
    interests: "Interests: {interests}",
    accommodation: "Accommodation: {accommodation}",
    accommodationNotBooked: "Not booked yet",
    includesHeading: "Includes:",
    includedPlan: "Personalized travel plan based on your answers",
    includedPlans: "More than one plan at no extra cost, up to 30 saved plans",
    includedGuide: "Complete {destination} Travel Guide",
    price: "Price",
    emailLabel: "Email",
    emailHint: "Use the same email when you sign in, so you can open your plan.",
    editAnswers: "Edit answers",
    missingTitle: "We couldn’t find your plan details",
    missingBody: "Start from the planner: answer the questions and you’ll come back here to pay.",
    backToPlanner: "Start from the planner",
    complimentaryCta: "Create my personalized plan",
    generatingTitle: "Preparing your personalized plan...",
  },
  mine: {
    title: "My Personalized Plans",
    subtitle: "Update your trip details and create a plan that fits you.",
    createNew: "Create a new plan",
    plansHeading: "Your plans",
    openPlan: "Open plan",
    planTitle: "{destination} plan",
    daysCount: "{n} days",
    createdOn: "Created {date}",
    readyBadge: "Payment confirmed ✅",
    readyTitle: "Your plan is ready to build",
    readyBody: "Your payment for the {destination} plan ({days} days) is confirmed. Tap below and we’ll build it from the answers you submitted.",
    buildPlan: "Build my plan ✨",
    building: "Building your trip...",
    buildingPhrases: ["Building your trip...", "Arranging places by day and area...", "Checking opening times..."],
    pendingBadge: "Awaiting payment confirmation",
    pendingTitle: "We’re confirming your payment",
    pendingBody: "As soon as the payment is confirmed, your plan will appear here ready to build. This page refreshes on its own.",
    newPlanNote: "Create as many plans as you like — no extra payment.",
    emptyOwner: "You don't have any saved plan right now. Create your first one whenever you like.",
    complimentaryBadge: "✨ Ready to build",
    complimentaryBody: "Your request for the {destination} plan ({days} days) is ready. Tap below and we’ll build it from your answers.",
  },
  generateErrors: {
    login_required: "Please sign in so we can build your plan.",
    not_found: "We couldn’t find this order in your account.",
    not_paid: "We couldn’t confirm the payment yet. Please try again in a moment.",
    not_owner: "Creating personalized plans is available to customers who bought the Personalized Plan.",
    limit: "You've reached the maximum of 30 saved plans. Delete an old one and try again.",
    invalid_answers: "Your plan details aren’t valid. Please review your answers and try again.",
    in_progress: "Your plan is being built right now. Wait a few seconds and refresh the page.",
    plan_deleted: "This plan was already built and later deleted from your account. You can create a new plan any time at no charge.",
    unsupported_destination: "This destination isn’t supported yet. Contact us and we’ll help.",
    generation_failed: "We couldn’t build the plan right now. Your payment is safe, and you can try again at no extra charge.",
    save_failed: "We built the plan but couldn’t save it. Please try again at no extra charge.",
    unexpected: "Something went wrong. Please try again.",
  },
  complimentaryErrors: {
    login_required: "Please sign in.",
    not_available: "We couldn’t create the plan for this account.",
    invalid_planner_answers: "Your plan details aren’t valid. Please review your answers and try again.",
    create_failed: "We couldn’t prepare the request. Please try again.",
  },
};

export const plannerCopyHe: PlannerCopy = {
  page: {
    title: "התוכנית האישית שלכם ✨",
    subtitle: "ענו על 4 שאלות קצרות ונבנה לכם תוכנית מסודרת יום אחרי יום.",
    tagline: "השאלות בחינם, והתשלום רק אחרי שמסיימים.",
    ownerTagline: "תוכניות חדשות בלי תשלום נוסף.",
    backHome: "← דף הבית",
    alreadyBought: "כבר קניתם? התחברו",
  },
  wizard: {
    progressAria: "שלבי תכנון הטיול",
    stepOf: "שלב {step} מתוך {total} · {label}",
    stepLabels: ["לאן נוסעים?", "מתי?", "מה אתם אוהבים?", "לינה"],
    destinationTitle: "לאן אתם נוסעים?",
    comingSoon: "בקרוב",
    availableNote: "ברצלונה זמינה עכשיו.",
    destinationNames: {
      barcelona: "ברצלונה",
      rome: "רומא",
      prague: "פראג",
      budapest: "בודפשט",
      dubai: "דובאי",
      batumi: "בטומי",
      istanbul: "איסטנבול",
      vienna: "וינה",
      paris: "פריז",
      london: "לונדון",
    },
    whenTitle: "מתי?",
    flexible: "גמיש",
    specificDates: "תאריכים מדויקים",
    howManyDays: "כמה ימים הטיול?",
    dayOne: "יום",
    dayMany: "ימים",
    arrivalDate: "תאריך הגעה",
    departureDate: "תאריך עזיבה",
    dateFormatHint: "תבנית התאריך תלויה בדפדפן שלכם (בדרך כלל יום / חודש / שנה)",
    tripLength: "אורך הטיול: {n} ימים",
    errDepartureBeforeArrival: "תאריך העזיבה צריך להיות באותו יום של ההגעה או אחריו.",
    errMaxDays: "אורך הטיול המקסימלי הנתמך הוא 10 ימים. בחרו תאריכים קרובים יותר.",
    interestsTitle: "מה אתם אוהבים בטיול?",
    interestsSelectedCount: "{n} נבחרו",
    surpriseSelected: "נבחר \"תפתיעו אותי\"",
    surpriseMe: "תפתיעו אותי ✨",
    interestGroups: {
      popular: "האטרקציות המפורסמות",
      cultureHistory: "תרבות והיסטוריה",
      natureBeaches: "טבע וחופים",
      food: "אוכל ומסעדות",
      shopping: "קניות",
      experiences: "חוויות ובילויים",
    },
    interestsHint: "בחרו לפחות תחום עניין אחד, או \"תפתיעו אותי\".",
    accommodationTitle: "לינה",
    hotel: "מלון",
    apartment: "דירה",
    notBooked: "עוד לא הזמנתי",
    accommodationTextLabel: "שם המלון, הדירה או הכתובת",
    accommodationHint: "בחרו את מצב הלינה, ואם כבר הזמנתם כתבו את השם או הכתובת.",
    back: "חזרה",
    next: "הבא",
    continueToCheckout: "המשך לתשלום",
    priceNote: "{price} פעם אחת · יותר מתוכנית אחת · עד 30 תוכניות שמורות",
    draftSaveFailed: "לא הצלחנו לשמור את התשובות בדפדפן הזה. אפשרו אחסון לאתר או נסו דפדפן אחר.",
    createMyPlan: "צרו את התוכנית שלי ✨",
    updateMyPlan: "עדכנו את התוכנית שלי ✨",
    ownerIntro: "",
    editingNote: "התשובות הנוכחיות שלכם נטענו. שנו אותן ועדכנו את התוכנית — בלי תשלום.",
  },
  checkoutSummary: {
    title: "תוכנית אישית ל{destination}",
    interests: "תחומי עניין: {interests}",
    accommodation: "לינה: {accommodation}",
    accommodationNotBooked: "עוד לא הוזמנה",
    includesHeading: "כולל:",
    includedPlan: "תוכנית טיול אישית לפי התשובות שלכם",
    includedPlans: "יותר מתוכנית אחת בלי תשלום נוסף, עד 30 תוכניות שמורות",
    includedGuide: "המדריך המלא ל{destination}",
    price: "מחיר",
    emailLabel: "אימייל",
    emailHint: "השתמשו באותו אימייל כשתתחברו, כדי שתוכלו לפתוח את התוכנית.",
    editAnswers: "עריכת התשובות",
    missingTitle: "לא מצאנו את פרטי התוכנית שלכם",
    missingBody: "התחילו מהמתכנן: ענו על השאלות ותחזרו לכאן לתשלום.",
    backToPlanner: "להתחיל מהמתכנן",
    complimentaryCta: "צרו את התוכנית האישית שלי",
    generatingTitle: "מכינים את התוכנית האישית שלכם...",
  },
  mine: {
    title: "התוכניות האישיות שלי",
    subtitle: "עדכנו את פרטי הטיול וצרו תוכנית שמתאימה לכם.",
    createNew: "יצירת תוכנית חדשה",
    plansHeading: "התוכניות שלכם",
    openPlan: "פתיחת התוכנית",
    planTitle: "תוכנית ל{destination}",
    daysCount: "{n} ימים",
    createdOn: "נוצרה {date}",
    readyBadge: "התשלום אושר ✅",
    readyTitle: "התוכנית שלכם מוכנה לבנייה",
    readyBody: "התשלום שלכם על התוכנית ל{destination} ({days} ימים) אושר. לחצו למטה ונבנה אותה מהתשובות ששלחתם.",
    buildPlan: "בנו את התוכנית שלי ✨",
    building: "בונים את הטיול שלכם...",
    buildingPhrases: ["בונים את הטיול שלכם...", "מסדרים את המקומות לפי ימים ואזורים...", "בודקים שעות פתיחה..."],
    pendingBadge: "ממתין לאישור התשלום",
    pendingTitle: "אנחנו מאשרים את התשלום שלכם",
    pendingBody: "ברגע שהתשלום יאושר, התוכנית תופיע כאן מוכנה לבנייה. הדף מתרענן לבד.",
    newPlanNote: "צרו כמה תוכניות שתרצו — בלי תשלום נוסף.",
    emptyOwner: "אין לכם כרגע תוכנית שמורה. צרו את הראשונה מתי שתרצו.",
    complimentaryBadge: "✨ מוכנה לבנייה",
    complimentaryBody: "הבקשה שלכם לתוכנית ל{destination} ({days} ימים) מוכנה. לחצו למטה ונבנה אותה מהתשובות שלכם.",
  },
  generateErrors: {
    login_required: "התחברו כדי שנוכל לבנות את התוכנית.",
    not_found: "לא מצאנו את ההזמנה הזו בחשבון שלכם.",
    not_paid: "עוד לא הצלחנו לאשר את התשלום. נסו שוב בעוד רגע.",
    not_owner: "יצירת תוכניות אישיות זמינה ללקוחות שרכשו את התוכנית האישית.",
    limit: "הגעתם למקסימום של 30 תוכניות שמורות. מחקו תוכנית ישנה ונסו שוב.",
    invalid_answers: "פרטי התוכנית לא תקינים. בדקו את התשובות ונסו שוב.",
    in_progress: "התוכנית שלכם נבנית ממש עכשיו. חכו כמה שניות ורעננו את הדף.",
    plan_deleted: "התוכנית הזו כבר נבנתה ונמחקה מהחשבון שלכם. אפשר ליצור תוכנית חדשה בכל זמן בלי תשלום.",
    unsupported_destination: "היעד הזה עוד לא נתמך. צרו איתנו קשר ונעזור.",
    generation_failed: "לא הצלחנו לבנות את התוכנית כרגע. התשלום שלכם שמור, ואפשר לנסות שוב בלי תשלום נוסף.",
    save_failed: "בנינו את התוכנית אבל לא הצלחנו לשמור אותה. נסו שוב בלי תשלום נוסף.",
    unexpected: "משהו השתבש. נסו שוב.",
  },
  complimentaryErrors: {
    login_required: "התחברו בבקשה.",
    not_available: "לא הצלחנו ליצור את התוכנית לחשבון הזה.",
    invalid_planner_answers: "פרטי התוכנית לא תקינים. בדקו את התשובות ונסו שוב.",
    create_failed: "לא הצלחנו להכין את הבקשה. נסו שוב.",
  },
};

