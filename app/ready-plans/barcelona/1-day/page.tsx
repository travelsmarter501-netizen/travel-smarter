import type { Metadata } from "next";
import Link from "next/link";
import Container from "../../../components/Container";
import BackLink from "../../../components/detail/BackLink";
import ProductAccessDenied from "../../../components/guide/ProductAccessDenied";
import BarcelonaReadyPlan from "../../../components/guide/BarcelonaReadyPlan";
import { barcelonaGuide } from "../../../lib/barcelona-guide";
import { barcelonaReadyPlan1Day } from "../../../lib/barcelona-ready-plan-1day";
import { hasProductAccess } from "../../../lib/entitlements";
import { PRODUCT_SLUGS } from "../../../lib/commerce/catalog";
import { createClient } from "../../../../utils/supabase/server";

const guide = barcelonaGuide;

export const metadata: Metadata = {
  title: "برشلونة بيوم واحد | Travel Smarter",
  description: barcelonaReadyPlan1Day.subtitle,
};

export default async function BarcelonaReadyPlan1DayPage() {
  // Independent entitlement gate for the "barcelona-ready-plan-1day" product -- a distinct
  // product slug from both "barcelona-ready-plan" (the 5-day package) and "barcelona-guide",
  // so all three can be priced/gated independently. See barcelona-ready-plan-1day.ts header
  // comment for where pricing should be decided and added.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hasAccess = user ? await hasProductAccess(PRODUCT_SLUGS.readyPlan1Day, user.id) : false;
  if (!hasAccess) {
    return <ProductAccessDenied productName="برشلونة بيوم واحد" mailSubject="استفسار عن رزمة برشلونة بيوم واحد" productSlug={PRODUCT_SLUGS.readyPlan1Day} signedOut={!user} signInNext="/ready-plans/barcelona/1-day" />;
  }

  return (
    <main className="pb-10">
      <Container className="space-y-5 pt-4">
        <BackLink href="/guides/barcelona" label="دليل Barcelona" />

        {/* Minimal product-discovery links -- separate fixed products from this one, so a
            visitor who lands here directly should still be able to find them without any
            homepage/nav redesign. */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/ready-plans/barcelona/3-days"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-teal-300 hover:bg-teal-50"
          >
            📅 عندك 3 أيام؟ شوف خطة الـ3 أيام
          </Link>
          <Link
            href="/ready-plans/barcelona"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-teal-300 hover:bg-teal-50"
          >
            🗓️ عندك 5 أيام؟ شوف الخطة الكاملة لـ5 أيام
          </Link>
        </div>

        <BarcelonaReadyPlan
          guideSlug={guide.slug}
          plan={barcelonaReadyPlan1Day}
          guide={{
            attractions: guide.attractions,
            foodPlaces: guide.foodPlaces,
            experiences: guide.experiences,
            areas: guide.areas,
            beaches: guide.beaches,
            shoppingAreas: guide.shoppingAreas,
            nightlifeVenues: guide.nightlifeVenues,
          }}
        />
      </Container>
    </main>
  );
}
