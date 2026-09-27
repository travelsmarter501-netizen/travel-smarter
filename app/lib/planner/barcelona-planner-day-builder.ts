import { buildPlannerPlan } from "./plannerDayBuilder";
import type {
  ClusterCompatibilityMap,
  CoverageGoal,
  DayBuilderConfig,
  GeneratedPlannerPlan,
  PlannerBuildRequest,
  RequiredCoverageGoal,
  SimilarityGroup,
  TierCoverageGoal,
} from "./plannerDayBuilder";
import { getBarcelonaPlannerPlaces } from "./barcelona-planner-metadata";
import { BARCELONA_FLAGSHIP_COVERAGE_GOALS } from "./barcelonaMustSeePolicy";

/**
 * Barcelona-specific config for the generic day builder: cluster closeness, similarity
 * groups, and special-interest coverage goals. None of this lives in plannerDayBuilder.ts —
 * a future destination supplies its own version of this file instead.
 */

// ── Cluster compatibility ───────────────────────────────────────────────────────────
// Logical closeness only — NOT real travel times/distances. Declared one-directionally
// below and mirrored automatically so the map is always symmetric.
const RAW_CLUSTER_LINKS: [string, string, "strong" | "medium" | "weak"][] = [
  ["eixample-north", "gracia-north", "strong"],
  ["eixample-north", "passeig-gracia", "medium"],
  // V2 density closure: gracia-north was only ever linked to eixample-north (strong) and
  // passeig-gracia only to eixample-north (medium) and city-center (strong) -- an asymmetric
  // gap, since eixample-north is close to both. Real distance from Park Güell to Casa Milà
  // (~2.2km) is actually SHORTER than the already-"weak"-linked les-corts<->passeig-gracia
  // pair (~3.6km) below, so "weak" here is a conservative, evidence-based correction, not a
  // blanket geography weakening -- it only closes this one documented transitive gap.
  ["gracia-north", "passeig-gracia", "weak"],
  ["passeig-gracia", "city-center", "strong"],
  ["passeig-gracia", "old-city", "medium"],
  ["city-center", "old-city", "strong"],
  ["city-center", "born", "medium"],
  ["old-city", "born", "strong"],
  ["old-city", "seafront", "strong"],
  ["born", "seafront", "strong"],
  ["seafront", "seafront-east", "strong"],
  ["montjuic", "city-center", "medium"],
  ["montjuic", "old-city", "medium"],
  // "weak/medium" in the source spec — treated as the more conservative "weak" here.
  ["les-corts", "passeig-gracia", "weak"],
  ["les-corts", "city-center", "weak"],
  ["tibidabo", "gracia-north", "medium"],
  // Fix Repetitive Montjuïc Day: Camp Nou (les-corts) and Montjuïc were previously NOT linked
  // at all (compatibility 0), so Camp Nou could never be considered as a same-day fill option
  // for an mnac/montjuic-anchored day, regardless of how well it scored -- a real, evidence-
  // found geographic gap (measured via montjuicDayQualityAudit.debug.ts: 23/24 montjuic-cluster
  // days paired montjuic+mnac together, none ever considered Camp Nou). Real Barcelona distance
  // from Camp Nou to Plaça d'Espanya/MNAC is a genuine, commonly-combined single-day pairing
  // (comparable to the already-"weak"-linked les-corts<->passeig-gracia/city-center above) --
  // "weak" here only makes Camp Nou ELIGIBLE to be picked when it scores well for the day, it
  // never forces it in (see BARCELONA_FLAGSHIP_MUST_SEE precedent: this file never hardcodes
  // WHICH profiles get Camp Nou, only which clusters may sit together on the same day).
  ["montjuic", "les-corts", "weak"],
];

function buildSymmetricCompatibilityMap(links: [string, string, "strong" | "medium" | "weak"][]): ClusterCompatibilityMap {
  const map: ClusterCompatibilityMap = {};
  for (const [a, b, level] of links) {
    (map[a] ??= {})[b] = level;
    (map[b] ??= {})[a] = level;
  }
  return map;
}

export const BARCELONA_CLUSTER_COMPATIBILITY: ClusterCompatibilityMap = buildSymmetricCompatibilityMap(RAW_CLUSTER_LINKS);

// ── Similarity groups (duplicate-experience control) ────────────────────────────────
export const BARCELONA_SIMILARITY_GROUPS: SimilarityGroup[] = [
  {
    id: "beaches",
    placeIds: ["barceloneta-beach", "bogatell", "nova-icaria"],
    maxByDefault: 1,
    unlockedByInterest: "beachRelax",
    maxWithInterest: 2,
  },
  {
    id: "gaudi-core",
    placeIds: ["sagrada-familia", "park-guell", "casa-batllo", "casa-mila"],
    // Major attractions, so multiple are fine — just avoid automatically grabbing all 4 by
    // default. V2: a cultureLocal-selecting visitor has explicitly signaled deep interest in
    // exactly this kind of core Barcelona/Gaudí architecture (all 4 score 8-10 on
    // cultureLocal) -- same unlock pattern already used for beaches/beachRelax below.
    maxByDefault: 3,
    unlockedByInterest: "cultureLocal",
    maxWithInterest: 4,
  },
];

