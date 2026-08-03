import React from "react";
import path from "path";
import { Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer";
import { CERT_BORDER, CERT_SEAL } from "./certificate-assets";
import type { CertRow } from "./certificate-data";

// Inter, read off disk at module load rather than fetched at render time.
// Fontsource ships woff2, which react-pdf cannot parse, so the TTFs come from
// the Expo package. Courier stays a built-in: it is one of the fourteen every
// PDF reader already has, so it can never fail to embed.
const FONTS = path.join(process.cwd(), "node_modules", "@expo-google-fonts", "inter");
Font.register({
  family: "Inter",
  fonts: [
    { src: path.join(FONTS, "400Regular", "Inter_400Regular.ttf"), fontWeight: 400 },
    { src: path.join(FONTS, "600SemiBold", "Inter_600SemiBold.ttf"), fontWeight: 600 },
  ],
});
// No hyphens in a reference or an email address. Left alone, react-pdf breaks
// words wherever it likes and RP-SIG-550C7F4D reads as two things.
Font.registerHyphenationCallback((w) => [w]);

export type CertProps = {
  reference: string;
  completedAt: string;
  qr: string;
  rows: CertRow[];
};

const INK = "#101828", MUTED = "#667085", FAINT = "#98A2B3";

const S = StyleSheet.create({
  page: { fontFamily: "Inter", fontSize: 11, position: "relative" },
  border: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" },
  inner: { paddingTop: 148, paddingBottom: 40, paddingHorizontal: 52 },

  title: { flexDirection: "row", justifyContent: "center", marginBottom: 36 },
  t1: { fontSize: 23, fontWeight: 600, color: INK, letterSpacing: -0.3 },
  t2: { fontSize: 20, color: "#5A6476", paddingHorizontal: 6 },

  meta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 22 },
  metaR: { alignItems: "flex-end" },
  cap: { fontSize: 6.6, letterSpacing: 0.7, color: FAINT, marginBottom: 3 },
  val: { fontSize: 8.4, fontFamily: "Courier", color: INK },

  head: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#788494", paddingBottom: 6 },
  hcap: { fontSize: 8.2, fontWeight: 600, letterSpacing: 0.5, color: INK },

  row: { flexDirection: "row", marginTop: 18, marginBottom: 8 },
  c1: { width: 184 }, c2: { width: 156 }, c3: { flex: 1 },
  name: { fontSize: 12, fontWeight: 600, letterSpacing: 0.4, color: INK, marginBottom: 10 },
  field: { marginBottom: 8 },

  sigbox: { borderWidth: 1, borderColor: "#3C4658", height: 44, width: 152,
            alignItems: "center", justifyContent: "center", marginBottom: 10 },
  sigimg: { maxHeight: 34, maxWidth: 138, objectFit: "contain" },

  sealWrap: { alignItems: "center", marginTop: 26 },
  seal: { width: 176, height: 176 },
  sealT: { position: "absolute", fontSize: 6.4, letterSpacing: 1.1, color: MUTED },

  qrWrap: { position: "absolute", right: 52, bottom: 118, alignItems: "center" },
  qr: { width: 72, height: 72 },

  foot: { position: "absolute", left: 52, right: 52, bottom: 40 },
  footRow: { flexDirection: "row", alignItems: "center" },
  mark: { width: 13, height: 13, backgroundColor: "#1F6F4A", borderRadius: 3, marginRight: 7 },
  brand: { fontSize: 8.4, fontWeight: 600, color: INK },
  page1: { position: "absolute", left: 0, right: 0, textAlign: "center", fontSize: 7.6,
           letterSpacing: 0.6, color: MUTED },
  note: { textAlign: "center", fontSize: 7.4, color: FAINT, marginTop: 14 },
});

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

// Pinned to UTC and never locale-formatted. A server locale deciding whether a
// contract reads 08/02 or 02/08 is not a risk worth carrying here.
function stamp(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} `
       + `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}
function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function Field({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  if (!value) return null;
  return (
    <View style={S.field}>
      <Text style={S.cap}>{label}</Text>
      <Text style={mono ? S.val : { fontSize: 8.4, color: INK }}>{value}</Text>
    </View>
  );
}

// Deliberately absent: any reading evidence. How long someone spent on page
// three is the sender's intelligence, not something to hand a counterparty.
export function SignatureCertificate(p: CertProps) {
  return (
    <Document>
      <Page size="A4" style={S.page}>
        <Image src={CERT_BORDER} style={S.border} fixed />

        <View style={S.inner}>
          <View style={S.title}>
            <Text style={S.t1}>CERTIFICATE</Text>
            <Text style={S.t2}>of</Text>
            <Text style={S.t1}>SIGNATURE</Text>
          </View>

          <View style={S.meta}>
            <View>
              <Text style={S.cap}>REF. NUMBER</Text>
              <Text style={S.val}>{p.reference}</Text>
            </View>
            <View style={S.metaR}>
              <Text style={S.cap}>DOCUMENT COMPLETED BY ALL PARTIES ON</Text>
              <Text style={S.val}>{stamp(p.completedAt)}</Text>
              <Text style={S.val}>UTC</Text>
            </View>
          </View>

          <View style={S.head}>
            <Text style={[S.hcap, S.c1]}>SIGNER</Text>
            <Text style={[S.hcap, S.c2]}>TIMESTAMP</Text>
            <Text style={[S.hcap, S.c3]}>SIGNATURE</Text>
          </View>

          {p.rows.map((r, i) => (
            <View key={i} style={S.row} wrap={false}>
              <View style={S.c1}>
                <Text style={S.name}>{r.name.toUpperCase()}</Text>
                <Field label="EMAIL" value={(r.email || "").toUpperCase()} />
              </View>
              <View style={S.c2}>
                {/* Sent is blank for a link-mode reader: nothing was ever sent
                    to them, and inventing a timestamp on this document would be
                    the one lie it cannot afford. */}
                <Field label="SENT" value={stamp(r.sentAt)} />
                <Field label="VIEWED" value={stamp(r.viewedAt)} />
                <Field label="SIGNED" value={stamp(r.signedAt)} />
              </View>
              <View style={S.c3}>
                <View style={S.sigbox}>
                  {r.signature ? <Image src={r.signature} style={S.sigimg} /> : null}
                </View>
                <Field label="IP ADDRESS" value={r.ip || "NOT RECORDED"} />
                <Field label="METHOD" value={(r.method || "").toUpperCase()} />
              </View>
            </View>
          ))}

          <View style={S.sealWrap}>
            <Image src={CERT_SEAL} style={S.seal} />
            <Text style={[S.sealT, { top: 72 }]}>{shortDate(p.completedAt)}</Text>
            <Text style={[S.sealT, { top: 96 }]}>COMPLETE</Text>
          </View>
        </View>

        <View style={S.qrWrap}>
          <Image src={p.qr} style={S.qr} />
          <Text style={[S.cap, { marginTop: 6 }]}>SCAN TO VERIFY</Text>
        </View>

        <View style={S.foot}>
          <View style={S.footRow}>
            <View style={S.mark} />
            <Text style={S.brand}>Certificate provided by ReadProspects</Text>
            <Text style={S.page1}>PAGE 1 OF 1</Text>
          </View>
          <Text style={S.note}>
            This certificate records what each party asserted and when. It does not verify
            identity beyond that assertion.
          </Text>
        </View>
      </Page>
    </Document>
  );
}