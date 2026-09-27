import Container from "./Container";
import SectionHeading from "./SectionHeading";
import DestinationCard from "./DestinationCard";
import { destinations } from "../lib/content";

export default function PopularDestinations() {
  return (
    <section id="destinations" className="scroll-mt-20 py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="الوجهات"
          title="وجهات يختارها مسافرون مثلك"
          description="كل وجهة من وجهاتنا تدعم الخطة المخصصة، الرزمة الجاهزة، والدليل السياحي—اختر ما يناسبك."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {destinations.map((destination) => (
            <DestinationCard key={destination.slug} destination={destination} />
          ))}
        </div>
      </Container>
    </section>
  );
}
