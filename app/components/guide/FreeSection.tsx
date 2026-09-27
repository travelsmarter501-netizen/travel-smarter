import type { FreeExperience } from "../../lib/guideTypes";

export default function FreeSection({ experiences }: { experiences: FreeExperience[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {experiences.map((experience) => (
        <div key={experience.id} className="rounded-2xl border border-teal-100 bg-teal-50/60 p-5">
          <p className="text-sm font-bold text-slate-900">{experience.name}</p>
          <p className="mt-1.5 text-sm leading-6 text-slate-600">{experience.description}</p>
        </div>
      ))}
    </div>
  );
}
