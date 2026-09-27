import type { AnchorHTMLAttributes, ReactNode } from "react";

/**
 * Single source of truth for every outbound link in a guide (official sites, tickets,
 * booking, Google/Apple Maps, rating links). Always opens in a new tab so Travel Smarter
 * never loses the visitor's scroll position or selected category — closing the new tab
 * always returns to exactly where they were. Never use a plain <a> for an external URL;
 * use this instead so target/rel can't be forgotten or gotten wrong on a new card.
 */
export default function ExternalLink({
  href,
  children,
  ...rest
}: { href: string; children: ReactNode } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "target" | "rel">) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
    </a>
  );
}
