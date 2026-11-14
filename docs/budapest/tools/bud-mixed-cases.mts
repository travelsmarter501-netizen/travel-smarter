// Mixed-date trips (an exceptional day and an ordinary day in the same trip), shared by bud-mixed-sample.mts and bud-mixed-dates.mts.
const N = ["natureViews", "beachRelax"], E = ["footballExperiences", "nightlife"];
const A = ["popular", "cultureHistory", ...N], B = ["cultureHistory"], C = ["food", "shopping", ...E];
export const MIXED_CASES: { id: string; why: string; arrival: string; departure: string; interests: string[] }[] = [
  { id: "M1-culture-2026-12-26", why: "10 days: Mon 28 Dec (gallery open, published) + Mon 4 Jan (ordinary, closed); 24/25 Dec not in trip; 31 Dec short day", arrival: "2026-12-26", departure: "2027-01-04", interests: B },
  { id: "M2-A-2026-12-29", why: "year end: 31 Dec (gallery last entry 15:00) next to ordinary days; 1 Jan from noon", arrival: "2026-12-29", departure: "2027-01-01", interests: A },
  { id: "M3-culture-2026-12-01", why: "House of Music: Tue 1 Dec first Tuesday (closed) + Tue 8 Dec ordinary (open)", arrival: "2026-12-01", departure: "2026-12-08", interests: B },
  { id: "M4-C-2026-12-23", why: "Thu 24 Dec (no evening cruise; gallery closed) + Thu 31 Dec (cruise published; gallery short day); 2027 day", arrival: "2026-12-23", departure: "2027-01-01", interests: C },
  { id: "M5-C-2026-11-16", why: "cruise period boundary: Mon 16 Nov (from 16:20) + Mon 23 Nov (15:40 period)", arrival: "2026-11-16", departure: "2026-11-23", interests: C },
  { id: "M6-C-2026-12-30", why: "year end for the cruise: 2026 days published, 2027 days not", arrival: "2026-12-30", departure: "2027-01-02", interests: C },
  { id: "M7-A-2026-12-23", why: "24, 25 (gallery closed), 26-30 (open, Monday 28 included), 31 Dec (short), 1 Jan (noon)", arrival: "2026-12-23", departure: "2027-01-01", interests: A },
];
