import Image from "next/image";
import Container from "../Container";
import Button from "../Button";
import Flag from "../Flag";
import Price from "../Price";
import { IconCheck } from "../icons";

const benefits = ["وفر ساعات من البحث", "استخدمه قبل وأثناء الرحلة", "معلومات مرتبة وسريعة"];

export default function GuideHero({
  image,
  name,
  countryCode,
  country,
  title,
  subtitle,
  priceILS,
  showPurchaseCta = true,
}: {
  image: string;
  name: string;
  countryCode: string;
  country: string;
  title: string;
  subtitle: string;
  priceILS: number;
  /** The visitor is already inside a purchased/available guide — showing "get the guide" here would be confusing. Defaults to true for sales/preview contexts. */
  showPurchaseCta?: boolean;
}) {
  return (
    <section className="relative">
      <div className="relative h-72 w-full overflow-hidden sm:h-96">
        <Image src={image} alt={name} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
      </div>

      <Container className="relative -mt-24 pb-4 sm:-mt-28">
        <div className="rounded-3xl bg-white p-6 shadow-xl sm:p-8">
          <p dir="ltr" className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            <span>{name}</span>
            <Flag code={countryCode} countryName={country} className="h-5 w-7" />
          </p>

          <span className="mt-3 inline-flex w-fit items-center rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
            دليل سياحي
          </span>

          <h1 className="mt-3 text-2xl font-bold leading-9 text-slate-900 sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{subtitle}</p>

          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                <IconCheck className="h-4 w-4 text-teal-700" />
                {benefit}
              </li>
            ))}
          </ul>

          {showPurchaseCta && (
            <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
              <Price ils={priceILS} className="text-2xl font-extrabold text-slate-900" />
              <Button href={`mailto:travelsmarter501@gmail.com?subject=${encodeURIComponent(`استفسار عن دليل ${name}`)}`} size="lg">
                احصل على الدليل
              </Button>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
