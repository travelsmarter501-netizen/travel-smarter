"use client";

import { useState } from "react";
import Image from "next/image";
import Container from "../Container";
import HomeButton from "./HomeButton";
import HomePhotoCredits from "./HomePhotoCredits";
import BottomSheet from "../guide/BottomSheet";
import LocationInfo from "../guide/LocationInfo";
import SmartPlannerTransportConnector from "../smart-planner/SmartPlannerTransportConnector";
import { IconArrowRight, IconChevronDown, IconClock } from "../icons";
import { START_PLAN_HREF } from "./homeOffer";
import { formatMinutesAr } from "../../lib/readyPlan";
import { HOME_SAMPLE_PLAN, type HomeSampleStop } from "../../lib/home/homeSamplePlan";
import { useLanguage } from "../../lib/language";
import type { ResolvedPlaceSummary } from "../../lib/readyPlan";

// Same width the real day view reserves for its time + number rail.
const RAIL_WIDTH = "w-11 sm:w-12";
const STOP_CARD = "flex w-full flex-col rounded-xl border border-line bg-white p-3 text-right shadow-sm";

function toSummary(stop: HomeSampleStop): ResolvedPlaceSummary {
  return {
    id: stop.id,
    name: stop.name,
    image: stop.image,
    imagePosition: stop.imagePosition,
    categoryLabel: stop.categoryLabel,
    address: stop.address,
    coordinates: stop.coordinates,
  };
}

export function Rail({ number, timeRange }: { number: number; timeRange: string }) {
  const [start, end] = timeRange.split("–");
  return (
    <div className={`flex ${RAIL_WIDTH} flex-shrink-0 flex-col items-center`}>
      <div dir="ltr" className="flex flex-col items-center text-center text-xs font-bold leading-tight text-muted">
        <span>{start}</span>
        <span>{end}</span>
      </div>
      <span className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{number}</span>
      <span className="mt-1 w-px flex-1 border-r border-dashed border-slate-300" aria-hidden="true" />
    </div>
  );
}

export function StopContent({ stop, hint }: { stop: HomeSampleStop; hint?: string }) {
  return (
    <>
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-surface">
          <Image
            src={stop.image}
            alt={stop.name}
            width={64}
            height={64}
            sizes="64px"
            style={stop.imagePosition ? { objectPosition: stop.imagePosition } : undefined}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p dir="auto" className="line-clamp-2 text-sm font-bold leading-snug text-ink">
            {stop.name}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-muted">
            <IconClock className="h-3 w-3 text-brand" />
            {formatMinutesAr(stop.visitDurationMinutes)}
          </p>
        </div>
      </div>
      {hint && (
        <span className="mt-2.5 flex items-center gap-1 text-xs font-bold text-brand">
          {hint}
          <IconArrowRight className="h-3.5 w-3.5 rotate-180" aria-hidden="true" />
        </span>
      )}
    </>
  );
}

/**
 * "جرّب مثال": a FREE, ready-made example -- not a customized plan and not the questionnaire. It shows the example's inputs as plain facts (they
 * are not controls: nothing here can be changed) and, under a native <details> "Try an example" button, the day-1 excerpt of the public sample
 * (lib/home/homeSamplePlan.ts: three stops, the two transport legs and ONE openable place). <details> keeps it working without JavaScript.
 * The real thing starts at /planner?new=1.
 *
 * The plan view is Arabic and right-to-left in the product, so the example card is always rendered that way, whatever the page language.
 */
