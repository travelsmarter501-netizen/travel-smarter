import { notFound, redirect } from "next/navigation";
import Container from "../../components/Container";
import BackLink from "../../components/detail/BackLink";
import DetailHero from "../../components/detail/DetailHero";
import InfoCard from "../../components/detail/InfoCard";
import MapLink from "../../components/detail/MapLink";
import StickyCTA from "../../components/detail/StickyCTA";
import Price from "../../components/Price";
import {
  IconBed,
  IconBus,
  IconCalendar,
  IconCamera,
  IconClock,
  IconLightbulb,
  IconMapPin,
  IconMoon,
  IconShoppingBag,
  IconUtensils,
  IconWallet,
} from "../../components/icons";
import { destinations } from "../../lib/content";
import { getGuideBySlug } from "../../lib/guides-data";

export function generateStaticParams() {
  // "barcelona" has its own dedicated page at app/guides/barcelona/page.tsx.
  // Only "available" destinations get a real guide page — "coming-soon" ones redirect at request time.
  return destinations
    .filter((destination) => destination.slug !== "barcelona" && destination.status === "available")
    .map((destination) => ({ slug: destination.slug }));
}

export async function generateMetadata(props: PageProps<"/guides/[slug]">) {
  const { slug } = await props.params;
  const result = getGuideBySlug(slug);
  if (!result) return {};
  return {
    title: `دليل ${result.destination.name} الكامل | Travel Smarter`,
    description: result.guide.overview,
  };
}

export default async function GuidePage(props: PageProps<"/guides/[slug]">) {
  const { slug } = await props.params;
  const result = getGuideBySlug(slug);
  if (!result) notFound();

  const { destination, guide } = result;

  // Coming-soon destinations have no finished guide product yet — send the user back to the destinations section.
  if (destination.status !== "available") redirect("/#destinations");

  return (
    <>
      <main className="pb-10">
        <Container className="pt-4">
          <BackLink href="/#guides" label="الدلائل السياحية" />
        </Container>

        <DetailHero
          image={destination.image}
          name={destination.name}
          countryCode={destination.countryCode}
          country={destination.country}
          kicker="دليل سياحي"
          title={`دليل ${destination.name} الكامل`}
          subtitle={guide.overview}
          meta={[
            { icon: IconCalendar, label: guide.suggestedTripLength },
            { icon: IconClock, label: guide.bestTimeToVisit },
            { icon: IconWallet, label: <Price ils={destination.guidePrice} /> },
          ]}
        />

        <Container className="mt-10 space-y-10">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <InfoCard icon={IconMapPin} title="أبرز الأماكن السياحية" items={guide.attractions} />
            <InfoCard icon={IconBed} title="أفضل المناطق للإقامة" items={guide.areasToStay} />
            <InfoCard icon={IconUtensils} title="مطاعم ومقاهي مقترحة" items={guide.food} />
            <InfoCard icon={IconBus} title="المواصلات" text={guide.transportation} />
            <InfoCard icon={IconShoppingBag} title="التسوق" text={guide.shopping} />
            <InfoCard icon={IconMoon} title="الحياة الليلية" text={guide.nightlife} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">تكاليف تقريبية</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {guide.costs.map((cost) => (
                <div key={cost.label} className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                  <p className="text-sm text-slate-500">{cost.label}</p>
                  <Price ils={cost.priceILS} className="mt-1 text-lg font-bold text-slate-900" />
                </div>
              ))}
            </div>
          </div>

          {guide.tips.map((section) => (
            <InfoCard key={section.id} icon={IconLightbulb} title={section.title} items={section.items} />
          ))}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-base font-bold text-slate-900">أفضل أماكن التصوير</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {guide.photoSpots.map((spot) => (
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
        priceILS={destination.guidePrice}
        priceLabel="سعر الدليل"
        ctaLabel="احصل على الدليل"
        mailSubject={`استفسار عن دليل ${destination.name}`}
      />
    </>
  );
}
