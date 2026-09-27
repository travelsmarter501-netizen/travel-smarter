import Image from "next/image";
import Link from "next/link";
import { IconArrowRight, IconStar } from "../icons";
import ExternalLink from "./ExternalLink";
import LocationInfo from "./LocationInfo";
import { centroidOf, formatDistanceAr } from "../../lib/geo";
import { getNearbyPlaces, type NearbyCandidate } from "../../lib/nearby";
import type { Area, Attraction } from "../../lib/guideTypes";

export default function AreaDetail({
  area,
  attractions,
  basePath,
}: {
  area: Area;
  attractions: Attraction[];
  basePath: string;
}) {
  const areaAttractions = area.attractionIds
    .map((id) => attractions.find((attraction) => attraction.id === id))
    .filter((attraction): attraction is Attraction => Boolean(attraction));

  const mustSee = areaAttractions.find((attraction) => attraction.mustSee);

  const candidates: NearbyCandidate[] = attractions.map((attraction) => ({
    id: attraction.id,
    name: attraction.name,
    description: attraction.description,
    coordinates: attraction.coordinates,
    image: attraction.image,
    imagePosition: attraction.imagePosition,
    href: attraction.officialUrl ?? attraction.mapsUrl,
  }));

  // Anchor "nearby" on the centroid of this area's own attractions (real, verified
  // coordinates) rather than one arbitrary landmark — keeps results centered on what
  // actually belongs to this area instead of drifting toward a denser neighbor.
  const anchorCoordinates =
    centroidOf(areaAttractions.map((attraction) => attraction.coordinates).filter((c): c is NonNullable<typeof c> => Boolean(c))) ??
    area.coordinates;

  const nearby = getNearbyPlaces({ id: area.id, coordinates: anchorCoordinates }, candidates, {
    radiusKm: 2,
    limit: 5,
    overrideIds: area.nearbyOverrides,
  });

  return (
    <div>
      <Link href={`${basePath}?s=areas`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700">
        <IconArrowRight className="h-4 w-4" />
        كل المناطق
      </Link>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative h-44 w-full">
          <Image src={area.image} alt={area.name} fill sizes="100vw" className="object-cover" />
          <p dir="ltr" className="absolute bottom-3 right-3 text-xl font-bold text-white drop-shadow">
            {area.name}
          </p>
        </div>
        <div className="p-5">
          <p className="text-sm leading-6 text-slate-600">{area.description}</p>

          {mustSee && (
            <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-amber-700">
              <IconStar filled className="h-4 w-4" />
              أهم شي هون: <span dir="ltr">{mustSee.name}</span>
            </p>
          )}

          <div className="mt-4">
            <LocationInfo address={area.address} mapsUrl={area.mapsUrl} appleMapsUrl={area.appleMapsUrl} label="نقطة مقترحة للبدء" />
          </div>
        </div>
      </div>

      <p className="mt-6 text-sm font-semibold text-slate-500">قريب من بعض بهذه المنطقة:</p>
      {nearby.length === 0 ? (
        <p className="mt-3 text-sm leading-6 text-slate-500">ما فيه أماكن ثانية قريبة كفاية ضمن مسافة مشي معقولة حاليًا.</p>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {nearby.map((item) => (
            <ExternalLink
              key={item.id}
              href={item.href}
              className="flex gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="80px"
                  style={item.imagePosition ? { objectPosition: item.imagePosition } : undefined}
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p dir="ltr" className="truncate text-sm font-bold text-slate-900">
                  {item.name}
                </p>
                {typeof item.distanceKm === "number" && (
                  <p className="mt-0.5 text-xs font-semibold text-teal-700">📍 {formatDistanceAr(item.distanceKm)}</p>
                )}
                {item.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.description}</p>}
              </div>
            </ExternalLink>
          ))}
        </div>
      )}
    </div>
  );
}
