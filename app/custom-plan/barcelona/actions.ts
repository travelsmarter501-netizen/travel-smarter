"use server";

import { createCustomPlanRequest, type CreateCustomPlanRequestResult } from "../../lib/customPlanRequests";
import type { CustomPlanRequest } from "../../lib/customPlanRequest";

/**
 * The one client-callable entry point for saving a Custom Plan request. A thin wrapper around
 * createCustomPlanRequest (app/lib/customPlanRequests.ts) so that file can stay a plain
 * server-only helper module (reusable from other server code later, e.g. a future payment
 * webhook) while this file is the actual Server Action boundary CustomPlanRequestForm calls.
 */
export async function submitCustomPlanRequest(request: CustomPlanRequest): Promise<CreateCustomPlanRequestResult> {
  return createCustomPlanRequest(request);
}
