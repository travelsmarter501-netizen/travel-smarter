/**
 * Single source of copy for the homepage and shared homepage UI (header, footer, cart,
 * mobile menu, loading splash). Scoped deliberately: the Barcelona Guide, Smart Planner, and
 * Ready Plan product pages are NOT covered here and remain Arabic-only for now -- see the
 * homepage redesign task's final report for which pages still need a translation pass.
 */

export type Language = "ar" | "en";

type Product = {
  id: string;
  title: string;
  description: string;
  priceILS: number;
  route: string;
  ctaLabel: string;
  /** Omitted (not shown) for a product whose price isn't a single fixed number yet -- e.g.
   * Custom Plan, whose price depends on a duration chosen on its own page. Adding a
   * multi-duration product straight to the cart would silently pick one of its prices with
   * no way to say which; every other product here has exactly one price, so this is safe
   * for them. */
  addToCartLabel?: string;
  /** Short included-benefit row shown under the description, e.g. "+ دليل برشلونة" -- only set for products whose purchase also includes Barcelona Guide access. */
  includesGuideLabel?: string;
  /** Small positioning badge (e.g. "فوري" / "مراجعة شخصية") -- Product Separation Cleanup:
   * exists purely to make Smart Planner and Custom Plan visually distinct at a glance. Never
   * set for a product that doesn't need one. */
  badge?: string;
  /** When true, priceILS is shown as a starting/from price (e.g. "ابتداءً من ₪69") instead of
   * a flat price -- for a duration-aware product like Custom Plan, whose real price is only
   * chosen on its own page. Purely a display prefix; priceILS/currency conversion is untouched. */
  startingFrom?: boolean;
  /** Optional one-line "which product do I want?" clarification shown under the CTA -- kept
   * to the two products that can otherwise feel similar (Smart Planner vs Custom Plan). Never
   * set on every card at once, per the task's own "do not overdo comparison text" guidance. */
  comparisonHint?: string;
};

type Destination = {
  badge: string;
  cta: string;
};

type DestinationEntry = { slug: string; name: string };

type TrustItem = { title: string; description: string };
type FaqItem = { question: string; answer: string };

export type HomepageCopy = {
  htmlLang: string;
  dir: "rtl" | "ltr";
  seo: { title: string; description: string };
  nav: {
    home: string;
    products: string;
    destinations: string;
    about: string;
    faq: string;
    contact: string;
    ctaPlanTrip: string;
  };
  languageSwitcher: { ar: string; en: string; ariaLabel: string };
  cartButton: { ariaLabel: string };
  mobileMenu: { open: string; close: string };
  loadingSplash: { ariaLabel: string };
  hero: {
    eyebrow: string;
    headline: string;
    supporting: string;
    primaryCta: string;
    secondaryCta: string;
    imageAlt: string;
  };
  products: {
    eyebrow: string;
    title: string;
    startingFromLabel: string;
    items: Product[];
  };
  destinations: {
    title: string;
    barcelona: Destination;
    comingSoonBadge: string;
    /** Curated homepage destination teaser list, in display order. Independent from lib/content.ts's destinations array order -- each slug is looked up there for image/country/status. */
    items: DestinationEntry[];
  };
  trust: {
    title: string;
    items: TrustItem[];
  };
  faq: {
    title: string;
    items: FaqItem[];
  };
  cart: {
    title: string;
    empty: string;
    remove: string;
    subtotal: string;
    continueCta: string;
    clear: string;
    alreadyInCart: string;
    close: string;
  };
  /** Small note used on the 5-day Ready Plan and Smart Planner pages -- not shown on the 1-day plan. */
  productPage: {
    guideIncluded: string;
  };
  footer: {
    brandLine: string;
    productsHeading: string;
    destinationsHeading: string;
    contactHeading: string;
    faqLabel: string;
    rights: string;
    /** One-line description of what Travel Smarter sells (shown in the footer on every page). */
    descriptor: string;
    /** Arabic mode only: the same description in English, shown beneath the Arabic line. */
    descriptorSecondary?: string;
    phoneLabel: string;
    privacyLabel: string;
    termsLabel: string;
  };
};

