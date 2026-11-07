/**
 * Hebrew spelling: after a one-letter prefix (ל / ב / מ / ש / כ), a name that starts with a single ו doubles it
 * (וינה -> לווינה, בווינה). Applied only to an inserted name, never to a template's own words. Tiny on purpose: it is
 * shared by the planner copy and the plan view without pulling either into the other's bundle.
 */
export function hebrewPrefixed(prefix: string, name: string): string {
  return /^ו(?!ו)/.test(name) ? `${prefix}ו${name}` : `${prefix}${name}`;
}
