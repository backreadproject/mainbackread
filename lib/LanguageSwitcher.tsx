"use client";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";

// FR/EN toggle. Writes the locale cookie and refreshes so server components re-render.
export default function LanguageSwitcher({ current, dark = true, compact = false }: { current: Locale; dark?: boolean; compact?: boolean }) {
  const router = useRouter();
  const set = (loc: Locale) => {
    document.cookie = `locale=${loc}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.refresh();
  };
  if (compact) {
    const other: Locale = current === "en" ? "fr" : "en";
    return (
      <button
        onClick={() => set(other)}
        aria-label={other === "en" ? "Switch to English" : "Passer au fran\u00e7ais"}
        title={other === "en" ? "English" : "Fran\u00e7ais"}
        style={{
          width: 30, height: 30, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: "transparent", border: "1px solid var(--rp-side-border)", borderRadius: "var(--rp-r-btn, 6px)",
          color: "var(--rp-side-text)", fontSize: 11, fontWeight: 600, cursor: "pointer",
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
        }}
      >
        {other.toUpperCase()}
      </button>
    );
  }
  const base = { fontSize: 13, fontWeight: 600, padding: "4px 9px", borderRadius: 6, cursor: "pointer", border: "none", background: "transparent", fontFamily: "var(--font-dm-sans), system-ui, sans-serif" } as const;
  const activeColor = dark ? "#fff" : "#0F1729";
  const idleColor = dark ? "rgba(255,255,255,0.55)" : "#98A2B3";
  const activeBg = dark ? "rgba(255,255,255,0.14)" : "rgba(15,23,41,0.08)";
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 2, border: `1px solid ${dark ? "rgba(255,255,255,0.18)" : "#EAECEF"}`, borderRadius: 8, padding: 2 }}>
      {(["en", "fr"] as Locale[]).map((loc) => (
        <button key={loc} onClick={() => set(loc)} style={{ ...base, color: current === loc ? activeColor : idleColor, background: current === loc ? activeBg : "transparent" }} aria-label={loc === "en" ? "English" : "Fran\u00e7ais"}>
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
