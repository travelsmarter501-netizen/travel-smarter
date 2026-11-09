import type { Metadata } from "next";
import { Cairo, Noto_Kufi_Arabic, Rubik } from "next/font/google";
import { CurrencyProvider } from "./lib/currency";
import { LanguageProvider } from "./lib/language";
import DocumentLanguageMeta from "./components/DocumentLanguageMeta";
import { CartProvider } from "./lib/cart";
import Header from "./components/Header";
import Footer from "./components/Footer";
import NavigationIntentTracker from "./components/NavigationIntentTracker";
import WebAnalytics from "./components/WebAnalytics";
import AttributionCapture from "./components/AttributionCapture";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

// Arabic headlines of the customer journey (h1 / h2 inside .theme-brand, see globals.css): a readable geometric Kufi with real weight, clearly different
// from Cairo body text. It has no Latin glyphs, so English headlines fall back to Cairo.
// Hebrew: neither Cairo nor Noto Kufi has Hebrew letters. Rubik (Hebrew + Latin) takes over body text and headlines only while the page is
// in Hebrew (html[lang="he"] in globals.css), so Arabic and English pages render exactly as before.
// Not preloaded: Arabic and English pages never use it (measured 2026-11-09), so its files load only on a Hebrew page.
const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
  preload: false,
});

// Headlines are bold (700) everywhere, so only that weight is loaded: one 43 KB static file instead of the 121 KB variable font
// (all weights 100-900). A headline set to another weight would render at 700.
const notoKufi = Noto_Kufi_Arabic({
  variable: "--font-noto-kufi",
  subsets: ["arabic"],
  weight: "700",
});

// The one semibold headline (the homepage video title, Hero.tsx) keeps its own 600 face: a separate static file, not preloaded, so it
// is downloaded only on a page that shows that title.
const notoKufiSemibold = Noto_Kufi_Arabic({
  variable: "--font-noto-kufi-600",
  subsets: ["arabic"],
  weight: "600",
  preload: false,
});

export const metadata: Metadata = {
  // The custom domain is the one public origin. "./" resolves against each route's own pathname, so every
  // page gets <link rel="canonical" href="https://travelsmarters.com/<its path>"> (no query string, so a
  // claim token in a URL never appears in a canonical). The same page served from another host (the
  // *.vercel.app domain) therefore points search engines back to the custom domain.
  metadataBase: new URL("https://travelsmarters.com"),
  alternates: { canonical: "./" },
  title: "Travel Smarter | خطة رحلة مخصصة، يوم بيوم",
  description: "جاوب على أسئلة قصيرة واحصل على خطة رحلة مخصصة حسب أيامك واهتماماتك ومكان سكنك، مع الأماكن والمطاعم وأوقات التنقل. متاح لبرشلونة وبراغ.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      dir="rtl"
      data-scroll-behavior="smooth"
      className={`${cairo.variable} ${notoKufi.variable} ${notoKufiSemibold.variable} ${rubik.variable} h-full scroll-smooth antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans">
        <LanguageProvider>
          <CurrencyProvider>
            <CartProvider>
              <DocumentLanguageMeta />
              <NavigationIntentTracker />
              <Header />
              {children}
              <Footer />
            </CartProvider>
          </CurrencyProvider>
        </LanguageProvider>
        <WebAnalytics />
        <AttributionCapture />
      </body>
    </html>
  );
}
