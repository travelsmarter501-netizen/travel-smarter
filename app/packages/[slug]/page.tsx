import { notFound, redirect } from "next/navigation";
import Container from "../../components/Container";
import BackLink from "../../components/detail/BackLink";
import DetailHero from "../../components/detail/DetailHero";
import InfoCard from "../../components/detail/InfoCard";
import MapLink from "../../components/detail/MapLink";
import PackageDayTimeline from "../../components/detail/PackageDayTimeline";
import StickyCTA from "../../components/detail/StickyCTA";
import Price from "../../components/Price";
import {
  IconBed,
  IconBus,
  IconCalendar,
  IconCamera,
  IconCheck,
  IconLightbulb,
  IconMapPin,
  IconUtensils,
  IconWallet,
} from "../../components/icons";
import { destinations } from "../../lib/content";
import { getPackageBySlug } from "../../lib/packages-data";

export function generateStaticParams() {
  // Only "available" destinations get a real package page — "coming-soon" ones redirect at request time.
  // Barcelona is excluded: it now always redirects to its own rich 5-day Ready Package at /ready-plans/barcelona.
  return destinations
    .filter((destination) => destination.status === "available" && destination.slug !== "barcelona")
    .map((destination) => ({ slug: destination.slug }));
}

export async function generateMetadata(props: PageProps<"/packages/[slug]">) {
  const { slug } = await props.params;
  const result = getPackageBySlug(slug);
  if (!result) return {};
  return {
    title: `رزمة ${result.destination.name} الجاهزة | Travel Smarter`,
    description: result.pkg.overview,
  };
}

export default async function PackagePage(props: PageProps<"/packages/[slug]">) {
  const { slug } = await props.params;
  const result = getPackageBySlug(slug);
  if (!result) notFound();

  const { destination, pkg } = result;

  // Coming-soon destinations have no finished package product yet — send the user back to the destinations section.
  if (destination.status !== "available") redirect("/#destinations");

  // Barcelona has a real, rich 5-day Ready Package at /ready-plans/barcelona — this legacy
  // shallow package page must not be shown as a second, competing product for it.
  if (destination.slug === "barcelona") redirect("/ready-plans/barcelona");

  return (
    <>
      <main className="pb-10">
        <Container className="pt-4">
          <BackLink href="/#packages" label="الرزم الجاهزة" />
        </Container>

        <DetailHero
          image={destination.image}
          name={destination.name}
          countryCode={destination.countryCode}
          country={destination.country}
          kicker="رزمة سفر جاهزة"
          title={`${destination.packageDays}-Day ${destination.name} Complete Plan`}
          subtitle={pkg.overview}
          meta={[
            { icon: IconCalendar, label: `${destination.packageDays} أيام` },
            { icon: IconWallet, label: <Price ils={destination.packagePrice} /> },
          ]}
        />

        <Container className="mt-10 space-y-10">
          <InfoCard icon={IconCheck} title="ماذا يتضمن؟" items={pkg.included} />

          <div>
            <h2 className="text-xl font-bold text-slate-900">برنامج الرحلة يوم بيوم</h2>
            <div className="mt-5">
              <PackageDayTimeline days={pkg.days} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <InfoCard icon={IconMapPin} title="أبرز المعالم" items={pkg.attractions} />
            <InfoCard icon={IconUtensils} title="مطاعم ومقاهي مقترحة" items={pkg.food} />
            <InfoCard icon={IconBed} title="أفضل الأحياء للإقامة" items={pkg.neighborhoods} />
            <InfoCard icon={IconBus} title="المواصلات" text={pkg.transportation} />
          </div>

          <InfoCard
            icon={IconWallet}
            title="الميزانية اليومية التقريبية"
            items={[
              <span key="budget" dir="ltr" className="inline-flex items-center gap-1">
                <Price ils={pkg.dailyBudgetILS.min} /> – <Price ils={pkg.dailyBudgetILS.max} /> في اليوم تقريبًا
              </span>,
            ]}
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <InfoCard icon={IconCalendar} title="توصيات الحجز" items={pkg.bookingTips} />
            <InfoCard icon={IconLightbulb} title="نصائح مهمة" items={pkg.tips} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-base font-bold text-slate-900">أفضل أماكن التصوير</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {pkg.photoSpots.map((spot) => (
                <li key={spot} className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm">
                  <IconCamera className="h-4 w-4 text-teal-700" />
                  {spot}
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <MapLink query={`${destination.name} attractions`} label={`افتح ${destination.name} في خرائط جوجل`} />
            </div>
          </div>
        </Container>
      </main>

      <StickyCTA
        priceILS={destination.packagePrice}
        priceLabel="سعر الرزمة"
        ctaLabel="اشترِ الرزمة"
        mailSubject={`استفسار عن رزمة ${destination.name}`}
      />
    </>
  );
}
