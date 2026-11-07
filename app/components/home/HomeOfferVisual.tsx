"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Container from "../Container";
import { Rail, StopContent } from "./HomeExample";
import { formatPlannerTransportOptionLabel, PLANNER_TRANSPORT_MODE_META, PLANNER_TRANSPORT_MODE_ORDER, plannerTransportModeLabel } from "../../lib/planner/plannerTransportFormat";
import { homeSampleForLanguage } from "../../lib/home/homeSamplePlan";
import { isRtlLanguage } from "../../lib/homepageTranslations";
import { useLanguage } from "../../lib/language";
import { bookingStatusText } from "../../lib/i18n/planText";

// Inside the scenes everything is the product's own output, shown in the page language like the plan view itself (homeSampleForLanguage).
const SCENE_COUNT = 3;

const getSlides = (el: HTMLElement | null) => Array.from(el?.children ?? []) as HTMLElement[];
// The scenes only form a gallery while they overflow their row (phones, tablets); on wide screens they sit side by side.
const isScrollable = (el: HTMLElement | null) => !!el && el.scrollWidth > el.clientWidth + 4;

function SceneTitle({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <h3 className={`flex items-center gap-2 text-lg font-bold ${light ? "text-white" : "text-ink"}`}>
      <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-apricot" />
      {children}
    </h3>
  );
}

function Chevron({ direction }: { direction: "back" | "forward" }) {
  // "back" points to the reading start (right in Arabic), "forward" to the reading end; the icon mirrors in RTL.
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={`h-5 w-5 ${direction === "back" ? "rtl:-scale-x-100" : "ltr:-scale-x-100"}`}>
      <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12.5 4.5 7 10l5.5 5.5" />
    </svg>
  );
}

/**
 * Product presentation ("الخطة المخصصة إلك"): three scenes built from the real output of the approved public sample (lib/home/homeSamplePlan.ts),
 * each with its title inside it, in this order:
 *  1. "يومك بالترتيب": the first two stops of day 1 with the time rail and the real walking leg between them (the example's own components);
 *  2. "تفاصيل كل مكان": one place's photograph with its details (category, area, description, price text, booking note);
 *  3. "التنقّل بين المحطات": the two transport options of one leg exactly as the engine produced them, the suggested one marked.
 * Fragments only: nothing is invented and the complete excerpt lives only in the example ("شوف مثال").
 *
 * Phones and tablets: a horizontal gallery the visitor swipes (native scroll with scroll-snap, RTL-aware, no autoplay, vertical page scrolling
 * untouched), one full scene plus a glimpse of the next (which, with the dots and arrows, is what tells the visitor to swipe), two arrows with screen-reader names and three dots that show and
 * set the current scene. The gallery's height follows the current scene (measured, with a short height transition that is off with reduced
 * motion), so a long scene never leaves a large gap under a short one; only content below the gallery moves. The scroller itself is focusable,
 * so the keyboard arrow keys scroll it too. Wide screens (1024 px and up): the three scenes side by side, no controls. Without JavaScript the
 * gallery still scrolls and shows every scene at its natural height.
 *
 * The whole gallery appears once with the section (HomeMotion, `data-reveal` on the gallery block, not on each scene), so a scene is never
 * hidden when the visitor swipes to it.
 */
