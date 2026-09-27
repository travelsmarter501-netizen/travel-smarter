import type { Metadata } from "next";
import { redirect } from "next/navigation";
import BackLink from "../../../../components/detail/BackLink";
import SmartPlannerV2Result from "../../../../components/smart-planner-v2/SmartPlannerV2Result";
import { createClient } from "../../../../../utils/supabase/server";
import { isValidSmartPlannerV2SavedPlanRow } from "../../../../lib/planner/smartPlannerV2SavedPlans";

/**
 * Smart Planner V2 Phase 5 -- saved-plan reopen route, separate from V1's
 * /smart-planner/barcelona/saved/[id] (item 10: a new route was chosen over reusing V1's,
 * since the two rows are shaped completely differently -- V1 stores placeIds + presentation
 * copy and re-resolves guide content live; V2 stores an already-fully-resolved V2Plan and has
 * no guide-import path to re-resolve against even if it wanted to. Branching V1's page on
 * product_slug would have meant touching a file this phase must leave untouched).
 *
 * Ownership: identical pattern to V1's saved page -- requires a session (redirect to
 * /login?next=... otherwise), then a plain `.eq("id", id)` select with NO explicit
 * `.eq("user_id", ...)` filter, because RLS (`user_id = auth.uid()`) already guarantees this
 * can only ever return the current user's own row; a foreign or nonexistent id both resolve to
 * `row === null`, rendered as the same generic "not found" message (never a 403, never a raw
 * error) -- so a guessed id can't distinguish "exists but isn't yours" from "doesn't exist".
 *
 * Defense in depth beyond RLS: `isValidSmartPlannerV2SavedPlanRow` (item 11) re-validates the
 * row is actually V2-shaped (product_slug + preferences_json.plannerVersion agree, every
 * interest key is a real current V2PlannerInterest, generated_plan_json.plan looks like a real
 * V2Plan) before anything is rendered -- a row that fails this is treated exactly like "not
 * found", never rendered half-validated.
 *
 * Renders the exact frozen V2Plan from generated_plan_json -- never regenerates. Reuses
 * SmartPlannerV2Result with no onEditSelections/onRegenerate/saveAction props (all optional),
 * so a reopened plan naturally shows no edit/regenerate/save controls -- it's already saved.
 */

export const metadata: Metadata = {
  title: "خطتك المحفوظة (V2) — برشلونة | Travel Smarter",
};

export default async function SavedSmartPlanV2Page(props: PageProps<"/smart-planner/barcelona-v2/saved/[id]">) {
  const { id } = await props.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/smart-planner/barcelona-v2/saved/${id}`)}`);
  }

  const { data: row } = await supabase.from("smart_planner_saved_plans").select("*").eq("id", id).maybeSingle();
  const validRow = isValidSmartPlannerV2SavedPlanRow(row) ? row : null;

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
          <SmartPlannerV2Result
            plan={validRow.generated_plan_json.plan}
            interests={validRow.preferences_json.interests}
            accommodation={validRow.preferences_json.accommodation}
          />
        </div>
      </div>
    </main>
  );
}
