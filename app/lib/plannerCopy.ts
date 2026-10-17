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
    backHome: string;
    /** Shown to signed-out visitors who already bought a plan as a guest. */
    alreadyBought: string;
    /** Notice for a customer who bought under the old pay-first model and has no saved plan. */
    legacyTitle: string;
    legacyBody: string;
    legacyContact: string;
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
    draftSaveFailed: string;
    /** The last step when the SERVER says payment must not be offered (see getPersonalizedFlowStatus). */
    checkingPurchase: string;
    buildMyPlan: string;
    openMyPlan: string;
    paidNote: string;
    duplicateNote: string;
    /** Shown on top of the questionnaire for a customer who already has plans: this is a new trip and a new purchase. */
    newTripNote: string;
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
    /** Shown instead of "Create a new plan" while a paid plan is still waiting to be built. */
    buildFirstNote: string;
    /** Plans the customer removed from the list (they are kept and can be restored). */
    archivedHeading: string;
    archivedNote: string;
    complimentaryBadge: string;
    complimentaryBody: string;
  };
  generateErrors: Record<PlannerGenerateErrorCode, string>;
  complimentaryErrors: Record<PlannerComplimentaryErrorCode, string>;
};

export function fillCopy(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

export const plannerCopyAr: PlannerCopy = {
  page: {
    title: "خطة مخصصة إلك ✨",
    subtitle: "اختار وجهتك واهتماماتك، وإحنا بنبني لك خطة ذكية حسب رحلتك.",
    tagline: "جاوب على كم سؤال، أكمل الدفع، وبنبني خطتك حسب أيامك، اهتماماتك ومكان سكنك.",
    backHome: "← الرئيسية",
    alreadyBought: "اشتريت من قبل؟ سجّل دخولك",
    legacyTitle: "اشتريت الخطة المخصصة قبل هذا التحديث",
    legacyBody: "مشترياتك محفوظة في حسابك. إذا ما لقيت خطتك أو بدك مساعدة لبنائها، تواصل معنا وبنساعدك. وتقدر كمان تبدأ خطة جديدة من الأسفل لرحلة جديدة.",
    legacyContact: "تواصل معنا",
  },
  wizard: {
    progressAria: "خطوات إنشاء الرحلة",
    stepOf: "الخطوة {step} من {total} · {label}",
    stepLabels: ["وين مسافر؟", "متى؟", "شو بتحب؟", "السكن"],
    destinationTitle: "وين مسافر؟",
    comingSoon: "قريبًا",
    availableNote: "برشلونة متاحة الآن — وجهات جديدة قريبًا.",
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
    draftSaveFailed: "تعذّر حفظ إجاباتك على هذا المتصفح. فعّل التخزين المؤقت أو جرّب متصفحًا آخر.",
    checkingPurchase: "جاري التحقق من حالة خطتك...",
    buildMyPlan: "ابنِ خطتي ✨",
    openMyPlan: "افتح خطتي",
    paidNote: "دفعتك لخطة مؤكدة وخطتك جاهزة للبناء — لا حاجة لدفع جديد.",
    duplicateNote: "اشتريت خطة بنفس هذه الإجابات قبل قليل — لا حاجة لدفع جديد. افتح خطتك، أو غيّر إجاباتك إذا كانت لرحلة جديدة.",
    newTripNote: "هذه خطة جديدة لرحلة أخرى، وتتطلب عملية شراء جديدة. خطتك الحالية محفوظة كما هي.",
  },
  checkoutSummary: {
    title: "خطة مخصصة إلى {destination}",
    interests: "الاهتمامات: {interests}",
    accommodation: "السكن: {accommodation}",
    accommodationNotBooked: "لسا ما حجزت",
    includesHeading: "يشمل:",
    includedPlan: "خطة سفر مخصصة مبنية على إجاباتك",
    includedGuide: "دليل {destination} الكامل",
    price: "السعر",
    emailLabel: "البريد الإلكتروني",
    emailHint: "سنستخدم بريدك لإرسال تفاصيل الطلب.",
    editAnswers: "تعديل الإجابات",
    missingTitle: "ما لقينا تفاصيل خطتك",
    missingBody: "ابدأ من صفحة المخطط: جاوب على الأسئلة وبترجع لهون لإتمام الدفع.",
    backToPlanner: "ابدأ من المخطط",
    complimentaryCta: "إنشاء خطتي المخصصة",
    generatingTitle: "عم نجهّز خطتك المخصصة...",
  },
  mine: {
    title: "خططي المخصصة",
    subtitle: "هنا كل خططك المخصصة. لكل رحلة جديدة بتنشئ خطة جديدة.",
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
    newPlanNote: "كل خطة جديدة هي عملية شراء جديدة لرحلة جديدة.",
    buildFirstNote: "عندك خطة مدفوعة جاهزة للبناء. ابنِها أولًا، وبعدها تقدر تنشئ خطة جديدة لرحلة أخرى.",
    archivedHeading: "الخطط المحذوفة",
    archivedNote: "هذه الخطط مخفية فقط، ومشترياتك محفوظة. تقدر تستعيد أي خطة منها.",
    complimentaryBadge: "✨ جاهزة للبناء",
    complimentaryBody: "طلب خطتك لـ {destination} ({days} أيام) جاهز. اضغط لنبني خطتك من إجاباتك.",
  },
  generateErrors: {
    login_required: "لازم تسجّل الدخول عشان نبني خطتك.",
    not_found: "ما لقينا هذا الطلب ضمن حسابك.",
    not_paid: "ما قدرنا نتأكد من الدفع بعد. جرّب بعد قليل.",
    in_progress: "خطتك قيد البناء حاليًا. انتظر لحظات وحدّث الصفحة.",
    plan_deleted: "هذه الخطة انبنت وانحذفت من حسابك سابقًا. لإنشاء خطة جديدة اختار «إنشاء خطة جديدة».",
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
    subtitle: "Pick your destination and interests, and we’ll build a smart plan around your trip.",
    tagline: "Answer a few questions, check out, and we build your plan around your days, interests and where you’re staying.",
    backHome: "← Home",
    alreadyBought: "Already bought? Sign in",
    legacyTitle: "You bought the Personalized Plan before this update",
    legacyBody: "Your purchase is safe in your account. If you can’t find your plan or want help building it, contact us and we’ll help. You can also start a new plan below for another trip.",
    legacyContact: "Contact us",
  },
  wizard: {
    progressAria: "Trip planning steps",
    stepOf: "Step {step} of {total} · {label}",
    stepLabels: ["Where to?", "When?", "What do you like?", "Accommodation"],
    destinationTitle: "Where are you going?",
    comingSoon: "Coming soon",
    availableNote: "Barcelona is available now — more destinations coming soon.",
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
    draftSaveFailed: "We couldn’t save your answers in this browser. Enable site storage or try another browser.",
    checkingPurchase: "Checking your plan status...",
    buildMyPlan: "Build my plan ✨",
    openMyPlan: "Open my plan",
    paidNote: "Your payment is confirmed and your plan is ready to build — there's nothing more to pay.",
    duplicateNote: "You just bought a plan with these exact answers — there's nothing more to pay. Open your plan, or change your answers if this is a new trip.",
    newTripNote: "This is a new plan for another trip and needs a new purchase. Your current plan stays exactly as it is.",
  },
  checkoutSummary: {
    title: "Personalized Plan to {destination}",
    interests: "Interests: {interests}",
    accommodation: "Accommodation: {accommodation}",
    accommodationNotBooked: "Not booked yet",
    includesHeading: "Includes:",
    includedPlan: "Personalized travel plan based on your answers",
    includedGuide: "Complete {destination} Travel Guide",
    price: "Price",
    emailLabel: "Email",
    emailHint: "We’ll use your email to send your order details.",
    editAnswers: "Edit answers",
    missingTitle: "We couldn’t find your plan details",
    missingBody: "Start from the planner: answer the questions and you’ll come back here to pay.",
    backToPlanner: "Start from the planner",
    complimentaryCta: "Create my personalized plan",
    generatingTitle: "Preparing your personalized plan...",
  },
  mine: {
    title: "My Personalized Plans",
    subtitle: "All your personalized plans are here. For each new trip you create a new plan.",
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
    newPlanNote: "Each new plan is a new purchase for a new trip.",
    buildFirstNote: "You have a paid plan ready to build. Build it first, then you can create another plan for a different trip.",
    archivedHeading: "Removed plans",
    archivedNote: "These plans are only hidden, and your purchases are safe. You can restore any of them.",
    complimentaryBadge: "✨ Ready to build",
    complimentaryBody: "Your request for the {destination} plan ({days} days) is ready. Tap below and we’ll build it from your answers.",
  },
  generateErrors: {
    login_required: "Please sign in so we can build your plan.",
    not_found: "We couldn’t find this order in your account.",
    not_paid: "We couldn’t confirm the payment yet. Please try again in a moment.",
    in_progress: "Your plan is being built right now. Wait a few seconds and refresh the page.",
    plan_deleted: "This plan was already built and later deleted from your account. To get a new plan, choose “Create a new plan”.",
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