// ── Iconic tiers (V1.1) ──────────────────────────────────────────────────────────────
// Tier A: outranks generic similarity caps (see resolveSimilarityExclusions in the core) and
// is the primary Popular coverage target. Tier B: strong highlights, secondary Popular goal.
export const BARCELONA_ICONIC_TIER_A = ["sagrada-familia", "park-guell", "gothic-quarter", "casa-batllo", "barceloneta-beach"];
export const BARCELONA_ICONIC_TIER_B = [
  "bunkers-carmel",
  "camp-nou",
  "mnac",
  "boqueria",
  "ciutadella",
  "casa-mila",
  "barcelona-cathedral",
  "arc-de-triomf",
];
export const BARCELONA_ICONIC_TIERS = [BARCELONA_ICONIC_TIER_A, BARCELONA_ICONIC_TIER_B];

// ── Special-interest coverage goals ─────────────────────────────────────────────────
// Tier A gets a bigger Popular boost than Tier B — "strongly aim for Tier A, aim for
// several Tier B when capacity/geography allows", not a flat single-tier list.
export const BARCELONA_COVERAGE_GOALS: CoverageGoal[] = [
  { interest: "popular", placeIds: BARCELONA_ICONIC_TIER_A, minimumCoverage: 4, boost: 6 },
  { interest: "popular", placeIds: BARCELONA_ICONIC_TIER_B, minimumCoverage: 0, boost: 3 },
  { interest: "footballExperiences", placeIds: ["camp-nou"], minimumCoverage: 1, boost: 8 },
  { interest: "beachRelax", placeIds: ["barceloneta-beach", "bogatell", "nova-icaria"], minimumCoverage: 1, boost: 5 },
  { interest: "viewsNature", placeIds: ["bunkers-carmel", "mnac", "tibidabo"], minimumCoverage: 1, boost: 5 },
  { interest: "cultureLocal", placeIds: ["gothic-quarter", "sagrada-familia", "barcelona-cathedral", "palau-musica", "sant-pau"], minimumCoverage: 1, boost: 5 },
];

// -- V1.2 coverage GUARANTEES (see plannerDayBuilder.ts's applyCoverageRepairs for the
// full priority order) -- distinct from the boost-only BARCELONA_COVERAGE_GOALS above.
//
// Camp Nou is the only dedicated football anchor in the current 21-place dataset, so
// selecting footballExperiences should reliably include it -- a scoring boost alone
// wasn't enough (Camp Nou sits alone in the geographically isolated les-corts cluster,
// so it could still lose out to the greedy fill order -- see the V1.2 task's audit finding).
export const BARCELONA_REQUIRED_COVERAGE_GOALS: RequiredCoverageGoal[] = [
  { interest: "footballExperiences", candidates: ["camp-nou"], minCoverage: 1 },
];

// Popular Tier A minimum coverage, upgraded from boost-only to a real post-selection
// guarantee. Reuses the same Tier A list as BARCELONA_COVERAGE_GOALS's boost entry above.
export const BARCELONA_TIER_COVERAGE_GOALS: TierCoverageGoal[] = [
  { interest: "popular", tierPlaceIds: BARCELONA_ICONIC_TIER_A, minCoverage: 4 },
];

// Phase 1 (Smart Planner V2 architecture): exported so barcelonaDestinationConfig.ts can reuse
// this exact object as DestinationConfig.dayBuilderConfig -- visibility change only, the object
// itself is byte-for-byte unchanged.
export const BARCELONA_DAY_BUILDER_CONFIG: DayBuilderConfig = {
  clusterCompatibility: BARCELONA_CLUSTER_COMPATIBILITY,
  similarityGroups: BARCELONA_SIMILARITY_GROUPS,
  coverageGoals: BARCELONA_COVERAGE_GOALS,
  iconicTiers: BARCELONA_ICONIC_TIERS,
  requiredCoverageGoals: BARCELONA_REQUIRED_COVERAGE_GOALS,
  tierCoverageGoals: BARCELONA_TIER_COVERAGE_GOALS,
  // Must-See Priority Audit -- see barcelonaMustSeePolicy.ts for the full policy/root-cause
  // doc. Shared by V1 and V2 (same as every other field on this config), matching precedent.
  flagshipCoverageGoals: BARCELONA_FLAGSHIP_COVERAGE_GOALS,
  // Fix Repetitive Montjuïc Day -- see plannerDayBuilder.ts's SECOND_LONG_EXPERIENCE_SAME_
  // CLUSTER_VALUE_FACTOR for the full evidence (measured 23/24 co-occurrence of montjuic+mnac,
  // each independently a 180min "long experience", riding in together with zero value
  // competition). Scoped to ONLY "montjuic" -- old-city's own long-experience pair
  // (gaudi-bike-tour/gothic-quarter-tapas-wine-tour) was NOT part of the measured problem and
  // must keep its existing free-pass behavior, confirmed via this task's own regression run.
  secondLongExperienceGateClusters: new Set(["montjuic"]),
};

export function buildBarcelonaPlannerPlan(request: PlannerBuildRequest): GeneratedPlannerPlan {
  return buildPlannerPlan(getBarcelonaPlannerPlaces(), request, BARCELONA_DAY_BUILDER_CONFIG);
}
