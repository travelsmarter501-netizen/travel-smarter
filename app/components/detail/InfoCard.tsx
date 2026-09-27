import type { ComponentType, ReactNode, SVGProps } from "react";
import { IconCheck } from "../icons";

export default function InfoCard({
  icon: Icon,
  title,
  items,
  text,
  className = "",
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  items?: ReactNode[];
  text?: string;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
      </div>

      {text && <p className="mt-4 text-sm leading-7 text-slate-600">{text}</p>}

      {items && (
        <ul className="mt-4 space-y-2.5">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
              <IconCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />
              <span dir="auto">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
