import Image from "next/image";
import Container from "./Container";
import SectionHeading from "./SectionHeading";
import Button from "./Button";
import Flag from "./Flag";
import Price from "./Price";
import { IconCalendar } from "./icons";
import { destinations, packages } from "../lib/content";
import { barcelonaReadyPlan } from "../lib/barcelona-ready-plan";

const barcelonaDestination = destinations.find((item) => item.slug === "barcelona")!;

export default function ReadyPackages() {
  return (
    <section id="packages" className="scroll-mt-20 bg-slate-50 py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="رزم سفر جاهزة"
          title="برنامج يوم بيوم، جاهز فورًا"
          description="خطط رحلة كاملة تم إعدادها مسبقًا لكل وجهة. غير مخصصة حسب ميزانيتك أو اهتماماتك الشخصية، لكنها جاهزة للاستخدام فورًا."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Barcelona Ready Package (day-by-day itinerary UI) — a separate product from
              both the "N-Day Complete Plan" packages below and the Barcelona Guide. */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-teal-200 bg-white shadow-sm transition-shadow hover:shadow-lg">
            <div className="relative h-32 w-full overflow-hidden">
              <Image
                src={barcelonaDestination.image}
                alt={barcelonaDestination.name}
                fill
                sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <p dir="ltr" className="absolute bottom-3 right-3 flex items-center gap-2 text-base font-bold text-white">
                <span>{barcelonaDestination.name}</span>
                <Flag code={barcelonaDestination.countryCode} countryName={barcelonaDestination.country} className="h-3.5 w-5" />
              </p>
            </div>

            <div className="flex flex-1 flex-col p-5">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                <IconCalendar className="h-3.5 w-3.5" />3 أيام
              </span>

              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{barcelonaReadyPlan.subtitle}</p>

              <Price ils={barcelonaReadyPlan.priceILS} className="mt-4 text-lg font-bold text-slate-900" />
              <Button href="/#products" variant="primary" size="md" className="mt-4 w-full">
                افتح الخطة
              </Button>
            </div>
          </div>

          {packages.map(({ destination }) => {
            const isComingSoon = destination.status === "coming-soon";

            return (
              <div
                key={destination.slug}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg"
              >
                <div className="relative h-32 w-full overflow-hidden">
                  <Image
                    src={destination.image}
                    alt={destination.name}
                    fill
                    sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className={`object-cover ${isComingSoon ? "grayscale-[30%]" : ""}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  {isComingSoon && (
                    <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm">
                      قريبًا
                    </div>
                  )}
                  <p dir="ltr" className="absolute bottom-3 right-3 flex items-center gap-2 text-base font-bold text-white">
                    <span>{destination.name}</span>
                    <Flag code={destination.countryCode} countryName={destination.country} className="h-3.5 w-5" />
                  </p>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                    <IconCalendar className="h-3.5 w-3.5" />
                    {destination.packageDays} أيام
                  </span>

                  <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{destination.description}</p>

                  {isComingSoon ? (
                    <>
                      <span className="mt-4 text-lg font-bold text-slate-500">قريبًا</span>
                      <span className="mt-4 flex w-full cursor-not-allowed items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-400">
                        قريبًا
                      </span>
                    </>
                  ) : (
                    <>
                      <Price ils={destination.packagePrice} className="mt-4 text-lg font-bold text-slate-900" />
                      <Button href={`/packages/${destination.slug}`} variant="primary" size="md" className="mt-4 w-full">
                        شاهد الرزمة
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
