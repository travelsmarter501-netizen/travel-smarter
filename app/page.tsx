import Hero from "./components/Hero";
import FAQ from "./components/FAQ";
import { HomeAudienceProvider } from "./components/home/HomeAudience";
import HomeBottomCta from "./components/home/HomeBottomCta";
import HomeExample from "./components/home/HomeExample";
import HomeOfferVisual from "./components/home/HomeOfferVisual";
import HomePricing from "./components/home/HomePricing";
import HomeProblems from "./components/home/HomeProblems";
import HomeMotion from "./components/home/HomeMotion";

/**
 * Single-product homepage: Header (logo + compact menu) / product video / visual offer / free example / price / FAQ / footer (Header and
 * Footer live in layout.tsx). It sells ONE product -- the personalized plan -- and every start button opens a new questionnaire (/planner?new=1),
 * including the floating purchase button (HomeBottomCta), which exists on this page only.
 *
 * The old multi-product storefront is not shown here any more, but nothing was removed from the product: the 1-day / 3-day / 5-day plan and
 * Guide routes, /checkout (including /checkout?product=...), carts that already hold items and every existing purchase work as before.
 * Components.tsx files that are no longer mounted (Products, Destinations, WhyUs, ItineraryPreview, HowItWorks, ProductCategories,
 * ReadyPackages, TravelGuides, PopularDestinations) still exist, unused.
 */
export default function Home() {
  return (
    <main className="theme-brand home-page">
      <HomeAudienceProvider>
        <Hero />
        <HomeProblems />
        <HomeOfferVisual />
        <HomeExample />
        <HomePricing />
        <FAQ />
        <HomeBottomCta />
        <HomeMotion />
      </HomeAudienceProvider>
    </main>
  );
}
