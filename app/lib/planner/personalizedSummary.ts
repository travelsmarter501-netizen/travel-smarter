import { V2_INTEREST_DISPLAY_GROUPS, isV2DisplayGroupActive, type V2PlannerInterest } from "./v2PlannerTypes";
import { fillCopy, plannerCopyAr, plannerCopyEn } from "../plannerCopy";

/**
 * The trip details of a Personalized Plan as short, ready-to-show lines -- the same wording the checkout summary uses:
 *   "الاهتمامات: فاجئني ✨" / "السكن: لسا ما حجزت"   (English: "Interests: Surprise me ✨" / "Accommodation: Not booked yet").
 * Built from the stored answers (or a saved plan's preferences), so the account, My Plans and checkout all describe a trip identically.
 * Display only: it reads values, it never decides anything about access or payment.
 */
export type TripDetailsInput = {
  surpriseMe?: boolean;
  interests?: readonly V2PlannerInterest[];
  accommodation?: { booked?: boolean; text?: string } | null;
};

export type TripDetails = { interests: string | null; accommodation: string | null };

export function personalizedTripDetails(input: TripDetailsInput | null | undefined, language: "ar" | "en"): TripDetails {
  if (!input) return { interests: null, accommodation: null };
  const copy = language === "en" ? plannerCopyEn : plannerCopyAr;

  const interestNames = input.surpriseMe
    ? copy.wizard.surpriseMe
    : V2_INTEREST_DISPLAY_GROUPS.filter((group) => isV2DisplayGroupActive(input.interests ?? [], group))
        .map((group) => copy.wizard.interestGroups[group.id] ?? group.label)
        .join(language === "ar" ? "، " : ", ");

  const accommodationText = input.accommodation?.booked ? (input.accommodation.text ?? "").trim() : copy.checkoutSummary.accommodationNotBooked;

  return {
    interests: interestNames ? fillCopy(copy.checkoutSummary.interests, { interests: interestNames }) : null,
    accommodation: accommodationText ? fillCopy(copy.checkoutSummary.accommodation, { accommodation: accommodationText }) : null,
  };
}
