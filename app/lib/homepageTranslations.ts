/**
 * Single source of copy for the homepage and shared homepage UI (header, footer, cart,
 * mobile menu, loading splash). Scoped deliberately: the Barcelona Guide, Smart Planner, and
 * Ready Plan product pages are NOT covered here and remain Arabic-only for now -- see the
 * homepage redesign task's final report for which pages still need a translation pass.
 */

import { PRODUCT_PRICES_ILS } from "./commerce/pricing";
import type { CheckoutErrorCode } from "./commerce/checkoutErrors";

export type Language = "ar" | "en" | "he";

/** Right-to-left languages (Arabic, Hebrew). */
export function isRtlLanguage(language: Language): boolean {
  return language !== "en";
}

type Product = {
  id: string;
  title: string;
  description: string;
  priceILS: number;
  /** Old price shown struck through next to priceILS (launch sale). Display only -- never used for any charge. */
  referencePriceILS?: number;
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
type FaqItem = { question: string; answer: string; /** Optional link shown under the answer. */ link?: { label: string; href: string } };

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
    howItWorks: string;
    price: string;
    /** Menu entry for signed-in customers: their plans. */
    myPlans: string;
    /** Account entry: shown when signed out / signed in. */
    signIn: string;
    account: string;
  };
  languageSwitcher: { ar: string; en: string; he: string; ariaLabel: string };
  cartButton: { ariaLabel: string };
  mobileMenu: { open: string; close: string };
  loadingSplash: { ariaLabel: string };
  products: {
    eyebrow: string;
    title: string;
    startingFromLabel: string;
    /** A signed-in customer already owns this product: the card says so and opens it (no price, no buy buttons). */
    ownedBadge: string;
    ownedCta: string;
    /** Personalized Plan card for an OWNER: "Purchased", no price, and this ONE button into their planner (nothing else is offered). */
    personalizedOpen: string;
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
  /** Single-product homepage sections that are not covered by the keys above. */
  home: {
    /** Floating purchase button (homepage only). The price comes from the shared price source, not from this copy. */
    bottomCta: { buy: string; owner: string };
    /** Short introduction at the top of the page (destination-neutral headline, one line, availability). */
    intro: { headline: string; description: string };
    video: {
      /** The caption of the video itself. */
      title: string;
      play: string;
      posterAlt: string;
      unavailable: string;
      /** English / Hebrew only: the temporary demo video shows the Arabic version of the product. */
      languageNote?: string;
    };
    offer: { title: string; text: string; includes: string; availability: string };
    /**
     * "صارت معك؟": everyday travel situations addressed to the visitor (written for the page; not customer messages or reviews) and the line that
     * leads into the product.
     */
    problems: { title: string; items: string[]; bridge: string };
    /** Product presentation: rendered fragments of the public sample with one short caption each. */
    product: {
      title: string;
      schedule: string;
      details: string;
      transport: string;
      recommended: string;
      /** Gallery controls (phones and tablets): the screen-reader names of the arrows. */
      previous: string;
      next: string;
    };
    example: {
      entry: string;
      badge: string;
      /** One short line under the badge before the example is opened (the full inputs are inside). */
      summary: string;
      hint: string;
      inputsTitle: string;
      inputs: { label: string; value: string }[];
      /** "{n}" = day number. */
      dayLabel: string;
      detailsHint: string;
      sheetPrice: string;
      sheetBooking: string;
      /** Label before the photo credits (Wikimedia Commons, CC BY-SA) under the example and the gallery. */
      photoCredits: string;
      start: string;
    };
    pricing: {
      /** "{price}" is replaced by the price in the visitor's currency. */
      title: string;
      points: string[];
      /** One readable line under the points: what the price does not cover. */
      notIncluded: string;
      ownerTitle: string;
      ownerBody: string;
      myPlans: string;
    };
    support: { text: string; refund: string };
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
    /** Shown when the browser will not let us save the cart (blocked storage): it works for this visit only. */
    sessionOnly: string;
  };
  /** Checkout page chrome (title, pay button, Allpay test-mode wording). */
  checkout: {
    title: string;
    payButton: string;
    /** Shown instead of payButton while ALLPAY_MODE=test. */
    payButtonTest: string;
    testBadge: string;
    /** Pay-button text while the payment page is being opened. */
    redirecting: string;
    /** Row label for a direct single-product checkout (/checkout?product=...). */
    selectedProduct: string;
    /** Customer-facing checkout errors, keyed by the code the checkout actions return. */
    errors: Record<CheckoutErrorCode, string>;
  };
  /** Personalized Plan flow: questionnaire wizard, review/payment step, post-payment states, "My Personalized Plans". */
  /** Launch-sale price labels and the "amount you pay" block. */
  pricing: {
    previousPrice: string;
    amountToPay: string;
    chargedInIls: string;
    includedInPlan: string;
    alreadyOwned: string;
  };
  /** "Included with your plan" card on the 3-day and 5-day Ready Plan pages -- not shown on the 1-day plan. */
  productPage: {
    includedGuide: { badge: string; title: string; cta: string };
  };
  footer: {
    brandLine: string;
    planHeading: string;
    accountHeading: string;
    contactHeading: string;
    faqLabel: string;
    linkStart: string;
    linkHow: string;
    linkPrice: string;
    linkAccount: string;
    photoCreditsLabel: string;
    rights: string;
    descriptor: string;
    descriptorSecondary?: string;
    privacyLabel: string;
    termsLabel: string;
  };
};

