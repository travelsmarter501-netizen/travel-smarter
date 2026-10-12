"use client";

import Link from "next/link";
import { useLanguage } from "../lib/language";
import { useAuthStatus, type AuthStatus } from "../lib/useAuthStatus";

/**
 * Header entry for the visitor's account: "Sign in" (-> /login) when signed out, "My Account"
 * (-> /account) when signed in. Purely navigational -- nothing is required before buying.
 *
 * `variant="bar"` is the compact desktop header link; `variant="menu"` is the full-width row used in the
 * mobile menu. While the session is still being read it renders an invisible placeholder of the same
 * size, so signed-in visitors never see a flash of "Sign in".
 */
export default function AccountNavLink({ variant = "bar", onNavigate }: { variant?: "bar" | "menu"; onNavigate?: () => void }) {
  return <AccountNavLinkView status={useAuthStatus()} variant={variant} onNavigate={onNavigate} />;
}

/** The presentational half: label + target for a given auth status (kept separate so each state is testable). */
export function AccountNavLinkView({ status, variant = "bar", onNavigate }: { status: AuthStatus; variant?: "bar" | "menu"; onNavigate?: () => void }) {
  const { t } = useLanguage();

  const signedIn = status === "signedIn";
  const href = signedIn ? "/account" : "/login";
  const label = signedIn ? t.nav.account : t.nav.signIn;

  const className =
    variant === "bar"
      ? "inline-flex h-10 items-center rounded-full px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
      : "flex w-full items-center justify-center rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50";

  if (status === "loading") {
    return (
      <span aria-hidden="true" className={`${className} invisible`}>
        {t.nav.signIn}
      </span>
    );
  }

  return (
    <Link href={href} onClick={onNavigate} className={className} data-auth-state={status}>
      {label}
    </Link>
  );
}
