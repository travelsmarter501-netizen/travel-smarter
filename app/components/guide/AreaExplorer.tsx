import Image from "next/image";
import Link from "next/link";
import type { Area } from "../../lib/guideTypes";

export default function AreaExplorer({ areas, basePath }: { areas: Area[]; basePath: string }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {areas.map((area) => (
        <Link
          key={area.id}
          href={`${basePath}?s=areas&area=${area.id}`}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="relative h-32 w-full">
            <Image src={area.image} alt={area.name} fill sizes="(min-width: 640px) 33vw, 100vw" className="object-cover" />
            <p dir="ltr" className="absolute bottom-2.5 right-2.5 text-base font-bold text-white drop-shadow">
              {area.name}
            </p>
          </div>
          <p className="p-4 text-sm leading-6 text-slate-600">{area.description}</p>
        </Link>
      ))}
    </div>
  );
}
