"use client";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";

// Read the locale cookie in a client component. Defaults to "en" until mounted.
export function useLocale(): Locale {
  const [locale, setLocale] = useState<Locale>("en");
  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)locale=(en|fr)/);
    if (m) setLocale(m[1] as Locale);
  }, []);
  return locale;
}