export default function HomeOfferVisual() {
  const { t, language } = useLanguage();
  const copy = t.home.product;
  const planCopy = t.home;
  const dir = isRtlLanguage(language) ? "rtl" : "ltr";
  const sample = homeSampleForLanguage(language);
  const place = sample.stops.find((stop) => stop.id === sample.details.placeId) ?? sample.stops[1];
  const firstLeg = sample.legs[0];
  const firstLegOption = firstLeg.options.find((o) => o.mode === firstLeg.recommendedMode) ?? firstLeg.options[0];
  const leg = sample.legs[sample.legs.length - 1];
  const from = sample.stops.find((stop) => stop.id === leg.fromPlaceId);
  const to = sample.stops.find((stop) => stop.id === leg.toPlaceId);
  const options = [...leg.options].sort((a, b) => PLANNER_TRANSPORT_MODE_ORDER.indexOf(a.mode) - PLANNER_TRANSPORT_MODE_ORDER.indexOf(b.mode));
  const titles = [copy.schedule, copy.details, copy.transport];

  const scrollerRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [height, setHeight] = useState<number | null>(null);

  // Which scene is current: the one whose start edge is closest to the scroller's start edge (inline-start padding included).
  const measure = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    if (!isScrollable(el)) {
      setHeight(null);
      return;
    }
    const rtl = getComputedStyle(el).direction === "rtl";
    const box = el.getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(el).paddingInlineStart) || 0;
    let best = 0;
    let bestDistance = Infinity;
    getSlides(el).forEach((slide, index) => {
      const r = slide.getBoundingClientRect();
      const distance = Math.abs(rtl ? box.right - pad - r.right : r.left - (box.left + pad));
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    // At the end of the row the last scene cannot reach the start edge (wide gallery, short last slide): then it is the current one.
    const remaining = el.scrollWidth - el.clientWidth - Math.abs(el.scrollLeft);
    if (remaining <= 2) best = getSlides(el).length - 1;
    setActive(best);
    const current = getSlides(el)[best];
    if (current) setHeight(current.offsetHeight + (parseFloat(getComputedStyle(el).paddingBottom) || 0));
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    el.addEventListener("scroll", onScroll, { passive: true });
    const observer = new ResizeObserver(onScroll);
    observer.observe(el);
    getSlides(el).forEach((slide) => observer.observe(slide));
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [measure]);

  const goTo = (index: number) => {
    const el = scrollerRef.current;
    const target = getSlides(el)[Math.max(0, Math.min(SCENE_COUNT - 1, index))];
    if (!el || !target) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    const box = el.getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(el).paddingInlineStart) || 0;
    const r = target.getBoundingClientRect();
    const delta = rtl ? r.right - (box.right - pad) : r.left - (box.left + pad);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: delta, behavior: reduce ? "auto" : "smooth" });
  };

  const sceneClass = "w-[calc(100%-2.75rem)] shrink-0 snap-start sm:w-[min(34rem,calc(100%-5rem))] lg:w-auto";

  return (
    <section id="offer" className="scroll-mt-20 bg-white py-10 sm:py-14">
      <Container>
        <div className="max-w-2xl">
          <h2 data-reveal className="text-balance text-[2.05rem] font-bold leading-tight tracking-tight text-ink sm:text-[3.25rem]">
            {copy.title}
          </h2>
          <p data-reveal className="mt-2 text-base leading-7 text-muted sm:text-lg">
            {t.home.offer.includes}
          </p>
        </div>
      </Container>

      <div data-reveal className="mx-auto mt-6 max-w-7xl sm:mt-8 lg:px-10">

        <ul
          ref={scrollerRef}
          tabIndex={0}
          aria-label={copy.title}
          style={height ? { height } : undefined}
          className="flex snap-x snap-mandatory items-start gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-px-5 px-5 pb-1 transition-[height] duration-300 ease-out [scrollbar-width:none] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none sm:scroll-px-8 sm:px-8 lg:mt-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {/* 1. The day, in order. */}
          <li className={sceneClass} aria-label={`1 / ${SCENE_COUNT}: ${titles[0]}`}>
            <div className="rounded-[1.5rem] bg-sky-surface p-4 sm:p-5">
              <SceneTitle>{copy.schedule}</SceneTitle>
              <div dir={dir} className="mt-3 text-start">
                <p className="mb-3 text-sm font-bold text-ink">
                  {planCopy.example.dayLabel.replace("{n}", String(sample.dayNumber))} · {sample.dayTitle}
                </p>
                {sample.stops.slice(0, 2).map((stop, index) => (
                  <div key={stop.id}>
                    <div className="flex items-stretch gap-2">
                      <Rail number={index + 1} timeRange={stop.timeRange} />
                      <div className="mb-2 flex w-full flex-col rounded-xl bg-white p-3 text-start">
                        <StopContent stop={stop} lang={language} />
                      </div>
                    </div>
                    {index === 0 && (
                      <p className="mb-2 ms-[3.25rem] flex items-center gap-1.5 text-xs font-semibold text-muted sm:ms-14">
                        <span aria-hidden="true">{PLANNER_TRANSPORT_MODE_META[firstLegOption.mode].icon}</span>
                        {formatPlannerTransportOptionLabel(firstLegOption, language)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </li>

          {/* 2. The details of one place. */}
          <li className={sceneClass} aria-label={`2 / ${SCENE_COUNT}: ${titles[1]}`}>
            <div className="overflow-hidden rounded-[1.5rem] border border-line bg-white">
              <div className="p-4 pb-3 sm:p-5 sm:pb-3">
                <SceneTitle>{copy.details}</SceneTitle>
              </div>
              <div className="relative mx-4 aspect-[16/10] overflow-hidden rounded-xl sm:mx-5">
                <Image src={place.image} alt={place.name} fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 26rem, 85vw" style={place.imagePosition ? { objectPosition: place.imagePosition } : undefined} className="object-cover" />
              </div>
              <div dir={dir} className="p-4 text-start sm:p-5">
                <p dir="auto" className="text-lg font-bold text-ink">
                  {place.name}
                </p>
                <p className="text-xs font-semibold text-muted">
                  {place.categoryLabel} · {sample.details.areaName}
                </p>
                <p className="mt-2 text-sm leading-6 text-ink">{sample.details.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-sm text-ink">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-surface px-3 py-1.5">
                    <span aria-hidden="true">🎟️</span>
                    {planCopy.example.sheetPrice}: {sample.details.priceText}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-surface px-3 py-1.5">
                    <span aria-hidden="true">📅</span>
                    {planCopy.example.sheetBooking}: {bookingStatusText(sample.details.bookingStatus, language)}
                  </span>
                </div>
              </div>
            </div>
          </li>

          {/* 3. Getting between stops. */}
          <li className={sceneClass} aria-label={`3 / ${SCENE_COUNT}: ${titles[2]}`}>
            <div className="rounded-[1.5rem] bg-brand-deep p-4 text-white sm:p-5">
              <SceneTitle light>{copy.transport}</SceneTitle>
              {from && to && (
                <div dir={dir} className="mt-3 text-start">
                  {[from, to].map((stop, index) => (
                    <div key={stop.id}>
                      {index === 1 && <span aria-hidden="true" className="ms-5 block h-5 w-px border-r-2 border-dotted border-on-deep/60" />}
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-white/80">
                          <Image src={stop.image} alt="" fill sizes="40px" style={stop.imagePosition ? { objectPosition: stop.imagePosition } : undefined} className="object-cover" />
                        </div>
                        <p dir="auto" className="min-w-0 flex-1 text-sm font-bold leading-snug text-white">
                          {stop.name}
                        </p>
                      </div>
                    </div>
                  ))}
                  <ul className="mt-4 space-y-2">
                    {options.map((option) => {
                      const recommended = option.mode === leg.recommendedMode;
                      return (
                        <li key={option.mode} className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 ${recommended ? "bg-brand" : "bg-white/10"}`}>
                          <span aria-hidden="true" className="text-xl">
                            {PLANNER_TRANSPORT_MODE_META[option.mode].icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-white">{plannerTransportModeLabel(option.mode, language)}</p>
                            <p className="text-sm text-on-deep">{formatPlannerTransportOptionLabel(option, language)}</p>
                          </div>
                          {recommended && <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-brand">{planCopy.product.recommended}</span>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </li>
        </ul>

        {/* Gallery controls (phones and tablets). */}
        <div className="mt-3 flex items-center justify-center gap-3 px-5 lg:hidden">
          <button
            type="button"
            onClick={() => goTo(active - 1)}
            disabled={active === 0}
            aria-label={copy.previous}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-ink transition-colors hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-40"
          >
            <Chevron direction="back" />
          </button>
          <div className="flex items-center">
            {titles.map((title, index) => (
              <button
                key={title}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`${index + 1} / ${SCENE_COUNT}: ${title}`}
                aria-current={active === index ? "true" : undefined}
                className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
              >
                <span aria-hidden="true" className={`block h-2.5 rounded-full transition-all duration-200 motion-reduce:transition-none ${active === index ? "w-6 bg-brand" : "w-2.5 bg-line"}`} />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => goTo(active + 1)}
            disabled={active === SCENE_COUNT - 1}
            aria-label={copy.next}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-ink transition-colors hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-40"
          >
            <Chevron direction="forward" />
          </button>
        </div>
      </div>
    </section>
  );
}
