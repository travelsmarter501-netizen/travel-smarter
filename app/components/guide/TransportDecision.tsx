import { IconExternalLink } from "../icons";
import ExternalLink from "./ExternalLink";
import type { TransportMode } from "../../lib/guideTypes";

const decisions = [
  { situation: "مسافة قصيرة", choice: "امشِ 🚶" },
  { situation: "داخل المدينة", choice: "Metro 🚇" },
  { situation: "شنط كثيرة أو بالليل", choice: "Taxi 🚕" },
  { situation: "من/إلى المطار", choice: "Aerobús أو R2 Nord ✈️" },
];

export default function TransportDecision({ modes }: { modes: TransportMode[] }) {
  return (
    <div>
      <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-5">
        <p className="text-sm font-bold text-teal-800">شو أختار؟</p>
        <div className="mt-3 space-y-2">
          {decisions.map((decision) => (
            <div key={decision.situation} dir="auto" className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-2.5 text-sm">
              <span className="text-slate-600">{decision.situation}</span>
              <span className="font-semibold text-slate-900">← {decision.choice}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {modes.map((mode) => (
          <div key={mode.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <span className="text-lg">{mode.icon}</span>
              <span dir="auto">{mode.name}</span>
            </p>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">{mode.whenToUse}</p>
            {mode.officialUrl && (
              <ExternalLink
                href={mode.officialUrl}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:underline"
              >
                معلومات رسمية
                <IconExternalLink className="h-3 w-3" />
              </ExternalLink>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
