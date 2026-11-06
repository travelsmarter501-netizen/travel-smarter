"use client";

import Link from "next/link";
import Container from "./Container";
import { IconChevronDown } from "./icons";
import { BUSINESS_CONTACT } from "../lib/businessInfo";
import { useLanguage } from "../lib/language";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/**
 * The essential questions as native <details> elements, so every answer stays reachable without JavaScript (the first one starts open;
 * `name` makes the browser keep one open at a time). Under them: the support email and the existing refund terms.
 */
export default function FAQ() {
  const { t } = useLanguage();
  const support = t.home.support;

  return (
    <section id="faq" className="scroll-mt-20 pb-10 pt-8 sm:pb-14 sm:pt-11">
      <Container>
        <div className="mx-auto max-w-3xl">
          <div data-reveal>
            <h2 className="text-[2.05rem] font-bold leading-tight tracking-tight text-ink sm:text-[3.25rem]">{t.faq.title}</h2>
          </div>

          <div className="mt-6 divide-y divide-line border-y border-line">
            {t.faq.items.map((faq, index) => (
              <details key={faq.question} data-reveal name="home-faq" open={index === 0} className="group">
                <summary
                  className={`flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-lg px-1 py-4 text-start transition-colors hover:text-brand focus-visible:-outline-offset-2 sm:py-5 [&::-webkit-details-marker]:hidden ${FOCUS}`}
                >
                  <span dir="auto" className="text-base font-semibold text-ink sm:text-[1.05rem]">
                    {faq.question}
                  </span>
                  <IconChevronDown className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
                </summary>
                <div className="home-details-body px-1 pb-5">
                  <p dir="auto" className="text-sm leading-7 text-muted">
                    {faq.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>

          <p data-reveal className="mt-5 text-center text-sm leading-7 text-muted">
            {support.text}{" "}
            <a href={`mailto:${BUSINESS_CONTACT.email}`} className={`rounded font-semibold text-brand hover:text-brand-strong hover:underline ${FOCUS}`}>
              {BUSINESS_CONTACT.email}
            </a>
            <span aria-hidden="true"> · </span>
            <Link href="/terms-of-service" className={`rounded font-semibold text-brand hover:text-brand-strong hover:underline ${FOCUS}`}>
              {support.refund}
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
