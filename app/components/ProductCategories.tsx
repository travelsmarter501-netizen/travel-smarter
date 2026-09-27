import Container from "./Container";
import SectionHeading from "./SectionHeading";
import Button from "./Button";
import Price from "./Price";
import { productCategories } from "../lib/content";

export default function ProductCategories() {
  return (
    <section id="custom-plan" className="scroll-mt-20 py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="ثلاث طرق للسفر"
          title="اختر الطريقة المناسبة لرحلتك"
          description="من التخطيط المخصص بالكامل إلى الرزم الجاهزة والأدلة السريعة—اختر ما يناسب وقتك وميزانيتك."
        />

        <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {productCategories.map((category) => {
            const Icon = category.icon;
            return (
              <div
                key={category.id}
                className={`relative flex flex-col rounded-3xl border p-8 shadow-sm transition-shadow hover:shadow-lg ${
                  category.featured
                    ? "border-teal-700 bg-gradient-to-b from-teal-50 to-white ring-1 ring-teal-700"
                    : "border-slate-200 bg-white"
                }`}
              >
                {category.featured && (
                  <span className="absolute -top-3.5 right-8 rounded-full bg-teal-700 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    الأكثر تخصيصًا
                  </span>
                )}

                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    category.featured ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </span>

                <h3 className="mt-6 text-xl font-bold text-slate-900">{category.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{category.description}</p>

                <p className="mt-6 text-sm text-slate-500">
                  ابتداءً من <Price ils={category.priceFrom} className="text-xl font-bold text-slate-900" />
                </p>

                <Button
                  href={category.ctaHref}
                  variant={category.featured ? "primary" : "secondary"}
                  className="mt-5 w-full"
                >
                  {category.ctaLabel}
                </Button>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
