import type { Metadata } from "next";
import { redirect } from "next/navigation";
import BackLink from "../../../../components/detail/BackLink";
import SmartPlannerSavedPlanView from "../../../../components/smart-planner/SmartPlannerSavedPlanView";
import { barcelonaGuide } from "../../../../lib/barcelona-guide";
import { createClient } from "../../../../../utils/supabase/server";
import { isValidSmartPlannerSavedPlanRow } from "../../../../lib/planner/smartPlannerSavedPlans";

const guide = barcelonaGuide;

export const metadata: Metadata = {
  title: "خطتك المحفوظة — برشلونة | Travel Smarter",
};

export default async function SavedSmartPlanPage(props: PageProps<"/smart-planner/barcelona/saved/[id]">) {
  const { id } = await props.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/smart-planner/barcelona/saved/${id}`)}`);
  }

  // RLS (user_id = auth.uid()) means this can only ever return the current user's own row --
  // a guessed/foreign id simply comes back empty, not another user's plan.
  const { data: row } = await supabase.from("smart_planner_saved_plans").select("*").eq("id", id).maybeSingle();
  // Final Pre-Payment Master QA: defense in depth beyond RLS, mirroring the V2 saved-plan page's
  // own `isValidSmartPlannerV2SavedPlanRow` check -- this table is shared with V2, distinguished
  // only by shape, so a row that isn't actually V1-shaped (e.g. reached via a stale/mismatched
  // link) is treated exactly like "not found" instead of being rendered half-validated.
  const validRow = isValidSmartPlannerSavedPlanRow(row) ? row : null;

  if (!validRow) {
    return (
      <main className="pb-10">
        <div className="mx-auto w-full max-w-3xl px-5 pt-4 sm:px-8 lg:px-10">
          <BackLink href="/account" label="حسابي" />
          <div className="mt-8 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
            <p className="text-sm font-semibold text-slate-600">ما لقينا هاي الخطة. ممكن تكون انحذفت.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pb-10">
      <div className="mx-auto w-full max-w-3xl px-5 pt-4 sm:px-8 lg:px-10">
        <BackLink href="/account" label="حسابي" />
        <div className="mt-4">
          <SmartPlannerSavedPlanView
            preferences={validRow.preferences_json}
            generatedPlan={validRow.generated_plan_json}
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