export const homepageTranslations: Record<Language, HomepageCopy> = {
  ar: {
    htmlLang: "ar",
    dir: "rtl",
    seo: {
      title: "Travel Smarter | تخطيط سفر ذكي — خطط برشلونة ودليل برشلونة",
      description: "خطط سفر جاهزة ومخصصة لبرشلونة: دليل سياحي، رزمة يوم واحد، رزمة 5 أيام، وخطة مخصصة بالذكاء. سافر أكثر، خطّط أقل.",
    },
    nav: {
      home: "الرئيسية",
      products: "المنتجات",
      destinations: "الوجهات",
      about: "من نحن",
      faq: "الأسئلة الشائعة",
      contact: "تواصل معنا",
      ctaPlanTrip: "اختار خطتك",
    },
    languageSwitcher: { ar: "العربية", en: "EN", ariaLabel: "اختيار اللغة" },
    cartButton: { ariaLabel: "السلة" },
    mobileMenu: { open: "فتح القائمة", close: "إغلاق القائمة" },
    loadingSplash: { ariaLabel: "جاري التحميل" },
    hero: {
      eyebrow: "تخطيط سفر ذكي وسهل",
      headline: "سافر أكثر. خطّط أقل.",
      supporting: "خطط سفر جاهزة ومخصصة توفر عليك ساعات البحث وتخليك تستمتع برحلتك من أول يوم.",
      primaryCta: "اختار خطتك",
      secondaryCta: "تصفح المنتجات",
      imageAlt: "سفر دولي — Travel Smarter",
    },
    products: {
      eyebrow: "المنتجات",
      title: "اختار الخطة اللي تناسب رحلتك",
      startingFromLabel: "ابتداءً من",
      items: [
        {
          // Unified Personalized Plan merge: replaces the old separate "خطة رحلة مخصصة إلك"
          // (Custom Plan, 99₪, human-reviewed) and "المخطط الذكي" (Smart Planner, 59₪, instant)
          // cards with ONE automated product card. See app/planner/page.tsx.
          id: "personalized-trip-plan",
          title: "خطة مخصصة إلك ✨",
          description: "اختار وجهتك واهتماماتك، وإحنا بنبني لك خطة ذكية حسب رحلتك.",
          priceILS: 59,
          route: "/planner",
          ctaLabel: "اشترِ الآن",
          addToCartLabel: "أضف للسلة",
          badge: "فوري",
          comparisonHint: "برشلونة متاحة الآن — وجهات جديدة قريبًا.",
        },
        {
          id: "barcelona-1day",
          title: "برشلونة بيوم واحد",
          description: "أهم برشلونة بمسار مرتب ليوم واحد.",
          priceILS: 19,
          route: "/ready-plans/barcelona/1-day",
          ctaLabel: "اشترِ الآن",
          addToCartLabel: "أضف للسلة",
        },
        {
          id: "barcelona-guide",
          title: "دليل برشلونة",
          description: "الأماكن، المطاعم، الفنادق، التسوق والسهر بمكان واحد.",
          priceILS: 29,
          route: "/guides/barcelona",
          ctaLabel: "اشترِ الآن",
          addToCartLabel: "أضف للسلة",
        },
        {
          id: "barcelona-3day",
          title: "برشلونة 3 أيام",
          description: "أهم معالم برشلونة بمسارات مرتبة على 3 أيام.",
          priceILS: 34,
          route: "/ready-plans/barcelona/3-days",
          ctaLabel: "اشترِ الآن",
          addToCartLabel: "أضف للسلة",
          includesGuideLabel: "+ دليل برشلونة",
        },
        {
          id: "barcelona-5day",
          title: "برشلونة 5 أيام",
          description: "خطة جاهزة يوم بيوم بمسارات وتنقلات واضحة.",
          priceILS: 39,
          route: "/ready-plans/barcelona",
          ctaLabel: "اشترِ الآن",
          addToCartLabel: "أضف للسلة",
          includesGuideLabel: "+ دليل برشلونة",
        },
      ],
    },
    destinations: {
      title: "الوجهات المتوفرة",
      barcelona: { badge: "متاحة الآن", cta: "استكشف برشلونة" },
      comingSoonBadge: "قريبًا",
      items: [
        { slug: "barcelona", name: "برشلونة" },
        { slug: "rome", name: "روما" },
        { slug: "prague", name: "براغ" },
        { slug: "budapest", name: "بودابست" },
        { slug: "dubai", name: "دبي" },
        { slug: "batumi", name: "باتومي" },
      ],
    },
    trust: {
      title: "ليش Travel Smarter؟",
      items: [
        { title: "خبرة سفر حقيقية", description: "خبرتنا مبنية على زيارة أكثر من 15 دولة." },
        { title: "وفّر وقتك", description: "بدل ساعات البحث، كل شيء مرتب بمكان واحد." },
        { title: "مسارات أذكى", description: "أماكن مختارة ومرتبة لتقلل التنقل وتستغل يومك." },
      ],
    },
    faq: {
      title: "الأسئلة الشائعة",
      items: [
        {
          question: "شو الفرق بين الدليل والرزمة والخطة المخصصة؟",
          answer: "الدليل معلومات شاملة عن الوجهة بدون برنامج يومي. الرزمة الجاهزة برنامج يوم بيوم مُعد مسبقًا. الخطة المخصصة تُبنى حسب اهتماماتك أنت تحديدًا.",
        },
        {
          question: "هل الخطط مناسبة لأول زيارة لبرشلونة؟",
          answer: "نعم، كل الخطط مصممة لتغطي أبرز المعالم والتجارب المناسبة لأول زيارة.",
        },
        {
          question: "كيف بستلم الخطة بعد الشراء؟",
          answer: "بعد تأكيد عملية الشراء، بيتفعّل المنتج على حسابك وبتقدر تفتحه من صفحة حسابي. إذا احتجت مساعدة، تواصل معنا مباشرة.",
        },
        {
          question: "هل بقدر أستخدم الخطة من الموبايل أثناء السفر؟",
          answer: "نعم، الموقع مصمم ليشتغل بشكل مريح على الموبايل عشان تقدر تفتح خطتك خلال الرحلة.",
        },
      ],
    },
    cart: {
      title: "السلة",
      empty: "السلة فارغة",
      remove: "إزالة",
      subtotal: "الإجمالي",
      continueCta: "إكمال الطلب",
      clear: "تفريغ السلة",
      alreadyInCart: "هذا المنتج موجود بالسلة",
      close: "إغلاق السلة",
    },
    productPage: {
      guideIncluded: "يشمل دليل برشلونة",
    },
    footer: {
      brandLine: "سافر أكثر. خطّط أقل.",
      productsHeading: "المنتجات",
      destinationsHeading: "الوجهات",
      contactHeading: "تواصل معنا",
      faqLabel: "الأسئلة الشائعة",
      rights: "© 2026 Travel Smarter. جميع الحقوق محفوظة.",
      descriptor: "أدلة سفر رقمية، خطط رحلات جاهزة، وتخطيط رحلات مخصص.",
      descriptorSecondary: "Digital travel guides, ready-made itineraries, and personalized trip planning.",
      phoneLabel: "الهاتف / واتساب",
      privacyLabel: "Privacy Policy · سياسة الخصوصية",
      termsLabel: "Terms of Service · شروط الخدمة",
    },
  },
  en: {
    htmlLang: "en",
    dir: "ltr",
    seo: {
      title: "Travel Smarter | Smart Travel Planning — Barcelona Plans & Guide",
      description: "Ready-made and personalized Barcelona travel plans: travel guide, 1-day plan, 5-day itinerary, and smart AI planning. Travel more, plan less.",
    },
    nav: {
      home: "Home",
      products: "Products",
      destinations: "Destinations",
      about: "About",
      faq: "FAQ",
      contact: "Contact",
      ctaPlanTrip: "Choose Your Plan",
    },
    languageSwitcher: { ar: "عربي", en: "EN", ariaLabel: "Select language" },
    cartButton: { ariaLabel: "Cart" },
    mobileMenu: { open: "Open menu", close: "Close menu" },
    loadingSplash: { ariaLabel: "Loading" },
    hero: {
      eyebrow: "Smart, easy travel planning",
      headline: "Travel More. Plan Less.",
      supporting: "Ready-made and personalized travel plans that save you hours of research.",
      primaryCta: "Choose Your Plan",
      secondaryCta: "Browse Products",
      imageAlt: "International travel — Travel Smarter",
    },
    products: {
      eyebrow: "Products",
      title: "Choose the Plan That Fits Your Trip",
      startingFromLabel: "Starting from",
      items: [
        {
          id: "personalized-trip-plan",
          title: "Your Personalized Trip Plan ✨",
          description: "Choose your destination and interests, and we'll build you a smart plan for your trip.",
          priceILS: 59,
          route: "/planner",
          ctaLabel: "Buy Now",
          addToCartLabel: "Add to Cart",
          badge: "Instant",
          comparisonHint: "Barcelona available now — new destinations coming soon.",
        },
        {
          id: "barcelona-1day",
          title: "Barcelona in One Day",
          description: "See the essential Barcelona highlights in one organized day.",
          priceILS: 19,
          route: "/ready-plans/barcelona/1-day",
          ctaLabel: "Buy Now",
          addToCartLabel: "Add to Cart",
        },
        {
          id: "barcelona-guide",
          title: "Barcelona Travel Guide",
          description: "Places, restaurants, hotels, shopping and nightlife in one guide.",
          priceILS: 29,
          route: "/guides/barcelona",
          ctaLabel: "Buy Now",
          addToCartLabel: "Add to Cart",
        },
        {
          id: "barcelona-3day",
          title: "Barcelona — 3 Days",
          description: "The Barcelona highlights, organized across 3 well-paced days.",
          priceILS: 34,
          route: "/ready-plans/barcelona/3-days",
          ctaLabel: "Buy Now",
          addToCartLabel: "Add to Cart",
          includesGuideLabel: "+ Barcelona Guide",
        },
        {
          id: "barcelona-5day",
          title: "Barcelona — 5 Days",
          description: "A complete 5-day itinerary with organized routes and transport.",
          priceILS: 39,
          route: "/ready-plans/barcelona",
          ctaLabel: "Buy Now",
          addToCartLabel: "Add to Cart",
          includesGuideLabel: "+ Barcelona Guide",
        },
      ],
    },
    destinations: {
      title: "Available Destinations",
      barcelona: { badge: "Available Now", cta: "Explore Barcelona" },
      comingSoonBadge: "Coming Soon",
      items: [
        { slug: "barcelona", name: "Barcelona" },
        { slug: "rome", name: "Rome" },
        { slug: "prague", name: "Prague" },
        { slug: "budapest", name: "Budapest" },
        { slug: "dubai", name: "Dubai" },
        { slug: "batumi", name: "Batumi" },
      ],
    },
    trust: {
      title: "Why Travel Smarter?",
      items: [
        { title: "Real Travel Experience", description: "Our experience comes from visiting more than 15 countries." },
        { title: "Save Your Time", description: "Skip hours of research and get everything organized." },
        { title: "Smarter Routes", description: "Places organized to reduce wasted travel time." },
      ],
    },
    faq: {
      title: "FAQ",
      items: [
        {
          question: "What is the difference between the Guide, Ready Plan and Personalized Plan?",
          answer: "The Guide is destination information without a daily schedule. The Ready Plan is a pre-built day-by-day itinerary. The Personalized Plan is built around your own interests.",
        },
        {
          question: "Are the plans suitable for a first trip to Barcelona?",
          answer: "Yes, every plan is designed to cover the highlights and experiences best suited for a first visit.",
        },
        {
          question: "How do I receive my plan after purchase?",
          answer: "Once your purchase is confirmed, the product is activated on your account and you can open it from your account page. If you need help, just contact us directly.",
        },
        {
          question: "Can I use the plan on my phone while traveling?",
          answer: "Yes. The website is designed to work comfortably on mobile so you can access your plan during your trip.",
        },
      ],
    },
    cart: {
      title: "Cart",
      empty: "Your cart is empty",
      remove: "Remove",
      subtotal: "Subtotal",
      continueCta: "Checkout",
      clear: "Clear cart",
      alreadyInCart: "This product is already in your cart",
      close: "Close cart",
    },
    productPage: {
      guideIncluded: "Barcelona Guide included",
    },
    footer: {
      brandLine: "Travel More. Plan Less.",
      productsHeading: "Products",
      destinationsHeading: "Destinations",
      contactHeading: "Contact",
      faqLabel: "FAQ",
      rights: "© 2026 Travel Smarter. All rights reserved.",
      descriptor: "Digital travel guides, ready-made itineraries, and personalized trip planning.",
      phoneLabel: "Phone / WhatsApp",
      privacyLabel: "Privacy Policy",
      termsLabel: "Terms of Service",
    },
  },
};
