import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Container from "../../components/Container";
import BackLink from "../../components/detail/BackLink";
import BackToGuide from "../../components/guide/BackToGuide";
import CategoryGrid from "../../components/guide/CategoryGrid";
import GuideHero from "../../components/guide/GuideHero";
import QuickFacts from "../../components/guide/QuickFacts";
import MobileBottomNav from "../../components/guide/MobileBottomNav";
import AttractionsExplorer from "../../components/guide/AttractionsExplorer";
import AreaExplorer from "../../components/guide/AreaExplorer";
import AreaDetail from "../../components/guide/AreaDetail";
import FoodHome from "../../components/guide/FoodHome";
import FoodCategoryView from "../../components/guide/FoodCategoryView";
import DishesGrid from "../../components/guide/DishesGrid";
import StayGrid from "../../components/guide/StayGrid";
import TransportDecision from "../../components/guide/TransportDecision";
import ShoppingGrid from "../../components/guide/ShoppingGrid";
import BeachesGrid from "../../components/guide/BeachesGrid";
import HotelsGrid from "../../components/guide/HotelsGrid";
import CasinoGrid from "../../components/guide/CasinoGrid";
import NightlifeHome from "../../components/guide/NightlifeHome";
import NightlifeCategoryView from "../../components/guide/NightlifeCategoryView";
import ExperiencesSection from "../../components/guide/ExperiencesSection";
import PhotoSpotsSection from "../../components/guide/PhotoSpotsSection";
import FreeSection from "../../components/guide/FreeSection";
import SaveMoneySection from "../../components/guide/SaveMoneySection";
import MistakesSection from "../../components/guide/MistakesSection";
import ChecklistSection from "../../components/guide/ChecklistSection";
import MyBarcelona from "../../components/guide/MyBarcelona";
import ProductAccessDenied from "../../components/guide/ProductAccessDenied";
import { destinations } from "../../lib/content";
import { barcelonaGuide } from "../../lib/barcelona-guide";
import { hasProductAccess } from "../../lib/entitlements";
import { createClient } from "../../../utils/supabase/server";

const destination = destinations.find((item) => item.slug === "barcelona")!;
const guide = barcelonaGuide;
const basePath = "/guides/barcelona";

// TEMPORARY DEVELOPMENT BYPASS
// Re-enable authentication and entitlement checks before production launch.
const TEMP_DISABLE_BARCELONA_ACCESS_GATE = true;

export const metadata: Metadata = {
  title: "دليل Barcelona الذكي | Travel Smarter",
  description: guide.subtitle,
};

const sectionTitles: Record<string, string> = {
  attractions: "أهم الأماكن",
  areas: "حسب المنطقة",
  food: "وين ناكل؟",
  stay: "وين تسكن؟",
  transport: "كيف تتنقل؟",
  shopping: "التسوق",
  beaches: "الشواطئ",
  nightlife: "Barcelona بالليل",
  experiences: "فعاليات وتجارب",
  "photo-spots": "أماكن التصوير",
  free: "Barcelona ببلاش",
  "save-money": "وفر مصاري",
  mistakes: "أخطاء تجنبها",
  checklist: "قبل السفر",
  hotels: "أفضل الفنادق",
  casino: "الكازينو",
  favorites: "المحفوظات",
};

