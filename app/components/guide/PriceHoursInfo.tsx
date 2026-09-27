export default function PriceHoursInfo({
  priceText,
  openingHours,
  lastVerified,
}: {
  priceText?: string;
  openingHours?: string;
  lastVerified?: string;
}) {
  if (!priceText && !openingHours) return null;

  return (
    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
      {priceText && (
        <div className="rounded-lg bg-slate-50 px-2.5 py-2">
          <p className="text-slate-500">السعر</p>
          <p className="mt-0.5 font-semibold text-slate-800">{priceText}</p>
        </div>
      )}
      {openingHours && (
        <div className="rounded-lg bg-slate-50 px-2.5 py-2">
          <p className="text-slate-500">ساعات العمل</p>
          <p className="mt-0.5 font-semibold text-slate-800">{openingHours}</p>
        </div>
      )}
      {lastVerified && <p className="col-span-2 text-[11px] text-slate-400">آخر تحقق: {lastVerified}</p>}
    </div>
  );
}
