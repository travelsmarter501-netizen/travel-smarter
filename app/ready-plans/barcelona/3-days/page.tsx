import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Container from "../../../components/Container";
import BackLink from "../../../components/detail/BackLink";
import GuideIncludedNote from "../../../components/GuideIncludedNote";
import ProductAccessDenied from "../../../components/guide/ProductAccessDenied";
import BarcelonaReadyPlan from "../../../components/guide/BarcelonaReadyPlan";
import { barcelonaGuide } from "../../../lib/barcelona-guide";
import { barcelonaReadyPlan3Day } from "../../../lib/barcelona-ready-plan-3day";
import { hasProductAccess } from "../../../lib/entitlements";
import { createClient } from "../../../../utils/supabase/server";

const guide = barcelonaGuide;

// TEMPORARY DEVELOPMENT BYPASS
// Re-enable Ready Plan entitlement checks before production launch.
const TEMP_DISABLE_BARCELONA_READY_PLAN_3DAY_ACCESS_GATE = true;

export const metadata: Metadata = {
  title: "برشلونة — خطة 3 أيام | Travel Smarter",
  description: barcelonaReadyPlan3Day.subtitle,
};

export default async function BarcelonaReadyPlan3DayPage() {
  // Independent entitlement gate for the "barcelona-ready-plan-3day" product -- a distinct
  // product slug from "barcelona-ready-plan" (5-day), "barcelona-ready-plan-1day", and
  // "barcelona-guide". This product also bundles Guide access (see
  // lib/entitlements.ts GUIDE_BUNDLE_PRODUCT_SLUGS) -- owning it grants "barcelona-guide"
  // access too, without a separate fake purchase row.
  if (!TEMP_DISABLE_BARCELONA_READY_PLAN_3DAY_ACCESS_GATE) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login?next=/ready-plans/barcelona/3-days");
    }

    const hasAccess = await hasProductAccess("barcelona-ready-plan-3day", user.id);
    if (!hasAccess) {
      return <ProductAccessDenied productName="برشلونة — خطة 3 أيام" mailSubject="استفسار عن خطة برشلونة 3 أيام" />;
    }
  }

  return (
    <main className="pb-10">
      <Container className="space-y-5 pt-4">
        <BackLink href="/guides/barcelona" label="دليل Barcelona" />

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Minimal product-discovery links -- separate fixed products from this one, so a
              visitor who lands here directly can still find them without a homepage redesign. */}
          <Link
            href="/ready-plans/barcelona/1-day"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-teal-300 hover:bg-teal-50"
          >
            ⏱️ يوم واحد بس ببرشلونة؟ جرّب خطة اليوم الواحد
          </Link>
          <Link
            href="/ready-plans/barcelona"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-teal-300 hover:bg-teal-50"
          >
            🗓️ عندك 5 أيام؟ شوف الخطة الكاملة لـ5 أيام
          </Link>

          {/* This product bundles Guide access -- see lib/entitlements.ts GUIDE_BUNDLE_PRODUCT_SLUGS. */}
          <GuideIncludedNote />
        </div>

        <BarcelonaReadyPlan
          guideSlug={guide.slug}
          plan={barcelonaReadyPlan3Day}
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
