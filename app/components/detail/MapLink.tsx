import { IconExternalLink, IconMapPin } from "../icons";

/**
 * A plain link to a Google Maps search — no API key or SDK involved.
 * This is a placeholder until real per-attraction map links are added.
 */
export default function MapLink({ query, label }: { query: string; label: string }) {
  const href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-teal-300 hover:text-teal-700"
    >
      <IconMapPin className="h-4 w-4" />
      {label}
      <IconExternalLink className="h-3.5 w-3.5 opacity-60" />
    </a>
  );
}
