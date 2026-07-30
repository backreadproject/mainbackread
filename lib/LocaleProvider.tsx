"use client";
import { createContext, useContext } from "react";
import type { Locale } from "@/lib/i18n";

/**
 * The locale, resolved once on the server and passed down.
 *
 * useLocale used to read document.cookie in a mount effect, which meant every
 * client component rendered English first and corrected after hydration. A French
 * user saw an English flash on every page, and router.refresh() could not fix it
 * because only server components re-render -- which is why the language switcher
 * had to do a full page reload.
 *
 * There is deliberately NO default. A component rendered outside the provider
 * throws rather than silently returning "en", because a silent fallback is how
 * this class of bug survives a refactor.
 */
const LocaleContext = createContext<Locale | null>(null);

export function LocaleProvider({ value, children }: { value: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  const v = useContext(LocaleContext);
  if (v === null) {
    throw new Error(
      "useLocale() was called outside LocaleProvider. The provider lives in app/layout.tsx, " +
      "seeded from getLocale(). If you are adding a new root layout, seed it there too."
    );
  }
  return v;
}