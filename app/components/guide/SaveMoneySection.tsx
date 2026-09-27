import { IconExternalLink } from "../icons";
import ExternalLink from "./ExternalLink";
import type { SaveMoneyTip } from "../../lib/guideTypes";

export default function SaveMoneySection({ tips }: { tips: SaveMoneyTip[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {tips.map((tip) => (
        <div key={tip.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xl">{tip.icon}</span>
          <div className="min-w-0 flex-1">
            <p dir="auto" className="text-sm font-bold text-slate-900">
              {tip.title}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-700">{tip.tip}</p>

            {(tip.estimatedSaving || tip.bestFor) && (
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                {tip.estimatedSaving && (
                  <span className="rounded-full bg-teal-50 px-2.5 py-1 font-semibold text-teal-700">💰 {tip.estimatedSaving}</span>
                )}
                {tip.bestFor && <span className="rounded-full bg-slate-50 px-2.5 py-1 font-medium text-slate-600">👤 {tip.bestFor}</span>}
              </div>
            )}

            {tip.warning && (
              <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-xs leading-5 text-amber-800">
                <span>⚠️</span>
                <span>{tip.warning}</span>
              </p>
            )}

            {tip.sourceUrl && (
              <ExternalLink
                href={tip.sourceUrl}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:underline"
              >
                المصدر الرسمي
                <IconExternalLink className="h-3 w-3" />
              </ExternalLink>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
