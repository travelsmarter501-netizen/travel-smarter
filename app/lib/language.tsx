"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { homepageTranslations, type HomepageCopy, type Language } from "./homepageTranslations";

const STORAGE_KEY = "travel-smarter-language";
const listeners = new Set<() => void>();

// When the browser refuses localStorage writes (see the same note in cart.tsx) the visitor's choice is kept here for the rest of the
// page session, so tapping EN / العربية still switches the site instead of silently doing nothing.
let memoryLanguage: Language | null = null;

function readStoredLanguage(): Language {
  if (memoryLanguage) return memoryLanguage;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "en" ? "en" : "ar";
  } catch {
    return "ar";
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

// Arabic is the SSR snapshot -- matches the root <html lang="ar" dir="rtl"> default, so the
// server-rendered HTML and the client's first hydration pass agree (no mismatch). The real
// persisted preference (if any) is only read via getSnapshot on the client, which
// useSyncExternalStore re-invokes right after hydration and on every notified change --
// this is the React-recommended way to read an external store (like localStorage) without
// the "setState synchronously in an effect" anti-pattern a plain useState+useEffect read
// would trigger.
function getServerSnapshot(): Language {
  return "ar";
}

function writeLanguage(next: Language) {
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
    memoryLanguage = null;
  } catch {
    // localStorage unavailable (private mode / blocked storage) -- the choice is kept in memory for this session
    memoryLanguage = next;
  }
  listeners.forEach((listener) => listener());
}

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: HomepageCopy;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(subscribe, readStoredLanguage, getServerSnapshot);

  // <html> itself is rendered by the server-only root layout, so this is the one place that
  // still needs an effect: syncing document.documentElement.lang/dir to match the client's
  // real language after it is known. This effect only ever WRITES to the DOM, never calls
  // setState, so it does not trigger the react-hooks/set-state-in-effect rule.
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = homepageTranslations[language].dir;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: writeLanguage, t: homepageTranslations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
