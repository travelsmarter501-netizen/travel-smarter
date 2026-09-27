import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { CurrencyProvider } from "./lib/currency";
import { LanguageProvider } from "./lib/language";
import { CartProvider } from "./lib/cart";
import Header from "./components/Header";
import Footer from "./components/Footer";
import LoadingSplash from "./components/LoadingSplash";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "Travel Smarter | تخطيط سفر ذكي — خطط برشلونة ودليل برشلونة",
  description: "خطط سفر جاهزة ومخصصة لبرشلونة: دليل سياحي، رزمة يوم واحد، رزمة 5 أيام، وخطة مخصصة بالذكاء. سافر أكثر، خطّط أقل.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      dir="rtl"
      data-scroll-behavior="smooth"
      className={`${cairo.variable} h-full scroll-smooth antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans">
        <LanguageProvider>
          <CurrencyProvider>
            <CartProvider>
              <LoadingSplash />
              <Header />
              {children}
              <Footer />
            </CartProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
