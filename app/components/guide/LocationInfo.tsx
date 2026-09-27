import { IconMapPin } from "../icons";
import CopyButton from "./CopyButton";
import ExternalLink from "./ExternalLink";
import type { LocationLabel } from "../../lib/guideTypes";

/**
 * Reusable location block for any real physical place across any destination guide:
 * area context, exact address (or a clearly-labeled central point when there isn't one),
 * a copy-address button, and Google/Apple Maps links. Reused across attractions, food,
 * nightlife, beaches, photo spots, shopping, and area cards — do not duplicate this UI
 * or the copy logic inside individual card components.
 */
export default function LocationInfo({
  area,
  address,
  phone,
  mapsUrl,
  appleMapsUrl,
  label = "الموقع",
}: {
  area?: string;
  address?: string;
  /** Real, verified phone number — rendered as a tap-to-call link. Omit rather than invent one when unknown. */
  phone?: string;
  mapsUrl: string;
  appleMapsUrl: string;
  label?: LocationLabel;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1 text-xs font-semibold text-slate-500">
          <span>📍</span>
          <span>{label}</span>
        </p>
        {area && (
          <span dir="auto" className="max-w-[60%] truncate rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            {area}
          </span>
        )}
      </div>

      {address && (
        <div className="mt-1 flex items-start gap-2">
          <p dir="auto" className="min-w-0 flex-1 break-words text-sm leading-5 text-slate-700">
            {address}
          </p>
          <CopyButton text={address} />
        </div>
      )}

      {phone && (
        <p dir="ltr" className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-700">
          <span>📞</span>
          <a href={`tel:${phone.replace(/\s+/g, "")}`} className="hover:text-teal-700 hover:underline">
            {phone}
          </a>
        </p>
      )}

      <div className="mt-2 grid grid-cols-2 gap-2">
        <ExternalLink
          href={mapsUrl}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-teal-300 hover:text-teal-700"
        >
          <IconMapPin className="h-3.5 w-3.5" />
          Google Maps
        </ExternalLink>
        <ExternalLink
          href={appleMapsUrl}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-teal-300 hover:text-teal-700"
        >
          <IconMapPin className="h-3.5 w-3.5" />
          Apple Maps
        </ExternalLink>
      </div>
    </div>
  );
}
