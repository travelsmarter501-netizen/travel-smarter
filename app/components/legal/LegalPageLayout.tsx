import type { ReactNode } from "react";
import Container from "../Container";
import { BUSINESS_ADDRESS, BUSINESS_CONTACT } from "../../lib/businessInfo";

/**
 * Shared shell for the public legal pages (Privacy Policy, Terms of Service). The site is
 * Arabic/RTL by default, but these pages are English-only, so the wrapper sets its own
 * lang="en" dir="ltr" regardless of the visitor's selected site language.
 */
export default function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <main lang="en" dir="ltr" className="py-10 sm:py-14">
      <Container className="max-w-3xl">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: {lastUpdated}</p>
          <div className="mt-8 space-y-8 text-sm leading-7 text-slate-700">{children}</div>
        </article>
      </Container>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1.5 ps-5">{children}</ul>;
}

/** Full business details, including the physical address -- legal pages only. */
export function LegalContactBlock() {
  return (
    <address className="not-italic rounded-2xl bg-slate-50 p-4 leading-7 text-slate-700">
      <p className="font-semibold text-slate-900">{BUSINESS_CONTACT.name}</p>
      <p>
        Email:{" "}
        <a href={`mailto:${BUSINESS_CONTACT.email}`} className="font-semibold text-teal-700 hover:underline">
          {BUSINESS_CONTACT.email}
        </a>
      </p>
      <p>Phone / WhatsApp: {BUSINESS_CONTACT.phone}</p>
      <p>Business address: {BUSINESS_ADDRESS}</p>
    </address>
  );
}
