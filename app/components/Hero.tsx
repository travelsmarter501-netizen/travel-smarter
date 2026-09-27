"use client";

import Image from "next/image";
import Container from "./Container";
import Button from "./Button";
import { useLanguage } from "../lib/language";

// General, non-destination-specific travel visual -- Travel Smarter covers many destinations,
// not just Barcelona, so the Hero must not read as a single-city brand. Manually added by the
// user at public/hero/travel-world-hero.png (1672x941, ~16:9) -- the container below uses
// aspect-[16/9] to match its native ratio exactly, so object-cover needs no cropping and every
// landmark in the image stays visible.
const HERO_IMAGE = "/hero/travel-world-hero.png";

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section id="hero" className="relative overflow-hidden scroll-mt-20">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-teal-50/70 via-white to-white" />

      <Container className="grid items-center gap-10 py-14 sm:py-16 md:grid-cols-2 md:py-20 lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-sm font-semibold text-teal-800">
            {t.hero.eyebrow}
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            {t.hero.headline}
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">{t.hero.supporting}</p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button href="/#products" size="lg">
              {t.hero.primaryCta}
            </Button>
            <Button href="/#products" variant="secondary" size="lg">
              {t.hero.secondaryCta}
            </Button>
          </div>
        </div>

        <div className="relative mx-auto aspect-[16/9] w-full max-w-md overflow-hidden rounded-[2rem] shadow-2xl md:max-w-none">
          <Image
            src={HERO_IMAGE}
            alt={t.hero.imageAlt}
            fill
            priority
            sizes="(min-width: 768px) 480px, 90vw"
            className="object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/0 to-transparent" />
        </div>
      </Container>
    </section>
  );
}
