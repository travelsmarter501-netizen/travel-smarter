"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Container from "./Container";
import { useLanguage } from "../lib/language";
import { BUSINESS_CONTACT } from "../lib/businessInfo";

const LINK = "rounded text-sm text-muted transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/**
 * Minimal footer: contact email, account access, legal links, copyright. (`id="contact"` is kept for older links.) On the homepage the email and the
 * account link are left out: the FAQ already gives the support email, and the header menu already has the account, so they are not repeated.
 */
export default function Footer() {
  const { t } = useLanguage();
  const home = usePathname() === "/";

  return (
    <footer id="contact" className="scroll-mt-20 border-t border-line bg-white">
      <Container className="flex flex-col items-center gap-3 py-8 text-center">
        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {!home && (
            <>
              <a href={`mailto:${BUSINESS_CONTACT.email}`} className={LINK}>
                {BUSINESS_CONTACT.email}
              </a>
              <Link href="/account" className={LINK}>
                {t.footer.linkAccount}
              </Link>
            </>
          )}
          <Link href="/privacy-policy" className={LINK}>
            {t.footer.privacyLabel}
          </Link>
          <Link href="/terms-of-service" className={LINK}>
            {t.footer.termsLabel}
          </Link>
        </nav>
        <p className="text-xs text-muted">{t.footer.rights}</p>
      </Container>
    </footer>
  );
}
