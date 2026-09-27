import type { ReactNode } from "react";

/** One labeled card in the Custom Plan request form -- consistent spacing/typography for every section, so the form reads as a series of clear steps without a heavy multi-step wizard. */
export default function FormSection({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-bold text-slate-900">{label}</p>
      {helper && <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}
