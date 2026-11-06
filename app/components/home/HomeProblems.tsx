"use client";

import Container from "../Container";
import { useLanguage } from "../../lib/language";

// Bubble tones alternate white / pale sky, with apricot for the last one; the tail uses the same colour (text-* drives the SVG fill).
const TONES = [
  { bubble: "bg-white", tail: "text-white" },
  { bubble: "bg-sky-surface", tail: "text-sky-surface" },
  { bubble: "bg-white", tail: "text-white" },
  { bubble: "bg-apricot", tail: "text-apricot" },
];

/** The small chat tail at the bubble's bottom corner (drawn for the start side; mirrored for the end side and for RTL). */
function Tail({ end, className }: { end: boolean; className: string }) {
  return (
    <svg
      viewBox="0 0 12 16"
      aria-hidden="true"
      className={`absolute bottom-0 h-4 w-3 fill-current ${className} ${end ? "-end-[9px] ltr:-scale-x-100" : "-start-[9px] rtl:-scale-x-100"}`}
    >
      <path d="M12 0C12 7 8.5 13.5 0 16h12z" />
    </svg>
  );
}

/**
 * "صارت معك؟": four short everyday travel situations addressed to the visitor, set as chat-style bubbles on the deep-navy band: each bubble is as
 * wide as its words, with soft corners and a small tail, on alternating sides. They are written for the page and are not customer messages:
 * no names, accounts, photos, times, read receipts or app logos, nothing that imitates a screenshot. A compact band: no decoration competes
 * with the words. The bubbles come in one after the other as the visitor reaches them (HomeMotion, `data-reveal`); everything stays visible
 * without JavaScript or with reduced motion.
 */
export default function HomeProblems() {
  const { t } = useLanguage();
  const copy = t.home.problems;

  return (
    <section id="problems" aria-labelledby="problems-title" className="scroll-mt-20 bg-brand-deep py-8 sm:py-11">
      <Container>
        <div className="mx-auto max-w-xl">
          <h2 data-reveal id="problems-title" className="text-center text-[2.05rem] font-bold leading-tight tracking-tight text-white sm:text-[3.25rem]">
            {copy.title}
          </h2>

          <ul className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:gap-3">
            {copy.items.map((item, index) => {
              const end = index % 2 === 1;
              const tone = TONES[index % TONES.length];
              return (
                <li key={index} data-reveal className={`flex ${end ? "justify-end" : "justify-start"}`}>
                  <p
                    className={`relative w-fit max-w-[84%] rounded-[1.3rem] px-4 py-2.5 text-base leading-7 text-ink sm:max-w-[76%] sm:text-[1.05rem] ${tone.bubble} ${end ? "rounded-ee-md" : "rounded-es-md"}`}
                  >
                    {item}
                    <Tail end={end} className={tone.tail} />
                  </p>
                </li>
              );
            })}
          </ul>

          <p data-reveal className="mt-7 text-center text-base font-semibold text-on-deep sm:text-lg">
            {copy.bridge}
          </p>
        </div>
      </Container>
    </section>
  );
}
