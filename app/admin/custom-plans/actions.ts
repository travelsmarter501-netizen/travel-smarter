"use server";

import { revalidatePath } from "next/cache";
import {
  generateOrGetCustomPlanDraftForAdmin,
  regenerateCustomPlanDraftForAdmin,
  saveCustomPlanDraftForAdmin,
  approveCustomPlanDraftForAdmin,
  startCustomPlanPreparationForAdmin,
  markCustomPlanReadyForAdmin,
  deliverCustomPlanForAdmin,
  type AdminActionResult,
} from "../../lib/customPlanAdmin";
import type { CustomPlanDraft, CustomPlanDraftPlanData } from "../../lib/customPlanDraft";
import type { CustomPlanFinalPlan } from "../../lib/customPlanFinalPlan";
import type { CustomPlanRequestStatus } from "../../lib/customPlanRequest";

/**
 * The only client-callable entry points for the Custom Plan Admin Builder. Each is a thin
 * wrapper over app/lib/customPlanAdmin.ts, which independently re-checks admin authorization
 * on every call -- never trusts that the page that rendered the calling button already
 * verified it (a Server Action is its own request).
 */

export async function generateCustomPlanDraftAction(requestId: string): Promise<AdminActionResult<CustomPlanDraft>> {
  const result = await generateOrGetCustomPlanDraftForAdmin(requestId);
  if (result.ok) revalidatePath(`/admin/custom-plans/${requestId}`);
  return result;
}

export async function saveCustomPlanDraftAction(requestId: string, planData: CustomPlanDraftPlanData): Promise<AdminActionResult<CustomPlanDraft>> {
  const result = await saveCustomPlanDraftForAdmin(requestId, planData);
  if (result.ok) revalidatePath(`/admin/custom-plans/${requestId}`);
  return result;
}

export async function approveCustomPlanDraftAction(requestId: string): Promise<AdminActionResult<CustomPlanDraft>> {
  const result = await approveCustomPlanDraftForAdmin(requestId);
  if (result.ok) revalidatePath(`/admin/custom-plans/${requestId}`);
  return result;
}

export async function startCustomPlanPreparationAction(requestId: string): Promise<AdminActionResult<{ status: CustomPlanRequestStatus }>> {
  const result = await startCustomPlanPreparationForAdmin(requestId);
  if (result.ok) {
    revalidatePath(`/admin/custom-plans/${requestId}`);
    revalidatePath("/admin/custom-plans");
  }
  return result;
}

export async function regenerateCustomPlanDraftAction(requestId: string): Promise<AdminActionResult<CustomPlanDraft>> {
  const result = await regenerateCustomPlanDraftForAdmin(requestId);
  if (result.ok) revalidatePath(`/admin/custom-plans/${requestId}`);
  return result;
}

export async function markCustomPlanReadyAction(requestId: string): Promise<AdminActionResult<{ status: CustomPlanRequestStatus }>> {
  const result = await markCustomPlanReadyForAdmin(requestId);
  if (result.ok) {
    revalidatePath(`/admin/custom-plans/${requestId}`);
    revalidatePath("/admin/custom-plans");
  }
  return result;
}

export async function deliverCustomPlanAction(requestId: string): Promise<AdminActionResult<CustomPlanFinalPlan>> {
  const result = await deliverCustomPlanForAdmin(requestId);
  if (result.ok) {
    revalidatePath(`/admin/custom-plans/${requestId}`);
    revalidatePath("/admin/custom-plans");
    revalidatePath(`/account`);
  }
  return result;
}
