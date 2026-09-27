/**
 * Smart Planner V2 Phase 3B -- the final, user-facing V2 interest model. Deliberately a
 * SEPARATE type from the legacy `PlannerInterest` (plannerTypes.ts) -- V1 keeps using the
 * legacy 6-key model completely untouched (see v2InterestAdapter.ts for the one-way mapping
 * from this type down to it). No Guide dependency, safe to import from client or server code.
 */

export type V2PlannerInterest =
  | "popular"
  | "cultureHistory"
  | "natureViews"
  | "food"
  | "shopping"
  | "beachRelax"
  | "footballExperiences"
  | "nightlife";

/** Runtime source of truth for validating unknown input (Server Action, etc.) -- mirrors the
 * exact pattern plannerTypes.ts's own PLANNER_INTERESTS already uses for the legacy model. */
export const V2_PLANNER_INTERESTS: readonly V2PlannerInterest[] = [
  "popular",
  "cultureHistory",
  "natureViews",
  "food",
  "shopping",
  "beachRelax",
  "footballExperiences",
  "nightlife",
];

/** Deterministic -- never random, never AI. Deliberately excludes food/shopping/nightlife/
 * football: those are intentional, niche choices a "surprise me" visitor hasn't signaled. */
export const V2_SURPRISE_ME_PRESET: V2PlannerInterest[] = ["popular", "cultureHistory", "natureViews"];

/**
 * Display labels for the 8 keys above -- kept in this plain (no "use client") module, not in
 * V2InterestSelector.tsx, specifically so Server Components (e.g. app/account/page.tsx) can
 * import it directly. A named data export from a "use client" module is not reliably readable
 * from a Server Component in Next's App Router (only the client module's own component/default
 * export is guaranteed to work across that boundary) -- account/page.tsx importing this constant
 * from V2InterestSelector.tsx previously crashed live with "V2_INTEREST_OPTIONS.filter is not a
 * function" for exactly this reason, only surfacing once a real V2 saved plan existed to render.
 * Every importer (V2InterestSelector.tsx, SmartPlannerV2Result.tsx, CustomPlanRequestForm.tsx,
 * account/page.tsx) now sources this one canonical array from here.
 */
export const V2_INTEREST_OPTIONS: { key: V2PlannerInterest; label: string; emoji: string }[] = [
  { key: "popular", label: "أشهر الأماكن", emoji: "⭐" },
  { key: "cultureHistory", label: "ثقافة وتاريخ", emoji: "🏛️" },
  { key: "natureViews", label: "طبيعة وإطلالات", emoji: "📸" },
  { key: "food", label: "أكل ومطاعم", emoji: "🍽️" },
  { key: "shopping", label: "تسوق", emoji: "🛍️" },
  { key: "beachRelax", label: "شواطئ وراحة", emoji: "🏖️" },
  { key: "footballExperiences", label: "كرة قدم وتجارب", emoji: "⚽" },
  { key: "nightlife", label: "حياة ليلية", emoji: "🌃" },
];

/**
 * Interests UI Simplification -- customer-facing display groups on top of the 8 internal keys
 * above, which stay completely unchanged (still what's validated, scored, and sent to the
 * Server Action). This is a presentation/adapter layer only: 6 groups instead of 8 buttons,
 * with "طبيعة وشواطئ" and "تجارب وترفيه" each covering 2 internal keys at once.
 *
 * `V2_INTEREST_OPTIONS` above is deliberately left untouched and still used as-is by the
 * separate (legacy-adjacent) Custom Plan admin flow (CustomPlanRequestForm.tsx,
 * CustomPlanFinalPlanView.tsx) -- out of scope for this task, never displayed to a planner
 * customer, so its own 8-option list is fine to keep.
 */
export type V2InterestDisplayGroup = {
  id: string;
  label: string;
  emoji: string;
  /** 1 or 2 internal keys this display group represents. Selecting the group in the UI always
   * adds/removes ALL of these together -- never a partial toggle for a fresh selection. */
  keys: V2PlannerInterest[];
};

export const V2_INTEREST_DISPLAY_GROUPS: V2InterestDisplayGroup[] = [
  { id: "popular", label: "أشهر الأماكن", emoji: "⭐", keys: ["popular"] },
  { id: "cultureHistory", label: "ثقافة وتاريخ", emoji: "🏛️", keys: ["cultureHistory"] },
  { id: "natureBeaches", label: "طبيعة وشواطئ", emoji: "🌿", keys: ["natureViews", "beachRelax"] },
  { id: "food", label: "أكل ومطاعم", emoji: "🍽️", keys: ["food"] },
  { id: "shopping", label: "تسوّق", emoji: "🛍️", keys: ["shopping"] },
  { id: "experiences", label: "تجارب وترفيه", emoji: "🎟️", keys: ["footballExperiences", "nightlife"] },
];

/**
 * A group reads as "selected" when ANY of its internal keys are present -- not just when ALL
 * are. This is deliberate, not a shortcut: it's what makes an old saved plan's single split key
 * (e.g. `natureViews` alone, from before this simplification) correctly show "طبيعة وشواطئ" as
 * selected when that plan is reopened/edited, per the saved-plan-compatibility requirement.
 * Going forward, `toggleV2DisplayGroup` below always adds/removes both keys of a group together,
 * so for any NEW selection this is equivalent to "all keys present" anyway.
 */
export function isV2DisplayGroupActive(selected: readonly V2PlannerInterest[], group: V2InterestDisplayGroup): boolean {
  return group.keys.some((key) => selected.includes(key));
}

/** Toggles a whole display group's keys together -- selecting "طبيعة وشواطئ" always adds BOTH
 * natureViews and beachRelax; deselecting removes both (or whichever subset is present, for an
 * old partially-split saved selection). Never duplicates a key already present. */
export function toggleV2DisplayGroup(selected: readonly V2PlannerInterest[], group: V2InterestDisplayGroup): V2PlannerInterest[] {
  if (isV2DisplayGroupActive(selected, group)) {
    return selected.filter((key) => !group.keys.includes(key));
  }
  const merged = new Set(selected);
  for (const key of group.keys) merged.add(key);
  return [...merged];
}

/** Customer-facing label for a set of internal interests, using the new 6-group names -- a
 * combined group (natureViews+beachRelax, footballExperiences+nightlife) is named ONCE, never
 * as two separate old labels, regardless of whether one or both of its keys are present. */
export function v2DisplayInterestsLabel(interests: readonly V2PlannerInterest[]): string {
  return V2_INTEREST_DISPLAY_GROUPS.filter((group) => isV2DisplayGroupActive(interests, group))
    .map((group) => group.label)
    .join(" + ");
}
