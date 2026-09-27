import Image from "next/image";
import Container from "../Container";
import Flag from "../Flag";
import type { ComponentType, ReactNode, SVGProps } from "react";

type MetaItem = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: ReactNode;
};

export default function DetailHero({
  image,
  name,
  countryCode,
  country,
  kicker,
  title,
  subtitle,
  meta,
}: {
  image: string;
  name: string;
  countryCode: string;
  country: string;
  kicker: string;
  title: string;
  subtitle: string;
  meta: MetaItem[];
}) {
  return (
    <section className="relative">
      <div className="relative h-72 w-full overflow-hidden sm:h-96">
        <Image src={image} alt={name} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
      </div>

      <Container className="relative -mt-24 pb-4 sm:-mt-28">
        <div className="rounded-3xl bg-white p-6 shadow-xl sm:p-8">
          <span className="inline-flex items-center rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
            {kicker}
          </span>

          <p dir="ltr" className="mt-4 flex items-center gap-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            <span>{name}</span>
            <Flag code={countryCode} countryName={country} className="h-5 w-7" />
          </p>
          <p className="mt-1 text-sm text-slate-500">{country}</p>

          <h1 className="mt-4 text-xl font-bold leading-8 text-slate-900 sm:text-2xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{subtitle}</p>

          <div className="mt-6 flex flex-wrap gap-4 border-t border-slate-100 pt-5">
            {meta.map((item, index) => {
              const Icon = item.icon;
              return (
                <span key={index} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Icon className="h-4 w-4 text-teal-700" />
                  {item.label}
                </span>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
