import type { Metadata } from "next";
import Link from "next/link";
import LegalPageLayout, { LegalContactBlock, LegalList, LegalSection } from "../components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Terms of Service | Travel Smarter",
  description:
    "Terms governing the sale and use of Travel Smarter digital travel guides, ready-made itineraries and personalized trip planning services.",
};

const linkClass = "font-semibold text-teal-700 hover:underline";

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="October 4, 2026">
      <p>
        These Terms of Service (“Terms”) govern your use of the Travel Smarter website and the purchase of products from
        Travel Smarter (“Travel Smarter”, “we”, “us”). By creating an account, buying a product or using the website you
        agree to these Terms. If you do not agree, please do not use the website. Please also read our{" "}
        <Link href="/privacy-policy" className={linkClass}>
          Privacy Policy
        </Link>
        .
      </p>

      <LegalSection title="1. Who we are">
        <LegalContactBlock />
      </LegalSection>

      <LegalSection title="2. What we sell">
        <p>Travel Smarter sells digital travel products and services:</p>
        <LegalList>
          <li>
            <strong>Digital travel guides:</strong> destination information such as places, restaurants, hotels, shopping
            and nightlife.
          </li>
          <li>
            <strong>Ready-made itineraries:</strong> pre-built, day-by-day travel plans (for example 1-day, 3-day and 5-day
            plans).
          </li>
          <li>
            <strong>Personalized trip planning:</strong> a plan generated for you based on the destination, trip length or
            dates, interests and accommodation you provide.
          </li>
        </LegalList>
        <p>Barcelona is currently the available destination; more destinations may be added over time.</p>
        <p>
          <strong>Travel Smarter is not a travel agency.</strong> We do not sell, book or arrange flights, hotels,
          transport, tours or travel packages, and we are not a party to any booking you make with a third party. Mentions
          of hotels, restaurants, attractions or booking pages are for information only.
        </p>
      </LegalSection>

      <LegalSection title="3. Your account">
        <p>
          You need an account to buy and access products. You agree to provide accurate information, keep your sign-in
          details secure, and are responsible for activity on your account. Contact us right away if you suspect
          unauthorized use.
        </p>
      </LegalSection>

      <LegalSection title="4. Personal use of digital products">
        <p>
          When you purchase a digital product, we grant you a limited, non-exclusive, non-transferable right to access and
          use it for your own personal, non-commercial purposes through your account. You may not copy, resell,
          redistribute or publish the products or their content, share your account access with others, use the content
          commercially, or use automated tools to extract content.
        </p>
      </LegalSection>

      <LegalSection title="5. Personalized trip plans">
        <p>
          Personalized trip plans are an informational and planning service. They are generated automatically from your
          selections and our travel data and are suggestions, not instructions or guarantees. A plan may not fit every
          traveler’s needs, budget, mobility or schedule. You decide what to do, and you are responsible for your own
          travel decisions and for checking details such as opening hours, closures, booking requirements and transport
          before relying on a plan.
        </p>
      </LegalSection>

      <LegalSection title="6. Prices and payment">
        <p>
          Prices are shown on the website in New Israeli Shekels (ILS, ₪). The website can display approximate amounts in
          US dollars for convenience; these are estimates only and you are charged in ILS. The price that applies to your
          order is the price shown at checkout when you place it.
        </p>
        <p>
          Payments are processed by third-party payment providers such as Allpay, on the provider’s own secure payment
          page. Travel Smarter does not store your full card details. By paying you also agree to the payment provider’s
          terms. Your order is completed only after the payment provider confirms the payment to us.
        </p>
      </LegalSection>

      <LegalSection title="7. Order confirmation">
        <p>
          After your payment is confirmed, the website shows an order confirmation and the purchased product is activated
          on your account. Because the confirmation comes from the payment provider, activation can occasionally take a
          short while; the confirmation page updates automatically. The payment provider may also issue its own payment
          confirmation or receipt. If you have paid but cannot see your product, contact us with your order reference.
        </p>
      </LegalSection>

      <LegalSection title="8. Digital delivery">
        <p>
          All Travel Smarter products are digital and nothing is shipped. Access is provided online through your account
          once your payment is confirmed, usually within moments. You need an internet connection and a compatible device
          and browser. We do not provide physical copies.
        </p>
      </LegalSection>

      <LegalSection title="9. Cancellation and refunds">
        <p>
          Purchases are generally non-refundable once access to the digital product has been granted, except where
          required by applicable law or where a technical issue prevents access.
        </p>
        <LegalList>
          <li>
            Before payment is completed you can cancel at any time by leaving the payment page; you will not be charged.
          </li>
          <li>
            If you were charged but did not receive access, or a technical issue prevents you from using a purchased
            product, contact us using the details below with your order reference. We will first try to fix the problem
            and, if we cannot, we will refund the purchase.
          </li>
          <li>Refunds, where due, are made to the original payment method through the payment provider.</li>
          <li>Nothing in these Terms limits any rights you have under applicable consumer-protection law that cannot be waived.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="10. Accuracy of travel information">
        <p>
          We prepare our guides and plans with care, but travel information changes: opening hours, prices, transport
          times, availability, closures and booking requirements may differ from what we show. Distances and travel times
          are estimates. Please verify important details with the official source before you rely on them.
        </p>
      </LegalSection>

      <LegalSection title="11. Third-party services and links">
        <p>
          The website links to and relies on third-party services, such as maps, official attraction and booking websites,
          Google sign-in and payment providers. We do not control these services and are not responsible for their content,
          availability or practices. Your use of them is subject to their own terms and policies.
        </p>
      </LegalSection>

      <LegalSection title="12. Intellectual property">
        <p>
          The website, guides, itineraries, plans, text, design and compiled data are owned by Travel Smarter or its
          licensors and are protected by intellectual-property laws. Third-party names, trademarks and photographs belong
          to their respective owners; some images are used under open licenses and remain subject to those licenses. No
          rights are granted to you other than the personal-use right described above.
        </p>
      </LegalSection>

      <LegalSection title="13. Acceptable use">
        <p>
          You agree not to misuse the website, including by breaking the law, interfering with its operation or security,
          attempting unauthorized access, or abusing the checkout or account systems. We may suspend or close accounts that
          breach these Terms.
        </p>
      </LegalSection>

      <LegalSection title="14. Disclaimer and limitation of liability">
        <p>
          The website and products are provided “as is”. To the fullest extent permitted by law, Travel Smarter is not
          liable for indirect, incidental, consequential or special damages, or for losses arising from reliance on the
          content, including closed or unavailable attractions, changed prices or schedules, transport delays, cancelled
          bookings, travel disruptions, injury or additional costs. Our total liability for any claim relating to a
          product is limited to the amount you paid for that product. Nothing in these Terms excludes liability that cannot
          be excluded under applicable law.
        </p>
      </LegalSection>

      <LegalSection title="15. Changes">
        <p>
          We may update these Terms, our products and our prices from time to time. The “Last updated” date at the top
          shows the latest version of the Terms. Continued use of the website after an update means you accept the updated
          Terms. Changes do not affect orders already completed.
        </p>
      </LegalSection>

      <LegalSection title="16. Governing law and jurisdiction">
        <p>
          These Terms are governed by the laws of the State of Israel. Any dispute arising from these Terms or from the use
          of the website is subject to the jurisdiction of the competent courts in Israel. Nothing here removes mandatory
          rights you may have under applicable consumer law.
        </p>
      </LegalSection>

      <LegalSection title="17. Contact us">
        <p>Questions about these Terms, your order or access to your purchase:</p>
        <LegalContactBlock />
      </LegalSection>
    </LegalPageLayout>
  );
}
