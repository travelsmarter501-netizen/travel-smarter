import type { ComponentType, SVGProps } from "react";
import { IconBook, IconPackage, IconSparkles } from "../components/icons";

/**
 * Single source of truth for every destination. Prices are stored in ILS
 * (the default currency) — see app/lib/currency.tsx for the conversion rate.
 * Add, remove, or edit destinations here; every section on the homepage
 * (destinations grid, ready packages, travel guides) is generated from this list.
 */
export type Destination = {
  slug: string;
  name: string;
  country: string;
  /** ISO 3166-1 alpha-2 country code, used to render the real flag image. */
  countryCode: string;
  image: string;
  description: string;
  customPlanPrice: number;
  packagePrice: number;
  guidePrice: number;
  packageDays: number;
  status: "available" | "coming-soon";
};

export const destinations: Destination[] = [
  {
    slug: "barcelona",
    name: "Barcelona",
    country: "إسبانيا",
    countryCode: "es",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Evening_light_over_Barcelona.jpg/1280px-Evening_light_over_Barcelona.jpg",
    description: "عمارة ساحرة، شواطئ متوسطية، وحياة ليلية نابضة بالحيوية.",
    customPlanPrice: 59,
    packagePrice: 39,
    guidePrice: 29,
    packageDays: 5,
    status: "available",
  },
  {
    slug: "batumi",
    name: "Batumi",
    country: "جورجيا",
    countryCode: "ge",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Batumi_sunset.jpg/1280px-Batumi_sunset.jpg",
    description: "شواطئ على البحر الأسود، طبيعة خلابة، وأجواء استجمام هادئة.",
    customPlanPrice: 89,
    packagePrice: 59,
    guidePrice: 29,
    packageDays: 4,
    status:"coming-soon"
  },
  {
    slug: "dubai",
    name: "Dubai",
    country: "الإمارات العربية المتحدة",
    countryCode: "ae",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Dubai_Marina_Skyline_93.jpg/1280px-Dubai_Marina_Skyline_93.jpg",
    description: "فخامة عصرية، تسوق عالمي، ومغامرات صحراوية مميزة.",
    customPlanPrice: 129,
    packagePrice: 99,
    guidePrice: 39,
    packageDays: 5,
    status:"coming-soon"
  },
  {
    slug: "miami",
    name: "Miami",
    country: "الولايات المتحدة",
    countryCode: "us",
    image:"/destinations/miami.jpg",
    description: "شواطئ ذهبية، أجواء استوائية، وحياة ليلية استثنائية.",
    customPlanPrice: 119,
    packagePrice: 89,
    guidePrice: 35,
    packageDays: 5,
    status: "coming-soon"
  },
  {
    slug: "istanbul",
    name: "Istanbul",
    country: "تركيا",
    countryCode: "tr",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Historical_peninsula_and_modern_skyline_of_Istanbul.jpg/1280px-Historical_peninsula_and_modern_skyline_of_Istanbul.jpg",
    description: "مزيج ساحر بين الشرق والغرب، أسواق تاريخية، ومطبخ غني.",
    customPlanPrice: 99,
    packagePrice: 69,
    guidePrice: 39,
    packageDays: 5,
    status: "coming-soon"
  },
  {
    slug: "sharm-el-sheikh",
    name: "Sharm El Sheikh",
    country: "مصر",
    countryCode: "eg",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Sharm_El_Sheikh_-_panoramio_%2815%29.jpg/1280px-Sharm_El_Sheikh_-_panoramio_%2815%29.jpg",
    description: "شعاب مرجانية ملونة، غوص عالمي المستوى، وشمس على مدار السنة.",
    customPlanPrice: 99,
    packagePrice: 69,
    guidePrice: 29,
    packageDays: 4,
    status: "coming-soon"
  },
  {
    slug: "prague",
    name: "Prague",
    country: "التشيك",
    countryCode: "cz",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Prague_%286365119737%29.jpg/1280px-Prague_%286365119737%29.jpg",
    description: "عمارة قوطية آسرة، شوارع مرصوفة، وأجواء أوروبية كلاسيكية.",
    customPlanPrice: 89,
    packagePrice: 59,
    guidePrice: 29,
    packageDays: 4,
    status: "coming-soon"
  },
  {
    slug: "budapest",
    name: "Budapest",
    country: "المجر",
    countryCode: "hu",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/View_from_Gell%C3%A9rt_Hill_to_the_Danube%2C_Hungary_-_Budapest_%2828493220635%29.jpg/1280px-View_from_Gell%C3%A9rt_Hill_to_the_Danube%2C_Hungary_-_Budapest_%2828493220635%29.jpg",
    description: "حمامات حرارية تاريخية، مناظر على نهر الدانوب، وعمارة مهيبة.",
    customPlanPrice: 89,
    packagePrice: 69,
    guidePrice: 29,
    packageDays: 4,
    status: "coming-soon"
  },
  {
    slug: "vienna",
    name: "Vienna",
    country: "النمسا",
    countryCode: "at",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Schoenbrunn_philharmoniker_2012.jpg/1280px-Schoenbrunn_philharmoniker_2012.jpg",
    description: "أناقة إمبراطورية، مقاهٍ عريقة، وموسيقى كلاسيكية في كل ركن.",
    customPlanPrice: 99,
    packagePrice: 69,
    guidePrice: 29,
    packageDays: 4,
    status: "coming-soon"
  },
  {
    slug: "rome",
    name: "Rome",
    country: "إيطاليا",
    countryCode: "it",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Trevi_Fountain%2C_Rome%2C_Italy_2_-_May_2007.jpg/1280px-Trevi_Fountain%2C_Rome%2C_Italy_2_-_May_2007.jpg",
    description: "آثار رومانية خالدة، وطعام إيطالي لا يُنسى في كل زاوية.",
    customPlanPrice: 109,
    packagePrice: 79,
    guidePrice: 35,
    packageDays: 4,
    status: "coming-soon"
  },
{
    slug: "paris",
    name: "Paris",
    country: "فرنسا",
    countryCode: "fr",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques%2C_Paris_ao%C3%BBt_2014_%282%29.jpg/1280px-La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques%2C_Paris_ao%C3%BBt_2014_%282%29.jpg",
    description: "أناقة باريسية، متاحف فنية، ومقاهٍ على ضفاف نهر السين.",
    customPlanPrice: 119,
    packagePrice: 89,
    guidePrice: 39,
    packageDays: 5,
    status: "coming-soon"
  },
  {
    slug: "london",
    name: "London",
    country: "المملكة المتحدة",
    countryCode: "gb",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/London_Skyline_%28125508655%29.jpeg/1280px-London_Skyline_%28125508655%29.jpeg",
    description: "تاريخ عريق، مسارح عالمية، وأجواء عالمية متنوعة الثقافات.",
    customPlanPrice: 129,
    packagePrice: 99,
    guidePrice: 39,
    packageDays: 5,
    status: "coming-soon"
  },
];

