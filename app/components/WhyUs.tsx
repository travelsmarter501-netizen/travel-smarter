"use client";

import Container from "./Container";
import SectionHeading from "./SectionHeading";
import { IconClock, IconCompass, IconSparkles } from "./icons";
import { useLanguage } from "../lib/language";

const icons = [IconSparkles, IconClock, IconCompass];

export default function WhyUs() {
  const { t } = useLanguage();

  return (
    <section id="about" className="scroll-mt-20 bg-slate-50 py-16 sm:py-20">
      <Container>
        <SectionHeading title={t.trust.title} />

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {t.trust.items.map((item, index) => {
            const Icon = icons[index];
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
