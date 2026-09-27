import Container from "../Container";
import type { QuickFact } from "../../lib/guideTypes";

export default function QuickFacts({ name, facts }: { name: string; facts: QuickFact[] }) {
  return (
    <section className="py-10">
      <Container>
        <h2 className="text-lg font-bold text-slate-900">
          <span dir="ltr" className="inline-block">
            {name}
          </span>{" "}
          بسرعة
        </h2>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {facts.map((fact) => (
            <div key={fact.label} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <p className="text-xl">{fact.icon}</p>
              <p className="mt-1.5 text-xs text-slate-500">{fact.label}</p>
              <p dir="auto" className="mt-0.5 text-sm font-bold text-slate-900">
                {fact.value}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
