import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Container from "../../components/Container";
import BackLink from "../../components/detail/BackLink";
import ProductAccessDenied from "../../components/guide/ProductAccessDenied";
import BarcelonaReadyPlan from "../../components/guide/BarcelonaReadyPlan";
import GuideIncludedNote from "../../components/GuideIncludedNote";
import { barcelonaGuide } from "../../lib/barcelona-guide";
import { barcelonaReadyPlan } from "../../lib/barcelona-ready-plan";
import { hasProductAccess } from "../../lib/entitlements";
import { PRODUCT_SLUGS } from "../../lib/commerce/catalog";
import { createClient } from "../../../utils/supabase/server";

const guide = barcelonaGuide;

export const metadata: Metadata = {
  title: "خطة Barcelona الجاهزة | Travel Smarter",
  description: barcelonaReadyPlan.subtitle,
};

export default async function BarcelonaReadyPlanPage() {
  // Independent entitlement gate for the "barcelona-ready-plan" product — separate from
  // "barcelona-guide". Owning the Guide does NOT automatically grant this product, and
  // vice versa; a future bundle product can grant both at once.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/ready-plans/barcelona");
  }

  const hasAccess = await hasProductAccess(PRODUCT_SLUGS.readyPlan5Day, user.id);
  if (!hasAccess) {
    return <ProductAccessDenied productName="خطة Barcelona الجاهزة" mailSubject="استفسار عن خطة Barcelona الجاهزة" productSlug={PRODUCT_SLUGS.readyPlan5Day} />;
  }

  return (
    <main className="pb-10">
      <Container className="space-y-5 pt-4">
        <BackLink href="/guides/barcelona" label="دليل Barcelona" />

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Minimal product-discovery link -- the 1-day package is a separate fixed product,
              not shown elsewhere on this page, so a visitor here should still be able to find it. */}
          <Link
            href="/ready-plans/barcelona/1-day"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-teal-300 hover:bg-teal-50"
          >
            ⏱️ يوم واحد بس ببرشلونة؟ جرّب خطة اليوم الواحد
          </Link>
          <Link
            href="/ready-plans/barcelona/3-days"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-teal-300 hover:bg-teal-50"
          >
            📅 عندك 3 أيام؟ شوف خطة الـ3 أيام
          </Link>

          {/* This product bundles Guide access -- see lib/entitlements.ts GUIDE_BUNDLE_PRODUCT_SLUGS. */}
          <GuideIncludedNote />
        </div>

        <BarcelonaReadyPlan
          guideSlug={guide.slug}
          plan={barcelonaReadyPlan}
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
