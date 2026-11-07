"use client";

import Container from "./Container";
import HomeVideo from "./home/HomeVideo";
import { useLanguage } from "../lib/language";

/**
 * Top of the homepage: the destination-neutral introduction (headline and one line saying what the product is) and the product video on its own, in a clean frame (moderate corners, a thin border, no photo, layers or large shadow), with its small title
 * above it. The video file, player and poster are unchanged; the 4:5 box keeps the recording's own ratio. Its poster is a still of a real plan,
 * so the product is visible without playing it. Phones: the video's width follows the screen height, so the headline, the line and the whole
 * video fit on the first screen above the fixed purchase bar; from 768 px the text and the video sit side by side.
 *
 * The introduction appears on load with plain CSS (`.home-load`, none with reduced motion), so it never waits for scrolling or JavaScript.
 *
 * Anchors: `#video` (the header's "كيف بتشتغل") is the video; `#hero`, `#how` and `#about` are kept for older links.
 */
export default function Hero() {
  const { t } = useLanguage();
  const intro = t.home.intro;
  const video = t.home.video;

  return (
    <section id="top" className="bg-white pb-10 pt-6 sm:pb-14 sm:pt-12 lg:pb-16 lg:pt-14">
      <span id="hero" className="block scroll-mt-20" aria-hidden="true" />
      <span id="how" className="block scroll-mt-20" aria-hidden="true" />
      <span id="about" className="block scroll-mt-20" aria-hidden="true" />
      <Container>
        <div className="mx-auto grid max-w-5xl items-center gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:gap-12 lg:gap-20">
          {/* Centred on phones (title and line, then the video under them); start-aligned beside the video from 768 px. */}
          <div className="text-center md:text-start">
            <h1 className="home-load text-balance text-[2.75rem] font-bold leading-[1.12] tracking-tight text-ink sm:text-[4rem] sm:leading-[1.08] md:text-[3.25rem] lg:text-[4rem]" style={{ "--d": "0.1s" } as React.CSSProperties}>
              {intro.headline}
            </h1>
            <p className="home-load mx-auto mt-4 max-w-[19rem] text-balance ltr:max-w-[22rem] text-base leading-[1.8] text-muted sm:max-w-md sm:text-lg sm:leading-8 md:mx-0" style={{ "--d": "0.2s" } as React.CSSProperties}>
              {intro.description}
            </p>
          </div>

          <div id="video" className="home-load mx-auto w-[clamp(10.5rem,calc((100svh-26rem)*0.8),15rem)] scroll-mt-24 sm:w-[18rem] md:w-[17rem] lg:w-[18.5rem]" style={{ "--d": "0.35s" } as React.CSSProperties}>
            <h2 className="mb-2 text-center text-sm font-semibold text-ink">{video.title}</h2>
            {/* HomeVideo draws its own frame: rounded corners, a thin border and a small shadow. */}
            <HomeVideo />
            {video.languageNote && <p className="mt-2 text-center text-sm text-muted">{video.languageNote}</p>}
          </div>
        </div>
      </Container>
    </section>
  );
}
