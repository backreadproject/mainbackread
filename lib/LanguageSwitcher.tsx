"use client";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";

// FR/EN toggle. Writes the locale cookie and refreshes so server components re-render.
export default function LanguageSwitcher({ current, dark = true }: { current: Locale; dark?: boolean }) {
  const router = useRouter();
  const set = (loc: Locale) => {
    document.cookie = `locale=${loc}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.refresh();
  };
  const base = { fontSize: 13, fontWeight: 600, padding: "4px 9px", borderRadius: 6, cursor: "pointer", border: "none", background: "transparent", fontFamily: "var(--font-dm-sans), system-ui, sans-serif" } as const;
  const activeColor = dark ? "#fff" : "#0F1729";
  const idleColor = dark ? "rgba(255,255,255,0.55)" : "#98A2B3";
  const activeBg = dark ? "rgba(255,255,255,0.14)" : "rgba(15,23,41,0.08)";
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 2, border: `1px solid ${dark ? "rgba(255,255,255,0.18)" : "#EAECEF"}`, borderRadius: 8, padding: 2 }}>
      {(["en", "fr"] as Locale[]).map((loc) => (
        <button key={loc} onClick={() => set(loc)} style={{ ...base, color: current === loc ? activeColor : idleColor, background: current === loc ? activeBg : "transparent" }} aria-label={loc === "en" ? "English" : "Français"}>
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
