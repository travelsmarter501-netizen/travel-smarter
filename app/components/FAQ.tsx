"use client";

import { useState } from "react";
import Container from "./Container";
import SectionHeading from "./SectionHeading";
import { IconChevronDown } from "./icons";
import { useLanguage } from "../lib/language";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { t } = useLanguage();

  return (
    <section id="faq" className="scroll-mt-20 py-16 sm:py-20">
      <Container className="max-w-3xl">
        <SectionHeading title={t.faq.title} />

        <div className="mt-10 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {t.faq.items.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={faq.question}>
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${index}`}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-start"
                  >
                    <span dir="auto" className="text-base font-semibold text-slate-900">
                      {faq.question}
                    </span>
                    <IconChevronDown
                      className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                </h3>
                {isOpen && (
                  <div id={`faq-panel-${index}`} className="px-6 pb-5">
                    <p dir="auto" className="text-sm leading-7 text-slate-600">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
