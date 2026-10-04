"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Container from "./Container";
import CurrencySwitcher from "./CurrencySwitcher";
import Logo from "./Logo";
import { useLanguage } from "../lib/language";
import { BUSINESS_CONTACT } from "../lib/businessInfo";

export default function Footer() {
  const { t } = useLanguage();

  const columns: { title: string; links: { label: string; href: string }[]; extra?: ReactNode[] }[] = [
    {
      title: t.footer.productsHeading,
      links: [
        { label: t.products.items[0].title, href: t.products.items[0].route },
        { label: t.products.items[1].title, href: t.products.items[1].route },
        { label: t.products.items[2].title, href: t.products.items[2].route },
        { label: t.products.items[3].title, href: t.products.items[3].route },
      ],
    },
    {
      title: t.footer.destinationsHeading,
      links: [
        { label: t.destinations.barcelona.cta, href: "/#destinations" },
        { label: t.footer.faqLabel, href: "/#faq" },
      ],
    },
    {
      title: t.footer.contactHeading,
      links: [{ label: BUSINESS_CONTACT.email, href: `mailto:${BUSINESS_CONTACT.email}` }],
      extra: [
        <span key="phone">
          {t.footer.phoneLabel}: <span dir="ltr">{BUSINESS_CONTACT.phone}</span>
        </span>,
      ],
    },
  ];

  return (
    <footer id="contact" className="scroll-mt-20 border-t border-slate-800 bg-slate-950 text-slate-400">
      <Container className="py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Link href="/#hero" className="inline-flex items-center">
              <Logo light />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6">{t.footer.brandLine}</p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">{t.footer.descriptor}</p>
            {t.footer.descriptorSecondary && (
              <p dir="ltr" className="mt-1 max-w-xs text-sm leading-6 text-slate-500 rtl:text-right">
                {t.footer.descriptorSecondary}
              </p>
            )}
            <div className="mt-4">
              <CurrencySwitcher />
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-white">{column.title}</h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm transition-colors hover:text-white">
                      {link.label}
                    </a>
                  </li>
                ))}
                {column.extra?.map((line, index) => (
                  <li key={`extra-${index}`} className="text-sm">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-800 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>{t.footer.rights}</p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/privacy-policy" className="transition-colors hover:text-white">
              {t.footer.privacyLabel}
            </Link>
            <Link href="/terms-of-service" className="transition-colors hover:text-white">
              {t.footer.termsLabel}
            </Link>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
