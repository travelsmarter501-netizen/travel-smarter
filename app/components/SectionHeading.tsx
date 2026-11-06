export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "start";
}) {
  const alignClass = align === "center" ? "mx-auto text-center" : "text-start";

  return (
    <div className={`max-w-2xl ${alignClass}`}>
      {eyebrow && <span className="text-sm font-semibold tracking-wide text-brand">{eyebrow}</span>}
      <h2 className="mt-2 text-[1.75rem] font-bold leading-tight tracking-tight text-ink sm:text-4xl">{title}</h2>
      {description && <p className="mt-3 text-base leading-7 text-muted sm:text-lg sm:leading-8">{description}</p>}
    </div>
  );
}
