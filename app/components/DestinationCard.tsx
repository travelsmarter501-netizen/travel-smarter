import Image from "next/image";
import Link from "next/link";
import Flag from "./Flag";
import Price from "./Price";
import { IconBook, IconPackage, IconSparkles } from "./icons";
import type { Destination } from "../lib/content";

export default function DestinationCard({
  destination,
}: {
  destination: Destination;
}) {
  const {
    name,
    country,
    countryCode,
    image,
    description,
    slug,
    status,
  } = destination;

  const isComingSoon = status === "coming-soon";

  // Barcelona (the only available destination) sells through the homepage products section;
  // its gated content routes are for owners only, so no card links straight to them.
  const isBarcelona = slug === "barcelona";

  const productLinks = [
    {
      key: "customPlanPrice",
      label: "خطة مخصصة",
      // Only ever rendered for an "available" destination (see isComingSoon below) -- today
      // that's Barcelona alone, so this resolves to /smart-planner/barcelona. Same fix as the
      // homepage's "خطة سفر مخصصة" card: it used to self-reference "/#custom-plan" instead of
      // opening the real product.
      href: isBarcelona ? "/#products" : `/smart-planner/${slug}`,
      icon: IconSparkles,
    },
    {
      key: "packagePrice",
      label: "رزمة جاهزة",
      // Barcelona has a real, rich 5-day Ready Package at /ready-plans/barcelona -- other
      // destinations (currently all "coming-soon") have no such page yet, so they keep the
      // generic /packages/${slug} route.
      href: isBarcelona ? "/#products" : `/packages/${slug}`,
      icon: IconPackage,
    },
    {
      key: "guidePrice",
      label: "دليل سياحي",
      href: isBarcelona ? "/#products" : `/guides/${slug}`,
      icon: IconBook,
    },
  ] as const;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg">
      <div className="relative h-52 w-full overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className={`object-cover transition-transform duration-300 ${
            isComingSoon ? "grayscale-[30%]" : "group-hover:scale-105"
          }`}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        {isComingSoon && (
          <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm">
            قريبًا
          </div>
        )}

        <div className="absolute bottom-4 right-4 text-white">
          <p
            dir="ltr"
            className="flex items-center justify-end gap-2 text-xl font-bold"
          >
            <span>{name}</span>
            <Flag
              code={countryCode}
              countryName={country}
              className="h-4 w-6"
            />
          </p>

          <p className="mt-1 text-sm text-white/85">{country}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm leading-6 text-slate-600">{description}</p>

        <ul className="mt-4 grid grid-cols-3 gap-2">
          {productLinks.map(({ key, label, href, icon: Icon }) => (
            <li key={key}>
              {isComingSoon ? (
                <div className="flex cursor-not-allowed flex-col items-center gap-1 rounded-xl border border-slate-100 bg-slate-50 px-2 py-2.5 text-center opacity-60">
                  <Icon className="h-4 w-4 text-slate-500" />

                  <span className="text-[11px] font-medium text-slate-600">
                    {label}
                  </span>

                  <span className="text-xs font-bold text-slate-500">
                    قريبًا
                  </span>
                </div>
              ) : (
                <Link
                  href={href}
                  className="flex flex-col items-center gap-1 rounded-xl border border-slate-100 bg-slate-50 px-2 py-2.5 text-center transition-colors hover:border-teal-200 hover:bg-teal-50"
                >
                  <Icon className="h-4 w-4 text-teal-700" />

                  <span className="text-[11px] font-medium text-slate-600">
                    {label}
                  </span>

                  <Price
                    ils={destination[key]}
                    className="text-sm font-bold text-slate-900"
                  />
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
