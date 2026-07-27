import { T } from "@/lib/theme";
// What would have been here, and what produces it.
//
// A panel that renders nothing when empty leaves the user deciding between two
// explanations: there is no data, or the feature is broken. They cannot tell
// which, and the second is the one they assume when they have just paid for it.
//
// Deliberately not a tooltip. Anything worth writing down is worth showing
// without being hunted for, and a hover does not exist on a phone.
export default function Blank({ title, hint, inset = true }: {
  title: string;
  /** What produces the thing. Skip only when it is genuinely self-evident. */
  hint?: string;
  inset?: boolean;
}) {
  return (
    <div style={{ padding: inset ? "18px 0" : 0 }}>
      <div style={{ fontSize: 13, color: T.body, marginBottom: hint ? 4 : 0 }}>{title}</div>
      {hint && <div style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.55, maxWidth: 460 }}>{hint}</div>}
    </div>
  );
}