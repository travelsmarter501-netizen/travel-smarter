import Image from "next/image";
import { IconMapPin } from "../icons";
import ExternalLink from "./ExternalLink";
import type { StayArea } from "../../lib/guideTypes";

export default function StayGrid({ areas }: { areas: StayArea[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {areas.map((area) => (
        <div key={area.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative h-32 w-full">
            <Image src={area.image} alt={area.name} fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
            <p dir="ltr" className="absolute bottom-2.5 right-2.5 text-base font-bold text-white drop-shadow">
              {area.name}
            </p>
          </div>

          <div className="p-4">
            <p className="text-xs font-semibold text-slate-500">Best for</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {area.bestFor.map((label) => (
                <span key={label} className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                  {label}
                </span>
              ))}
            </div>

            <p className="mt-3 text-sm font-bold text-slate-900" dir="ltr">
              Price: <span className="font-normal text-slate-600">{area.priceLevel}</span>
            </p>

            <div className="mt-2 space-y-1">
              {area.pros.map((pro) => (
                <p key={pro} className="text-sm text-emerald-700">
                  ✓ {pro}
                </p>
              ))}
              {area.cons.map((con) => (
                <p key={con} className="text-sm text-slate-500">
                  − {con}
                </p>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <ExternalLink
                href={area.mapsUrl}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-teal-300"
              >
                <IconMapPin className="h-3.5 w-3.5" />
                Google Maps
              </ExternalLink>
              <ExternalLink
                href={area.appleMapsUrl}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-teal-300"
              >
                <IconMapPin className="h-3.5 w-3.5" />
                Apple Maps
              </ExternalLink>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
