import { cookies } from "next/headers";
import type { Locale } from "@/lib/i18n";

// Read the current locale from the cookie in a server component.
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const v = store.get("locale")?.value;
  return v === "fr" ? "fr" : "en";
}
