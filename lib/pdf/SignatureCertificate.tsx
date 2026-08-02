import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

export type CertSigner = {
  name: string;
  email: string | null;
  method: string | null;
  signedAt: string | null;
  ip: string | null;
  signatureData: string | null;
};

export type CertProps = {
  reference: string;
  title: string;
  documentId: string;
  fingerprint: string;
  completedAt: string;
  signers: CertSigner[];
};

const S = StyleSheet.create({
  page: { padding: 46, fontFamily: "Helvetica", fontSize: 9.5, color: "#344054" },
  eyebrow: { fontSize: 7.5, letterSpacing: 1.6, color: "#98A2B3", marginBottom: 8 },
  h1: { fontSize: 19, color: "#101828", fontFamily: "Helvetica-Bold", marginBottom: 4 },
  ref: { fontSize: 9, color: "#667085", marginBottom: 22 },
  rule: { borderBottomWidth: 1, borderBottomColor: "#E4E7EC", marginBottom: 18 },
  row: { flexDirection: "row", marginBottom: 6 },
  label: { width: 118, color: "#98A2B3", fontSize: 8.5 },
  value: { flex: 1, color: "#101828" },
  mono: { flex: 1, color: "#101828", fontFamily: "Courier", fontSize: 8 },
  section: { fontSize: 8, letterSpacing: 1.4, color: "#98A2B3", marginTop: 26, marginBottom: 10 },
  card: { borderWidth: 1, borderColor: "#E4E7EC", borderRadius: 4, marginBottom: 10 },
  head: { backgroundColor: "#F9FAFB", paddingVertical: 6, paddingHorizontal: 12,
          borderBottomWidth: 1, borderBottomColor: "#E4E7EC", flexDirection: "row" },
  name: { fontFamily: "Helvetica-Bold", color: "#101828", fontSize: 10, flex: 1 },
  body: { padding: 12 },
  stamp: { height: 40, marginBottom: 8, objectFit: "contain", alignSelf: "flex-start" },
  note: { marginTop: 24, fontSize: 8, color: "#667085", lineHeight: 1.55 },
});

function when(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

// The certificate records what happened at the moment of signing, and nothing
// else. Reading evidence stays in the product: it is the sender's intelligence,
// not something to hand a counterparty. Concerns raised and resolved stay out
// for the same reason -- negotiation history on the artefact hands a future
// opponent a documented reason the signer hesitated.
export function SignatureCertificate(p: CertProps) {
  return (
    <Document>
      <Page size="A4" style={S.page}>
        <Text style={S.eyebrow}>CERTIFICATE OF SIGNATURE</Text>
        <Text style={S.h1}>{p.title}</Text>
        <Text style={S.ref}>Reference {p.reference}</Text>
        <View style={S.rule} />

        <View style={S.row}><Text style={S.label}>Completed</Text><Text style={S.value}>{when(p.completedAt)}</Text></View>
        <View style={S.row}><Text style={S.label}>Signers</Text><Text style={S.value}>{String(p.signers.length)}</Text></View>
        <View style={S.row}><Text style={S.label}>Document ID</Text><Text style={S.mono}>{p.documentId}</Text></View>
        <View style={S.row}><Text style={S.label}>Original SHA-256</Text><Text style={S.mono}>{p.fingerprint}</Text></View>

        <Text style={S.section}>SIGNATURES</Text>
        {p.signers.map((s, i) => (
          <View key={i} style={S.card} wrap={false}>
            <View style={S.head}><Text style={S.name}>{s.name}</Text></View>
            <View style={S.body}>
              {s.signatureData ? <Image style={S.stamp} src={s.signatureData} /> : null}
              <View style={S.row}><Text style={S.label}>Email</Text><Text style={S.value}>{s.email || ""}</Text></View>
              <View style={S.row}><Text style={S.label}>Signed</Text><Text style={S.value}>{when(s.signedAt)}</Text></View>
              <View style={S.row}><Text style={S.label}>Method</Text><Text style={S.value}>{s.method || ""}</Text></View>
              <View style={S.row}><Text style={S.label}>IP address</Text><Text style={S.value}>{s.ip || "not recorded"}</Text></View>
            </View>
          </View>
        ))}

        <Text style={S.note}>
          Each person above opened a link sent to them, entered the email address shown, and
          applied the signature reproduced above. The date and time are recorded by the server
          at the moment the signature was submitted. The SHA-256 value identifies the document
          as it stood before any signature was applied, so the original can be checked against
          this record.{"\n"}{"\n"}
          This certificate does not verify identity beyond the assertion each signer made. It
          records what was done, by whom it was claimed to be done, and when.
        </Text>
      </Page>
    </Document>
  );
}