export const homepageTranslations: Record<Language, HomepageCopy> = {
  ar: {
    htmlLang: "ar",
    dir: "rtl",
    seo: {
      title: "Travel Smarter | خطة رحلة مخصصة، يوم بيوم",
      description: "جاوب على أسئلة قصيرة واحصل على خطة رحلة مخصصة حسب أيامك واهتماماتك ومكان سكنك، مع الأماكن والمطاعم وأوقات التنقل. متاح لبرشلونة وبراغ.",
    },
    nav: {
      home: "الرئيسية",
      products: "المنتجات",
      destinations: "الوجهات",
      about: "من نحن",
      faq: "الأسئلة",
      contact: "تواصل معنا",
      ctaPlanTrip: "ابدأ خطتك",
      howItWorks: "كيف بتشتغل",
      price: "السعر",
      myPlans: "خططي",
      signIn: "تسجيل الدخول",
      account: "حسابي",
    },
    languageSwitcher: { ar: "العربية", en: "EN", he: "עברית", ariaLabel: "اختيار اللغة" },
    cartButton: { ariaLabel: "السلة" },
    mobileMenu: { open: "فتح القائمة", close: "إغلاق القائمة" },
    loadingSplash: { ariaLabel: "جاري التحميل" },
    products: {
      eyebrow: "المنتجات",
      title: "اختار الخطة اللي تناسب رحلتك",
      startingFromLabel: "ابتداءً من",
      ownedBadge: "تم الشراء ✓",
      ownedCta: "افتح المنتج",
      personalizedOpen: "افتح خطتي المخصصة",
      items: [
        {
          // Unified Personalized Plan merge: replaces the old separate "خطة رحلة مخصصة إلك"
          // (Custom Plan, 99₪, human-reviewed) and "المخطط الذكي" (Smart Planner, 59₪, instant)
          // cards with ONE automated product card. See app/planner/page.tsx.
          id: "personalized-trip-plan",
          title: "خطة مخصصة إلك ✨",
          description: "جاوب على كم سؤال أولًا، وبعدها بنبني لك خطة ذكية حسب رحلتك.",
          priceILS: PRODUCT_PRICES_ILS["personalized-trip-plan"].launch,
          referencePriceILS: PRODUCT_PRICES_ILS["personalized-trip-plan"].reference,
          route: "/planner",
          ctaLabel: "ابدأ خطتك",
          includesGuideLabel: "+ دليل برشلونة (لخطط برشلونة)",
          badge: "فوري",
          comparisonHint: "برشلونة وبراغ متاحتين الآن — وجهات جديدة قريبًا.",
        },
        {
          id: "barcelona-1day",
          title: "برشلونة بيوم واحد",
          description: "أهم برشلونة بمسار مرتب ليوم واحد.",
          priceILS: PRODUCT_PRICES_ILS["barcelona-1day"].launch,
          referencePriceILS: PRODUCT_PRICES_ILS["barcelona-1day"].reference,
          route: "/ready-plans/barcelona/1-day",
          ctaLabel: "اشترِ الآن",
          addToCartLabel: "أضف للسلة",
        },
        {
          id: "barcelona-guide",
          title: "دليل برشلونة",
          description: "الأماكن، المطاعم، الفنادق، التسوق والسهر بمكان واحد.",
          priceILS: PRODUCT_PRICES_ILS["barcelona-guide"].launch,
          referencePriceILS: PRODUCT_PRICES_ILS["barcelona-guide"].reference,
          route: "/guides/barcelona",
          ctaLabel: "اشترِ الآن",
          addToCartLabel: "أضف للسلة",
        },
        {
          id: "barcelona-3day",
          title: "برشلونة 3 أيام",
          description: "أهم معالم برشلونة بمسارات مرتبة على 3 أيام.",
          priceILS: PRODUCT_PRICES_ILS["barcelona-3day"].launch,
          referencePriceILS: PRODUCT_PRICES_ILS["barcelona-3day"].reference,
          route: "/ready-plans/barcelona/3-days",
          ctaLabel: "اشترِ الآن",
          addToCartLabel: "أضف للسلة",
          includesGuideLabel: "+ دليل برشلونة",
        },
        {
          id: "barcelona-5day",
          title: "برشلونة 5 أيام",
          description: "خطة جاهزة يوم بيوم بمسارات وتنقلات واضحة.",
          priceILS: PRODUCT_PRICES_ILS["barcelona-5day"].launch,
          referencePriceILS: PRODUCT_PRICES_ILS["barcelona-5day"].reference,
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
          question: "شو بتشمل الخطة؟",
          answer: "برنامج يومي بالأوقات والأماكن والمطاعم والتنقّل بين المحطات، مع تفاصيل كل مكان وساعات عمله وروابط خرائط Google / Apple، حسب إجاباتك.",
        },
        {
          question: "كيف بفتح خطتي؟",
          answer: "الأسئلة والدفع بدون حساب. بعد الدفع سجّل دخولك أو افتح حساب بنفس إيميل الدفع، واضغط «ابنِ خطتي».",
        },
        {
          question: "بقدر أعمل أكثر من خطة؟",
          answer: "أكيد. اعمل خطط جديدة وعدّل أي خطة (بنعيد بناءها من إجاباتك) بدون دفع إضافي، حتى 30 خطة محفوظة.",
        },
        {
          question: "الطيران والفنادق والتذاكر مشمولة؟",
          answer: "لا، سعر الخطة ما بشمل الطيران ولا الفنادق ولا التذاكر. الخطة بتعرض معلومات الأسعار، وإذا المكان بده حجز مسبق بتشوف هاد.",
        },
      ],
    },
    home: {
      bottomCta: { buy: "اشترِ الآن", owner: "اعمل خطة جديدة" },
      intro: {
        headline: "خطّط أقل، واستمتع أكثر",
        description: "خطة سفر يومية حسب أيامك واهتماماتك ومكان سكنك.",
      },
      video: {
        title: "شوف كيف بتكون خطتك",
        play: "شغّل الفيديو",
        posterAlt: "مقتطف من خطة مثال: أيام الرحلة وأماكنها",
        unavailable: "الفيديو مش متاح هلأ.",
      },
      offer: {
        title: "خطتك، على طريقتك",
        text: "اختار وين مسافر، قديش يوم، شو بتحب ووين ساكن.",
        includes: "أماكن، مطاعم وتنقّل — مرتّبين يوم بيوم.",
        availability: "متاح لبرشلونة وبراغ",
      },
      problems: {
        title: "صارت معك؟",
        items: [
          "رجعنا من السفرة… واكتشفنا أماكن ما كنا نعرف عنها!",
          "كل صباح: وين نروح؟ ويضيع الوقت وإحنا ندوّر.",
          "حطّينا أماكن بعيدة بنفس اليوم… وضاع الوقت بالمواصلات.",
          "وصلنا عالمكان… وطلع مسكّر.",
        ],
        bridge: "خلّي وقتك للرحلة، والترتيب علينا.",
      },
      product: {
        title: "الخطة المخصصة إلك",
        schedule: "يومك بالترتيب",
        details: "تفاصيل كل مكان",
        transport: "التنقّل بين المحطات",
        recommended: "مقترح",
        previous: "المشهد السابق",
        next: "المشهد التالي",
      },
      example: {
        entry: "شوف مثال",
        badge: "مثال لبرشلونة",
        summary: "3 أيام · ثقافة وأكل",
        hint: "هاد مثال جاهز، مش خطتك. خطتك بتنبني من إجاباتك أنت.",
        inputsTitle: "مدخلات المثال",
        inputs: [
          { label: "الوجهة", value: "برشلونة" },
          { label: "المدة", value: "3 أيام" },
          { label: "الاهتمامات", value: "ثقافة وتاريخ، أكل ومطاعم" },
          { label: "السكن", value: "لسا ما حجزت" },
        ],
        dayLabel: "اليوم {n}",
        detailsHint: "تفاصيل المكان",
        sheetPrice: "السعر",
        sheetBooking: "الحجز",
        photoCredits: "حقوق الصور:",
        start: "ابدأ خطتك",
      },
      pricing: {
        title: "{price} مرة واحدة",
        points: [
          "اعمل أكثر من خطة، وعدّلها وأعد بناءها بدون دفع إضافي، حتى 30 خطة محفوظة.",
          "بتفتح كل المدن المدعومة: برشلونة وبراغ.",
          "دليل برشلونة الكامل مرفق فقط لما تشتري لخطة برشلونة.",
        ],
        notIncluded: "السعر للخطة فقط، ومش شامل الطيران أو الإقامة أو تذاكر الأماكن.",
        ownerTitle: "الخطة المخصصة إلك ✓",
        ownerBody: "اعمل خطة جديدة أو عدّل خططك بدون دفع إضافي، حتى 30 خطة محفوظة.",
        myPlans: "خططي",
      },
      support: { text: "ما لقيت جوابك؟ راسلنا:", refund: "سياسة الاسترجاع" },
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
      sessionOnly: "متصفحك ما بسمح بحفظ السلة، فهي بتضل متاحة طول ما الصفحة مفتوحة بس. أكمل الطلب هلأ.",
    },
    checkout: {
      title: "إتمام الشراء",
      payButton: "الدفع عبر Allpay",
      payButtonTest: "الدفع عبر Allpay (تجريبي)",
      testBadge: "وضع اختبار Allpay — بدون دفع حقيقي",
      redirecting: "جاري التحويل للدفع...",
      selectedProduct: "منتج محدد للدفع",
      errors: {
        invalid_product: "منتج غير صالح في السلة.",
        empty_cart: "السلة فارغة.",
        invalid_email: "أدخل بريدًا إلكترونيًا صحيحًا — بنرسل عليه تأكيد الدفع.",
        no_product_selected: "لم يتم تحديد أي منتج للشراء.",
        already_owned: "كل المنتجات المطلوبة إما مملوكة لديك مسبقًا أو متضمنة ضمن منتج تملكه.",
        login_required: "يجب تسجيل الدخول لإتمام عملية الشراء.",
        order_create_failed: "تعذّر إنشاء الطلب. حاول مرة أخرى.",
        order_load_failed: "تعذّر تحميل تفاصيل الطلب بعد إنشائه.",
        order_not_found: "الطلب غير موجود.",
        order_not_pending: "هذا الطلب لم يعد بانتظار الدفع.",
        order_items_failed: "تعذّر تحميل منتجات الطلب.",
        payment_page_failed: "تعذّر فتح صفحة الدفع. حاول مرة أخرى.",
        payment_setup_failed: "تعذّر تجهيز الدفع حاليًا. حاول مرة أخرى بعد قليل، وإذا استمرت المشكلة تواصل معنا.",
        planner_answers_required: "الخطة المخصصة بتبدأ من صفحة المخطط: جاوب على الأسئلة أولًا ثم أكمل الدفع.",
        invalid_planner_answers: "بيانات الخطة غير صالحة. راجع إجاباتك وحاول مرة أخرى.",
        planner_already_unlocked: "مخطط الرحلات المخصص مفتوح لك مسبقًا — أنشئ خطتك بدون أي دفع جديد.",
      },
    },
    pricing: {
      previousPrice: "السعر السابق",
      amountToPay: "المبلغ الذي سيتم خصمه اليوم",
      chargedInIls: "يتم الدفع بالشيكل (₪)",
      includedInPlan: "مشمول ضمن خطتك",
      alreadyOwned: "لديك هذا المنتج مسبقًا",
    },
    productPage: {
      includedGuide: {
        badge: "🎁 مشمول مع خطتك",
        title: "دليل برشلونة الكامل",
        cta: "افتح دليل برشلونة",
      },
    },
    footer: {
      brandLine: "سافر أكثر. خطّط أقل.",
      planHeading: "الخطة المخصصة",
      accountHeading: "حسابك",
      contactHeading: "تواصل معنا",
      faqLabel: "الأسئلة الشائعة",
      linkStart: "ابدأ خطتك",
      linkHow: "كيف بتشتغل",
      linkPrice: "السعر",
      linkAccount: "حسابي وخططي",
      photoCreditsLabel: "حقوق الصور",
      rights: "© 2026 Travel Smarter. جميع الحقوق محفوظة.",
      descriptor: "خطط رحلات مخصصة حسب أيامك واهتماماتك ومكان سكنك.",
      descriptorSecondary: "Personalized trip plans built around your days, interests and where you stay.",
      privacyLabel: "Privacy Policy · سياسة الخصوصية",
      termsLabel: "Terms of Service · شروط الخدمة",
    },
  },
  en: {
    htmlLang: "en",
    dir: "ltr",
    seo: {
      title: "Travel Smarter | Personalized trip plans, day by day",
      description: "Answer a few questions and get a trip plan built around your days, interests and where you stay, with places, restaurants and travel times. Available for Barcelona and Prague.",
    },
    nav: {
      home: "Home",
      products: "Products",
      destinations: "Destinations",
      about: "About",
      faq: "FAQ",
      contact: "Contact",
      ctaPlanTrip: "Start your plan",
      howItWorks: "How it works",
      price: "Price",
      myPlans: "My plans",
      signIn: "Sign in",
      account: "My Account",
    },
    languageSwitcher: { ar: "عربي", en: "EN", he: "עברית", ariaLabel: "Select language" },
    cartButton: { ariaLabel: "Cart" },
    mobileMenu: { open: "Open menu", close: "Close menu" },
    loadingSplash: { ariaLabel: "Loading" },
    products: {
      eyebrow: "Products",
      title: "Choose the Plan That Fits Your Trip",
      startingFromLabel: "Starting from",
      ownedBadge: "Purchased ✓",
      ownedCta: "Open",
      personalizedOpen: "Open my personalized planner",
      items: [
        {
          id: "personalized-trip-plan",
          title: "Your Personalized Trip Plan ✨",
          description: "Answer a few questions first, then we'll build you a smart plan for your trip.",
          priceILS: PRODUCT_PRICES_ILS["personalized-trip-plan"].launch,
          referencePriceILS: PRODUCT_PRICES_ILS["personalized-trip-plan"].reference,
          route: "/planner",
          ctaLabel: "Start Your Plan",
          includesGuideLabel: "+ Barcelona Guide (Barcelona plans)",
          badge: "Instant",
          comparisonHint: "Barcelona and Prague available now — new destinations coming soon.",
        },
        {
          id: "barcelona-1day",
          title: "Barcelona in One Day",
          description: "See the essential Barcelona highlights in one organized day.",
          priceILS: PRODUCT_PRICES_ILS["barcelona-1day"].launch,
          referencePriceILS: PRODUCT_PRICES_ILS["barcelona-1day"].reference,
          route: "/ready-plans/barcelona/1-day",
          ctaLabel: "Buy Now",
          addToCartLabel: "Add to Cart",
        },
        {
          id: "barcelona-guide",
          title: "Barcelona Travel Guide",
          description: "Places, restaurants, hotels, shopping and nightlife in one guide.",
          priceILS: PRODUCT_PRICES_ILS["barcelona-guide"].launch,
          referencePriceILS: PRODUCT_PRICES_ILS["barcelona-guide"].reference,
          route: "/guides/barcelona",
          ctaLabel: "Buy Now",
          addToCartLabel: "Add to Cart",
        },
        {
          id: "barcelona-3day",
          title: "Barcelona — 3 Days",
          description: "The Barcelona highlights, organized across 3 well-paced days.",
          priceILS: PRODUCT_PRICES_ILS["barcelona-3day"].launch,
          referencePriceILS: PRODUCT_PRICES_ILS["barcelona-3day"].reference,
          route: "/ready-plans/barcelona/3-days",
          ctaLabel: "Buy Now",
          addToCartLabel: "Add to Cart",
          includesGuideLabel: "+ Barcelona Guide",
        },
        {
          id: "barcelona-5day",
          title: "Barcelona — 5 Days",
          description: "A complete 5-day itinerary with organized routes and transport.",
          priceILS: PRODUCT_PRICES_ILS["barcelona-5day"].launch,
          referencePriceILS: PRODUCT_PRICES_ILS["barcelona-5day"].reference,
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
          question: "What does the plan include?",
          answer: "A day-by-day program with times, places, restaurants and travel time between stops, plus each place's details, opening hours and Google / Apple Maps links, based on your answers.",
        },
        {
          question: "How do I open my plan?",
          answer: "The questions and the payment need no account. After paying, sign in or create an account with the email you paid with, then press \"Build my plan\".",
        },
        {
          question: "Can I make more than one plan?",
          answer: "Yes. Create new plans and edit any plan (we rebuild it from your answers) at no extra cost, up to 30 saved plans.",
        },
        {
          question: "Are flights, hotels and tickets included?",
          answer: "No, the plan's price doesn't include flights, hotels or tickets. The plan shows price information and tells you when a place needs advance booking.",
        },
      ],
    },
    home: {
      bottomCta: { buy: "Buy now", owner: "Create a new plan" },
      intro: {
        headline: "Plan less, enjoy more",
        description: "A day-by-day travel plan built around your days, your interests and where you're staying.",
      },
      video: {
        title: "See how your plan comes together",
        play: "Play the video",
        posterAlt: "An excerpt of an example plan: the days of the trip and their places",
        unavailable: "The video isn't available right now.",
        languageNote: "The demo video shows the Arabic version.",
      },
      offer: {
        title: "Your plan, your way",
        text: "Pick where you're going, how many days, what you like and where you're staying.",
        includes: "Places, restaurants and getting around — arranged day by day.",
        availability: "Available for Barcelona and Prague",
      },
      problems: {
        title: "Sound familiar?",
        items: [
          "We got back from the trip… and found places we never knew about!",
          "Every morning: where do we go? And the time slips away while we search.",
          "We put far-apart places in the same day… and lost the time getting around.",
          "We got there… and it was closed.",
        ],
        bridge: "Keep your time for the trip, and leave the planning to us.",
      },
      product: {
        title: "Your personalized plan",
        schedule: "Your day, in order",
        details: "Details for every place",
        transport: "Getting between stops",
        recommended: "Suggested",
        previous: "Previous scene",
        next: "Next scene",
      },
      example: {
        entry: "See an example",
        badge: "Example for Barcelona",
        summary: "3 days · Culture & food",
        hint: "This is a ready-made example, not your plan. Your plan is built from your own answers.",
        inputsTitle: "Example inputs",
        inputs: [
          { label: "Destination", value: "Barcelona" },
          { label: "Duration", value: "3 days" },
          { label: "Interests", value: "Culture & history, Food" },
          { label: "Accommodation", value: "Not booked yet" },
        ],
        dayLabel: "Day {n}",
        detailsHint: "Place details",
        sheetPrice: "Price",
        sheetBooking: "Booking",
        photoCredits: "Photo credits:",
        start: "Start your plan",
      },
      pricing: {
        title: "{price} once",
        points: [
          "Create more than one plan, then edit and rebuild them at no extra cost, up to 30 saved plans.",
          "One payment unlocks all supported cities: Barcelona and Prague.",
          "The full Barcelona guide is included only when you buy for a Barcelona plan.",
        ],
        notIncluded: "The price is for the plan only. It doesn't include flights, accommodation or tickets for places.",
        ownerTitle: "Your personalized plan is unlocked ✓",
        ownerBody: "Create a new plan or edit your plans at no extra cost, up to 30 saved plans.",
        myPlans: "My plans",
      },
      support: { text: "Didn't find your answer? Write to us:", refund: "Refund policy" },
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
      sessionOnly: "Your browser won't let us save the cart, so it only lasts while this page stays open. Complete your order now.",
    },
    checkout: {
      title: "Checkout",
      payButton: "Pay with Allpay",
      payButtonTest: "Pay with Allpay (Test)",
      testBadge: "Allpay test mode — no real payment",
      redirecting: "Redirecting to payment...",
      selectedProduct: "Selected product",
      errors: {
        invalid_product: "Invalid product in your cart.",
        empty_cart: "Your cart is empty.",
        invalid_email: "Enter a valid email address — we’ll send your payment confirmation there.",
        no_product_selected: "No product was selected for purchase.",
        already_owned: "All the requested products are already yours or included in a product you own.",
        login_required: "Please sign in to complete this purchase.",
        order_create_failed: "We couldn’t create your order. Please try again.",
        order_load_failed: "We couldn’t load your order details after creating it.",
        order_not_found: "Order not found.",
        order_not_pending: "This order is no longer awaiting payment.",
        order_items_failed: "We couldn’t load the products in your order.",
        payment_page_failed: "We couldn’t open the payment page. Please try again.",
        payment_setup_failed: "We couldn’t set up the payment right now. Please try again in a moment, and contact us if the problem continues.",
        planner_answers_required: "The Personalized Plan starts on the planner page: answer the questions first, then continue to payment.",
        invalid_planner_answers: "Your plan details aren’t valid. Please review your answers and try again.",
        planner_already_unlocked: "Your personalized planner is already unlocked — create your plan with no new payment.",
      },
    },
    pricing: {
      previousPrice: "Previous price",
      amountToPay: "Amount charged today",
      chargedInIls: "Charged in Israeli shekels (₪)",
      includedInPlan: "Included with your plan",
      alreadyOwned: "Already yours",
    },
    productPage: {
      includedGuide: {
        badge: "🎁 Included with your plan",
        title: "Complete Barcelona Travel Guide",
        cta: "Open Barcelona Guide",
      },
    },
    footer: {
      brandLine: "Travel More. Plan Less.",
      planHeading: "Personalized plan",
      accountHeading: "Your account",
      contactHeading: "Contact",
      faqLabel: "FAQ",
      linkStart: "Start your plan",
      linkHow: "How it works",
      linkPrice: "Price",
      linkAccount: "My account and plans",
      photoCreditsLabel: "Photo credits",
      rights: "© 2026 Travel Smarter. All rights reserved.",
      descriptor: "Personalized trip plans built around your days, interests and where you stay.",
      privacyLabel: "Privacy Policy",
      termsLabel: "Terms of Service",
    },
  },
  he: {
    htmlLang: "he",
    dir: "rtl",
    seo: {
      title: "Travel Smarter | תוכנית טיול אישית, יום אחרי יום",
      description: "עונים על כמה שאלות ומקבלים תוכנית טיול לפי הימים, תחומי העניין ומקום הלינה שלכם, עם מקומות, מסעדות וזמני הגעה. זמין עכשיו לברצלונה.",
    },
    nav: {
      home: "דף הבית",
      products: "מוצרים",
      destinations: "יעדים",
      about: "עלינו",
      faq: "שאלות נפוצות",
      contact: "צור קשר",
      ctaPlanTrip: "התחילו את התוכנית",
      howItWorks: "איך זה עובד",
      price: "מחיר",
      myPlans: "התוכניות שלי",
      signIn: "התחברות",
      account: "החשבון שלי",
    },
    languageSwitcher: { ar: "عربي", en: "EN", he: "עברית", ariaLabel: "בחירת שפה" },
    cartButton: { ariaLabel: "עגלה" },
    mobileMenu: { open: "פתיחת התפריט", close: "סגירת התפריט" },
    loadingSplash: { ariaLabel: "טוען" },
    products: {
      eyebrow: "מוצרים",
      title: "בחרו את התוכנית שמתאימה לטיול שלכם",
      startingFromLabel: "החל מ־",
      ownedBadge: "נרכש ✓",
      ownedCta: "פתיחה",
      personalizedOpen: "פתיחת מתכנן הטיול האישי",
      items: [
        {
          id: "personalized-trip-plan",
          title: "תוכנית הטיול האישית שלכם ✨",
          description: "עונים קודם על כמה שאלות, ואנחנו בונים לכם תוכנית חכמה לטיול.",
          priceILS: PRODUCT_PRICES_ILS["personalized-trip-plan"].launch,
          referencePriceILS: PRODUCT_PRICES_ILS["personalized-trip-plan"].reference,
          route: "/planner",
          ctaLabel: "התחילו את התוכנית",
          includesGuideLabel: "+ מדריך ברצלונה",
          badge: "מיידי",
          comparisonHint: "ברצלונה זמינה עכשיו — יעדים חדשים בקרוב.",
        },
        {
          id: "barcelona-1day",
          title: "ברצלונה ביום אחד",
          description: "האטרקציות החשובות של ברצלונה ביום אחד מסודר.",
          priceILS: PRODUCT_PRICES_ILS["barcelona-1day"].launch,
          referencePriceILS: PRODUCT_PRICES_ILS["barcelona-1day"].reference,
          route: "/ready-plans/barcelona/1-day",
          ctaLabel: "לקנייה",
          addToCartLabel: "הוספה לעגלה",
        },
        {
          id: "barcelona-guide",
          title: "מדריך הטיולים לברצלונה",
          description: "מקומות, מסעדות, מלונות, קניות ובילויים במדריך אחד.",
          priceILS: PRODUCT_PRICES_ILS["barcelona-guide"].launch,
          referencePriceILS: PRODUCT_PRICES_ILS["barcelona-guide"].reference,
          route: "/guides/barcelona",
          ctaLabel: "לקנייה",
          addToCartLabel: "הוספה לעגלה",
        },
        {
          id: "barcelona-3day",
          title: "ברצלונה — 3 ימים",
          description: "האטרקציות של ברצלונה, מסודרות ב־3 ימים בקצב נוח.",
          priceILS: PRODUCT_PRICES_ILS["barcelona-3day"].launch,
          referencePriceILS: PRODUCT_PRICES_ILS["barcelona-3day"].reference,
          route: "/ready-plans/barcelona/3-days",
          ctaLabel: "לקנייה",
          addToCartLabel: "הוספה לעגלה",
          includesGuideLabel: "+ מדריך ברצלונה",
        },
        {
          id: "barcelona-5day",
          title: "ברצלונה — 5 ימים",
          description: "מסלול מלא ל־5 ימים עם מסלולים ותחבורה מסודרים.",
          priceILS: PRODUCT_PRICES_ILS["barcelona-5day"].launch,
          referencePriceILS: PRODUCT_PRICES_ILS["barcelona-5day"].reference,
          route: "/ready-plans/barcelona",
          ctaLabel: "לקנייה",
          addToCartLabel: "הוספה לעגלה",
          includesGuideLabel: "+ מדריך ברצלונה",
        },
      ],
    },
    destinations: {
      title: "יעדים זמינים",
      barcelona: { badge: "זמין עכשיו", cta: "לגלות את ברצלונה" },
      comingSoonBadge: "בקרוב",
      items: [
        { slug: "barcelona", name: "ברצלונה" },
        { slug: "rome", name: "רומא" },
        { slug: "prague", name: "פראג" },
        { slug: "budapest", name: "בודפשט" },
        { slug: "dubai", name: "דובאי" },
        { slug: "batumi", name: "בטומי" },
      ],
    },
    trust: {
      title: "למה Travel Smarter?",
      items: [
        { title: "ניסיון טיולים אמיתי", description: "הניסיון שלנו מגיע מביקור ביותר מ־15 מדינות." },
        { title: "חוסכים זמן", description: "בלי שעות של חיפושים, הכול מסודר בשבילכם." },
        { title: "מסלולים חכמים יותר", description: "מקומות מסודרים כך שפחות זמן הולך על הדרכים." },
      ],
    },
    faq: {
      title: "שאלות נפוצות",
      items: [
        {
          question: "מה כוללת התוכנית?",
          answer: "תוכנית יום אחרי יום עם שעות, מקומות, מסעדות וזמני הגעה בין התחנות, ופרטים על כל מקום: שעות פתיחה וקישורים ל־Google / Apple Maps, לפי התשובות שלכם.",
        },
        {
          question: "איך פותחים את התוכנית?",
          answer: "לשאלות ולתשלום לא צריך חשבון. אחרי התשלום מתחברים או פותחים חשבון עם האימייל ששילמתם איתו, ולוחצים על \"בנו את התוכנית שלי\".",
        },
        {
          question: "אפשר להכין יותר מתוכנית אחת?",
          answer: "כן. אפשר ליצור תוכניות חדשות ולערוך כל תוכנית (אנחנו בונים אותה מחדש לפי התשובות) בלי תשלום נוסף, עד 30 תוכניות שמורות.",
        },
        {
          question: "טיסות, מלונות וכרטיסים כלולים?",
          answer: "לא, מחיר התוכנית לא כולל טיסות, מלונות או כרטיסים. התוכנית מציגה מידע על מחירים ומציינת כשמקום דורש הזמנה מראש.",
        },
      ],
    },
    home: {
      bottomCta: { buy: "לקנייה", owner: "יצירת תוכנית חדשה" },
      intro: {
        headline: "פחות תכנון, יותר הנאה",
        description: "תוכנית טיול יומית לפי הימים, תחומי העניין ומקום הלינה שלכם.",
      },
      video: {
        title: "תראו איך התוכנית שלכם נבנית",
        play: "הפעלת הסרטון",
        posterAlt: "קטע מתוכנית לדוגמה: ימי הטיול והמקומות שלהם",
        unavailable: "הסרטון לא זמין כרגע.",
        languageNote: "סרטון ההדגמה מוצג בערבית.",
      },
      offer: {
        title: "התוכנית שלכם, בדרך שלכם",
        text: "בוחרים לאן נוסעים, כמה ימים, מה אוהבים ואיפה ישנים.",
        includes: "מקומות, מסעדות ודרכי הגעה — מסודרים יום אחרי יום.",
        availability: "זמין עכשיו לברצלונה",
      },
      problems: {
        title: "מכירים את זה?",
        items: [
          "חזרנו מהטיול… וגילינו מקומות שלא ידענו עליהם!",
          "כל בוקר: לאן הולכים? והזמן עובר בחיפושים.",
          "שמנו מקומות רחוקים באותו יום… והזמן הלך על הדרכים.",
          "הגענו למקום… והוא היה סגור.",
        ],
        bridge: "תשמרו את הזמן לטיול, ואת התכנון תשאירו לנו.",
      },
      product: {
        title: "התוכנית האישית שלכם",
        schedule: "היום שלכם, לפי הסדר",
        details: "פרטים על כל מקום",
        transport: "הדרך בין התחנות",
        recommended: "מומלץ",
        previous: "הסצנה הקודמת",
        next: "הסצנה הבאה",
      },
      example: {
        entry: "לצפייה בדוגמה",
        badge: "דוגמה לברצלונה",
        summary: "3 ימים · תרבות ואוכל",
        hint: "זו דוגמה מוכנה, לא התוכנית שלכם. התוכנית שלכם נבנית מהתשובות שלכם.",
        inputsTitle: "נתוני הדוגמה",
        inputs: [
          { label: "יעד", value: "ברצלונה" },
          { label: "משך", value: "3 ימים" },
          { label: "תחומי עניין", value: "תרבות והיסטוריה, אוכל" },
          { label: "לינה", value: "עוד לא הוזמנה" },
        ],
        dayLabel: "יום {n}",
        detailsHint: "פרטי המקום",
        sheetPrice: "מחיר",
        sheetBooking: "הזמנה",
        photoCredits: "קרדיט לתמונות:",
        start: "התחילו את התוכנית",
      },
      pricing: {
        title: "{price} פעם אחת",
        points: [
          "יוצרים יותר מתוכנית אחת, עורכים ובונים מחדש בלי תשלום נוסף, עד 30 תוכניות שמורות.",
          "תשלום אחד פותח את כל הערים הנתמכות. זמינה עכשיו: ברצלונה.",
          "המדריך המלא לברצלונה כלול בתוכניות לברצלונה.",
        ],
        notIncluded: "המחיר הוא על התוכנית בלבד, ולא כולל טיסות, לינה או כרטיסי כניסה.",
        ownerTitle: "התוכנית האישית שלכם פתוחה ✓",
        ownerBody: "צרו תוכנית חדשה או ערכו את התוכניות שלכם בלי תשלום נוסף, עד 30 תוכניות שמורות.",
        myPlans: "התוכניות שלי",
      },
      support: { text: "לא מצאתם תשובה? כתבו לנו:", refund: "מדיניות החזרים" },
    },
    cart: {
      title: "עגלה",
      empty: "העגלה ריקה",
      remove: "הסרה",
      subtotal: "סכום ביניים",
      continueCta: "לתשלום",
      clear: "ריקון העגלה",
      alreadyInCart: "המוצר הזה כבר בעגלה",
      close: "סגירת העגלה",
      sessionOnly: "הדפדפן לא מאפשר לשמור את העגלה, אז היא נשמרת רק כל עוד הדף פתוח. השלימו את ההזמנה עכשיו.",
    },
    checkout: {
      title: "תשלום",
      payButton: "תשלום ב־Allpay",
      payButtonTest: "תשלום ב־Allpay (בדיקה)",
      testBadge: "מצב בדיקה של Allpay — אין חיוב אמיתי",
      redirecting: "מעבירים אתכם לתשלום...",
      selectedProduct: "המוצר שנבחר",
      errors: {
        invalid_product: "יש בעגלה מוצר לא תקין.",
        empty_cart: "העגלה ריקה.",
        invalid_email: "הזינו כתובת אימייל תקינה — לשם נשלח את אישור התשלום.",
        no_product_selected: "לא נבחר מוצר לרכישה.",
        already_owned: "כל המוצרים שביקשתם כבר שלכם או כלולים במוצר שכבר רכשתם.",
        login_required: "התחברו כדי להשלים את הרכישה.",
        order_create_failed: "לא הצלחנו ליצור את ההזמנה. נסו שוב.",
        order_load_failed: "לא הצלחנו לטעון את פרטי ההזמנה אחרי שנוצרה.",
        order_not_found: "ההזמנה לא נמצאה.",
        order_not_pending: "ההזמנה הזו כבר לא ממתינה לתשלום.",
        order_items_failed: "לא הצלחנו לטעון את המוצרים בהזמנה.",
        payment_page_failed: "לא הצלחנו לפתוח את דף התשלום. נסו שוב.",
        payment_setup_failed: "לא הצלחנו להכין את התשלום כרגע. נסו שוב בעוד כמה רגעים, ואם הבעיה נמשכת צרו איתנו קשר.",
        planner_answers_required: "התוכנית האישית מתחילה בדף המתכנן: עונים קודם על השאלות, ואז ממשיכים לתשלום.",
        invalid_planner_answers: "פרטי התוכנית לא תקינים. בדקו את התשובות ונסו שוב.",
        planner_already_unlocked: "מתכנן הטיול האישי שלכם כבר פתוח — צרו תוכנית בלי תשלום חדש.",
      },
    },
    pricing: {
      previousPrice: "מחיר קודם",
      amountToPay: "הסכום לחיוב היום",
      chargedInIls: "החיוב בשקלים (₪)",
      includedInPlan: "כלול בתוכנית שלכם",
      alreadyOwned: "כבר שלכם",
    },
    productPage: {
      includedGuide: {
        badge: "🎁 כלול בתוכנית שלכם",
        title: "המדריך המלא לברצלונה",
        cta: "פתיחת מדריך ברצלונה",
      },
    },
    footer: {
      brandLine: "יותר לטייל. פחות לתכנן.",
      planHeading: "תוכנית אישית",
      accountHeading: "החשבון שלכם",
      contactHeading: "צור קשר",
      faqLabel: "שאלות נפוצות",
      linkStart: "התחילו את התוכנית",
      linkHow: "איך זה עובד",
      linkPrice: "מחיר",
      linkAccount: "החשבון והתוכניות שלי",
      photoCreditsLabel: "קרדיטים לתמונות",
      rights: "© 2026 Travel Smarter. כל הזכויות שמורות.",
      descriptor: "תוכניות טיול אישיות לפי הימים, תחומי העניין ומקום הלינה שלכם.",
      privacyLabel: "מדיניות פרטיות",
      termsLabel: "תנאי שימוש",
    },
  },
};
