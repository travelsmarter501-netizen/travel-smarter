import Price from "../Price";

export default function StickyCTA({
  priceILS,
  priceLabel,
  ctaLabel,
  mailSubject,
}: {
  priceILS: number;
  priceLabel: string;
  ctaLabel: string;
  mailSubject: string;
}) {
  return (
    <div className="sticky bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-10">
        <div>
          <p className="text-xs text-slate-500">{priceLabel}</p>
          <Price ils={priceILS} className="text-lg font-bold text-slate-900" />
        </div>
        <a
          href={`mailto:travelsmarter501@gmail.com?subject=${encodeURIComponent(mailSubject)}`}
          className="inline-flex items-center justify-center rounded-full bg-teal-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800"
        >
          {ctaLabel}
        </a>
      </div>
    </div>
  );
}
