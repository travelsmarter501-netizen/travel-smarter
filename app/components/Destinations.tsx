"use client";

import Image from "next/image";
import Link from "next/link";
import Container from "./Container";
import SectionHeading from "./SectionHeading";
import Flag from "./Flag";
import { useLanguage } from "../lib/language";
import { destinations } from "../lib/content";

export default function Destinations() {
  const { t } = useLanguage();

  return (
    <section id="destinations" className="scroll-mt-20 py-16 sm:py-20">
      <Container>
        <SectionHeading title={t.destinations.title} />

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {t.destinations.items.map((item) => {
            // t.destinations.items is the curated, ordered, bilingual-name homepage teaser
            // list -- everything else (image/country/status) is still sourced from
            // lib/content.ts's own destinations array, never duplicated here.
            const destination = destinations.find((entry) => entry.slug === item.slug);
            if (!destination) return null;

            const available = destination.status === "available";
            const badge = available ? t.destinations.barcelona.badge : t.destinations.comingSoonBadge;
            const card = (
              <div className="group relative aspect-[3/4] w-full overflow-hidden rounded-2xl">
                <Image
                  src={destination.image}
                  alt={item.name}
                  fill
                  loading="lazy"
                  sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                  className={`object-cover transition-transform duration-300 ${available ? "group-hover:scale-105" : "grayscale-[35%]"}`}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />

                <span
                  className={`absolute start-2.5 top-2.5 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm ${
                    available ? "bg-teal-700 text-white" : "bg-white/90 text-slate-700"
                  }`}
                >
                  {badge}
                </span>

                <div className="absolute inset-x-2.5 bottom-2.5 text-white">
                  <p dir="auto" className="flex items-center gap-1.5 text-sm font-bold">
                    {item.name}
                    <Flag code={destination.countryCode} countryName={destination.country} className="h-3 w-4.5" />
                  </p>
                </div>
              </div>
            );

            return available ? (
              <Link key={destination.slug} href="/#products" aria-label={`${t.destinations.barcelona.cta} — ${item.name}`}>
                {card}
              </Link>
            ) : (
              <div key={destination.slug} aria-disabled="true">
                {card}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
