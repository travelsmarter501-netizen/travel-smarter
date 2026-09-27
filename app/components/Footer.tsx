"use client";

import Link from "next/link";
import Container from "./Container";
import CurrencySwitcher from "./CurrencySwitcher";
import Logo from "./Logo";
import { useLanguage } from "../lib/language";

export default function Footer() {
  const { t } = useLanguage();

  const columns = [
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
      links: [{ label: "travelsmarter501@gmail.com", href: "mailto:travelsmarter501@gmail.com" }],
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
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 text-sm">
          <p>{t.footer.rights}</p>
        </div>
      </Container>
    </footer>
  );
}
