import type { CustomPlanRequest } from "./customPlanRequest";

/**
 * Custom Plan V1 — pending-request local draft.
 *
 * Mirrors smartPlannerSavedPlans.ts's writePendingSmartPlanSave/readPendingSmartPlanSave/
 * clearPendingSmartPlanSave pattern exactly (same storage-key shape, same try/catch-everywhere
 * safety, same "written right before redirecting to /login" usage) -- written right before
 * CustomPlanRequestForm sends a logged-out visitor to /login, so their filled-in form survives
 * the auth round trip instead of being silently lost. Read back once on the form's next mount.
 */

const PENDING_REQUEST_STORAGE_KEY = "travelSmarter:customPlan:pendingRequest:barcelona";

export function readPendingCustomPlanRequest(): CustomPlanRequest | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PENDING_REQUEST_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CustomPlanRequest;
  } catch {
    return null;
  }
}

export function writePendingCustomPlanRequest(request: CustomPlanRequest): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PENDING_REQUEST_STORAGE_KEY, JSON.stringify(request));
  } catch {
    // localStorage unavailable (private browsing, quota) -- the draft simply won't survive the
    // auth redirect; the customer can just fill the form again once they're logged in.
  }
}

export function clearPendingCustomPlanRequest(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PENDING_REQUEST_STORAGE_KEY);
  } catch {
    // ignore
  }
}
