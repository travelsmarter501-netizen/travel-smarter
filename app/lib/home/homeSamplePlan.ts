import type { PlannerRouteLeg } from "../planner/plannerTransportTypes";

/**
 * The PUBLIC example itinerary shown on the homepage ("Show me an example of your plan").
 *
 * What it is: an excerpt of day 1 of a synthetic Barcelona plan that the real planner engine produced locally for fixed example answers
 * (3 days, interests: culture & history + food, accommodation not booked). No customer, order, account or saved plan was involved.
 *
 * What it deliberately is NOT: the full itinerary, the Guide, or the engine data. Only the fields below were copied (an explicit allowlist):
 * three stops with their time slot, the two real transport legs between them, and a short details card for ONE of the three places
 * (details: description, price text, booking note, address and map links). Nothing else from the plan or the Guide is imported here, so
 * the homepage bundle never contains the Guide (see docs/PROJECT_PLAN.md, phase 3 verification).
 *
 * If the engine or the Barcelona data change materially, regenerate this excerpt the same way (synthetic answers, local run) and re-check
 * it by eye; it is a snapshot, not live data. Plain module: safe for client and server code.
 */

export type HomeSampleStop = {
  id: string;
  name: string;
  image: string;
  imagePosition?: string;
  categoryLabel: string;
  address: string;
  coordinates: { lat: number; lng: number };
  visitDurationMinutes: number;
  /** "HH:MM–HH:MM", as the real plan shows it. */
  timeRange: string;
};

export type HomeSamplePlan = {
  dayNumber: number;
  dayTitle: string;
  stops: HomeSampleStop[];
  /** legs[i] connects stops[i] to stops[i + 1]. */
  legs: PlannerRouteLeg[];
  /** The one place whose details card can be opened. */
  details: {
    placeId: string;
    areaName: string;
    description: string;
    priceText: string;
    bookingStatus: string;
    address: string;
    mapsUrl: string;
    appleMapsUrl: string;
  };
};

export const HOME_SAMPLE_PLAN: HomeSamplePlan = {
  dayNumber: 1,
  dayTitle: "Gaudí وعمارة برشلونة 🏛️",
  stops: [
    {
      id: "mercat-sagrada-familia",
      name: "Mercat de la Sagrada Família",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/035_Mercat_de_la_Sagrada_Fam%C3%ADlia%2C_c._Padilla_255_%28Barcelona%29.jpg/1280px-035_Mercat_de_la_Sagrada_Fam%C3%ADlia%2C_c._Padilla_255_%28Barcelona%29.jpg",
      categoryLabel: "معلم سياحي",
      address: "Carrer de Padilla, 255, 08013 Barcelona, Spain",
      coordinates: {
        lat: 41.40561,
        lng: 2.17698
      },
      visitDurationMinutes: 20,
      timeRange: "09:00–09:20"
    },
    {
      id: "sagrada-familia",
      name: "Sagrada Família",
      image: "/images-barcelona/sagrada-familia.jpg",
      imagePosition: "center 25%",
      categoryLabel: "معلم سياحي",
      address: "Carrer de Mallorca, 401, 08013 Barcelona, Spain",
      coordinates: {
        lat: 41.40369,
        lng: 2.17433
      },
      visitDurationMinutes: 120,
      timeRange: "09:45–11:45"
    },
    {
      id: "sant-pau",
      name: "Recinte Modernista de Sant Pau",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Hospital_Sant_Pau%2C_main_facade.jpg/1280px-Hospital_Sant_Pau%2C_main_facade.jpg",
      categoryLabel: "معلم سياحي",
      address: "Carrer de Sant Antoni Maria Claret, 167, 08025 Barcelona, Spain",
      coordinates: {
        lat: 41.41278,
        lng: 2.17444
      },
      visitDurationMinutes: 60,
      timeRange: "12:15–13:15"
    }
  ],
  legs: [
    {
      fromPlaceId: "mercat-sagrada-familia",
      toPlaceId: "sagrada-familia",
      recommendedMode: "walking",
      options: [
        {
          mode: "walking",
          durationMinutesMin: 5,
          durationMinutesMax: 6,
          distanceKm: 0.35
        }
      ],
      sourceStatus: "verified"
    },
    {
      fromPlaceId: "sagrada-familia",
      toPlaceId: "sant-pau",
      recommendedMode: "transit",
      options: [
        {
          mode: "walking",
          durationMinutesMin: 23,
          durationMinutesMax: 26,
          distanceKm: 1.6
        },
        {
          mode: "transit",
          durationMinutesMin: 11,
          durationMinutesMax: 15
        }
      ],
      sourceStatus: "verified"
    }
  ],
  details: {
    placeId: "sagrada-familia",
    areaName: "Eixample",
    description: "كنيسة Gaudí الأسطورية — لسا قيد البناء من أكثر من قرن.",
    priceText: "من €26 — حسب نوع التذكرة",
    bookingStatus: "ضروري مسبقًا",
    address: "Carrer de Mallorca, 401, 08013 Barcelona, Spain",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Sagrada+Familia+Barcelona",
    appleMapsUrl: "https://maps.apple.com/?q=Sagrada+Familia+Barcelona"
  }
};

/**
 * The sample's display texts in English and Hebrew, copied verbatim from the reviewed plan catalog (lib/i18n/planCatalog.ts) so the
 * homepage does not load the whole catalog. A check script compares them with the catalog (docs/PROJECT_PLAN.md, phase 5L). Only text
 * changes: stops, times, legs, prices and links are the same in every language.
 */
type SampleText = { dayTitle: string; categoryLabel: string; description: string; priceText: string };
const HOME_SAMPLE_TEXT: Record<"en" | "he", SampleText> = {
  en: {
    dayTitle: "Gaudí and Barcelona's architecture 🏛️",
    categoryLabel: "Attraction",
    description: "Gaudí's legendary basilica — still under construction after more than a century.",
    priceText: "From €26 — depends on the ticket type",
  },
  he: {
    dayTitle: "Gaudí והאדריכלות של ברצלונה 🏛️",
    categoryLabel: "אטרקציה",
    description: "הבזיליקה האגדית של Gaudí — עדיין בבנייה כבר יותר ממאה שנה.",
    priceText: "החל מ־€26 — לפי סוג הכרטיס",
  },
};

/** The sample in the page language (Arabic = the stored sample itself). */
export function homeSampleForLanguage(lang: "ar" | "en" | "he"): HomeSamplePlan {
  if (lang === "ar") return HOME_SAMPLE_PLAN;
  const text = HOME_SAMPLE_TEXT[lang];
  return {
    ...HOME_SAMPLE_PLAN,
    dayTitle: text.dayTitle,
    stops: HOME_SAMPLE_PLAN.stops.map((stop) => (stop.categoryLabel === HOME_SAMPLE_PLAN.stops[0].categoryLabel ? { ...stop, categoryLabel: text.categoryLabel } : stop)),
    details: { ...HOME_SAMPLE_PLAN.details, description: text.description, priceText: text.priceText },
  };
}