export type TripPackage = {
  destination: Destination;
  title: string;
  highlights: string[];
};

const packageHighlights = [
  "برنامج يوم بيوم جاهز للاستخدام",
  "أماكن ومطاعم مختارة بعناية",
  "روابط خرائط جاهزة",
];

// Derived from `destinations` — no separate data to keep in sync.
export const packages: TripPackage[] = destinations.map((destination) => ({
  destination,
  title: `${destination.packageDays}-Day ${destination.name} Complete Plan`,
  highlights: packageHighlights,
}));

export type TravelGuide = {
  destination: Destination;
  title: string;
};

// Derived from `destinations` — no separate data to keep in sync.
export const guides: TravelGuide[] = destinations.map((destination) => ({
  destination,
  title: `دليل ${destination.name} الكامل`,
}));

export type ProductCategory = {
  id: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  priceFrom: number;
  ctaLabel: string;
  ctaHref: string;
  featured?: boolean;
};

export const productCategories: ProductCategory[] = [
  {
    id: "custom-plan",
    icon: IconSparkles,
    // Barcelona is the only live Smart Planner destination today -- the title says so
    // explicitly rather than reading like a generic all-destinations product.
    title: "خطة سفر مخصصة لبرشلونة",
    description: "اختار شو بتحب والأماكن اللي بدك تزورها، وإحنا بنرتبلك الأيام بأذكى مسار.",
    priceFrom: 59,
    ctaLabel: "ابنِ خطتك",
    // Sales entry point: the homepage products section (where "Buy now" lives). Never the
    // entitlement-gated content route -- that is for people who already bought.
    ctaHref: "/#products",
    featured: true,
  },
  {
    id: "ready-packages",
    icon: IconPackage,
    title: "رزم سفر جاهزة",
    description: "برنامج يوم بيوم جاهز للتحميل والاستخدام",
    priceFrom: 39,
    ctaLabel: "تصفح الرزم",
    // Sales entry point (see above): the products section, not the gated Ready Plan route.
    ctaHref: "/#products",
  },
  {
    id: "guides",
    icon: IconBook,
    title: "دلائل سياحية",
    description: "كل ما تحتاج معرفته عن وجهتك في دليل واحد",
    priceFrom: 29,
    ctaLabel: "تصفح الأدلة",
    // Sales entry point (see above): the products section, not the gated Guide route.
    ctaHref: "/#products",
  },
];

export const navLinks = [
  { label: "الرئيسية", href: "/#hero" },
  { label: "الوجهات", href: "/#destinations" },
  { label: "الرزم الجاهزة", href: "/#products" },
  { label: "الدلائل السياحية", href: "/#products" },
  { label: "خطط رحلتك", href: "/#custom-plan" },
  { label: "كيف يعمل", href: "/#how-it-works" },
];
