import type { V2Day } from "./barcelonaV2Resolve";

/**
 * Estimated entry tickets of a plan day (cities with ticketEstimate). Included = the day's stops visited inside; outside stops
 * are free; optional suggestions are counted apart; a paid place without a known price is counted as "not available", never 0.
 * Old saved plans (no ticket data on their stops) return null, and nothing is shown.
 */
export type TicketSummary = { currency: string; included: number; unknown: number; optional: number; optionalUnknown: number };

export function dayTickets(day: V2Day): TicketSummary | null {
  const withData = day.stops.filter((stop) => stop.ticket);
  if (withData.length === 0) return null;
  const currency = withData[0].ticket!.currency;
  let included = 0;
  let unknown = 0;
  for (const stop of withData) {
    if (stop.ticket!.amount === null) unknown++;
    else included += stop.ticket!.amount;
  }
  let optional = 0;
  let optionalUnknown = 0;
  for (const nearby of day.optionalNearby) {
    if (!nearby.ticket) continue;
    if (nearby.ticket.amount === null) optionalUnknown++;
    else optional += nearby.ticket.amount;
  }
  return { currency, included, unknown, optional, optionalUnknown };
}

export function planTickets(days: readonly V2Day[]): TicketSummary | null {
  const perDay = days.map(dayTickets).filter((t): t is TicketSummary => t !== null);
  if (perDay.length === 0) return null;
  return perDay.reduce((sum, t) => ({ currency: sum.currency, included: sum.included + t.included, unknown: sum.unknown + t.unknown, optional: sum.optional + t.optional, optionalUnknown: sum.optionalUnknown + t.optionalUnknown }));
}

export function formatTicketAmount(amount: number, currency: string): string {
  // Isolated left-to-right so "~2,150 CZK" reads the same inside Arabic or Hebrew text.
  return "⁦~" + amount.toLocaleString("en-US") + " " + currency + "⁩";
}
