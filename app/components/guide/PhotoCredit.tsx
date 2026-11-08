import type { ImageCredit } from "../../lib/guideTypes";
import type { ResolvedPlace } from "../../lib/readyPlan";
import { PLACE_CARD_TEXT, type PlanLanguage } from "../../lib/i18n/planText";

/**
 * The credit a free-licensed photo needs next to it (CC BY / CC BY-SA / Free Art License): the author, a link to the
 * file and a link to the license. Renders nothing for a photo without a named author (our own or unlicensed-free images).
 */
const LINK = "underline decoration-dotted underline-offset-2 hover:text-slate-700";

function hasCredit(credit: ImageCredit & { image?: string }): boolean {
  return !!credit.image && !!credit.imageAuthor;
}

function CreditParts({ credit }: { credit: ImageCredit }) {
  return (
    <>
      {credit.imageSourceUrl ? (
        <a href={credit.imageSourceUrl} target="_blank" rel="noopener noreferrer" className={LINK}>
          {credit.imageAuthor}
        </a>
      ) : (
        credit.imageAuthor
      )}
      {credit.imageLicense && (
        <>
          {" · "}
          {credit.imageLicenseUrl ? (
            <a href={credit.imageLicenseUrl} target="_blank" rel="noopener noreferrer" className={LINK}>
              {credit.imageLicense}
            </a>
          ) : (
            credit.imageLicense
          )}
        </>
      )}
      {credit.imageSource && ` · ${credit.imageSource}`}
    </>
  );
}

/** One photo's credit, under the place's details: a small "حقوق الصورة" link that opens the full credit (author, licence, file). */
export default function PhotoCredit({ credit, lang = "ar" }: { credit: ImageCredit & { image?: string }; lang?: PlanLanguage }) {
  if (!hasCredit(credit)) return null;
  return (
    <details className="mt-3 text-[11px] leading-5 text-slate-500">
      <summary className="inline cursor-pointer list-none underline decoration-dotted underline-offset-2">📷 {PLACE_CARD_TEXT[lang].photoCredit}</summary>
      <p dir="ltr" className="mt-1 text-start">
        <CreditParts credit={credit} />
      </p>
    </details>
  );
}

/** Every credited photo a plan can show, in one collapsed list at the end of the plan. */
export function PlanPhotoCredits({ places, lang = "ar" }: { places: Record<string, ResolvedPlace> | undefined; lang?: PlanLanguage }) {
  const credited = Object.values(places ?? {})
    .map((resolved) => resolved.place)
    .filter(hasCredit);
  const unique = [...new Map(credited.map((place) => [place.image, place])).values()];
  if (unique.length === 0) return null;
  return (
    <details className="mt-6 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] leading-5 text-slate-500">
      <summary className="cursor-pointer font-semibold text-slate-600">
        📷 {PLACE_CARD_TEXT[lang].photoCredits} ({unique.length})
      </summary>
      <ul className="mt-2 space-y-2">
        {unique.map((place) => (
          <li key={place.image}>
            <span dir="auto" className="block font-semibold text-slate-600">
              {place.name}
            </span>
            <span dir="ltr" className="block text-start">
              <CreditParts credit={place} />
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
