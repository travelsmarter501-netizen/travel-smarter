/**
 * Shared shape for a rich, single-destination guide (like /guides/barcelona).
 * Barcelona is the first destination built on this structure — when a future
 * destination gets the same premium treatment, reuse these exact types and
 * just add a new data file (e.g. app/lib/dubai-guide.ts).
 */

import type { HoursInfo } from "./hours";
import type { Coordinates } from "./geo";

export type QuickFact = {
  icon: string;
  label: string;
  value: string;
};

/** A tile on the guide's home screen, and an entry in the mobile bottom nav. */
export type GuideCategory = {
  id: string;
  icon: string;
  label: string;
  subtitle: string;
};

/** Optional image-credit fields, kept for licensing/compliance — not shown loudly in the UI. */
export type ImageCredit = {
  imageSource?: string;
  imageAuthor?: string;
  imageSourceUrl?: string;
  /** e.g. "CC BY-SA 4.0" — only set for images that actually require attribution/ShareAlike tracking. */
  imageLicense?: string;
  imageLicenseUrl?: string;
};

/** Fields for time-sensitive facts (prices/hours) that must stay verifiable and easy to update centrally. */
export type VerifiedInfo = {
  priceText?: string;
  /** Internal maintenance timestamp — never rendered to the customer (see also HoursInfo's own lastVerified). */
  lastVerified?: string;
  bookingUrl?: string;
  ticketsUrl?: string;
};

export type BookingStatus = "ضروري مسبقًا" | "يفضل مسبقًا" | "مش ضروري عادةً" | "بدون حجز";

/** Only set when a current rating was actually verified — never invented. Shown compactly as "⭐ 4.7 · Google". */
export type RatingInfo = {
  rating?: number;
  reviewCount?: number;
  ratingSource?: string;
  /** Deep link to the exact listing (Google Maps place or Tripadvisor page) so the rating can be tapped through to real reviews — never a fabricated URL. */
  ratingUrl?: string;
  /** Internal maintenance timestamp — never rendered to the customer. */
  ratingLastVerified?: string;
};

/**
 * How a physical-location block should be labeled — most real businesses use the default
 * "الموقع", while diffuse areas, beaches, and viewpoints get a more honest label instead
 * of pretending they have one exact street address.
 */
export type LocationLabel = "الموقع" | "نقطة الوصول" | "نقطة التصوير" | "نقطة مقترحة للبدء" | "نقطة مقترحة";

export type Attraction = ImageCredit &
  VerifiedInfo &
  RatingInfo & {
    id: string;
    name: string;
    image: string;
    /** CSS object-position value, e.g. "center 30%" — keeps the important subject (towers, view...) visible in the crop. */
    imagePosition?: string;
    description: string;
    /** Not shown in the UI — kept for potential future use. */
    whyRecommend: string;
    areaId: string;
    /** Not shown in the UI — kept for potential future use. */
    duration: string;
    priceType: "free" | "paid";
    bookingStatus: BookingStatus;
    bestTime: string;
    tip: string;
    mapsUrl: string;
    appleMapsUrl: string;
    officialUrl?: string;
    mustSee: boolean;
    /** Real, verified street address — omit rather than invent one when unknown. */
    address?: string;
    /** Defaults to "الموقع" when omitted — set for diffuse places (whole neighborhoods, streets, beaches). */
    locationLabel?: LocationLabel;
    /** Omit entirely for places with no meaningful opening hours (public squares, streets...). */
    hours?: HoursInfo;
    /** Real, verified lat/lng — powers "شو قريب من شو". Never invented; omit rather than guess. */
    coordinates?: Coordinates;
  };

export type Area = {
  id: string;
  name: string;
  description: string;
  image: string;
  mapsUrl: string;
  appleMapsUrl: string;
  attractionIds: string[];
  /** A useful central starting point — these are whole neighborhoods, never one exact address. */
  address?: string;
  /** Real, verified lat/lng of the area's starting point — powers "شو قريب من شو". Never invented; omit rather than guess. */
  coordinates?: Coordinates;
  /**
   * Manual curation for "شو قريب من شو": when set, these exact attraction ids are shown
   * (in this order) instead of the automatic geographic result. Optional — automatic
   * distance-based nearby is the default; this is only for deliberate overrides.
   */
  nearbyOverrides?: string[];
};

export type FoodCategory = {
  id: string;
  icon: string;
  label: string;
};

export type DietaryNote = "usually-pork" | "usually-pork-free" | "depends-ask";