export default function HomeExample() {
  const { t } = useLanguage();
  const copy = t.home.example;
  const [open, setOpen] = useState(false);

  const sample = HOME_SAMPLE_PLAN;
  const detailsStop = sample.stops.find((stop) => stop.id === sample.details.placeId);

  return (
    <section id="example" className="scroll-mt-20 pb-10 pt-4 sm:pb-12 sm:pt-6">
      <Container>
        <div className="mx-auto max-w-2xl">
          {/* Before opening: the badge, one short line and the button. Everything else is inside. */}
          <div data-reveal className="flex flex-col items-center text-center">
            <span className="inline-flex rounded-full bg-apricot/60 px-3 py-1 text-sm font-bold text-ink">{copy.badge}</span>
            <p className="mt-2.5 text-base font-semibold text-ink">{copy.summary}</p>
          </div>

          <details data-reveal className="group mt-4">
            <summary className="mx-auto flex min-h-12 w-full max-w-sm cursor-pointer list-none items-center justify-center gap-2 rounded-full border-2 border-brand bg-white px-6 text-base font-bold text-brand transition-colors hover:bg-brand-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">
              <span>{copy.entry}</span>
              <IconChevronDown className="h-5 w-5 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
            </summary>

            <div className="home-details-body mt-5 rounded-[1.75rem] bg-surface p-4 sm:p-6">
              <p className="text-balance text-center text-base leading-7 text-muted">{copy.hint}</p>
              {/* The example's inputs as compact facts (they are not controls). */}
              <ul aria-label={copy.inputsTitle} className="mb-5 mt-3 flex flex-wrap justify-center gap-2">
                {copy.inputs.map((input) => (
                  <li key={input.label} className="rounded-full border border-line bg-white px-3 py-1 text-sm text-ink">
                    <span className="text-muted">{input.label}: </span>
                    <span className="font-semibold">{input.value}</span>
                  </li>
                ))}
              </ul>
              <div dir="rtl">
                <p dir="auto" className="text-sm font-bold text-ink">
                  {copy.dayLabel.replace("{n}", String(sample.dayNumber))} · {sample.dayTitle}
                </p>
                <div className="mt-4">
                  {sample.stops.map((stop, index) => {
                    const next = sample.stops[index + 1];
                    const leg = sample.legs[index];
                    const canOpen = stop.id === sample.details.placeId;
                    return (
                      <div key={stop.id} data-example-stop>
                        <div className="flex items-stretch gap-2">
                          <Rail number={index + 1} timeRange={stop.timeRange} />
                          <div className="mb-3 flex-1">
                            {canOpen ? (
                              <button
                                type="button"
                                onClick={() => setOpen(true)}
                                className={`${STOP_CARD} transition-[box-shadow,transform] hover:shadow-md active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand`}
                              >
                                <StopContent stop={stop} hint={copy.detailsHint} />
                              </button>
                            ) : (
                              <div className={STOP_CARD}>
                                <StopContent stop={stop} />
                              </div>
                            )}
                          </div>
                        </div>
                        {next && leg && <SmartPlannerTransportConnector leg={leg} from={toSummary(stop)} to={toSummary(next)} railWidth={RAIL_WIDTH} />}
                      </div>
                    );
                  })}
                </div>
              </div>
              <HomePhotoCredits className="mb-3" />
              <HomeButton href={START_PLAN_HREF} variant="secondary" className="mt-2 w-full">
                {copy.start}
              </HomeButton>
            </div>
          </details>
        </div>
      </Container>

      <BottomSheet open={open} onClose={() => setOpen(false)} title={detailsStop?.name}>
        <div dir="rtl" className="space-y-3 text-right">
          <p className="text-sm leading-6 text-muted">{sample.details.description}</p>
          <LocationInfo area={sample.details.areaName} address={sample.details.address} mapsUrl={sample.details.mapsUrl} appleMapsUrl={sample.details.appleMapsUrl} />
          <div className="space-y-1.5 text-sm text-ink">
            <p className="flex items-center gap-1.5">
              <span aria-hidden="true">🎟️</span>
              <span>
                {copy.sheetPrice}: {sample.details.priceText}
              </span>
            </p>
            <p className="flex items-center gap-1.5">
              <span aria-hidden="true">📅</span>
              <span>
                {copy.sheetBooking}: {sample.details.bookingStatus}
              </span>
            </p>
          </div>
        </div>
      </BottomSheet>
    </section>
  );
}
