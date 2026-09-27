import Hero from "./components/Hero";
import Products from "./components/Products";
import Destinations from "./components/Destinations";
import WhyUs from "./components/WhyUs";
import FAQ from "./components/FAQ";

/**
 * Homepage redesign (2026-08): target structure is Header / Hero / Products / Destinations /
 * Trust / FAQ / Contact+Footer (Header and Footer live in layout.tsx). "How it works" and the
 * old 3-card ProductCategories section were removed to keep the page short -- Products now
 * shows the 4 real products directly with exact prices/routes/cart actions, which already
 * covers what those sections used to explain. Neither component was deleted; they're just no
 * longer mounted here (ProductCategories.tsx, HowItWorks.tsx, ItineraryPreview.tsx,
 * ReadyPackages.tsx, TravelGuides.tsx all still exist, unused).
 */
export default function Home() {
  return (
    <main>
      <Hero />
      <Products />
      <Destinations />
      <WhyUs />
      <FAQ />
    </main>
  );
}
