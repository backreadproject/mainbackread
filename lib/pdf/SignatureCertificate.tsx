import React from "react";
import path from "path";
import { Document, Page, Text, View, StyleSheet, Svg, Path, Circle, Font } from "@react-pdf/renderer";

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

// Inter, read off disk rather than fetched.
//
// The report engine uses Helvetica because a font fetched at render time can
// 404 and take the document with it. That reasoning does not apply here: these
// are files in node_modules, resolved at module load. Fontsource ships woff2
// only, which react-pdf cannot parse, so the TTFs come from the Expo package.
const FONTS = path.join(process.cwd(), "node_modules", "@expo-google-fonts", "inter");
Font.register({
  family: "Inter",
  fonts: [
    { src: path.join(FONTS, "400Regular", "Inter_400Regular.ttf"), fontWeight: 400 },
    { src: path.join(FONTS, "600SemiBold", "Inter_600SemiBold.ttf"), fontWeight: 600 },
  ],
});
// Inter has no hyphens in a reference or an email address. Left to itself
// react-pdf breaks words wherever it likes, which would split RP-SIG-550C7F4D
// across a line and make the reference look like two.
Font.registerHyphenationCallback((w) => [w]);

// Security-print line work.
//
// A holographic effect cannot exist in a PDF: it is a physical property of foil
// shifting with viewing angle. What reproduces is the real visual language of a
// printed instrument -- guilloche waves, a rosette seal, microprint -- which is
// flat, printable, and survives a photocopy badly on purpose.
//
// Opacity is baked into the stroke colours rather than set with strokeOpacity,
// because that attribute is not reliably honoured and a silent failure would
// give either invisible line work or a solid green band. These are #1F6F4A
// composited on white at the mock's alpha values.
const WAVE   = "#BCD4C9"; // 0.30
const RING_A = "#8FB7A5"; // 0.50
const RING_B = "#B1CDC0"; // 0.35
const RING_C = "#C5DACF"; // 0.30
const ELL_A  = "#9ABEAE"; // 0.45
const ELL_B  = "#C5DACF"; // 0.30
const G      = "#1F6F4A";

// Ellipses emitted as explicit path data, not with an SVG transform. A rotate()
// that silently no-ops would leave a seal of four bare circles with nothing
// reporting an error.
function rotatedEllipse(cx: number, cy: number, rx: number, ry: number, deg: number): string {
  const t = (deg * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t);
  let d = "";
  for (let i = 0; i <= 96; i++) {
    const a = (2 * Math.PI * i) / 96;
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

const S = StyleSheet.create({
  page: { padding: 34, fontFamily: "Inter", fontSize: 11 },
  card: { flex: 1, borderWidth: 1, borderColor: "#C8CFD8", borderRadius: 6 },

  head: { height: 118, paddingTop: 26, paddingHorizontal: 29,
          borderBottomWidth: 1, borderBottomColor: "#E4E7EC" },
  waves: { position: "absolute", top: 0, left: 0, right: 0, height: 118 },
  eyebrow: { fontSize: 10.5, letterSpacing: 0.95, color: "#667085", marginBottom: 6 },
  title: { fontSize: 21, fontWeight: 600, letterSpacing: -0.44, color: "#101828", marginBottom: 5 },
  ref: { fontSize: 11.5, color: "#667085", fontFamily: "Courier" },

  body: { flex: 1, flexDirection: "row", paddingTop: 26, paddingHorizontal: 30 },
  left: { flex: 1 },
  block: { marginBottom: 8 },
  ruled: { borderTopWidth: 1, borderTopColor: "#EFF1F4", paddingTop: 22, marginTop: 14 },
  row: { flexDirection: "row", marginBottom: 9 },
  label: { width: 120, color: "#667085", fontSize: 12 },
  value: { flex: 1, color: "#101828", fontSize: 12 },
  mono: { flex: 1, color: "#101828", fontSize: 11, fontFamily: "Courier" },

  foot: { paddingHorizontal: 30, paddingBottom: 26 },
  micro: { fontSize: 6.2, color: "#C8CFD8", fontFamily: "Courier", letterSpacing: 0.4, lineHeight: 1.5 },
  note: { fontSize: 11, color: "#98A2B3", lineHeight: 1.6,
          borderTopWidth: 1, borderTopColor: "#E4E7EC", paddingTop: 14, marginTop: 16 },
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
    <Svg viewBox="0 0 160 160" style={{ width: 150, height: 150 }}>
      <Circle cx="80" cy="80" r="76" fill="none" stroke={RING_A} strokeWidth={0.6} />
      <Circle cx="80" cy="80" r="72" fill="none" stroke={RING_B} strokeWidth={0.6} />
      <Circle cx="80" cy="80" r="52" fill="none" stroke={RING_A} strokeWidth={0.6} />
      <Circle cx="80" cy="80" r="49" fill="none" stroke={RING_C} strokeWidth={0.6} />
      {[0, 30, 60, 90, 120, 150].map((a) => (
        <Path key={"o" + a} d={rotatedEllipse(80, 80, 62, 24, a)} fill="none" stroke={ELL_A} strokeWidth={0.55} />
      ))}
      {[15, 75, 135].map((a) => (
        <Path key={"i" + a} d={rotatedEllipse(80, 80, 44, 16, a)} fill="none" stroke={ELL_B} strokeWidth={0.5} />
      ))}
      <Circle cx="80" cy="80" r="26" fill="#FFFFFF" />
      <Circle cx="80" cy="80" r="9" fill="none" stroke={G} strokeWidth={1.6} />
      <Circle cx="80" cy="80" r="3.4" fill={G} />
      <Text x="80" y="62" textAnchor="middle" style={{ fontSize: 6.5, color: "#667085", fontFamily: "Inter" }}>{date}</Text>
      <Text x="80" y="104" textAnchor="middle" style={{ fontSize: 6.5, color: "#667085", fontFamily: "Inter" }}>COMPLETE</Text>
    </Svg>
  );
}

// Deliberately absent: the signature images, and any reading evidence.
// Reproducing the mark invites the certificate to be read as verification of
// it. Reading evidence is the sender's own intelligence and does not belong in
// a counterparty's hands.
export function SignatureCertificate(p: CertProps) {
  const micro = Array(28).fill(p.reference).join("\u00B7");
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={S.page}>
        <View style={S.card}>
          <View style={S.head}>
            <View style={S.waves}>
              <Svg viewBox="0 0 600 120" preserveAspectRatio="none" style={{ width: "100%", height: 118 }}>
                {WAVES.map((d, i) => (
                  <Path key={i} d={d} fill="none" stroke={WAVE} strokeWidth={0.6} />
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
                <View key={i} style={i === 0 ? S.block : [S.block, S.ruled]}>
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