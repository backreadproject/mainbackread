"use client";
import { useState } from "react";
import { PanelLeft, Square } from "lucide-react";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";

/**
 * Switching workspace from the sidebar.
 *
 * Sits beside the theme and language switches because it is the same kind of
 * thing: a preference about how the app looks, not a setting about how it
 * behaves. Reloads rather than re-rendering, because the shell class is decided
 * on the server and a client swap would leave the two disagreeing.
 *
 * If this button is ever unreachable, /api/workspace?ws=classic does the same
 * thing without loading the app at all.
 */

export default function WorkspaceToggle({
  current,
  compact = false,
}: {
  current: "classic" | "elegant";
  compact?: boolean;
}) {
  const fr = useLocale() === "fr";
  const [busy, setBusy] = useState(false);
  const next = current === "elegant" ? "classic" : "elegant";

  const title = fr
    ? (next === "elegant" ? "Passer \u00e0 l\u2019espace \u00c9l\u00e9gant" : "Revenir \u00e0 l\u2019espace Classique")
    : (next === "elegant" ? "Switch to the Elegant workspace" : "Back to the Classic workspace");

  async function flip() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/workspace", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workspace: next }),
      });
    } catch {
      // The cookie may not have been set. Reloading shows which, rather than
      // leaving a button that looks like it did nothing.
    }
    window.location.reload();
  }

  const Icon = current === "elegant" ? PanelLeft : Square;

  return (
    <button
      onClick={() => void flip()}
      title={title}
      aria-label={title}
      disabled={busy}
      style={{
        width: compact ? 26 : 30,
        height: compact ? 26 : 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        border: "1px solid " + T.sidebarBorder,
        borderRadius: T.rBtn,
        color: T.sidebarText,
        cursor: busy ? "default" : "pointer",
        opacity: busy ? 0.55 : 1,
        flexShrink: 0,
      }}
    >
      <Icon size={compact ? 13 : 15} strokeWidth={1.8} />
    </button>
  );
}
