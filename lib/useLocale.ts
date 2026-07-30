"use client";
// The locale now comes from context, resolved on the server in app/layout.tsx.
// This file stays as a re-export so the twenty-two components that import from
// here keep working; the cookie-reading effect that caused the English flash on
// every client render is gone.
export { useLocale } from "@/lib/LocaleProvider";
