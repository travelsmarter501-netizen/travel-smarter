"use client";

import BottomSheet from "./BottomSheet";
import AttractionCard from "./AttractionCard";
import FoodPlaceCard from "./FoodPlaceCard";
import ExperienceCard from "./ExperienceCard";
import NightlifeVenueCard from "./NightlifeVenueCard";
import BeachDetailCard from "./BeachDetailCard";
import ShoppingAreaCard from "./ShoppingAreaCard";
import { useFavorites } from "../../lib/useFavorites";
import type { ResolvedPlace } from "../../lib/readyPlan";
import type { Weekday } from "../../lib/hours";

/**
 * Opens the SAME place-card component already used throughout the Barcelona Guide
 * (image, description, address, copy button, hours, rating, price, official site,
 * maps links, favorite button) — the Ready Plan never renders its own copy of this
 * information, it only decides *when* to show the existing card.
 *
 * Planned-Date Hours Context Fix -- `plannedWeekday` (optional) is the real calendar weekday of
 * the itinerary day this place is scheduled on (SmartPlannerV2Day.tsx passes its own `day.weekday`,
 * already resolved server-side from the trip's real arrival date -- see barcelonaV2Resolve.ts).
 * Forwarded to whichever card renders below so its own OpeningHours block shows that day's hours
 * instead of "right now", never a misleading live status for a date that may not be today.
 * Omitted by every other caller (Guide browsing, V1's planner with no date concept, a flexible/
 * dateless V2 plan, or an old saved plan predating the `weekday` field): every card below falls
 * back to its existing real-time behavior, unchanged.
 */
export default function PlaceDetailsSheet({
  guideSlug,
  resolved,
  open,
  onClose,
  plannedWeekday,
}: {
  guideSlug: string;
  resolved: ResolvedPlace | undefined;
  open: boolean;
  onClose: () => void;
  plannedWeekday?: Weekday;
}) {
  const { isFavorite, toggleFavorite } = useFavorites(guideSlug);

  return (
    <BottomSheet open={open && !!resolved} onClose={onClose} title={resolved?.place.name}>
      {resolved?.type === "attraction" && (
        <AttractionCard
          attraction={resolved.place}
          areaName={resolved.areaName}
          isFavorite={isFavorite("attraction", resolved.place.id)}
          onToggleFavorite={() => toggleFavorite("attraction", resolved.place.id)}
          plannedWeekday={plannedWeekday}
        />
      )}
      {resolved?.type === "food" && (
        <FoodPlaceCard
          place={resolved.place}
          isFavorite={isFavorite("food", resolved.place.id)}
          onToggleFavorite={() => toggleFavorite("food", resolved.place.id)}
          plannedWeekday={plannedWeekday}
        />
      )}
      {resolved?.type === "experience" && (
        <ExperienceCard
          experience={resolved.place}
          isFavorite={isFavorite("experience", resolved.place.id)}
          onToggleFavorite={() => toggleFavorite("experience", resolved.place.id)}
          plannedWeekday={plannedWeekday}
        />
      )}
      {resolved?.type === "nightlife" && (
        <NightlifeVenueCard
          venue={resolved.place}
          isFavorite={isFavorite("nightlife", resolved.place.id)}
          onToggleFavorite={() => toggleFavorite("nightlife", resolved.place.id)}
          plannedWeekday={plannedWeekday}
        />
      )}
      {resolved?.type === "beach" && (
        <BeachDetailCard
          beach={resolved.place}
          isFavorite={isFavorite("beach", resolved.place.id)}
          onToggleFavorite={() => toggleFavorite("beach", resolved.place.id)}
        />
      )}
      {resolved?.type === "shopping" && (
        <ShoppingAreaCard
          area={resolved.place}
          isFavorite={isFavorite("shopping", resolved.place.id)}
          onToggleFavorite={() => toggleFavorite("shopping", resolved.place.id)}
          plannedWeekday={plannedWeekday}
        />
      )}
    </BottomSheet>
  );
}
