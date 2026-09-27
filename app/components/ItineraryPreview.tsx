import Container from "./Container";
import SectionHeading from "./SectionHeading";
import Button from "./Button";
import Flag from "./Flag";
import { IconMapPin } from "./icons";

const timeline = [
  { time: "09:00", label: "Breakfast" },
  { time: "10:00", label: "Sagrada Família (ساغرادا فاميليا)" },
  { time: "13:00", label: "Lunch" },
  { time: "15:00", label: "Gothic Quarter (الحي القوطي)" },
  { time: "18:00", label: "Barceloneta Beach (شاطئ برشلونيتا)" },
  { time: "21:00", label: "Evening activity" },
];

export default function ItineraryPreview() {
  return (
    <section id="itinerary-preview" className="scroll-mt-20 py-20 sm:py-28">
      <Container className="grid items-center gap-12 md:grid-cols-2">
        <div>
          <SectionHeading
            align="start"
            eyebrow="معاينة"
            title="هكذا يبدو يوم واحد من رحلتك"
            description="سواء اخترت خطة مخصصة أو رزمة جاهزة، إليك مثالاً مصغرًا لما يمكن أن يبدو عليه برنامج يوم كامل."
          />
          <Button href="/#custom-plan" className="mt-8">
            ابدأ تخطيط رحلتك الخاصة
          </Button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center border-b border-slate-100 pb-4">
            <span className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-900">
              <IconMapPin className="h-4 w-4 shrink-0 text-teal-700" />
              <span>مثال مصغر من خطة</span>
              <span dir="ltr" className="inline-flex items-center gap-1.5">
                Barcelona
                <Flag code="es" countryName="Spain" className="h-3.5 w-5" />
              </span>
            </span>
          </div>

          <ol className="mt-5 space-y-4">
            {timeline.map((item) => (
              <li key={item.time} className="flex items-center gap-4">
                <span className="w-14 shrink-0 text-sm font-semibold text-teal-700">{item.time}</span>
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" />
                <span dir="ltr" className="text-sm text-slate-700">{item.label}</span>
              </li>
            ))}
          </ol>

          <p className="mt-6 border-t border-slate-100 pt-4 text-xs leading-6 text-slate-500">
            هذا مثال مصغر فقط لتوضيح شكل الخطة. الخطة الكاملة التي تحصل عليها بعد
            الشراء تتضمن تفاصيل أكثر: أماكن إضافية، أوقات دقيقة، روابط خرائط،
            ونصائح محلية.
          </p>
        </div>
      </Container>
    </section>
  );
}
