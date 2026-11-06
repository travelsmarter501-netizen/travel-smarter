import "server-only";

import { generateCityPlanV2, type GenerateCityPlanV2Input, type GenerateCityPlanV2Result } from "../../lib/planner/v2CityPipeline";
import { getCityPlannerModule } from "../../lib/planner/cityPlannerRegistry";
import { isAvailablePlannerDestinationId } from "../../lib/planner/plannerDestinations";

/**
 * Smart Planner V2 -- the ONLY server-side entry point for V2 plan generation (name kept from the Barcelona-only era so
 * every caller and old reference keeps working).
 *
 * Deliberately NOT a Server Action (no "use server"): a Server Action is a public POST endpoint, and "owns the product"
 * must never be enough to generate plans. The only caller is lib/commerce/personalizedPlan.ts, which first proves the
 * caller owns a paid / owner request and feeds this function the answers stored on the server. `server-only` keeps it
 * out of every client bundle.
 *
 * Multi-city foundation: picks the city's planner module (cityPlannerRegistry.ts) and runs the shared pipeline
 * (v2CityPipeline.ts). A destination must both have a module AND be enabled for customers (plannerDestinations.ts:
 * publicly available, or the local-only preview switch); anything else gets the same "unsupported" error as before.
 */

export type GenerateBarcelonaPlanV2Input = GenerateCityPlanV2Input;
export type GenerateBarcelonaPlanV2Result = GenerateCityPlanV2Result;

export async function generateBarcelonaPlanV2(input: GenerateBarcelonaPlanV2Input): Promise<GenerateBarcelonaPlanV2Result> {
  const destinationId = input && typeof input === "object" && typeof input.destinationId === "string" ? input.destinationId : "";
  const city = destinationId && isAvailablePlannerDestinationId(destinationId) ? getCityPlannerModule(destinationId) : null;
  if (!city) {
    if (!input || typeof input !== "object") return { ok: false, error: "طلب غير صالح." };
    return { ok: false, error: "الوجهة غير مدعومة في هذا الإصدار التجريبي." };
  }
  return generateCityPlanV2(city, input);
}
