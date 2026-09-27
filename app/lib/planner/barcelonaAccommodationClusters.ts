/**
 * Barcelona Smart Planner — accommodation free-text -> planner cluster resolver (V1).
 *
 * Deterministic, offline, keyword-based only -- no geocoding API, no external service, no
 * fuzzy/ML matching. Maps a customer-entered hotel name/apartment address to one of the REAL
 * existing planner cluster ids (see barcelona-planner-metadata.ts) only when the text
 * contains an unambiguous, specific signal for that neighborhood. Deliberately conservative:
 * a generic/ambiguous term (e.g. a bare "Eixample", which spans three different clusters
 * here — eixample-north, passeig-gracia, and city-center all sit within the real Eixample
 * district) is never guessed -- returns null instead. This is the fail-safe rule from the
 * task spec: misclassification must degrade to "no anchor benefit", never a wrong one.
 *
 * Patterns are checked in order, MOST SPECIFIC FIRST, first match wins -- e.g. "passeig de
 * gracia" is checked before the bare "gracia" pattern, since the former text contains the
 * latter as a substring but names a different, more specific cluster.
 *
 * V1 scope note: this does not attempt to cover every possible Barcelona address or every
 * Arabic transliteration spelling — only the clearest, most common signals. A real cluster
 * name (e.g. "eixample-north") is never invented here; every `cluster` value returned is one
 * of the actual ids already used by barcelona-planner-metadata.ts /
 * barcelona-planner-day-builder.ts.
 */

type ClusterPattern = { cluster: string; patterns: RegExp[] };

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Word-boundary-anchored patterns for Latin-script phrases (case-insensitive). */
function latin(...phrases: string[]): RegExp[] {
  return phrases.map((phrase) => new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "i"));
}

/**
 * Real planner cluster ids only (see barcelona-planner-metadata.ts / RAW_CLUSTER_LINKS in
 * barcelona-planner-day-builder.ts for the ground truth). Arabic patterns are common
 * transliterations only, not exhaustive.
 */
const CLUSTER_PATTERNS: ClusterPattern[] = [
  {
    cluster: "passeig-gracia",
    patterns: [...latin("passeig de gracia", "passeig de gràcia", "paseo de gracia", "pg de gracia"), /باسي?ج\s*دي?\s*غراسيا/],
  },
  {
    cluster: "eixample-north",
    patterns: [...latin("sagrada familia", "sagrada família"), /ساغرادا\s*فامي?ليا|سجرادا\s*فامي?ليا/],
  },
  {
    cluster: "gracia-north",
    patterns: [...latin("gracia", "gràcia", "park guell", "park güell", "bunkers del carmel"), /غراسيا|جراسيا|بارك\s*غويل/],
  },
  {
    cluster: "city-center",
    patterns: [...latin("placa catalunya", "plaça catalunya", "plaza catalunya", "catalunya square"), /بلاث?ا\s*كاتالونيا/],
  },
  {
    cluster: "old-city",
    patterns: [
      ...latin("gothic quarter", "barri gotic", "barri gòtic", "ciutat vella", "raval", "la rambla", "las ramblas"),
      /الحي\s*القوطي|رامبلا/,
    ],
  },
  {
    cluster: "born",
    patterns: [...latin("el born", "born", "santa maria del mar"), /البورن|\bبورن\b/],
  },
  {
    cluster: "seafront-east",
    patterns: [...latin("poblenou", "poble nou", "diagonal mar"), /بوبلينو/],
  },
  {
    cluster: "seafront",
    patterns: [...latin("barceloneta"), /برشلونيتا/],
  },
  {
    cluster: "montjuic",
    patterns: [...latin("montjuic", "montjuïc"), /مونجويك|مونتجويك/],
  },
  {
    cluster: "les-corts",
    patterns: [...latin("les corts", "camp nou", "pedralbes"), /ليس\s*كورتس|كامب\s*نو|بيدرالبس/],
  },
  {
    cluster: "tibidabo",
    patterns: [...latin("tibidabo"), /تيبيدابو/],
  },
];

/**
 * Resolves free-text accommodation input to a real planner cluster id, or null if no
 * pattern confidently matches. Never throws, never fabricates a guess.
 */
export function resolveBarcelonaAccommodationCluster(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  for (const { cluster, patterns } of CLUSTER_PATTERNS) {
    if (patterns.some((pattern) => pattern.test(trimmed))) return cluster;
  }
  return null;
}