/** Quick tags shown as small icons on a food card — not a full allergen guarantee. */
export type DietaryTag = "pork-maybe" | "vegetarian" | "vegan" | "seafood" | "meat" | "coffee" | "dessert";

/** Editorial signal, not a mathematically-averaged score — set only when multiple real signals (rating, review volume, description) genuinely support it. */
export type FoodBadge = "best-overall" | "great-value" | "popular" | "local-experience" | "trending" | "less-touristy" | "best-atmosphere";

export type FoodPlace = ImageCredit &
  Pick<VerifiedInfo, "lastVerified"> &
  RatingInfo & {
    id: string;
    name: string;
    /** Omit when no real, licensed photo of the actual business was found — the card then shows an honest placeholder, never a stand-in photo. */
    image?: string;
    /** CSS object-position value, e.g. "center 30%" — keeps the important subject visible in the crop. */
    imagePosition?: string;
    categoryId: string;
    area: string;
    /** Real, verified street address — omit rather than invent one when unknown. */
    address?: string;
    priceLevel: "$" | "$$" | "$$$";
    why: string;
    mapsUrl: string;
    appleMapsUrl: string;
    officialUrl?: string;
    /** Real, verified phone number — omit rather than invent one when unknown. */
    phone?: string;
    dietaryTags: DietaryTag[];
    badges?: FoodBadge[];
    hours?: HoursInfo;
  };

export type MustTryDish = {
  name: string;
  image: string;
  description: string;
  dietary: DietaryNote;
} & ImageCredit;

export type StayArea = {
  id: string;
  name: string;
  image: string;
  bestFor: string[];
  pros: string[];
  cons: string[];
  priceLevel: string;
  mapsUrl: string;
  appleMapsUrl: string;
} & ImageCredit;

export type TransportMode = {
  id: string;
  icon: string;
  name: string;
  whenToUse: string;
  officialUrl?: string;
};

export type ShoppingArea = {
  id: string;
  name: string;
  image: string;
  bestFor: string;
  description: string;
  mapsUrl: string;
  appleMapsUrl: string;
  officialUrl?: string;
  /** Real, verified address for a single business; a useful central point for a whole shopping street. */
  address?: string;
  /** Defaults to "الموقع" when omitted — set to "نقطة مقترحة" for shopping streets with no single address. */
  locationLabel?: LocationLabel;
  /** Only meaningful for single businesses (e.g. an outlet village) — omit for whole shopping streets. */
  hours?: HoursInfo;
  /** Real, verified phone number — only meaningful for single businesses, omit for whole shopping streets. */
  phone?: string;
  /** Only meaningful for single businesses — omit for whole shopping streets/areas. */
  priceLevel?: "$" | "$$" | "$$$";
} & ImageCredit &
  RatingInfo;

export type Beach = {
  id: string;
  name: string;
  image: string;
  /** CSS object-position value, e.g. "center 30%" — keeps the important subject visible in the crop. */
  imagePosition?: string;
  vibe: string;
  bestFor: string[];
  crowdLevel: "low" | "medium" | "high";
  area: string;
  bestTime: string;
  tip: string;
  mapsUrl: string;
  appleMapsUrl: string;
  /** A useful beach access/promenade point — never a fake street address. */
  address?: string;
} & ImageCredit &
  RatingInfo;

export type NightlifeMusicStyle = "Electronic" | "House" | "Commercial" | "Latin" | "Mixed";

export type NightlifeVenue = ImageCredit &
  Pick<VerifiedInfo, "lastVerified"> &
  RatingInfo & {
    id: string;
    name: string;
    categoryId: string;
    area: string;
    /** Real, verified street address — omit rather than invent one when unknown. */
    address?: string;
    description: string;
    image?: string;
    /** CSS object-position value, e.g. "center 30%" — keeps the important subject visible in the crop. */
    imagePosition?: string;
    priceLevel?: "$" | "$$" | "$$$";
    entryPriceText?: string;
    ticketUrl?: string;
    officialUrl?: string;
    /** Set only when Instagram/social is the venue's sole official presence — UI must label it "Instagram الرسمي", never "الموقع الرسمي". */
    officialSocialUrl?: string;
    mapsUrl: string;
    appleMapsUrl: string;
    musicStyle?: NightlifeMusicStyle;
    dressCode?: string;
    ageRequirement?: string;
    tags: string[];
    hours?: HoursInfo;
  };

export type NightlifeCategory = {
  id: string;
  icon: string;
  title: string;
  description: string;
};