function CategoryContent({
  section,
  areaId,
  foodCategoryId,
  nightlifeCategoryId,
}: {
  section: string;
  areaId?: string;
  foodCategoryId?: string;
  nightlifeCategoryId?: string;
}): ReactNode {
  switch (section) {
    case "attractions":
      return <AttractionsExplorer guideSlug={guide.slug} attractions={guide.attractions} areas={guide.areas} />;
    case "areas": {
      if (areaId) {
        const area = guide.areas.find((item) => item.id === areaId);
        if (!area) return <AreaExplorer areas={guide.areas} basePath={basePath} />;
        return <AreaDetail area={area} attractions={guide.attractions} basePath={basePath} />;
      }
      return <AreaExplorer areas={guide.areas} basePath={basePath} />;
    }
    case "food": {
      if (foodCategoryId === "dishes") {
        return <DishesGrid dishes={guide.mustTryDishes} basePath={basePath} />;
      }
      if (foodCategoryId) {
        const category = guide.foodCategories.find((item) => item.id === foodCategoryId);
        if (!category) return <FoodHome categories={guide.foodCategories} places={guide.foodPlaces} basePath={basePath} />;
        const places = guide.foodPlaces.filter((place) => place.categoryId === foodCategoryId);
        return <FoodCategoryView guideSlug={guide.slug} category={category} places={places} basePath={basePath} />;
      }
      return <FoodHome categories={guide.foodCategories} places={guide.foodPlaces} basePath={basePath} />;
    }
    case "stay":
      return <StayGrid areas={guide.stayAreas} />;
    case "transport":
      return <TransportDecision modes={guide.transportModes} />;
    case "shopping":
      return <ShoppingGrid guideSlug={guide.slug} areas={guide.shoppingAreas} />;
    case "beaches":
      return <BeachesGrid guideSlug={guide.slug} beaches={guide.beaches} />;
    case "hotels":
      return <HotelsGrid guideSlug={guide.slug} hotels={guide.hotels} />;
    case "casino":
      return <CasinoGrid guideSlug={guide.slug} casinos={guide.casinos} />;
    case "nightlife": {
      if (nightlifeCategoryId) {
        const category = guide.nightlifeCategories.find((item) => item.id === nightlifeCategoryId);
        if (!category) return <NightlifeHome categories={guide.nightlifeCategories} venues={guide.nightlifeVenues} basePath={basePath} />;
        const venues = guide.nightlifeVenues.filter((venue) => venue.categoryId === nightlifeCategoryId);
        return <NightlifeCategoryView key={category.id} guideSlug={guide.slug} category={category} venues={venues} basePath={basePath} />;
      }
      return <NightlifeHome categories={guide.nightlifeCategories} venues={guide.nightlifeVenues} basePath={basePath} />;
    }
    case "experiences":
      return <ExperiencesSection guideSlug={guide.slug} categories={guide.experienceCategories} experiences={guide.experiences} />;
    case "photo-spots":
      return <PhotoSpotsSection guideSlug={guide.slug} spots={guide.photoSpots} />;
    case "free":
      return <FreeSection experiences={guide.freeExperiences} />;
    case "save-money":
      return <SaveMoneySection tips={guide.saveMoneyTips} />;
    case "mistakes":
      return <MistakesSection mistakes={guide.touristMistakes} />;
    case "checklist":
      return <ChecklistSection guideSlug={guide.slug} items={guide.checklist} />;
    case "favorites":
      return (
        <MyBarcelona
          guideSlug={guide.slug}
          attractions={guide.attractions}
          foodPlaces={guide.foodPlaces}
          beaches={guide.beaches}
          photoSpots={guide.photoSpots}
          shoppingAreas={guide.shoppingAreas}
          nightlifeVenues={guide.nightlifeVenues}
          experiences={guide.experiences}
          hotels={guide.hotels}
          casinos={guide.casinos}
        />
      );
    default:
      return null;
  }
}

export default async function BarcelonaGuidePage(props: PageProps<"/guides/barcelona">) {
  // Server-side entitlement gate — runs before any guide content (including every
  // ?s=... internal state) is read or rendered, so no query param can bypass it.
  if (!TEMP_DISABLE_BARCELONA_ACCESS_GATE) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login?next=/guides/barcelona");
    }

    const hasAccess = await hasProductAccess("barcelona-guide", user.id);
    if (!hasAccess) {
      return <ProductAccessDenied productName="دليل Barcelona الكامل" mailSubject="استفسار عن دليل Barcelona" />;
    }
  }

  const searchParams = await props.searchParams;
  const section = typeof searchParams.s === "string" ? searchParams.s : undefined;
  const areaId = typeof searchParams.area === "string" ? searchParams.area : undefined;
  const foodCategoryId = typeof searchParams.fc === "string" ? searchParams.fc : undefined;
  const nightlifeCategoryId = typeof searchParams.nc === "string" ? searchParams.nc : undefined;

  if (!section) {
    return (
      <>
        <main className="pb-6">
          <Container className="pt-4">
            <BackLink href="/#guides" label="الدلائل السياحية" />
          </Container>

          <GuideHero
            image={destination.image}
            name={destination.name}
            countryCode={destination.countryCode}
            country={destination.country}
            title="دليل Barcelona الذكي"
            subtitle={guide.subtitle}
            priceILS={guide.priceILS}
            showPurchaseCta={false}
          />

          <QuickFacts name={destination.name} facts={guide.quickFacts} />

          <Container>
            <h2 className="text-lg font-bold text-slate-900">وين تحب تبدأ؟</h2>
            <div className="mt-4">
              <CategoryGrid categories={guide.categories} basePath={basePath} />
            </div>
          </Container>
        </main>
        <MobileBottomNav basePath={basePath} />
      </>
    );
  }

  return (
    <>
      <main className="pb-10">
        <Container className="space-y-5 pt-4">
          <BackToGuide basePath={basePath} />
          <h1 className="text-xl font-bold text-slate-900">{sectionTitles[section] ?? "الدليل"}</h1>
          <CategoryContent section={section} areaId={areaId} foodCategoryId={foodCategoryId} nightlifeCategoryId={nightlifeCategoryId} />
        </Container>
      </main>
      <MobileBottomNav basePath={basePath} />
    </>
  );
}
