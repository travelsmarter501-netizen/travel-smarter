"use client";

import { useState } from "react";
import Link from "next/link";
import Container from "./Container";
import Button from "./Button";
import CartWidget from "./CartWidget";
import LanguageSwitcher from "./LanguageSwitcher";
import Logo from "./Logo";
import { IconClose, IconMenu } from "./icons";
import { useLanguage } from "../lib/language";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLanguage();

  const navLinks = [
    { label: t.nav.products, href: "/#products" },
    { label: t.nav.destinations, href: "/#destinations" },
    { label: t.nav.about, href: "/#about" },
    { label: t.nav.faq, href: "/#faq" },
    { label: t.nav.contact, href: "/#contact" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between md:h-20">
        <Link href="/#hero" className="flex items-center">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-5 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher />
          <CartWidget />
          <Button href="/#products">{t.nav.ctaPlanTrip}</Button>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <CartWidget />
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? t.mobileMenu.close : t.mobileMenu.open}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"
          >
            {menuOpen ? <IconClose className="h-6 w-6" /> : <IconMenu className="h-6 w-6" />}
          </button>
        </div>
      </Container>

      {menuOpen && (
        <div id="mobile-menu" className="border-t border-slate-200 bg-white lg:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 flex items-center justify-between gap-3">
              <LanguageSwitcher />
            </div>
            <Button href="/#products" className="mt-2 w-full">
              {t.nav.ctaPlanTrip}
            </Button>
          </Container>
        </div>
      )}
    </header>
  );
}
