import React from "react";
import { Document, Page, Text, View, StyleSheet, Svg, Path, Circle } from "@react-pdf/renderer";

export type CertSigner = {
  name: string;
  email: string | null;
  method: string | null;
  signedAt: string | null;
  ip: string | null;
};

export type CertProps = {
  reference: string;
  title: string;
  completedAt: string;
  signers: CertSigner[];
};

// Security-print line work, generated rather than drawn.
//
// A holographic effect cannot exist in a PDF -- it is a physical property of
// foil, shifting with viewing angle. What reproduces is the genuine visual
// language of a printed instrument: guilloche waves, a rosette seal, microprint.
// Flat, printable, and it survives a photocopy badly on purpose.
//
// The seal's ellipses are emitted as explicit path data rather than relying on
// an SVG transform attribute, because a transform that silently no-ops would
// leave a seal of four bare circles and nothing would report an error.
function rotatedEllipse(cx: number, cy: number, rx: number, ry: number, deg: number): string {
  const t = (deg * Math.PI) / 180;
  const c = Math.cos(t), s = Math.sin(t);
  const N = 96;
  let d = "";
  for (let i = 0; i <= N; i++) {
    const a = (2 * Math.PI * i) / N;
    const x = rx * Math.cos(a), y = ry * Math.sin(a);
    d += (i ? "L" : "M") + (cx + x * c - y * s).toFixed(2) + " " + (cy + x * s + y * c).toFixed(2) + " ";
  }
  return d.trim();
}

const WAVES = [
  "M0 60 Q 50 20, 100 60 T 200 60 T 300 60 T 400 60 T 500 60 T 600 60",
  "M0 60 Q 50 100, 100 60 T 200 60 T 300 60 T 400 60 T 500 60 T 600 60",
  "M0 45 Q 50 5, 100 45 T 200 45 T 300 45 T 400 45 T 500 45 T 600 45",
  "M0 75 Q 50 115, 100 75 T 200 75 T 300 75 T 400 75 T 500 75 T 600 75",
  "M0 30 Q 60 70, 120 30 T 240 30 T 360 30 T 480 30 T 600 30",
  "M0 90 Q 60 50, 120 90 T 240 90 T 360 90 T 480 90 T 600 90",
];

const G = "#1F6F4A";

const S = StyleSheet.create({
  page: { padding: 36, fontFamily: "Helvetica", fontSize: 11 },
  card: { borderWidth: 1, borderColor: "#C8CFD8", borderRadius: 6 },

  head: { position: "relative", paddingTop: 26, paddingBottom: 20, paddingHorizontal: 28,
          borderBottomWidth: 1, borderBottomColor: "#E4E7EC" },
  waves: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  eyebrow: { fontSize: 9, letterSpacing: 0.85, color: "#667085", marginBottom: 5 },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#101828", marginBottom: 4 },
  ref: { fontSize: 11, color: "#667085", fontFamily: "Courier" },

  body: { flexDirection: "row", paddingVertical: 22, paddingHorizontal: 28, alignItems: "flex-start" },
  left: { flex: 1 },
  block: { marginBottom: 14 },
  blockRule: { borderTopWidth: 1, borderTopColor: "#EFF1F4", paddingTop: 14 },
  row: { flexDirection: "row", marginBottom: 6 },
  label: { width: 108, color: "#667085", fontSize: 11 },
  value: { flex: 1, color: "#101828", fontSize: 11 },
  mono: { flex: 1, color: "#101828", fontSize: 10, fontFamily: "Courier" },

  foot: { paddingHorizontal: 28, paddingBottom: 22 },
  micro: { fontSize: 5.6, color: "#C8CFD8", fontFamily: "Courier", letterSpacing: 0.4,
           lineHeight: 1.4, marginBottom: 12 },
  note: { fontSize: 10, color: "#98A2B3", lineHeight: 1.6,
          borderTopWidth: 1, borderTopColor: "#E4E7EC", paddingTop: 13 },
});

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

// Pinned, never locale-formatted. A server locale deciding whether a contract
// reads 08/02 or 02/08 is not a risk worth carrying on this document.
function when(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.getUTCDate() + " " + MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear() + ", "
    + String(d.getUTCHours()).padStart(2, "0") + ":" + String(d.getUTCMinutes()).padStart(2, "0") + " UTC";
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  return (d.getUTCDate() + " " + MONTHS[d.getUTCMonth()].slice(0, 3) + " " + d.getUTCFullYear()).toUpperCase();
}

