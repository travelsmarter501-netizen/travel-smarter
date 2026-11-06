import type { ReactNode } from "react";
import Link from "next/link";

/**
 * The homepage / header button in the confirmed palette: solid royal blue with white text, or a white button with a blue outline.
 * (The shared Button component keeps its own styling for every other page.) Hover and focus are visible: the hover blue is darker (white on
 * it is 8.3:1) and the focus ring is a 2px blue outline offset from the button.
 */
export default function HomeButton({
  href,
  children,
  variant = "primary",
  size = "md",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[color,background-color,transform] active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
  const variants = {
    primary: "bg-brand text-white shadow-sm hover:bg-brand-strong",
    secondary: "border border-brand bg-white text-brand hover:bg-brand-tint",
  };
  const sizes = {
    md: "min-h-11 px-5 py-2.5 text-sm pointer-coarse:py-3",
    lg: "px-7 py-3.5 text-base",
  };
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </Link>
  );
}
