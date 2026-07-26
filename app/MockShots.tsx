// The remaining marketing mockups, rebuilt as the real screens.
//
// Same principle as the hero: real light theme, real components, real
// proportions, invented data only. Nothing is removed from what these sections
// showed before, so the copy and the layout around them are untouched.
//
// The ask panel uses the RELAY palette (#159A56) rather than the app green,
// because that surface really does live on relaydocuments.com and really is a
// different green. Showing the app's green there would be the wrong screen.
const S = {
  ca: "#FFFFFF", bd: "#E4E7EC", bs: "#EFF1F4", sf: "#F9FAFB",
  hd: "#101828", bo: "#344054", mu: "#667085", fa: "#98A2B3",
  gr: "#1F6F4A", gs: "#ECF6F0", gt: "#14603C", gb: "#CFE7DA", am: "#B54708",
};
const R = { green: "#159A56", ink: "#111A16", body: "#475467", slate: "#6E7B74", line: "#E5EBE7", soft: "#F6F8F7" };
export const MOCK_CSS = `
.rp-m{background:${S.ca};border-radius:12px;overflow:hidden;box-shadow:0 24px 60px -22px rgba(0,0,0,.7);
  font-family:var(--font-dm-sans),system-ui,sans-serif;letter-spacing:normal;text-align:left;color:${S.bo}}
.rp-m *{box-sizing:border-box}
.rp-m .m-top{display:flex;align-items:center;gap:7px;padding:9px 13px;background:${S.sf};border-bottom:1px solid ${S.bd}}
.rp-m .m-top i{width:8px;height:8px;border-radius:50%;background:${S.bd};display:block}
.rp-m .m-url{font-size:11px;color:${S.fa};margin-left:9px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rp-m .m-pad{padding:16px}
.rp-m .m-h{font-size:13px;font-weight:600;color:${S.hd};margin:0 0 2px}
.rp-m .m-s{font-size:11px;color:${S.mu};margin:0}
.rp-m .m-tbl{border:1px solid ${S.bd};border-radius:6px;overflow:hidden;margin-top:12px}
.rp-m .m-tr{display:grid;grid-template-columns:1.3fr 1.3fr .5fr .8fr .5fr .9fr;gap:9px;padding:9px 12px;align-items:center}
.rp-m .m-th{background:${S.sf};border-bottom:1px solid ${S.bd};font-size:10.5px;font-weight:600;color:${S.bo};white-space:nowrap}
.rp-m .m-td{border-bottom:1px solid ${S.bs};font-size:11.5px;color:${S.bo}}
.rp-m .m-td:last-child{border-bottom:none}
.rp-m .m-nm{display:flex;align-items:center;gap:8px;min-width:0}
.rp-m .m-ini{width:22px;height:22px;border-radius:4px;background:${S.gs};color:${S.gt};font-size:9.5px;font-weight:600;display:flex;align-items:center;justify-content:center;flex:none}
.rp-m .m-ell{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:${S.hd}}
.rp-m .m-dim{color:${S.fa}}
.rp-m .m-st{display:inline-flex;align-items:center;gap:6px;color:${S.hd};white-space:nowrap}
.rp-m .m-dot{width:6px;height:6px;border-radius:2px;flex:none}
.rp-m .m-strip{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid ${S.bd};border-radius:6px;overflow:hidden}
.rp-m .m-cell{padding:10px 12px;border-left:3px solid ${S.bd}}
.rp-m .m-cell.g{border-left-color:${S.gr}}
.rp-m .m-cell.a{border-left-color:${S.am}}
.rp-m .m-cell.i{border-left-color:#3538CD}
.rp-m .m-cv{font-size:18px;font-weight:600;color:${S.hd};letter-spacing:-.02em;line-height:1.15}
.rp-m .m-cl{font-size:10px;color:${S.mu};margin-top:2px}
.rp-m .m-ask{background:${R.soft};border-bottom:1px solid ${R.line};padding:10px 14px;display:flex;align-items:center;gap:8px}
.rp-m .m-askd{width:7px;height:7px;border-radius:50%;background:${R.green};flex:none}
.rp-m .m-askt{font-size:12px;font-weight:600;color:${R.ink}}
.rp-m .m-bub{border-radius:10px;padding:10px 12px;font-size:12.5px;line-height:1.5;margin-bottom:9px;max-width:86%}
.rp-m .m-bub.q{background:${R.green};color:#fff;margin-left:auto}
.rp-m .m-bub.a{background:${R.soft};border:1px solid ${R.line};color:${R.body}}
.rp-m .m-in{display:flex;gap:8px;padding:11px 14px;border-top:1px solid ${R.line}}
.rp-m .m-inb{flex:1;border:1px solid ${R.line};border-radius:6px;padding:7px 10px;font-size:11.5px;color:${S.fa}}
.rp-m .m-ing{background:${R.green};color:#fff;border-radius:6px;padding:7px 14px;font-size:11.5px;font-weight:500;white-space:nowrap}
.rp-m .m-pg{display:flex;align-items:center;gap:11px;margin-bottom:9px}
.rp-m .m-pgl{font-size:11px;color:${S.mu};width:46px;flex:none}
.rp-m .m-pgb{flex:1;height:6px;background:${S.sf};border:1px solid ${S.bd};border-radius:2px;overflow:hidden;min-width:0}
.rp-m .m-pgb i{display:block;height:100%;background:${S.gr}}
.rp-m .m-pgt{font-size:11px;color:${S.bo};width:36px;text-align:right;flex:none;font-variant-numeric:tabular-nums}
.rp-m .m-vhd{padding:9px 14px;background:${S.sf};border-bottom:1px solid ${S.bd};font-size:11.5px;font-weight:600;color:${S.bo}}
.rp-m .m-conf{display:inline-flex;align-items:center;gap:7px;font-size:11px;color:${S.gt};margin-bottom:9px}
.rp-m .m-vh{font-size:17px;font-weight:600;color:${S.hd};line-height:1.3;letter-spacing:-.021em;margin:0 0 8px}
.rp-m .m-vr{font-size:12px;color:${S.bo};line-height:1.5;margin:0 0 12px}
.rp-m .m-next{background:${S.gs};border:1px solid ${S.gb};border-radius:6px;padding:10px 12px}
.rp-m .m-nk{font-size:11px;font-weight:600;color:${S.gt};margin-bottom:3px}
.rp-m .m-nv{font-size:12px;color:${S.hd};line-height:1.45;margin:0}
.rp-m .m-two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.rp-m .m-col{border:1px solid ${S.bd};border-radius:6px;padding:12px}
.rp-m .m-cn{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.rp-m .m-cnn{font-size:12.5px;font-weight:600;color:${S.hd}}
.rp-m .m-kv{display:flex;justify-content:space-between;font-size:11.5px;color:${S.mu};padding:5px 0;border-bottom:1px solid ${S.bs}}
.rp-m .m-kv:last-of-type{border-bottom:none}
.rp-m .m-kv b{color:${S.hd};font-weight:600;font-variant-numeric:tabular-nums}
@media (max-width:640px){
  .rp-m .m-tr{grid-template-columns:1.4fr .6fr .9fr}
  .rp-m .m-hide{display:none}
  .rp-m .m-strip{grid-template-columns:1fr 1fr}
  .rp-m .m-two{grid-template-columns:1fr}
}
`;
type L = "en" | "fr";
const T = {
  en: {
    reader: "Reader", document: "Document", reads: "Reads", dwell: "Dwell", questions: "Questions", verdict: "Verdict",
    ready: "Ready to move", warming: "Warming", glanced: "Just glanced",
    opened: "Opened", notYet: "not yet", escalated: "Escalated", totalReaders: "Total readers",
    ask: "Ask about the document...", askBtn: "Ask",
    page: "Page", conf: "high confidence", next: "Do this next",
    why: "Re-read the pricing page three times, asked whether the annual commit is negotiable, then forwarded it to one colleague.",
    action: "Send the annual terms in writing today and offer a call this week.",
  },
  fr: {
    reader: "Lecteur", document: "Document", reads: "Lectures", dwell: "Temps", questions: "Questions", verdict: "Verdict",
    ready: "Pr\u00eat \u00e0 avancer", warming: "En int\u00e9r\u00eat", glanced: "Simple coup d\u2019\u0153il",
    opened: "Ouvert", notYet: "pas encore", escalated: "Escalad\u00e9es", totalReaders: "Lecteurs au total",
    ask: "Posez une question sur le document...", askBtn: "Demander",
    page: "Page", conf: "confiance \u00e9lev\u00e9e", next: "\u00c0 faire maintenant",
    why: "A relu la page tarifs trois fois, a demand\u00e9 si l\u2019engagement annuel est n\u00e9gociable, puis l\u2019a transf\u00e9r\u00e9 \u00e0 un coll\u00e8gue.",
    action: "Envoyez les conditions annuelles par \u00e9crit aujourd\u2019hui et proposez un appel cette semaine.",
  },
} as const;
const dots = <><i /><i /><i /></>;
const ROWS = [
  ["DW", "Dana Whitfield", "Q3 proposal", "12", "6m 40s", "3", "ready"],
  ["MC", "Marcus Cole", "Pricing overview", "8", "4m 12s", "2", "ready"],
  ["SR", "Sam Rivera", "Q3 proposal", "1", "0m 22s", "0", "glance"],
  ["AB", "Aisha Bello", "Security questionnaire", "9", "5m 30s", "4", "ready"],
  ["ER", "Elena Ross", "Implementation plan", "3", "2m 08s", "1", "warm"],
];
export function RecipientsShot({ title, sub, locale = "en" }: { title: string; sub: string; locale?: L }) {
  const x = T[locale];
  const dot = (v: string) => (v === "ready" ? S.gr : v === "warm" ? S.am : S.fa);
  const word = (v: string) => (v === "ready" ? x.ready : v === "warm" ? x.warming : x.glanced);
  return (
    <div className="rp-m">
      <div className="m-top">{dots}<span className="m-url">app.readprospects.com/recipients</span></div>
      <div className="m-pad">
        <p className="m-h">{title}</p>
        <p className="m-s">{sub}</p>
        <div className="m-strip" style={{ marginTop: 12 }}>
          <div className="m-cell g"><div className="m-cv">13</div><div className="m-cl">{x.opened} &middot; 10 {x.notYet}</div></div>
          <div className="m-cell a"><div className="m-cv">2</div><div className="m-cl">{x.escalated}</div></div>
          <div className="m-cell i"><div className="m-cv">11</div><div className="m-cl">{x.questions}</div></div>
          <div className="m-cell"><div className="m-cv">23</div><div className="m-cl">{x.totalReaders}</div></div>
        </div>
        <div className="m-tbl">
          <div className="m-tr m-th">
            <span>{x.reader}</span><span className="m-hide">{x.document}</span><span>{x.reads}</span>
            <span className="m-hide">{x.dwell}</span><span className="m-hide">{x.questions}</span><span>{x.verdict}</span>
          </div>
          {ROWS.map(([ini, name, doc, reads, dwell, q, v]) => (
            <div key={name} className="m-tr m-td">
              <span className="m-nm"><span className="m-ini">{ini}</span><span className="m-ell">{name}</span></span>
              <span className="m-hide m-ell">{doc}</span>
              <span>{reads}</span>
              <span className="m-hide">{dwell}</span>
              <span className={"m-hide" + (q === "0" ? " m-dim" : "")}>{q}</span>
              <span className="m-st"><i className="m-dot" style={{ background: dot(v) }} />{word(v)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export function AskShot({ doc, view, q1, a1, q2, locale = "en" }: { doc: string; view: string; q1: string; a1: string; q2: string; locale?: L }) {
  const x = T[locale];
  return (
    <div className="rp-m">
      <div className="m-top">{dots}<span className="m-url">relaydocuments.com/read &middot; {doc}</span></div>
      <div className="m-ask"><span className="m-askd" /><span className="m-askt">{view}</span></div>
      <div className="m-pad" style={{ display: "flex", flexDirection: "column" }}>
        <div className="m-bub q">{q1}</div>
        <div className="m-bub a">{a1}</div>
        <div className="m-bub q" style={{ marginBottom: 0 }}>{q2}</div>
      </div>
      <div className="m-in"><span className="m-inb">{x.ask}</span><span className="m-ing">{x.askBtn} &rarr;</span></div>
    </div>
  );
}
export function DwellShot({ title, visits, locale = "en" }: { title: string; visits: string; locale?: L }) {
  const x = T[locale];
  const pages: [string, string, string][] = [[x.page + " 1", "18%", "8s"], [x.page + " 2", "100%", "44s"], [x.page + " 3", "28%", "12s"], [x.page + " 4", "46%", "20s"], [x.page + " 5", "12%", "5s"]];
  return (
    <div className="rp-m">
      <div className="m-top">{dots}<span className="m-url">app.readprospects.com/recipients</span></div>
      <div className="m-vhd" style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <span>{title}</span><span style={{ fontWeight: 400, color: S.mu }}>{visits}</span>
      </div>
      <div className="m-pad">
        {pages.map(([label, w, t]) => (
          <div key={label} className="m-pg">
            <span className="m-pgl">{label}</span>
            <span className="m-pgb"><i style={{ width: w }} /></span>
            <span className="m-pgt">{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
export function VerdictShot({ read, verdict, ready, locale = "en" }: { read: string; verdict: string; ready: string; locale?: L }) {
  const x = T[locale];
  return (
    <div className="rp-m">
      <div className="m-top">{dots}<span className="m-url">app.readprospects.com/recipients</span></div>
      <div className="m-pad">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span className="m-ini" style={{ width: 30, height: 30, fontSize: 11 }}>DW</span>
          <span>
            <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: S.hd }}>Dana Whitfield</span>
            <span style={{ display: "block", fontSize: 11, color: S.mu, marginTop: 1 }}>{read}</span>
          </span>
        </div>
      </div>
      <div className="m-vhd">{verdict}</div>
      <div className="m-pad">
        <span className="m-conf"><i className="m-dot" style={{ background: S.gr }} />{x.conf}</span>
        <p className="m-vh">{ready}</p>
        <p className="m-vr">{x.why}</p>
        <div className="m-next">
          <div className="m-nk">{x.next}</div>
          <p className="m-nv">{x.action}</p>
        </div>
      </div>
    </div>
  );
}
export function CompareShot({ visits, time, q, ready, glance }: { visits: string; time: string; q: string; ready: string; glance: string }) {
  const col = (ini: string, name: string, v: string, t: string, qq: string, label: string, tone: string) => (
    <div className="m-col">
      <div className="m-cn"><span className="m-ini">{ini}</span><span className="m-cnn">{name}</span></div>
      <div className="m-kv"><span>{visits}</span><b>{v}</b></div>
      <div className="m-kv"><span>{time}</span><b>{t}</b></div>
      <div className="m-kv"><span>{q}</span><b>{qq}</b></div>
      <div className="m-st" style={{ marginTop: 11, fontSize: 11.5 }}><i className="m-dot" style={{ background: tone }} />{label}</div>
    </div>
  );
  return (
    <div className="rp-m">
      <div className="m-top">{dots}<span className="m-url">app.readprospects.com/documents</span></div>
      <div className="m-pad">
        <div className="m-two">
          {col("DW", "Dana Whitfield", "2", "6m 40s", "3", ready, S.gr)}
          {col("SR", "Sam Rivera", "1", "0m 22s", "0", glance, S.fa)}
        </div>
      </div>
    </div>
  );
}