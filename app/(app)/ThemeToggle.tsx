"use client";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { T } from "@/lib/theme";

// The class on <html> is set before paint by app/ThemeScript.tsx. This only
// reads it back and flips it, so the two never disagree and there is no flash.
export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setReady(true);
  }, []);

  function flip() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("rp-theme", next ? "dark" : "light");
    } catch {
      // Private mode or storage disabled. Still works for this session.
    }
  }

  const label = dark ? "Switch to light" : "Switch to dark";

  if (compact) {
    return (
      <button onClick={flip} aria-label={label} title={label} className="t-out"
        style={{ width: 34, height: 34, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid " + T.sidebarBorder, borderRadius: T.rBtn, color: T.sidebarText, cursor: "pointer" }}>
        {ready && dark ? <Sun size={16} strokeWidth={1.75} /> : <Moon size={16} strokeWidth={1.75} />}
      </button>
    );
  }

  return (
    <button onClick={flip} aria-label={label} className="t-out"
      style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", border: "1px solid " + T.border, borderRadius: T.rBtn, padding: "8px 12px", fontSize: 13, fontFamily: T.font, color: T.body, cursor: "pointer" }}>
      {ready && dark ? <Sun size={16} strokeWidth={1.75} /> : <Moon size={16} strokeWidth={1.75} />}
      {ready && dark ? "Light" : "Dark"}
    </button>
  );
}