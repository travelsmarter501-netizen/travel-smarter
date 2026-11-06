"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Container from "./Container";
import AccountNavLink from "./AccountNavLink";
import CurrencySwitcher from "./CurrencySwitcher";
import LanguageSwitcher from "./LanguageSwitcher";
import Logo from "./Logo";
import { IconClose, IconMenu } from "./icons";
import { MY_PLANS_HREF } from "./home/homeOffer";
import { useAuthStatus } from "../lib/useAuthStatus";
import { useLanguage } from "../lib/language";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const MENU_ITEM = `rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface pointer-coarse:py-3 ${FOCUS}`;

/**
 * Minimal header: the logo and one compact menu button, on every screen size. The menu holds the essential links (video, price, FAQ), "My plans"
 * for a signed-in customer, the account entry, and the language and currency switchers. There is no cart icon or cart drawer here any more:
 * the storefront is one product that is bought through the questionnaire. The cart itself, /checkout and every legacy product route are untouched
 * (a visitor who already holds items can still reach /checkout), and CartWidget.tsx is simply no longer mounted.
 *
 * The open menu has id="mobile-menu" (the floating purchase button hides while it is open) and closes with Escape, a tap outside, or a link.
 */
export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLanguage();
  const signedIn = useAuthStatus() === "signedIn";
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen]);

  const navLinks = [
    { label: t.nav.howItWorks, href: "/#video" },
    { label: t.nav.price, href: "/#price" },
    { label: t.nav.faq, href: "/#faq" },
  ];

  return (
    <header ref={headerRef} className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-3 md:h-20">
        <Link href="/#video" className={`flex shrink-0 items-center rounded ${FOCUS}`}>
          <Logo />
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? t.mobileMenu.close : t.mobileMenu.open}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink transition-colors hover:bg-surface ${FOCUS}`}
        >
          {menuOpen ? <IconClose className="h-6 w-6" /> : <IconMenu className="h-6 w-6" />}
        </button>
      </Container>

      {menuOpen && (
        <div id="mobile-menu" className="border-t border-line bg-white shadow-lg">
          <Container className="flex flex-col gap-1 py-3 sm:max-w-sm sm:ms-auto sm:me-0 sm:px-4">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className={MENU_ITEM}>
                {link.label}
              </a>
            ))}
            {signedIn && (
              <Link href={MY_PLANS_HREF} onClick={() => setMenuOpen(false)} className={MENU_ITEM}>
                {t.nav.myPlans}
              </Link>
            )}
            <div className="mt-1">
              <AccountNavLink variant="menu" onNavigate={() => setMenuOpen(false)} />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
              <LanguageSwitcher />
              <CurrencySwitcher />
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
