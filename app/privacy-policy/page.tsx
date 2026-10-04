import type { Metadata } from "next";
import Link from "next/link";
import LegalPageLayout, { LegalContactBlock, LegalList, LegalSection } from "../components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Privacy Policy | Travel Smarter",
  description:
    "How Travel Smarter collects, uses and protects personal data when you use our digital travel guides, ready-made itineraries and personalized trip planning.",
};

const linkClass = "font-semibold text-teal-700 hover:underline";

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="October 4, 2026">
      <p>
        This Privacy Policy explains how Travel Smarter (“Travel Smarter”, “we”, “us”) collects, uses and protects personal
        data when you visit our website, create an account, buy our products or contact us. By using the website you
        acknowledge this policy. Our{" "}
        <Link href="/terms-of-service" className={linkClass}>
          Terms of Service
        </Link>{" "}
        also apply.
      </p>

      <LegalSection title="1. Who we are">
        <p>
          Travel Smarter sells digital travel guides, ready-made itineraries and personalized trip planning services through
          this website. We are not a travel agency and we do not sell or book flights, hotels or travel packages.
        </p>
        <LegalContactBlock />
      </LegalSection>

      <LegalSection title="2. Information we collect">
        <p>Depending on how you use the website, we may collect the following:</p>
        <LegalList>
          <li>
            <strong>Account information:</strong> your name (if provided), your email address and your sign-in details. If
            you choose to sign in with Google, we receive the basic profile information Google shares with us, such as your
            name and email address. We never receive your Google password. Passwords for accounts created with email are
            stored in hashed form by our authentication provider.
          </li>
          <li>
            <strong>Order information:</strong> the products you buy, the price and currency, the order status and date, the
            payment reference supplied by the payment provider, and the access granted to your account.
          </li>
          <li>
            <strong>Trip planning information:</strong> the destination, trip length or travel dates, interests, and the
            accommodation name or address you enter into the planner, together with the
            plans you choose to save.
          </li>
          <li>
            <strong>Contact details:</strong> any information you send us when you contact us by email or WhatsApp, such
            as your name, email address or phone number.
          </li>
          <li>
            <strong>Technical information:</strong> standard server and hosting logs (such as IP address, browser type, pages
            requested and time of access), and small pieces of data stored in your browser as described in the Cookies and
            local storage section below.
          </li>
        </LegalList>
        <p>We do not collect or store full payment card numbers (see “Payments” below).</p>
      </LegalSection>

      <LegalSection title="3. How we use your information">
        <LegalList>
          <li>To create and manage your account.</li>
          <li>To process orders, confirm payments and grant access to the digital products you buy.</li>
          <li>To generate, display and save personalized trip plans.</li>
          <li>To respond to inquiries, support requests and access or refund issues.</li>
          <li>To protect the website and prevent fraud, abuse and unauthorized access.</li>
          <li>To comply with legal, tax and accounting obligations.</li>
          <li>To maintain and improve the website and our products.</li>
        </LegalList>
        <p>We do not sell your personal data.</p>
      </LegalSection>

      <LegalSection title="4. Payments">
        <p>
          Payments are processed by third-party payment providers such as Allpay. When you check out, you are redirected to
          the payment provider’s secure payment page, where you enter your payment details directly with the provider.
          Travel Smarter does not collect or store your full credit card number or security code.
        </p>
        <p>
          After a payment attempt, the payment provider sends us confirmation data such as the order reference, payment
          status, amount and currency, so that we can activate your purchase. The payment provider handles your payment
          data under its own terms and privacy policy, which we encourage you to read.
        </p>
      </LegalSection>

      <LegalSection title="5. Service providers and third parties">
        <p>We share personal data only as needed to operate the website, with providers that help us deliver it:</p>
        <LegalList>
          <li>
            <strong>Supabase:</strong> database, authentication and storage of account, order and saved-plan data.
          </li>
          <li>
            <strong>Allpay (and similar payment providers):</strong> payment processing.
          </li>
          <li>
            <strong>Google:</strong> if you choose to sign in with Google, Google authenticates you under its own privacy
            policy.
          </li>
          <li>
            <strong>Geoapify:</strong> a geocoding service. If you enter an accommodation name or address in the planner,
            that text may be sent to Geoapify to find its location on the map.
          </li>
          <li>
            <strong>Website hosting and infrastructure providers (currently Vercel):</strong> to serve the website.
          </li>
        </LegalList>
        <p>
          We may also disclose information where required by law or court order, or to protect our rights, our users or the
          public. The website links to third-party sites (for example maps or official attraction websites). Those services
          are outside our control and their own privacy policies apply.
        </p>
      </LegalSection>

      <LegalSection title="6. Cookies and local storage">
        <p>
          We use only what is necessary for the website to work: authentication session cookies that keep you signed in,
          and browser local storage that remembers your language choice, the items in your cart, your saved favorites and
          checklist (tick) states in the guide, and a temporary draft of a plan while you sign in. We do not currently use advertising cookies or
          third-party analytics trackers. You can clear cookies and local storage in your browser settings; doing so may
          sign you out and empty your cart.
        </p>
      </LegalSection>

      <LegalSection title="7. Data security">
        <p>
          We use reasonable technical and organizational measures to protect personal data, including encrypted (HTTPS)
          connections, access controls on our database, and keeping payment card entry on the payment provider’s own page
          rather than on our servers. No method of transmission or storage is completely secure, so we cannot guarantee
          absolute security.
        </p>
      </LegalSection>

      <LegalSection title="8. Data retention">
        <p>
          We keep personal data only for as long as needed to provide the website and your purchased products, maintain
          your account, resolve disputes and enforce our terms, and meet legal, tax and accounting obligations. When data is
          no longer needed, we delete or anonymize it. You can ask us to delete your account and data at any time (see
          “Your rights”); we may keep information that we are legally required to retain, such as records of transactions.
        </p>
      </LegalSection>

      <LegalSection title="9. Your rights">
        <p>Subject to applicable law, you may ask us to:</p>
        <LegalList>
          <li>give you access to the personal data we hold about you;</li>
          <li>correct inaccurate or incomplete data;</li>
          <li>delete your data;</li>
          <li>restrict or object to certain uses of your data; and</li>
          <li>withdraw your consent where we rely on it.</li>
        </LegalList>
        <p>
          Under the Israeli Protection of Privacy Law, 1981, you may review personal information held about you in a
          database and request its correction or deletion where it is inaccurate. Depending on where you live, additional
          rights may apply under local data-protection law (for example the EU/UK GDPR). To exercise your rights, contact
          us using the details below. We may need to verify your identity first.
        </p>
      </LegalSection>

      <LegalSection title="10. International data transfers">
        <p>
          Our service providers may process data on servers located outside Israel. We choose providers that publish
          security and data-protection commitments.
        </p>
      </LegalSection>

      <LegalSection title="11. Children">
        <p>
          We do not knowingly collect personal data in violation of applicable law. If you believe personal data has been
          provided to us in a way that requires parental or guardian consent under applicable law, please contact us.
        </p>
      </LegalSection>

      <LegalSection title="12. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. The updated version will be posted on this page with a
          revised “Last updated” date.
        </p>
      </LegalSection>

      <LegalSection title="13. Contact us">
        <p>For questions or requests about this policy or your personal data, contact us:</p>
        <LegalContactBlock />
      </LegalSection>
    </LegalPageLayout>
  );
}
