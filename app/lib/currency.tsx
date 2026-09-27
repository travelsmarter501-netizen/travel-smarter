"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type Currency = "ILS" | "USD";

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  ILS: "₪",
  USD: "$",
};

// Temporary fixed conversion rate (frontend-only, no live exchange rate API).
// To update the rate, change this single number.
const ILS_PER_USD = 3.7;

export function convertFromILS(priceInILS: number, currency: Currency): number {
  if (currency === "ILS") return priceInILS;
  return priceInILS / ILS_PER_USD;
}

export function formatPrice(priceInILS: number, currency: Currency): string {
  const value = Math.round(convertFromILS(priceInILS, currency));
  const symbol = CURRENCY_SYMBOLS[currency];
  return currency === "ILS" ? `${value} ${symbol}` : `${symbol}${value}`;
}

type CurrencyContextValue = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("ILS");
  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
