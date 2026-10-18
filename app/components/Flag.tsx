// Flags are served from our own origin (public/flags/<code>.svg) instead of a third-party host: no extra DNS/TLS
// connection on mobile, and a few hundred bytes each. The detailed coat-of-arms in the Spanish and Egyptian
// flags is omitted because it is invisible at these sizes (about 18-28px wide).
export default function Flag({
  code,
  countryName,
  className = "",
}: {
  code: string;
  countryName: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${code}.svg`}
      alt={countryName}
      loading="lazy"
      decoding="async"
      className={`inline-block rounded-sm object-cover shadow-sm ${className}`}
    />
  );
}
