import { destinations } from "./content";

/**
 * Ready-made package content, keyed by destination slug.
 * Name, flag, image, country, and price all live in `destinations` (content.ts) —
 * this file only holds package-specific content, so nothing is duplicated.
 * Each day currently has one short block; add more blocks (e.g. "ظهر", "مساء")
 * to expand a day later without changing the type.
 */

export type PackageDayBlock = {
  time: string;
  activity: string;
};

export type PackageDay = {
  day: number;
  title: string;
  blocks: PackageDayBlock[];
};

export type Package = {
  slug: string;
  overview: string;
  included: string[];
  days: PackageDay[];
  attractions: string[];
  food: string[];
  neighborhoods: string[];
  transportation: string;
  dailyBudgetILS: { min: number; max: number };
  bookingTips: string[];
  tips: string[];
  photoSpots: string[];
};

const included = [
  "برنامج يومي مفصّل جاهز للاستخدام",
  "أماكن ومطاعم مختارة بعناية",
  "نصائح تنقل محلية",
  "روابط خرائط جاهزة",
];

export const packagesData: Package[] = [
  {
    slug: "barcelona",
    overview: "خمسة أيام بين عمارة غاودي الساحرة، أزقة الحي القوطي، وشواطئ المتوسط.",
    included,
    days: [
      { day: 1, title: "الوصول والحي القوطي", blocks: [{ time: "صباحًا", activity: "استقرار في الفندق ثم جولة في Gothic Quarter (الحي القوطي)" }] },
      { day: 2, title: "عمارة غاودي", blocks: [{ time: "صباحًا", activity: "زيارة Sagrada Família (ساغرادا فاميليا) ثم Park Güell (حديقة غويل)" }] },
      { day: 3, title: "ساحل برشلونة", blocks: [{ time: "صباحًا", activity: "Casa Batlló (بيت باتّيو) ثم استرخاء في Barceloneta Beach (شاطئ برشلونيتا)" }] },
      { day: 4, title: "كرة القدم والأسواق", blocks: [{ time: "صباحًا", activity: "جولة في Camp Nou (كامب نو) ثم تسوق في La Boqueria Market (سوق لا بوكيريا)" }] },
      { day: 5, title: "يوم حر ومغادرة", blocks: [{ time: "صباحًا", activity: "وقت حر للتسوق الأخير قبل التوجه للمطار" }] },
    ],
    attractions: [
      "Sagrada Família (ساغرادا فاميليا)",
      "Park Güell (حديقة غويل)",
      "Gothic Quarter (الحي القوطي)",
      "Casa Batlló (بيت باتّيو)",
      "Camp Nou (كامب نو)",
    ],
    food: ["La Boqueria Market (سوق لا بوكيريا)", "بارات التاباس في El Born"],
    neighborhoods: ["Eixample", "Gràcia", "El Born"],
    transportation: "بطاقة مترو T-10 تغطي أغلب تنقلاتك داخل المدينة بسعر مناسب.",
    dailyBudgetILS: { min: 250, max: 400 },
    bookingTips: [
      "احجز تذاكر Sagrada Família أونلاين مسبقًا لتجنب الطوابير",
      "استقرار في Eixample يسهّل الوصول لمعظم المعالم",
      "تجنب حجز فندق قريب من Las Ramblas بسبب الازدحام",
    ],
    tips: ["احذر النشالين في المناطق السياحية المزدحمة", "معظم المتاحف مغلقة يوم الاثنين", "الغداء المحلي عادة بعد الساعة 2 ظهرًا"],
    photoSpots: ["واجهة Sagrada Família", "شرفة Park Güell المطلة على المدينة"],
  },
  {
    slug: "batumi",
    overview: "أربعة أيام على ساحل البحر الأسود بين الواجهة البحرية والطبيعة الجورجية الخلابة.",
    included,
    days: [
      { day: 1, title: "الوصول والكورنيش", blocks: [{ time: "صباحًا", activity: "استقرار ثم نزهة على Batumi Boulevard (كورنيش باتومي)" }] },
      { day: 2, title: "ميادين باتومي", blocks: [{ time: "صباحًا", activity: "Piazza Square (ميدان بيازا) و Europe Square (ميدان أوروبا)" }] },
      { day: 3, title: "طبيعة وحدائق", blocks: [{ time: "صباحًا", activity: "زيارة Batumi Botanical Garden (الحديقة النباتية)" }] },
      { day: 4, title: "يوم حر ومغادرة", blocks: [{ time: "صباحًا", activity: "وقت حر في المدينة القديمة قبل المغادرة" }] },
    ],
    attractions: [
      "Batumi Boulevard (كورنيش باتومي)",
      "Alphabet Tower (برج الأبجدية)",
      "Piazza Square (ميدان بيازا)",
      "Batumi Botanical Garden (الحديقة النباتية)",
      "Europe Square (ميدان أوروبا)",
    ],
    food: ["مطاعم المأكولات البحرية على الكورنيش", "خاچابوري أجاري التقليدي"],
    neighborhoods: ["المدينة القديمة", "منطقة الكورنيش"],
    transportation: "المدينة صغيرة ويمكن التنقل مشيًا، وسيارات الأجرة رخيصة نسبيًا.",
    dailyBudgetILS: { min: 120, max: 200 },
    bookingTips: ["احجز فندقًا قريبًا من الكورنيش للاستمتاع بالإطلالة", "أفضل وقت للزيارة هو الصيف", "قارن أسعار الفنادق قبل الحجز فالفروقات كبيرة"],
    tips: ["العملة المحلية اللاري أفضل من الدولار في المحلات الصغيرة", "الطقس الصيفي رطب نسبيًا", "بعض المحلات تغلق مبكرًا خارج الموسم"],
    photoSpots: ["برج الأبجدية عند الغروب", "نافورة ميدان أوروبا ليلًا"],
  },
  {
    slug: "dubai",
    overview: "خمسة أيام بين ناطحات السحاب، التسوق العالمي، ومغامرة في الصحراء.",
    included,
    days: [
      { day: 1, title: "الوصول ووسط المدينة", blocks: [{ time: "صباحًا", activity: "استقرار ثم زيارة Burj Khalifa (برج خليفة) و Dubai Mall (دبي مول)" }] },
      { day: 2, title: "نخلة جميرا والمارينا", blocks: [{ time: "صباحًا", activity: "جولة في Palm Jumeirah (نخلة جميرا) ثم Dubai Marina" }] },
      { day: 3, title: "الأسواق التراثية", blocks: [{ time: "صباحًا", activity: "تجول في Gold Souk (سوق الذهب) والسوق القديم في ديرة" }] },
      { day: 4, title: "سفاري صحراوي", blocks: [{ time: "بعد الظهر", activity: "رحلة سفاري صحراوية مع عشاء تقليدي" }] },
      { day: 5, title: "يوم حر ومغادرة", blocks: [{ time: "صباحًا", activity: "وقت حر للتسوق الأخير قبل التوجه للمطار" }] },
    ],
    attractions: [
      "Burj Khalifa (برج خليفة)",
      "Dubai Mall (دبي مول)",
      "Palm Jumeirah (نخلة جميرا)",
      "Dubai Marina",
      "Gold Souk (سوق الذهب)",
    ],
    food: ["مطاعم دبي مارينا", "مطعم Ravi الباكستاني الشهير"],
    neighborhoods: ["Downtown Dubai", "Dubai Marina", "ديرة"],
    transportation: "مترو دبي نظيف وسريع، وبطاقة Nol تغطي المترو والترام والحافلات.",
    dailyBudgetILS: { min: 350, max: 600 },
    bookingTips: ["احجز تذكرة صعود برج خليفة مسبقًا خصوصًا وقت الغروب", "رحلات السفاري تُحجز قبل يوم على الأقل", "الإقامة في Downtown تسهّل الوصول لأغلب المعالم"],
    tips: ["الصيف حار جدًا؛ فضّل الأنشطة الخارجية في المساء", "الملابس المحتشمة مطلوبة في الأماكن الدينية", "الجمعة والسبت هما عطلة نهاية الأسبوع محليًا"],
    photoSpots: ["نافورة دبي أمام برج خليفة", "إطلالة نخلة جميرا من The View"],
  },
  {
    slug: "miami",
    overview: "خمسة أيام بين شواطئ South Beach، فن Wynwood، وأجواء هافانا الصغيرة.",
    included,
    days: [
      { day: 1, title: "الوصول وساوث بيتش", blocks: [{ time: "صباحًا", activity: "استقرار ثم نزهة على Ocean Drive و South Beach" }] },
      { day: 2, title: "فنون وينوود", blocks: [{ time: "صباحًا", activity: "جولة جداريات في Wynwood Walls (حائط وينوود للفنون)" }] },
      { day: 3, title: "هافانا الصغيرة", blocks: [{ time: "صباحًا", activity: "استكشاف Little Havana (هافانا الصغيرة) وأجوائها الكوبية" }] },
      { day: 4, title: "قصر وحدائق", blocks: [{ time: "صباحًا", activity: "زيارة Vizcaya Museum and Gardens (متحف وحدائق فيزكايا)" }] },
      { day: 5, title: "يوم حر ومغادرة", blocks: [{ time: "صباحًا", activity: "تسوق أخير في Bayside Marketplace قبل المغادرة" }] },
    ],
    attractions: [
      "South Beach",
      "Ocean Drive",
      "Wynwood Walls (حائط وينوود للفنون)",
      "Little Havana (هافانا الصغيرة)",
      "Vizcaya Museum and Gardens",
    ],
    food: ["مطاعم كوبية في Little Havana", "مقاهي Ocean Drive"],
    neighborhoods: ["South Beach", "Wynwood", "Little Havana"],
    transportation: "يُفضَّل استئجار سيارة أو استخدام تطبيقات النقل؛ المدينة ممتدة والمواصلات العامة محدودة.",
    dailyBudgetILS: { min: 350, max: 550 },
    bookingTips: ["احجز فندقًا في South Beach إن أردت القرب من الشاطئ والحياة الليلية", "أفضل وقت للزيارة هو الربيع أو الخريف لتفادي الرطوبة الشديدة", "استأجر السيارة من المطار مباشرة لتوفير الوقت"],
    tips: ["احترس من أشعة الشمس القوية وارتدِ واقيًا", "موسم الأعاصير من شهر 6–10", "التنقيح (tipping) في المطاعم يعادل 15-20٪"],
    photoSpots: ["مباني آرت ديكو الملونة على Ocean Drive", "جداريات Wynwood"],
  },
  {
    slug: "istanbul",
    overview: "خمسة أيام بين تاريخ عثماني وبيزنطي، أسواق نابضة، وإطلالات على البوسفور.",
    included,
    days: [
      { day: 1, title: "الوصول والسلطان أحمد", blocks: [{ time: "صباحًا", activity: "استقرار ثم زيارة Hagia Sophia (آيا صوفيا) و Blue Mosque (المسجد الأزرق)" }] },
      { day: 2, title: "قصور وأسواق", blocks: [{ time: "صباحًا", activity: "Topkapi Palace (قصر توبكابي) ثم Grand Bazaar (البازار الكبير)" }] },
      { day: 3, title: "جولة البوسفور", blocks: [{ time: "بعد الظهر", activity: "رحلة بحرية في Bosphorus Cruise (مضيق البوسفور)" }] },
      { day: 4, title: "تقسيم وغلطة", blocks: [{ time: "صباحًا", activity: "Galata Tower (برج غلطة) ثم شارع Istiklal في تقسيم" }] },
      { day: 5, title: "يوم حر ومغادرة", blocks: [{ time: "صباحًا", activity: "وقت حر للتسوق الأخير قبل المطار" }] },
    ],
    attractions: [
      "Hagia Sophia (آيا صوفيا)",
      "Blue Mosque (المسجد الأزرق)",
      "Topkapi Palace (قصر توبكابي)",
      "Grand Bazaar (البازار الكبير)",
      "Galata Tower (برج غلطة)",
    ],
    food: ["الفطور التركي التقليدي", "أسماك مشوية في Kadıköy"],
    neighborhoods: ["Sultanahmet", "Beyoğlu / Taksim", "Kadıköy"],
    transportation: "بطاقة Istanbulkart تعمل على الترام والمترو والعبّارات.",
    dailyBudgetILS: { min: 150, max: 280 },
    bookingTips: ["احجز جولة البوسفور وقت الغروب لإطلالة أجمل", "الإقامة في Sultanahmet تقرّبك من أغلب المعالم التاريخية", "تذاكر Topkapi تُشترى مسبقًا لتفادي الطوابير"],
    tips: ["احمل نقودًا صغيرة للأسواق الشعبية", "المساجد تُزار خارج أوقات الصلاة", "المساومة مقبولة في البازار الكبير"],
    photoSpots: ["إطلالة Galata Tower على المدينة", "قبة Hagia Sophia الداخلية"],
  },
  {
    slug: "sharm-el-sheikh",
    overview: "أربعة أيام من الشمس والبحر الأحمر، مثالية للغوص والاسترخاء.",
    included,
    days: [
      { day: 1, title: "الوصول وخليج نعمة", blocks: [{ time: "صباحًا", activity: "استقرار ثم استرخاء في Naama Bay (خليج نعمة)" }] },
      { day: 2, title: "الغوص والشعاب", blocks: [{ time: "صباحًا", activity: "رحلة غوص أو سنوركل في الشعاب المرجانية" }] },
      { day: 3, title: "رأس محمد", blocks: [{ time: "صباحًا", activity: "زيارة Ras Mohammed National Park (محمية رأس محمد)" }] },
      { day: 4, title: "يوم حر ومغادرة", blocks: [{ time: "صباحًا", activity: "تسوق أخير في Old Market (السوق القديم) قبل المغادرة" }] },
    ],
    attractions: [
      "Naama Bay (خليج نعمة)",
      "Ras Mohammed National Park (محمية رأس محمد)",
      "Old Market (السوق القديم)",
      "Soho Square",
      "نقاط الغوص والسنوركل الشهيرة",
    ],
    food: ["مأكولات بحرية في Old Market", "مطاعم المنتجعات على الخليج"],
    neighborhoods: ["Naama Bay", "المدينة القديمة"],
    transportation: "التنقل غالبًا عبر تاكسي أو حافلات المنتجعات؛ المسافات بين المناطق متوسطة.",
    dailyBudgetILS: { min: 150, max: 250 },
    bookingTips: ["احجز رحلة الغوص مسبقًا خصوصًا في موسم الذروة", "اختر منتجعًا قريبًا من Naama Bay للحياة الليلية", "تأكد من شهادة الغوص إن رغبت بالغوص العميق"],
    tips: ["استخدم واقي شمس صديق للشعاب المرجانية", "أفضل رؤية غوص عادة في الصباح الباكر", "احمل ملابس خفيفة فالطقس حار طوال العام"],
    photoSpots: ["شروق الشمس على خليج نعمة", "الشعاب المرجانية الملونة تحت الماء"],
  },
  {
    slug: "prague",
    overview: "أربعة أيام في مدينة القلعة والجسور، حيث العمارة القوطية تلتقي بأجواء أوروبا الوسطى.",
    included,
    days: [
      { day: 1, title: "الوصول والبلدة القديمة", blocks: [{ time: "صباحًا", activity: "استقرار ثم Old Town Square (الساحة القديمة) و Astronomical Clock (الساعة الفلكية)" }] },
      { day: 2, title: "القلعة والجسر", blocks: [{ time: "صباحًا", activity: "Prague Castle (قلعة براغ) ثم عبور Charles Bridge (جسر تشارلز)" }] },
      { day: 3, title: "تلة بترشين", blocks: [{ time: "صباحًا", activity: "نزهة في Petřín Hill (تلة بترشين) وإطلالتها البانورامية" }] },
      { day: 4, title: "يوم حر ومغادرة", blocks: [{ time: "صباحًا", activity: "وقت حر للتسوق الأخير قبل المغادرة" }] },
    ],
    attractions: [
      "Prague Castle (قلعة براغ)",
      "Charles Bridge (جسر تشارلز)",
      "Old Town Square (الساحة القديمة)",
      "Astronomical Clock (الساعة الفلكية)",
      "Petřín Hill (تلة بترشين)",
    ],
    food: ["حانات تشيكية تقليدية", "حلوى Trdelník الشهيرة"],
    neighborhoods: ["Old Town", "Malá Strana"],
    transportation: "شبكة الترام والمترو واسعة وسهلة الاستخدام ببطاقة يومية.",
    dailyBudgetILS: { min: 180, max: 300 },
    bookingTips: ["اصعد برج الساعة الفلكية مبكرًا لتفادي الازدحام", "الإقامة في Old Town تقلل وقت التنقل", "احجز جولة القلعة أونلاين في موسم الذروة"],
    tips: ["الشوارع الحجرية غير مريحة بالكعب العالي", "معظم المطاعم تقبل الدفع النقدي والبطاقة", "الطقس متقلب؛ احمل معطفًا خفيفًا حتى بالصيف"],
    photoSpots: ["جسر تشارلز عند الشروق", "إطلالة القلعة من الجهة المقابلة للنهر"],
  },
  {
    slug: "budapest",
    overview: "أربعة أيام بين ضفتي الدانوب، الحمامات الحرارية، وعمارة برلمانية مهيبة.",
    included,
    days: [
      { day: 1, title: "الوصول وجانب بودا", blocks: [{ time: "صباحًا", activity: "استقرار ثم Buda Castle (قلعة بودا) و Fisherman's Bastion (حصن الصيادين)" }] },
      { day: 2, title: "حمامات سيتشيني", blocks: [{ time: "صباحًا", activity: "استرخاء في Széchenyi Thermal Bath (حمامات سيتشيني)" }] },
      { day: 3, title: "جانب بيست والبرلمان", blocks: [{ time: "صباحًا", activity: "زيارة Hungarian Parliament (مبنى البرلمان) وحي اليهود" }] },
      { day: 4, title: "يوم حر ومغادرة", blocks: [{ time: "بعد الظهر", activity: "رحلة نهرية قصيرة على الدانوب قبل المغادرة" }] },
    ],
    attractions: [
      "Buda Castle (قلعة بودا)",
      "Fisherman's Bastion (حصن الصيادين)",
      "Széchenyi Thermal Bath (حمامات سيتشيني)",
      "Hungarian Parliament (مبنى البرلمان)",
      "جولة نهرية على الدانوب",
    ],
    food: ["حساء الغولاش التقليدي", "حانات الأنقاض (Ruin Bars) الشهيرة"],
    neighborhoods: ["جانب بودا", "حي اليهود في بيست"],
    transportation: "مترو وترام واسعان يغطيان معظم المدينة ببطاقة يومية واحدة.",
    dailyBudgetILS: { min: 160, max: 280 },
    bookingTips: ["احجز دخول الحمامات الحرارية أونلاين لتوفير الوقت", "الإقامة في بيست أقرب للحياة الليلية والمطاعم", "شاهد البرلمان مضاءً ليلًا من الضفة المقابلة"],
    tips: ["احمل ملابس سباحة لزيارة الحمامات", "بعض حانات الأنقاض مزدحمة جدًا في عطلة نهاية الأسبوع", "العملة المحلية الفورنت وليس اليورو"],
    photoSpots: ["حصن الصيادين عند الغروب", "مبنى البرلمان من جسر السلاسل"],
  },
  {
    slug: "vienna",
    overview: "أربعة أيام من الأناقة الإمبراطورية، المقاهي العريقة، والموسيقى الكلاسيكية.",
    included,
    days: [
      { day: 1, title: "الوصول ووسط المدينة", blocks: [{ time: "صباحًا", activity: "استقرار ثم St. Stephen's Cathedral (كاتدرائية القديس ستيفن)" }] },
      { day: 2, title: "قصر شونبرون", blocks: [{ time: "صباحًا", activity: "جولة في Schönbrunn Palace (قصر شونبرون) وحدائقه" }] },
      { day: 3, title: "بلفيدير وناشماركت", blocks: [{ time: "صباحًا", activity: "Belvedere Palace (قصر بلفيدير) ثم تسوق في Naschmarkt" }] },
      { day: 4, title: "يوم حر ومغادرة", blocks: [{ time: "مساءً", activity: "أمسية في Vienna State Opera (دار أوبرا فيينا) إن توفرت تذاكر" }] },
    ],
    attractions: [
      "Schönbrunn Palace (قصر شونبرون)",
      "St. Stephen's Cathedral (كاتدرائية القديس ستيفن)",
      "Belvedere Palace (قصر بلفيدير)",
      "Naschmarkt",
      "Vienna State Opera (دار أوبرا فيينا)",
    ],
    food: ["مقاهي فيينا التاريخية", "شنيتزل تقليدي"],
    neighborhoods: ["Innere Stadt (وسط المدينة)", "منطقة Naschmarkt"],
    transportation: "شبكة U-Bahn (المترو) نظيفة ومباشرة لأغلب الوجهات.",
    dailyBudgetILS: { min: 250, max: 400 },
    bookingTips: ["احجز تذاكر شونبرون أونلاين لتفادي الطوابير", "تذاكر الأوبرا الواقفة رخيصة نسبيًا إن توفرت", "الإقامة قرب Innere Stadt توفر وقت التنقل"],
    tips: ["المقاهي التاريخية تتوقع بقاءً طويلًا وليس فقط طلبًا سريعًا", "الأحد أغلب المحلات مغلقة", "الطقس معتدل صيفًا وبارد شتاءً"],
    photoSpots: ["واجهة قصر شونبرون من الحديقة", "قبة كاتدرائية القديس ستيفن الملونة"],
  },
  {
    slug: "rome",
    overview: "أربعة أيام بين آثار رومانية خالدة، فن الفاتيكان، ونافورات كلاسيكية.",
    included,
    days: [
      { day: 1, title: "الوصول والكولوسيوم", blocks: [{ time: "صباحًا", activity: "استقرار ثم Colosseum (الكولوسيوم) و Roman Forum (المنتدى الروماني)" }] },
      { day: 2, title: "الفاتيكان", blocks: [{ time: "صباحًا", activity: "جولة في Vatican Museums (متاحف الفاتيكان) وكنيسة سيستين" }] },
      { day: 3, title: "قلب روما القديم", blocks: [{ time: "صباحًا", activity: "Pantheon (البانثيون) ثم Trevi Fountain (نافورة تريفي)" }] },
      { day: 4, title: "يوم حر ومغادرة", blocks: [{ time: "صباحًا", activity: "نزهة في Trastevere قبل المغادرة" }] },
    ],
    attractions: [
      "Colosseum (الكولوسيوم)",
      "Roman Forum (المنتدى الروماني)",
      "Vatican Museums (متاحف الفاتيكان)",
      "Trevi Fountain (نافورة تريفي)",
      "Pantheon (البانثيون)",
    ],
    food: ["مطاعم Trastevere الشعبية", "بيتزا رومانية على الطريقة التقليدية"],
    neighborhoods: ["Trastevere", "Centro Storico"],
    transportation: "مزيج من المترو والمشي مناسب لمعظم المعالم القريبة من بعضها.",
    dailyBudgetILS: { min: 250, max: 400 },
    bookingTips: ["احجز تذاكر الكولوسيوم والفاتيكان أونلاين مسبقًا إلزاميًا تقريبًا", "الإقامة قرب Centro Storico تقلل التنقل", "تجنب مطاعم قريبة جدًا من المعالم السياحية لجودة أفضل بسعر أقل"],
    tips: ["ارتدِ حذاءً مريحًا فالمشي كثير على حجر مرصوف", "الملابس المحتشمة مطلوبة داخل الفاتيكان", "رمي عملة في نافورة تريفي تقليد شهير"],
    photoSpots: ["الكولوسيوم من الخارج عند الغروب", "نافورة تريفي ليلًا"],
  },
  {
    slug: "paris",
    overview: "خمسة أيام من الأناقة الباريسية بين المتاحف الكبرى وضفاف نهر السين.",
    included,
    days: [
      { day: 1, title: "الوصول وبرج إيفل", blocks: [{ time: "صباحًا", activity: "استقرار ثم زيارة Eiffel Tower (برج إيفل)" }] },
      { day: 2, title: "اللوفر ونوتردام", blocks: [{ time: "صباحًا", activity: "Louvre Museum (متحف اللوفر) ثم Notre-Dame (كاتدرائية نوتردام)" }] },
      { day: 3, title: "مونمارتر", blocks: [{ time: "صباحًا", activity: "استكشاف حي Montmartre وكنيسة Sacré-Cœur" }] },
      { day: 4, title: "الشانزليزيه والسين", blocks: [{ time: "بعد الظهر", activity: "نزهة على Champs-Élysées ثم Seine River Cruise" }] },
      { day: 5, title: "يوم حر ومغادرة", blocks: [{ time: "صباحًا", activity: "تسوق أخير في Le Marais قبل المغادرة" }] },
    ],
    attractions: [
      "Eiffel Tower (برج إيفل)",
      "Louvre Museum (متحف اللوفر)",
      "Notre-Dame (كاتدرائية نوتردام)",
      "Montmartre",
      "Champs-Élysées",
    ],
    food: ["مقاهي ومخابز Le Marais", "كرواسون ومعجنات فرنسية أصيلة"],
    neighborhoods: ["Le Marais", "Montmartre"],
    transportation: "شبكة مترو باريس واسعة وتغطي كل الوجهات الرئيسية.",
    dailyBudgetILS: { min: 300, max: 480 },
    bookingTips: ["احجز تذاكر اللوفر أونلاين لتفادي طوابير طويلة", "صعود برج إيفل يُحجز مسبقًا خصوصًا في الصيف", "الإقامة في Le Marais قريبة من أغلب المعالم"],
    tips: ["أغلب المتاحف مغلقة يوم الاثنين أو الثلاثاء", "تعلّم بضع عبارات فرنسية يُقدَّر من السكان المحليين", "احذر جيوب النشل في المترو المزدحم"],
    photoSpots: ["برج إيفل من Trocadéro", "شوارع مونمارتر المرصوفة"],
  },
  {
    slug: "london",
    overview: "خمسة أيام بين تاريخ ملكي عريق، متاحف عالمية، وأسواق نابضة بالحياة.",
    included,
    days: [
      { day: 1, title: "الوصول ووستمنستر", blocks: [{ time: "صباحًا", activity: "استقرار ثم Big Ben و Westminster" }] },
      { day: 2, title: "برج لندن والمتحف", blocks: [{ time: "صباحًا", activity: "Tower of London (برج لندن) ثم British Museum (المتحف البريطاني)" }] },
      { day: 3, title: "كامدن وساوث بانك", blocks: [{ time: "صباحًا", activity: "تسوق في Camden Market ثم نزهة على South Bank" }] },
      { day: 4, title: "عين لندن وباكنغهام", blocks: [{ time: "صباحًا", activity: "London Eye (عين لندن) ثم Buckingham Palace (قصر باكنغهام)" }] },
      { day: 5, title: "يوم حر ومغادرة", blocks: [{ time: "صباحًا", activity: "تسوق أخير في Borough Market (سوق بورو) قبل المغادرة" }] },
    ],
    attractions: [
      "Big Ben & Westminster",
      "Tower of London (برج لندن)",
      "British Museum (المتحف البريطاني)",
      "London Eye (عين لندن)",
      "Buckingham Palace (قصر باكنغهام)",
    ],
    food: ["Borough Market (سوق بورو)", "حانات إنجليزية تقليدية"],
    neighborhoods: ["Covent Garden", "Camden", "South Bank"],
    transportation: "بطاقة Oyster تغطي المترو (Tube) والحافلات بسعر مخفض.",
    dailyBudgetILS: { min: 320, max: 500 },
    bookingTips: ["احجز تذاكر برج لندن أونلاين لتوفير الوقت والسعر", "الإقامة قرب South Bank أو Covent Garden مركزية ومريحة", "تحقق من عروض المسارح في آخر لحظة لأسعار أفضل"],
    tips: ["الطقس متقلب؛ احمل مظلة دائمًا", "الوقوف على يمين السلم الكهربائي في المترو عادة محلية", "أغلب المتاحف الوطنية دخولها مجاني"],
    photoSpots: ["Tower Bridge عند الغروب", "إطلالة London Eye على النهر"],
  },
];

export function getPackageBySlug(slug: string) {
  const destination = destinations.find((item) => item.slug === slug);
  const pkg = packagesData.find((item) => item.slug === slug);
  if (!destination || !pkg) return null;
  return { destination, pkg };
}
