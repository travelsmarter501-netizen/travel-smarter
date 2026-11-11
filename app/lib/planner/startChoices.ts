/** The possible start nearest to the one asked for (ties go to the earlier one); null when none is possible. */
export function nearestValidStart(valid: readonly number[], wanted: number): number | null {
  let best: number | null = null;
  for (const v of valid) if (best === null || Math.abs(v - wanted) < Math.abs(best - wanted)) best = v;
  return best;
}
