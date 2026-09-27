"use client";

import Image from "next/image";
import { useFavorites } from "../../lib/useFavorites";
import { IconHeart } from "../icons";
import type { Attraction, Beach, Casino, Experience, FoodPlace, Hotel, NightlifeVenue, PhotoSpot, ShoppingArea } from "../../lib/guideTypes";

export default function MyBarcelona({
  guideSlug,
  attractions,
  foodPlaces,
  beaches,
  photoSpots,
  shoppingAreas,
  nightlifeVenues,
  experiences,
  hotels,
  casinos,
}: {
  guideSlug: string;
  attractions: Attraction[];
  foodPlaces: FoodPlace[];
  beaches: Beach[];
  photoSpots: PhotoSpot[];
  shoppingAreas: ShoppingArea[];
  nightlifeVenues: NightlifeVenue[];
  experiences: Experience[];
  hotels: Hotel[];
  casinos: Casino[];
}) {
  const { favorites, toggleFavorite } = useFavorites(guideSlug);

  const groups = [
    { type: "attraction" as const, title: "أماكن", items: attractions },
    { type: "food" as const, title: "أكل", items: foodPlaces },
    { type: "beach" as const, title: "شواطئ", items: beaches },
    { type: "photo-spot" as const, title: "أماكن تصوير", items: photoSpots },
    { type: "shopping" as const, title: "تسوق", items: shoppingAreas },
    { type: "nightlife" as const, title: "سهرات وأماكن ليلية", items: nightlifeVenues },
    { type: "experience" as const, title: "فعاليات وتجارب", items: experiences },
    { type: "hotel" as const, title: "فنادق", items: hotels },
    { type: "casino" as const, title: "كازينوهات", items: casinos },
  ];

  const savedGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => favorites.includes(`${group.type}:${item.id}`)),
    }))
    .filter((group) => group.items.length > 0);

  if (savedGroups.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
        <p className="text-3xl">🤍</p>
        <p className="mt-3 text-sm font-semibold text-slate-700">لسا ما حفظت شي</p>
        <p className="mt-1 text-sm text-slate-500">اضغط ♡ على أي مكان يعجبك، وراح يظهر هون.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {savedGroups.map((group) => (
        <div key={group.type}>
          <h3 className="text-base font-bold text-slate-900">{group.title}</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                  {"image" in item && item.image ? (
                    <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                  ) : (
                    <span className="text-lg">{group.type === "nightlife" ? "🌙" : group.type === "experience" ? "🔥" : "🍽️"}</span>
                  )}
                </div>
                <p dir="ltr" className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900">
                  {item.name}
                </p>
                <button
                  type="button"
                  onClick={() => toggleFavorite(group.type, item.id)}
                  aria-label="إزالة من المفضلة"
                  className="shrink-0 text-rose-600"
                >
                  <IconHeart filled className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