function Seal({ date }: { date: string }) {
  return (
    <Svg viewBox="0 0 160 160" style={{ width: 132, height: 132 }}>
      <Circle cx="80" cy="80" r="76" fill="none" stroke={G} strokeWidth={0.5} strokeOpacity={0.5} />
      <Circle cx="80" cy="80" r="72" fill="none" stroke={G} strokeWidth={0.5} strokeOpacity={0.35} />
      <Circle cx="80" cy="80" r="52" fill="none" stroke={G} strokeWidth={0.5} strokeOpacity={0.5} />
      <Circle cx="80" cy="80" r="49" fill="none" stroke={G} strokeWidth={0.5} strokeOpacity={0.3} />
      {[0, 30, 60, 90, 120, 150].map((a) => (
        <Path key={"o" + a} d={rotatedEllipse(80, 80, 62, 24, a)} fill="none"
              stroke={G} strokeWidth={0.4} strokeOpacity={0.45} />
      ))}
      {[15, 75, 135].map((a) => (
        <Path key={"i" + a} d={rotatedEllipse(80, 80, 44, 16, a)} fill="none"
              stroke={G} strokeWidth={0.35} strokeOpacity={0.3} />
      ))}
      <Circle cx="80" cy="80" r="26" fill="#FFFFFF" fillOpacity={0.92} />
      <Circle cx="80" cy="80" r="9" fill="none" stroke={G} strokeWidth={1.6} />
      <Circle cx="80" cy="80" r="3.4" fill={G} />
      <Text x="80" y="62" textAnchor="middle" style={{ fontSize: 6.5, color: "#667085" }}>{date}</Text>
      <Text x="80" y="104" textAnchor="middle" style={{ fontSize: 6.5, color: "#667085" }}>COMPLETE</Text>
    </Svg>
  );
}

// What is deliberately NOT here: the signature images, and any reading evidence.
// The certificate records what each party asserted and when. Reproducing the
// mark invites it to be treated as verification, and reading evidence is the
// sender's own intelligence rather than something to hand a counterparty.
export function SignatureCertificate(p: CertProps) {
  const micro = Array(12).fill(p.reference).join("\u00B7");
  return (
    <Document>
      <Page size="A4" style={S.page}>
        <View style={S.card}>
          <View style={S.head}>
            <View style={S.waves}>
              <Svg viewBox="0 0 600 120" style={{ width: "100%", height: "100%" }}>
                {WAVES.map((d, i) => (
                  <Path key={i} d={d} fill="none" stroke={G} strokeWidth={0.4} strokeOpacity={0.175} />
                ))}
              </Svg>
            </View>
            <Text style={S.eyebrow}>CERTIFICATE OF ACCEPTANCE</Text>
            <Text style={S.title}>{p.title}</Text>
            <Text style={S.ref}>{p.reference}</Text>
          </View>

          <View style={S.body}>
            <View style={S.left}>
              {p.signers.map((s, i) => (
                <View key={i} style={i === 0 ? S.block : [S.block, S.blockRule]}>
                  <View style={S.row}><Text style={S.label}>Name</Text><Text style={S.value}>{s.name}</Text></View>
                  <View style={S.row}><Text style={S.label}>Email</Text><Text style={S.mono}>{s.email || ""}</Text></View>
                  <View style={S.row}><Text style={S.label}>Signed</Text><Text style={S.value}>{when(s.signedAt)}</Text></View>
                  <View style={S.row}><Text style={S.label}>IP address</Text><Text style={S.mono}>{s.ip || "not recorded"}</Text></View>
                  <View style={S.row}><Text style={S.label}>Method</Text><Text style={S.value}>{s.method || ""}</Text></View>
                </View>
              ))}
            </View>
            <Seal date={shortDate(p.completedAt)} />
          </View>

          <View style={S.foot}>
            <Text style={S.micro}>{micro}</Text>
            <Text style={S.note}>
              Each signer confirmed their email address at the moment of signing. This certificate
              records what each party asserted and when. It does not verify identity beyond that
              assertion.
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}