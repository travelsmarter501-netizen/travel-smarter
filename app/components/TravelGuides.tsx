import Image from "next/image";
import Container from "./Container";
import SectionHeading from "./SectionHeading";
import Button from "./Button";
import Flag from "./Flag";
import Price from "./Price";
import { guides } from "../lib/content";

export default function TravelGuides() {
  return (
    <section id="guides" className="scroll-mt-20 py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="دلائل سياحية"
          title="كل ما تحتاج معرفته، في دليل واحد"
          description="أدلة رقمية موجزة تشرح لك كل وجهة: أفضل الأماكن، المطاعم، المواصلات، ونصائح لا غنى عنها—بسعر بسيط."
        />

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {guides.map(({ destination }) => {
            const isComingSoon = destination.status === "coming-soon";

            return (
              <div
                key={destination.slug}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                  <Image
                    src={destination.image}
                    alt={destination.name}
                    fill
                    sizes="64px"
                    className={`object-cover ${isComingSoon ? "grayscale-[30%]" : ""}`}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p dir="ltr" className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                    <span className="truncate">{destination.name}</span>
                    <Flag code={destination.countryCode} countryName={destination.country} className="h-3 w-4.5 shrink-0" />
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{destination.description}</p>
                  {isComingSoon ? (
                    <span className="mt-1 inline-block text-sm font-semibold text-slate-500">قريبًا</span>
                  ) : (
                    <Price ils={destination.guidePrice} className="mt-1 text-sm font-semibold text-teal-700" />
                  )}
                </div>

                {isComingSoon ? (
                  <span className="inline-flex shrink-0 cursor-not-allowed items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-400">
                    قريبًا
                  </span>
                ) : (
                  <Button href={`/guides/${destination.slug}`} variant="secondary" size="md" className="shrink-0">
                    شاهد الدليل
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">أدلة وجهات جديدة تُضاف باستمرار.</p>
      </Container>
    </section>
  );
}
