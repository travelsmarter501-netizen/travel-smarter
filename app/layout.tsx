import type { Metadata } from "next";
import { Cairo, Noto_Kufi_Arabic } from "next/font/google";
import { CurrencyProvider } from "./lib/currency";
import { LanguageProvider } from "./lib/language";
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
const notoKufi = Noto_Kufi_Arabic({
  variable: "--font-noto-kufi",
  subsets: ["arabic"],
});

export const metadata: Metadata = {
  // The custom domain is the one public origin. "./" resolves against each route's own pathname, so every
  // page gets <link rel="canonical" href="https://travelsmarters.com/<its path>"> (no query string, so a
  // claim token in a URL never appears in a canonical). The same page served from another host (the
  // *.vercel.app domain) therefore points search engines back to the custom domain.
  metadataBase: new URL("https://travelsmarters.com"),
  alternates: { canonical: "./" },
  title: "Travel Smarter | خطة رحلة مخصصة، يوم بيوم",
  description: "جاوب على أسئلة قصيرة واحصل على خطة رحلة مخصصة حسب أيامك واهتماماتك ومكان سكنك، مع الأماكن والمطاعم وأوقات التنقل. متاح حاليًا لبرشلونة.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      dir="rtl"
      data-scroll-behavior="smooth"
      className={`${cairo.variable} ${notoKufi.variable} h-full scroll-smooth antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans">
        <LanguageProvider>
          <CurrencyProvider>
            <CartProvider>
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
