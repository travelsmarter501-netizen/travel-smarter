import Container from "./Container";
import SectionHeading from "./SectionHeading";

const steps = [
  {
    number: "01",
    title: "اختر وجهتك",
    description: "اختر المدينة أو الوجهة التي تحلم بزيارتها من بين وجهاتنا المتنوعة حول العالم.",
  },
  {
    number: "02",
    title: "أخبرنا ماذا تحب",
    description: "شاركنا ميزانيتك، مدة رحلتك، وأسلوبك المفضل: مغامرة، ثقافة، طعام، أو استرخاء.",
  },
  {
    number: "03",
    title: "استلم خطتك المخصصة",
    description: "نجهّز لك برنامج رحلة يومي متكامل، مصمم خصيصًا لك، خلال دقائق معدودة.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-slate-50 py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="كيف يعمل"
          title="ثلاث خطوات بسيطة تفصلك عن خطتك المخصصة"
          description="هكذا تحصل على خطة سفر مخصصة. أما الرزم الجاهزة والأدلة السياحية فهي متاحة للتصفح والشراء فورًا بدون انتظار."
        />

        <div className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
          <div
            aria-hidden
            className="absolute top-7 hidden h-px w-full border-t border-dashed border-slate-300 md:block"
          />

          {steps.map((step) => (
            <div key={step.number} className="relative flex flex-col items-center text-center md:items-start md:text-start">
              <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-700 text-lg font-bold text-white shadow-md">
                {step.number}
              </span>
              <h3 className="mt-5 text-xl font-bold text-slate-900">{step.title}</h3>
              <p className="mt-2 max-w-xs text-slate-600 leading-7">{step.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
