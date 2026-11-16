import type { Metadata } from "next";
import { getCityPlannerModule } from "../lib/planner/cityPlannerRegistry";
import type { ImageCredit } from "../lib/guideTypes";
import { isServedPlannerDestinationId } from "../lib/planner/plannerDestinations";

/**
 * Photo credits for the place photos shown in the plans (Wikimedia Commons, free licences). CC BY, CC BY-SA and the Free Art
 * License require the author, a link to the file and a link to the licence; they are listed here, one page linked from the
 * footer, instead of inside the plan. Built from the cities' own place data, so a new credited photo appears here by itself.
 */
export const metadata: Metadata = {
  title: "حقوق الصور · Photo credits | Travel Smarter",
  robots: { index: false },
};

type Credited = ImageCredit & { id: string; name: string; image: string };

/** `onlyWhenSelectable`: listed only while the city can be chosen (public, or the local / Preview switch), so an unreleased city is not shown. */
const CITIES: { id: string; titleAr: string; titleEn: string; onlyWhenSelectable?: boolean; noteAr?: string; noteEn?: string }[] = [
  { id: "prague", titleAr: "براغ", titleEn: "Prague" },
  { id: "barcelona", titleAr: "برشلونة", titleEn: "Barcelona" },
  {
    id: "budapest",
    titleAr: "بودابست",
    titleEn: "Budapest",
    onlyWhenSelectable: true,
    noteAr: "كل صورة نسخة مصغّرة (960 بكسل) من الملف الأصلي على Wikimedia Commons، بدون أي تعديل تاني.",
    noteEn: "Each photo is a resized copy (960 px) of the original file on Wikimedia Commons, with no other change.",
  },
];

function creditedPlaces(cityId: string): Credited[] {
  const city = getCityPlannerModule(cityId);
  if (!city) return [];
  const p = city.places;
  const all = [...p.attractions, ...p.experiences, ...p.foodPlaces, ...p.nightlifeVenues, ...p.shoppingAreas, ...(p.beaches ?? [])] as unknown as Credited[];
  const seen = new Set<string>();
  return all
    .filter((x) => x.image && x.imageAuthor && !seen.has(x.image) && seen.add(x.image))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const LINK = "underline decoration-dotted underline-offset-2 hover:text-slate-900";

export default function PhotoCreditsPage() {
  return (
    <main className="theme-brand mx-auto w-full max-w-3xl px-5 pb-16 pt-8 sm:px-8">
      <h1 className="text-2xl font-bold text-slate-900">حقوق الصور</h1>
      <p dir="ltr" className="mt-1 text-sm text-slate-500">Photo credits</p>
      <p className="mt-3 text-sm leading-6 text-slate-600">صور الأماكن بالخطط من Wikimedia Commons، كل صورة برخصتها واسم مصوّرها.</p>
      {CITIES.map((c) => {
        // Shown while the city is served (its photos still appear in existing plans), even when closed to new requests.
        if (c.onlyWhenSelectable && !isServedPlannerDestinationId(c.id)) return null;
        const places = creditedPlaces(c.id);
        if (places.length === 0) return null;
        return (
          <section key={c.id} className="mt-8">
            <h2 className="text-lg font-bold text-slate-900">
              {c.titleAr} <span dir="ltr" className="text-sm font-normal text-slate-500">· {c.titleEn}</span>
            </h2>
            {c.noteAr && <p className="mt-1 text-xs leading-5 text-slate-500">{c.noteAr}</p>}
            {c.noteEn && <p dir="ltr" className="text-start text-xs leading-5 text-slate-500">{c.noteEn}</p>}
            <ul className="mt-3 space-y-2 text-[13px] leading-5 text-slate-600">
              {places.map((x) => (
                <li key={x.image} id={`photo-${x.id}`} className="scroll-mt-24">
                  <span dir="auto" className="font-semibold text-slate-800">{x.name}</span>
                  <span dir="ltr" className="block text-start">
                    {x.imageSourceUrl ? <a href={x.imageSourceUrl} target="_blank" rel="noopener noreferrer" className={LINK}>{x.imageAuthor}</a> : x.imageAuthor}
                    {x.imageLicense && (
                      <>
                        {" · "}
                        {x.imageLicenseUrl ? <a href={x.imageLicenseUrl} target="_blank" rel="noopener noreferrer" className={LINK}>{x.imageLicense}</a> : x.imageLicense}
                      </>
                    )}
                    {x.imageSource && ` · ${x.imageSource}`}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
