import { destinations } from "./content";

/**
 * Travel guide content, keyed by destination slug.
 * Name, flag, image, country, and price all live in `destinations` (content.ts) —
 * this file only holds guide-specific content, so nothing is duplicated.
 * `tips` is a list of GuideSection blocks so more tip categories (money-saving,
 * mistakes to avoid, before you go...) can be added later without changing the type.
 */

export type GuideSection = {
  id: string;
  title: string;
  items: string[];
};

export type GuideCost = {
  label: string;
  priceILS: number;
};

export type Guide = {
  slug: string;
  overview: string;
  bestTimeToVisit: string;
  suggestedTripLength: string;
  areasToStay: string[];
  attractions: string[];
  food: string[];
  transportation: string;
  shopping: string;
  nightlife: string;
  photoSpots: string[];
  costs: GuideCost[];
  tips: GuideSection[];
};

export const guidesData: Guide[] = [
  {
    slug: "barcelona",
    overview: "دليل سريع لأجمل ما في برشلونة: عمارة غاودي، الأحياء التاريخية، والشواطئ المتوسطية.",
    bestTimeToVisit: "من شهر 4–6 و9–10، لتفادي حر الصيف وازدحامه.",
    suggestedTripLength: "4–5 أيام",
    areasToStay: ["Eixample", "Gràcia", "El Born"],
    attractions: [
      "Sagrada Família (ساغرادا فاميليا)",
      "Park Güell (حديقة غويل)",
      "Gothic Quarter (الحي القوطي)",
      "Casa Batlló (بيت باتّيو)",
      "Barceloneta Beach (شاطئ برشلونيتا)",
    ],
    food: ["La Boqueria Market (سوق لا بوكيريا)", "بارات التاباس في El Born", "مقاهي Gràcia المحلية"],
    transportation: "مترو ببطاقة T-10 يغطي أغلب الوجهات، والمشي مريح داخل الأحياء القديمة.",
    shopping: "Passeig de Gràcia للماركات العالمية، وأسواق El Born للمنتجات المحلية.",
    nightlife: "حياة ليلية نشطة في El Born وBarceloneta حتى ساعات متأخرة.",
    photoSpots: ["واجهة Sagrada Família", "شرفة Park Güell"],
    costs: [
      { label: "قهوة", priceILS: 12 },
      { label: "وجبة في مطعم متوسط", priceILS: 60 },
      { label: "تذكرة مترو واحدة", priceILS: 9 },
    ],
    tips: [
      {
        id: "quick-tips",
        title: "نصائح سريعة",
        items: [
          "احجز تذاكر Sagrada Família أونلاين مسبقًا",
          "احذر النشالين في المناطق المزدحمة",
          "الغداء المحلي عادة بعد الساعة 2 ظهرًا",
          "معظم المتاحف مغلقة يوم الاثنين",
          "بطاقة T-10 أوفر من تذاكر المترو المفردة",
        ],
      },
    ],
  },
  {
    slug: "batumi",
    overview: "دليل سريع لباتومي: مدينة ساحلية جورجية تجمع بين الواجهة البحرية والطبيعة الخضراء.",
    bestTimeToVisit: "من شهر 6–9 لأجواء صيفية مثالية على البحر الأسود.",
    suggestedTripLength: "3–4 أيام",
    areasToStay: ["منطقة الكورنيش", "المدينة القديمة"],
    attractions: [
      "Batumi Boulevard (كورنيش باتومي)",
      "Alphabet Tower (برج الأبجدية)",
      "Piazza Square (ميدان بيازا)",
      "Europe Square (ميدان أوروبا)",
      "Batumi Botanical Garden (الحديقة النباتية)",
    ],
    food: ["مطاعم المأكولات البحرية على الكورنيش", "خاچابوري أجاري التقليدي", "مقاهي ميدان بيازا"],
    transportation: "المدينة صغيرة ويمكن التنقل مشيًا، وسيارات الأجرة رخيصة.",
    shopping: "أسواق صغيرة في المدينة القديمة، ومحلات هدايا حول الكورنيش.",
    nightlife: "نوادٍ ومقاهي مسائية على طول الكورنيش، خصوصًا في الصيف.",
    photoSpots: ["برج الأبجدية عند الغروب", "نافورة ميدان أوروبا ليلًا"],
    costs: [
      { label: "قهوة", priceILS: 6 },
      { label: "وجبة في مطعم متوسط", priceILS: 35 },
      { label: "تاكسي داخل المدينة", priceILS: 10 },
    ],
    tips: [
      {
        id: "quick-tips",
        title: "نصائح سريعة",
        items: [
          "العملة المحلية اللاري أفضل من الدولار في المحلات الصغيرة",
          "الطقس الصيفي رطب نسبيًا",
          "بعض المحلات تغلق مبكرًا خارج الموسم",
          "احجز فندقًا قريبًا من الكورنيش للإطلالة",
          "المدينة آمنة نسبيًا للتجول مساءً",
        ],
      },
    ],
  },
  {
    slug: "dubai",
    overview: "دليل سريع لدبي: فخامة حديثة، ناطحات سحاب، وتجربة صحراوية أصيلة.",
    bestTimeToVisit: "من شهر 11–3 لتفادي حرارة الصيف الشديدة.",
    suggestedTripLength: "4–5 أيام",
    areasToStay: ["Downtown Dubai", "Dubai Marina", "ديرة"],
    attractions: [
      "Burj Khalifa (برج خليفة)",
      "Dubai Mall (دبي مول)",
      "Palm Jumeirah (نخلة جميرا)",
      "Dubai Marina",
      "Gold Souk (سوق الذهب)",
    ],
    food: ["مطاعم دبي مارينا", "مطعم Ravi الباكستاني الشهير", "مطاعم السوق القديم في ديرة"],
    transportation: "مترو دبي نظيف وسريع، وبطاقة Nol تغطي المترو والترام والحافلات.",
    shopping: "Dubai Mall وMall of the Emirates للماركات العالمية، وGold Souk للذهب والتوابل.",
    nightlife: "مطاعم أسطح ونوادٍ راقية في Downtown وDubai Marina.",
    photoSpots: ["نافورة دبي أمام برج خليفة", "إطلالة نخلة جميرا من The View"],
    costs: [
      { label: "قهوة", priceILS: 16 },
      { label: "وجبة في مطعم متوسط", priceILS: 90 },
      { label: "تذكرة مترو واحدة", priceILS: 6 },
    ],
    tips: [
      {
        id: "quick-tips",
        title: "نصائح سريعة",
        items: [
          "الصيف حار جدًا؛ فضّل الأنشطة الخارجية مساءً",
          "الملابس المحتشمة مطلوبة في الأماكن الدينية",
          "الجمعة والسبت عطلة نهاية الأسبوع محليًا",
          "احجز تذكرة برج خليفة مسبقًا خصوصًا وقت الغروب",
          "رحلات السفاري تُحجز قبل يوم على الأقل",
        ],
      },
    ],
  },
  {
    slug: "miami",
    overview: "دليل سريع لميامي: شواطئ ذهبية، فن حضري، وأجواء لاتينية نابضة.",
    bestTimeToVisit: "من شهر 11–4 لتفادي الرطوبة الشديدة وموسم الأعاصير.",
    suggestedTripLength: "4–5 أيام",
    areasToStay: ["South Beach", "Wynwood", "Little Havana"],
    attractions: [
      "South Beach",
      "Ocean Drive",
      "Wynwood Walls (حائط وينوود للفنون)",
      "Little Havana (هافانا الصغيرة)",
      "Vizcaya Museum and Gardens",
    ],
    food: ["مطاعم كوبية في Little Havana", "مقاهي Ocean Drive", "أسواق طعام في Wynwood"],
    transportation: "يُفضَّل استئجار سيارة أو استخدام تطبيقات النقل؛ المدينة ممتدة.",
    shopping: "Bayside Marketplace وLincoln Road للتسوق والنزهة.",
    nightlife: "حياة ليلية شهيرة في South Beach ونوادٍ Ocean Drive.",
    photoSpots: ["مباني آرت ديكو الملونة على Ocean Drive", "جداريات Wynwood"],
    costs: [
      { label: "قهوة", priceILS: 18 },
      { label: "وجبة في مطعم متوسط", priceILS: 100 },
      { label: "رحلة تاكسي قصيرة", priceILS: 45 },
    ],
    tips: [
      {
        id: "quick-tips",
        title: "نصائح سريعة",
        items: [
          "احترس من أشعة الشمس القوية وارتدِ واقيًا",
          "موسم الأعاصير من شهر 6–10",
          "التنقيح في المطاعم يعادل 15–20٪",
          "استأجر السيارة من المطار مباشرة لتوفير الوقت",
          "South Beach مزدحمة في عطلات نهاية الأسبوع",
        ],
      },
    ],
  },
  {
    slug: "istanbul",
    overview: "دليل سريع لإسطنبول: مدينة تجمع الشرق والغرب بتاريخ عثماني وبيزنطي عريق.",
    bestTimeToVisit: "من شهر 4–5 و9–10 لطقس معتدل.",
    suggestedTripLength: "4–5 أيام",
    areasToStay: ["Sultanahmet", "Beyoğlu / Taksim", "Kadıköy"],
    attractions: [
      "Hagia Sophia (آيا صوفيا)",
      "Blue Mosque (المسجد الأزرق)",
      "Topkapi Palace (قصر توبكابي)",
      "Grand Bazaar (البازار الكبير)",
      "Galata Tower (برج غلطة)",
    ],
    food: ["الفطور التركي التقليدي", "أسماك مشوية في Kadıköy", "حلويات في Beyoğlu"],
    transportation: "بطاقة Istanbulkart تعمل على الترام والمترو والعبّارات.",
    shopping: "Grand Bazaar وSpice Bazaar للتوابل والهدايا، وIstiklal Street للماركات.",
    nightlife: "بارات وأسطح في Beyoğlu وKadıköy حتى وقت متأخر.",
    photoSpots: ["إطلالة Galata Tower على المدينة", "قبة Hagia Sophia الداخلية"],
    costs: [
      { label: "قهوة", priceILS: 8 },
      { label: "وجبة في مطعم متوسط", priceILS: 40 },
      { label: "تذكرة ترام واحدة", priceILS: 4 },
    ],
    tips: [
      {
        id: "quick-tips",
        title: "نصائح سريعة",
        items: [
          "احمل نقودًا صغيرة للأسواق الشعبية",
          "المساجد تُزار خارج أوقات الصلاة",
          "المساومة مقبولة في البازار الكبير",
          "تذاكر توبكابي تُشترى مسبقًا لتفادي الطوابير",
          "جولة البوسفور وقت الغروب أجمل",
        ],
      },
    ],
  },
  {
    slug: "sharm-el-sheikh",
    overview: "دليل سريع لشرم الشيخ: وجهة الغوص والاسترخاء على البحر الأحمر.",
    bestTimeToVisit: "من شهر 3–5 و9–11 لطقس معتدل ورؤية غوص ممتازة.",
    suggestedTripLength: "3–4 أيام",
    areasToStay: ["Naama Bay", "المدينة القديمة"],
    attractions: [
      "Naama Bay (خليج نعمة)",
      "Ras Mohammed National Park (محمية رأس محمد)",
      "Old Market (السوق القديم)",
      "Soho Square",
      "نقاط الغوص والسنوركل الشهيرة",
    ],
    food: ["مأكولات بحرية في Old Market", "مطاعم المنتجعات على الخليج", "مقاهي Soho Square"],
    transportation: "التنقل غالبًا عبر تاكسي أو حافلات المنتجعات.",
    shopping: "Old Market وSoho Square للهدايا التذكارية والمنتجات المحلية.",
    nightlife: "عروض وحفلات في Soho Square ومنتجعات Naama Bay.",
    photoSpots: ["شروق الشمس على خليج نعمة", "الشعاب المرجانية تحت الماء"],
    costs: [
      { label: "قهوة", priceILS: 10 },
      { label: "وجبة في مطعم متوسط", priceILS: 45 },
      { label: "رحلة غوص/سنوركل", priceILS: 130 },
    ],
    tips: [
      {
        id: "quick-tips",
        title: "نصائح سريعة",
        items: [
          "استخدم واقي شمس صديق للشعاب المرجانية",
          "أفضل رؤية غوص عادة في الصباح الباكر",
          "احمل ملابس خفيفة فالطقس حار طوال العام",
          "تأكد من شهادة الغوص إن رغبت بالغوص العميق",
          "احجز رحلة الغوص مسبقًا في موسم الذروة",
        ],
      },
    ],
  },
  {
    slug: "prague",
    overview: "دليل سريع لبراغ: مدينة القلعة والجسور بعمارة قوطية آسرة.",
    bestTimeToVisit: "من شهر 5–9 لطقس معتدل ونهار أطول.",
    suggestedTripLength: "3–4 أيام",
    areasToStay: ["Old Town", "Malá Strana"],
    attractions: [
      "Prague Castle (قلعة براغ)",
      "Charles Bridge (جسر تشارلز)",
      "Old Town Square (الساحة القديمة)",
      "Astronomical Clock (الساعة الفلكية)",
      "Petřín Hill (تلة بترشين)",
    ],
    food: ["حانات تشيكية تقليدية", "حلوى Trdelník الشهيرة", "مقاهي Old Town"],
    transportation: "شبكة الترام والمترو واسعة وسهلة الاستخدام ببطاقة يومية.",
    shopping: "أسواق Old Town للكريستال والهدايا التقليدية.",
    nightlife: "حانات وبيرة تشيكية أصيلة في Old Town وMalá Strana.",
    photoSpots: ["جسر تشارلز عند الشروق", "إطلالة القلعة من الجهة المقابلة للنهر"],
    costs: [
      { label: "قهوة", priceILS: 9 },
      { label: "وجبة في مطعم متوسط", priceILS: 45 },
      { label: "تذكرة ترام واحدة", priceILS: 5 },
    ],
    tips: [
      {
        id: "quick-tips",
        title: "نصائح سريعة",
        items: [
          "الشوارع الحجرية غير مريحة بالكعب العالي",
          "معظم المطاعم تقبل الدفع النقدي والبطاقة",
          "الطقس متقلب؛ احمل معطفًا خفيفًا حتى بالصيف",
          "اصعد برج الساعة الفلكية مبكرًا لتفادي الازدحام",
          "الإقامة في Old Town تقلل وقت التنقل",
        ],
      },
    ],
  },
  {
    slug: "budapest",
    overview: "دليل سريع لبودابست: مدينة الدانوب بحمامات حرارية وعمارة مهيبة.",
    bestTimeToVisit: "من شهر 4–6 و9–10 لطقس معتدل.",
    suggestedTripLength: "3–4 أيام",
    areasToStay: ["جانب بودا", "حي اليهود في بيست"],
    attractions: [
      "Buda Castle (قلعة بودا)",
      "Fisherman's Bastion (حصن الصيادين)",
      "Széchenyi Thermal Bath (حمامات سيتشيني)",
      "Hungarian Parliament (مبنى البرلمان)",
      "جولة نهرية على الدانوب",
    ],
    food: ["حساء الغولاش التقليدي", "حانات الأنقاض (Ruin Bars)", "مقاهي حي اليهود"],
    transportation: "مترو وترام واسعان يغطيان معظم المدينة ببطاقة يومية واحدة.",
    shopping: "Great Market Hall للمنتجات المحلية والهدايا.",
    nightlife: "حانات الأنقاض الشهيرة في حي اليهود، نشطة حتى ساعات متأخرة.",
    photoSpots: ["حصن الصيادين عند الغروب", "مبنى البرلمان من جسر السلاسل"],
    costs: [
      { label: "قهوة", priceILS: 8 },
      { label: "وجبة في مطعم متوسط", priceILS: 42 },
      { label: "تذكرة مترو واحدة", priceILS: 5 },
    ],
    tips: [
      {
        id: "quick-tips",
        title: "نصائح سريعة",
        items: [
          "احمل ملابس سباحة لزيارة الحمامات الحرارية",
          "بعض حانات الأنقاض مزدحمة جدًا في عطلة نهاية الأسبوع",
          "العملة المحلية الفورنت وليس اليورو",
          "احجز دخول الحمامات أونلاين لتوفير الوقت",
          "شاهد البرلمان مضاءً ليلًا من الضفة المقابلة",
        ],
      },
    ],
  },
  {
    slug: "vienna",
    overview: "دليل سريع لفيينا: أناقة إمبراطورية، مقاهٍ عريقة، وموسيقى كلاسيكية.",
    bestTimeToVisit: "من شهر 4–6 و9–10 لطقس معتدل ومهرجانات موسيقية.",
    suggestedTripLength: "3–4 أيام",
    areasToStay: ["Innere Stadt (وسط المدينة)", "منطقة Naschmarkt"],
    attractions: [
      "Schönbrunn Palace (قصر شونبرون)",
      "St. Stephen's Cathedral (كاتدرائية القديس ستيفن)",
      "Belvedere Palace (قصر بلفيدير)",
      "Naschmarkt",
      "Vienna State Opera (دار أوبرا فيينا)",
    ],
    food: ["مقاهي فيينا التاريخية", "شنيتزل تقليدي", "أكشاك Naschmarkt"],
    transportation: "شبكة U-Bahn (المترو) نظيفة ومباشرة لأغلب الوجهات.",
    shopping: "Naschmarkt للمنتجات الطازجة، وMariahilfer Straße للماركات.",
    nightlife: "دار الأوبرا والحفلات الكلاسيكية، وبارات هادئة في وسط المدينة.",
    photoSpots: ["واجهة قصر شونبرون من الحديقة", "قبة كاتدرائية القديس ستيفن الملونة"],
    costs: [
      { label: "قهوة", priceILS: 14 },
      { label: "وجبة في مطعم متوسط", priceILS: 65 },
      { label: "تذكرة مترو واحدة", priceILS: 10 },
    ],
    tips: [
      {
        id: "quick-tips",
        title: "نصائح سريعة",
        items: [
          "المقاهي التاريخية تتوقع بقاءً طويلًا وليس فقط طلبًا سريعًا",
          "الأحد أغلب المحلات مغلقة",
          "الطقس معتدل صيفًا وبارد شتاءً",
          "احجز تذاكر شونبرون أونلاين لتفادي الطوابير",
          "تذاكر الأوبرا الواقفة رخيصة نسبيًا إن توفرت",
        ],
      },
    ],
  },
  {
    slug: "rome",
    overview: "دليل سريع لروما: آثار خالدة، فن الفاتيكان، ونافورات كلاسيكية.",
    bestTimeToVisit: "من شهر 4–5 و9–10 لتفادي حر الصيف وازدحامه.",
    suggestedTripLength: "3–4 أيام",
    areasToStay: ["Trastevere", "Centro Storico"],
    attractions: [
      "Colosseum (الكولوسيوم)",
      "Roman Forum (المنتدى الروماني)",
      "Vatican Museums (متاحف الفاتيكان)",
      "Trevi Fountain (نافورة تريفي)",
      "Pantheon (البانثيون)",
    ],
    food: ["مطاعم Trastevere الشعبية", "بيتزا رومانية تقليدية", "جيلاتو في Centro Storico"],
    transportation: "مزيج من المترو والمشي مناسب لمعظم المعالم القريبة من بعضها.",
    shopping: "Via del Corso للماركات، وأسواق Trastevere للمنتجات المحلية.",
    nightlife: "بارات ومطاعم مسائية نشطة في Trastevere.",
    photoSpots: ["الكولوسيوم من الخارج عند الغروب", "نافورة تريفي ليلًا"],
    costs: [
      { label: "قهوة", priceILS: 10 },
      { label: "وجبة في مطعم متوسط", priceILS: 55 },
      { label: "تذكرة مترو واحدة", priceILS: 6 },
    ],
    tips: [
      {
        id: "quick-tips",
        title: "نصائح سريعة",
        items: [
          "ارتدِ حذاءً مريحًا فالمشي كثير على حجر مرصوف",
          "الملابس المحتشمة مطلوبة داخل الفاتيكان",
          "رمي عملة في نافورة تريفي تقليد شهير",
          "احجز تذاكر الكولوسيوم والفاتيكان أونلاين مسبقًا",
          "تجنب مطاعم قريبة جدًا من المعالم السياحية"
        ],
      },
    ],
  },
  {
    slug: "paris",
    overview: "دليل سريع لباريس: أناقة كلاسيكية، متاحف عالمية، وضفاف نهر السين.",
    bestTimeToVisit: "من شهر 4–6 و9–10 لطقس معتدل.",
    suggestedTripLength: "4–5 أيام",
    areasToStay: ["Le Marais", "Montmartre"],
    attractions: [
      "Eiffel Tower (برج إيفل)",
      "Louvre Museum (متحف اللوفر)",
      "Notre-Dame (كاتدرائية نوتردام)",
      "Montmartre",
      "Champs-Élysées",
    ],
    food: ["مقاهي ومخابز Le Marais", "كرواسون ومعجنات فرنسية أصيلة", "مطاعم مونمارتر الصغيرة"],
    transportation: "شبكة مترو باريس واسعة وتغطي كل الوجهات الرئيسية.",
    shopping: "Champs-Élysées للماركات العالمية، وLe Marais للمحلات المستقلة.",
    nightlife: "بارات نبيذ هادئة في Le Marais وحياة ليلية فنية في مونمارتر.",
    photoSpots: ["برج إيفل من Trocadéro", "شوارع مونمارتر المرصوفة"],
    costs: [
      { label: "قهوة", priceILS: 15 },
      { label: "وجبة في مطعم متوسط", priceILS: 75 },
      { label: "تذكرة مترو واحدة", priceILS: 8 },
    ],
    tips: [
      {
        id: "quick-tips",
        title: "نصائح سريعة",
        items: [
          "أغلب المتاحف مغلقة يوم الاثنين أو الثلاثاء",
          "تعلّم بضع عبارات فرنسية يُقدَّر من السكان المحليين",
          "احذر جيوب النشل في المترو المزدحم",
          "احجز تذاكر اللوفر أونلاين لتفادي طوابير طويلة",
          "صعود برج إيفل يُحجز مسبقًا خصوصًا في الصيف",
        ],
      },
    ],
  },
  {
    slug: "london",
    overview: "دليل سريع للندن: تاريخ ملكي عريق، متاحف عالمية، وأسواق نابضة بالحياة.",
    bestTimeToVisit: "من شهر 5–9 لطقس أدفأ ونهار أطول.",
    suggestedTripLength: "4–5 أيام",
    areasToStay: ["Covent Garden", "Camden", "South Bank"],
    attractions: [
      "Big Ben & Westminster",
      "Tower of London (برج لندن)",
      "British Museum (المتحف البريطاني)",
      "London Eye (عين لندن)",
      "Buckingham Palace (قصر باكنغهام)",
    ],
    food: ["Borough Market (سوق بورو)", "حانات إنجليزية تقليدية", "مقاهي Covent Garden"],
    transportation: "بطاقة Oyster تغطي المترو (Tube) والحافلات بسعر مخفض.",
    shopping: "Camden Market للأزياء البديلة، وOxford Street للماركات العالمية.",
    nightlife: "مسارح West End وبارات South Bank حتى وقت متأخر.",
    photoSpots: ["Tower Bridge عند الغروب", "إطلالة London Eye على النهر"],
    costs: [
      { label: "قهوة", priceILS: 16 },
      { label: "وجبة في مطعم متوسط", priceILS: 85 },
      { label: "تذكرة مترو واحدة", priceILS: 12 },
    ],
    tips: [
      {
        id: "quick-tips",
        title: "نصائح سريعة",
        items: [
          "الطقس متقلب؛ احمل مظلة دائمًا",
          "الوقوف على يمين السلم الكهربائي في المترو عادة محلية",
          "أغلب المتاحف الوطنية دخولها مجاني",
          "احجز تذاكر برج لندن أونلاين لتوفير الوقت والسعر",
          "تحقق من عروض المسارح في آخر لحظة لأسعار أفضل",
        ],
      },
    ],
  },
];

export function getGuideBySlug(slug: string) {
  const destination = destinations.find((item) => item.slug === slug);
  const guide = guidesData.find((item) => item.slug === slug);
  if (!destination || !guide) return null;
  return { destination, guide };
}
