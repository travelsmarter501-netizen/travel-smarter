import type { Metadata } from "next";
import BackLink from "../../components/detail/BackLink";
import SmartPlannerApp from "../../components/smart-planner/SmartPlannerApp";
import GuideIncludedNote from "../../components/GuideIncludedNote";
import ProductAccessDenied from "../../components/guide/ProductAccessDenied";
import { barcelonaGuide } from "../../lib/barcelona-guide";
import { hasProductAccess } from "../../lib/entitlements";
import { PRODUCT_SLUGS } from "../../lib/commerce/catalog";
import { createClient } from "../../../utils/supabase/server";

/**
 * Smart Planner V2 Production Launch: this is the LEGACY V1 planner, relocated here verbatim
 * (byte-for-byte the same component/logic/entitlement-gate code that used to live at
 * /smart-planner/barcelona) so it stays available as a manual rollback path -- no homepage
 * link, no public CTA, but still fully functional if V2 ever needs to be rolled back. See
 * app/smart-planner/barcelona/page.tsx (now V2, the production route) for the switch itself.
 *
 * Deliberately NOT linked from the homepage or any product card -- reachable only by typing
 * this URL directly (rollback/testing use), matching the task's own "no homepage link, no
 * public CTA, accessible manually" requirement.
 */

const guide = barcelonaGuide;

export const metadata: Metadata = {
  title: "المخطط الذكي (V1 - احتياطي) — برشلونة | Travel Smarter",
  description: "اختار اهتماماتك وخلينا نرتبلك خطة رحلة كاملة لبرشلونة خلال ثواني.",
};

export default async function SmartPlannerBarcelonaV1Page() {
  // Entitlement gate. This legacy V1 planner is the rollback UI for the same paid product as
  // /planner ("travel-smarter-personalized-plan"). The older "barcelona-smart-planner" product is
  // deactivated, so gating on it would permanently lock every customer out.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hasAccess = user ? await hasProductAccess(PRODUCT_SLUGS.personalizedPlan, user.id) : false;
  if (!hasAccess) {
    return <ProductAccessDenied productName="المخطط الذكي لبرشلونة" mailSubject="استفسار عن المخطط الذكي لبرشلونة" productSlug={PRODUCT_SLUGS.personalizedPlan} signedOut={!user} signInNext="/smart-planner/barcelona-v1" />;
  }

  return (
    <main className="pb-10">
      {/* V1.1 polish: a narrower, centered max-width than the shared Container (which is
          sized for wide multi-column guide/package pages) — this flow is a single linear
          questionnaire + result column, so it shouldn't stretch to 1280px on tablet/desktop.
          Padding classes are kept IDENTICAL to Container's own (px-5 sm:px-8 lg:px-10) so
          SmartPlannerResult's sticky day-tabs bar (which cancels this exact padding with a
          matching negative margin for its edge-to-edge bleed effect) keeps working unchanged.
          At <768px this max-width never engages, so mobile is pixel-identical to before. */}
      <div className="mx-auto w-full max-w-3xl px-5 pt-4 sm:px-8 lg:px-10">
        <BackLink href="/guides/barcelona" label="دليل Barcelona" />
        {/* This product bundles Guide access -- see lib/entitlements.ts GUIDE_BUNDLE_PRODUCT_SLUGS. */}
        <div className="mt-3">
          <GuideIncludedNote />
        </div>
        <div className="mt-4">
          <SmartPlannerApp
            guide={{
              attractions: guide.attractions,
              foodPlaces: guide.foodPlaces,
              experiences: guide.experiences,
              areas: guide.areas,
              nightlifeVenues: guide.nightlifeVenues,
              beaches: guide.beaches,
              shoppingAreas: guide.shoppingAreas,
            }}
            guideSlug={guide.slug}
          />
        </div>
      </div>
    </main>
  );
}
