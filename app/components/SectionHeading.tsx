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
      {eyebrow && (
        <span className="text-sm font-semibold tracking-wide text-teal-700">{eyebrow}</span>
      )}
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        {title}
      </h2>
      {description && <p className="mt-4 text-lg leading-8 text-slate-600">{description}</p>}
    </div>
  );
}