export type PhotoSpot = {
  id: string;
  name: string;
  image: string;
  /** CSS object-position value, e.g. "center 30%" — keeps the important subject visible in the crop. */
  imagePosition?: string;
  bestTime: string;
  whySpecial: string;
  tip: string;
  mapsUrl: string;
  appleMapsUrl: string;
  /** Exact viewpoint location when known; coordinates/nearby recognized point otherwise — never a fake business address. */
  address?: string;
} & ImageCredit &
  RatingInfo;

export type FreeExperience = {
  id: string;
  name: string;
  description: string;
};

/**
 * A single bookable hotel property — distinct from `StayArea` (which describes a whole
 * NEIGHBORHOOD's pros/cons for deciding where to stay, with no address/coordinates/rating of
 * its own). `priceText` is deliberately free-text ("الأسعار تتغير حسب الموسم — شوف السعر
 * الحالي") rather than a number: real hotel prices change nightly/seasonally, so a fixed
 * price would go stale immediately and mislead the customer.
 */
export type Hotel = {
  id: string;
  name: string;
  image: string;
  imagePosition?: string;
  address: string;
  /** Short neighborhood/district name for compact-card display — real, taken from the verified address, not a separate lookup. */
  area?: string;
  coordinates: Coordinates;
  /** Short, honest reason this specific hotel earns its spot — e.g. "إطلالة بحر وبرج أيقوني". */
  bestFor: string;
  /** Free-text price framing, never a fixed number — see the type's own doc comment above. */
  priceText: string;
  mapsUrl: string;
  appleMapsUrl: string;
  officialUrl?: string;
} & ImageCredit &
  RatingInfo;

/** A single real, licensed casino venue — table games/slots, not a betting shop, arcade, or unrelated nightlife venue. */
export type Casino = {
  id: string;
  name: string;
  image: string;
  imagePosition?: string;
  address: string;
  coordinates: Coordinates;
  description: string;
  /** Real, verified phone number — omit rather than invent one when unknown. */
  phone?: string;
  hours?: HoursInfo;
  mapsUrl: string;
  appleMapsUrl: string;
  officialUrl?: string;
} & ImageCredit &
  RatingInfo;

export type SaveMoneyTip = {
  id: string;
  icon: string;
  title: string;
  tip: string;
  /** Rough, honest order-of-magnitude — e.g. "توفير حوالي €10-15" — never a fake precise figure. */
  estimatedSaving?: string;
  bestFor?: string;
  warning?: string;
  sourceUrl?: string;
};

export type TouristMistake = {
  id: string;
  title: string;
  explanation: string;
};

/** "فعاليات وتجارب" — bookable things to DO, distinct from "أهم الأماكن" (places to see). */
export type ExperienceCategory = {
  id: string;
  icon: string;
  label: string;
};

export type Experience = ImageCredit &
  Pick<VerifiedInfo, "lastVerified"> &
  RatingInfo & {
    id: string;
    name: string;
    /** Omit when no real, licensed photo of the actual experience was found. */
    image?: string;
    imagePosition?: string;
    categoryId: string;
    /** Cross-cutting descriptive tags (e.g. "Sunset", "Couples", "Family") used by quick filters — not a primary category. */
    tags: string[];
    description: string;
    area?: string;
    /** Real, verified meeting-point/venue address — omit rather than invent one when the experience has no fixed address. */
    address?: string;
    duration?: string;
    /** Required — "€45" for a fixed price, or "من €45" when it varies. Never invented. */
    priceText: string;
    priceVaries: boolean;
    ageRequirement?: string;
    bookingRequired: boolean;
    hours?: HoursInfo;
    mapsUrl?: string;
    appleMapsUrl?: string;
    officialUrl?: string;
    bookingUrl?: string;
  };

export type ChecklistItem = {
  id: string;
  label: string;
};

export type DestinationGuideContent = {
  slug: string;
  priceILS: number;
  subtitle: string;
  quickFacts: QuickFact[];
  categories: GuideCategory[];
  attractions: Attraction[];
  areas: Area[];
  foodCategories: FoodCategory[];
  foodPlaces: FoodPlace[];
  mustTryDishes: MustTryDish[];
  stayAreas: StayArea[];
  transportModes: TransportMode[];
  shoppingAreas: ShoppingArea[];
  beaches: Beach[];
  nightlifeCategories: NightlifeCategory[];
  nightlifeVenues: NightlifeVenue[];
  photoSpots: PhotoSpot[];
  freeExperiences: FreeExperience[];
  experienceCategories: ExperienceCategory[];
  experiences: Experience[];
  saveMoneyTips: SaveMoneyTip[];
  touristMistakes: TouristMistake[];
  checklist: ChecklistItem[];
  hotels: Hotel[];
  casinos: Casino[];
};
