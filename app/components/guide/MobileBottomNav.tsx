"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const items = [
  { id: "home", icon: "🏠", label: "الدليل", href: "" },
  { id: "attractions", icon: "🔍", label: "بحث", href: "?s=attractions" },
  { id: "areas", icon: "📍", label: "استكشف", href: "?s=areas" },
  { id: "favorites", icon: "❤️", label: "محفوظاتي", href: "?s=favorites" },
];

export default function MobileBottomNav({ basePath }: { basePath: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSection = searchParams.get("s");

  return (
    <nav className="sticky bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map((item) => {
          const isActive = item.id === "home" ? pathname === basePath && !currentSection : currentSection === item.id;
          return (
            <Link
              key={item.id}
              href={`${basePath}${item.href}`}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                isActive ? "text-teal-700" : "text-slate-500"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
