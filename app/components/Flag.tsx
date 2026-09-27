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
      src={`https://flagcdn.com/${code}.svg`}
      alt={countryName}
      loading="lazy"
      className={`inline-block rounded-sm object-cover shadow-sm ${className}`}
    />
  );
}
