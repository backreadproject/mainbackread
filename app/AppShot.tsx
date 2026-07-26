// A faithful, code-built replica of the Documents screen for the marketing hero.
//
// Not a stylised mock: this is the real light theme, the real sidebar, the real
// stat strip and the real table, at the real proportions. The only fiction is
// the data. Built in code rather than as a screenshot so it tracks the app when
// the app changes, and so it reflows on a phone.
//
// The org is ReadProspects Inc, the account is support@readprospects.com, and
// the avatar is initials. Nothing personal, nothing borrowed from a real tenant.
const ROWS = [
  { t: "Q3 proposal \u2014 Northwind", r: 4, o: 12, q: 3, p: "Enterprise", d: "24 Jul 2026", s: "active" },
  { t: "Pricing overview 2026", r: 6, o: 9, q: 5, p: "Enterprise", d: "22 Jul 2026", s: "active" },
  { t: "Security questionnaire", r: 2, o: 3, q: 1, p: "\u2014", d: "19 Jul 2026", s: "active" },
  { t: "Master services agreement", r: 3, o: 0, q: 0, p: "Legal", d: "16 Jul 2026", s: "awaiting" },
  { t: "Implementation plan v2", r: 0, o: 0, q: 0, p: "\u2014", d: "14 Jul 2026", s: "unshared" },
];
const NAV = [
  ["Overview", "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z", false],
  ["Documents", "M4 3h9l5 5v13H4zM13 3v5h5", true],
  ["Projects", "M3 6h6l2 3h10v10H3z", false],
  ["Activity", "M3 12h4l3 8 4-16 3 8h4", false],
  ["Recipients", "M17 20v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9.5 8.5a3.5 3.5 0 107 0 3.5 3.5 0 10-7 0M22 20v-2a4 4 0 00-3-3.9", false],
] as const;
const CFG = [
  ["Members", "M17 20v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9.5 8.5a3.5 3.5 0 107 0 3.5 3.5 0 10-7 0"],
  ["Settings", "M12 15a3 3 0 100-6 3 3 0 000 6M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-2.9 1.2V21a2 2 0 11-4 0v-.1A1.7 1.7 0 007 19.4l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.7 1.7 0 003 13.7H3a2 2 0 110-4h.1A1.7 1.7 0 004.6 7l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9.4a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9v.1a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1"],
  ["Account", "M12 12a4 4 0 100-8 4 4 0 000 8M6 21v-1a4 4 0 014-4h4a4 4 0 014 4v1"],
] as const;
const SHOT_CSS = `
.rp-shot{--sb:#FFFFFF;--sl:#E4E7EC;--st:#475467;--sa:#ECF6F0;--sat:#14603C;
  --ca:#FFFFFF;--bd:#E4E7EC;--bs:#EFF1F4;--sf:#F9FAFB;--hd:#101828;--bo:#344054;--mu:#667085;--fa:#98A2B3;
  --gr:#1F6F4A;--gs:#ECF6F0;--gt:#14603C;--am:#B54708;--in:#3538CD;
  background:var(--ca);border-radius:14px;overflow:hidden;box-shadow:0 30px 80px -20px rgba(0,0,0,.75);
  font-family:var(--font-dm-sans),system-ui,sans-serif;letter-spacing:normal;text-align:left;color:var(--bo)}
.rp-shot *{box-sizing:border-box}
.rp-shot .s-chrome{display:flex;align-items:center;gap:7px;padding:9px 14px;background:var(--sf);border-bottom:1px solid var(--bd)}
.rp-shot .s-chrome i{width:9px;height:9px;border-radius:50%;background:var(--bd);display:block}
.rp-shot .s-url{font-size:11.5px;color:var(--fa);margin-left:10px}
.rp-shot .s-body{display:grid;grid-template-columns:198px minmax(0,1fr)}
.rp-shot .s-side{background:var(--sb);border-right:1px solid var(--sl);padding:14px 10px;display:flex;flex-direction:column;min-height:430px}
.rp-shot .s-brand{display:flex;align-items:center;gap:7px;padding:0 6px 12px;font-size:14px;font-weight:600;color:var(--hd)}
.rp-shot .s-ring{width:15px;height:15px;border:2px solid var(--gr);border-radius:50%;position:relative;flex:none}
.rp-shot .s-ring::after{content:"";position:absolute;inset:3.5px;background:var(--gr);border-radius:50%}
.rp-shot .s-org{display:flex;align-items:center;gap:8px;border:1px solid var(--sl);border-radius:6px;padding:8px 9px;margin-bottom:14px}
.rp-shot .s-orgm{width:22px;height:22px;border-radius:4px;background:var(--gr);color:#fff;font-size:10px;font-weight:600;display:flex;align-items:center;justify-content:center;flex:none}
.rp-shot .s-orgk{font-size:8.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--fa);line-height:1.3}
.rp-shot .s-orgn{font-size:12px;font-weight:600;color:var(--hd);line-height:1.3}
.rp-shot .s-bell{margin-left:auto;position:relative;color:var(--fa);flex:none}
.rp-shot .s-badge{position:absolute;top:-5px;right:-5px;min-width:14px;height:14px;border-radius:3px;background:#B42318;color:#fff;font-size:9px;font-weight:600;display:flex;align-items:center;justify-content:center;padding:0 3px}
.rp-shot .s-k{font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--fa);padding:0 6px;margin:6px 0 5px}
.rp-shot .s-nav{display:flex;align-items:center;gap:9px;padding:7px 8px;border-radius:6px;font-size:12.5px;color:var(--st);margin-bottom:1px}
.rp-shot .s-nav.on{background:var(--sa);color:var(--sat);font-weight:500}
.rp-shot .s-nav svg{width:15px;height:15px;flex:none}
.rp-shot .s-foot{margin-top:auto;padding-top:12px;border-top:1px solid var(--sl)}
.rp-shot .s-me{display:flex;align-items:center;gap:8px;margin-bottom:9px}
.rp-shot .s-av{width:22px;height:22px;border-radius:4px;background:var(--gs);color:var(--gt);font-size:9.5px;font-weight:600;display:flex;align-items:center;justify-content:center;flex:none}
.rp-shot .s-em{font-size:11px;color:var(--mu);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rp-shot .s-btns{display:flex;gap:6px}
.rp-shot .s-btn{flex:1;text-align:center;border:1px solid var(--bd);border-radius:6px;padding:5px 0;font-size:11px;color:var(--hd)}
.rp-shot .s-main{padding:20px 20px 22px;min-width:0}
.rp-shot .s-h1{font-size:21px;font-weight:600;color:var(--hd);letter-spacing:-.021em;margin:0}
.rp-shot .s-sub{font-size:12px;color:var(--mu);margin:5px 0 0}
.rp-shot .s-tools{display:flex;gap:7px;align-items:center;margin:16px 0 12px;flex-wrap:wrap}
.rp-shot .s-sel{border:1px solid var(--bd);border-radius:6px;padding:6px 9px;font-size:11.5px;color:var(--bo);display:flex;align-items:center;gap:14px;background:var(--ca)}
.rp-shot .s-sel svg{width:11px;height:11px;color:var(--fa)}
.rp-shot .s-search{border:1px solid var(--bd);border-radius:6px;padding:6px 9px;font-size:11.5px;color:var(--fa);flex:1;min-width:120px;background:var(--ca)}
.rp-shot .s-out{border:1px solid var(--bd);border-radius:6px;padding:6px 11px;font-size:11.5px;color:var(--hd);background:var(--ca)}
.rp-shot .s-cta{background:var(--gr);color:#fff;border-radius:6px;padding:6px 11px;font-size:11.5px;font-weight:500}
.rp-shot .s-strip{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--bd);border-radius:6px;overflow:hidden;background:var(--ca)}
.rp-shot .s-cell{padding:11px 13px;border-left:3px solid var(--bd)}
.rp-shot .s-cell.g{border-left-color:var(--gr)}
.rp-shot .s-cell.a{border-left-color:var(--am)}
.rp-shot .s-cell.i{border-left-color:var(--in)}
.rp-shot .s-cv{font-size:19px;font-weight:600;color:var(--hd);letter-spacing:-.02em;line-height:1.15}
.rp-shot .s-cl{font-size:10.5px;color:var(--mu);margin-top:2px}
.rp-shot .s-tbl{border:1px solid var(--bd);border-radius:6px;margin-top:14px;overflow:hidden}
.rp-shot .s-tr{display:grid;grid-template-columns:1.9fr .8fr .6fr .8fr .8fr .9fr .9fr 22px;gap:9px;padding:9px 13px;align-items:center}
.rp-shot .s-th{background:var(--sf);border-bottom:1px solid var(--bd);font-size:10.5px;font-weight:600;color:var(--bo);white-space:nowrap}
.rp-shot .s-td{border-bottom:1px solid var(--bs);font-size:11.5px;color:var(--bo)}
.rp-shot .s-td:last-child{border-bottom:none}
.rp-shot .s-name{color:var(--hd);font-weight:500;border-bottom:1px solid var(--bd);padding-bottom:1px;justify-self:start;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}
.rp-shot .s-dim{color:var(--fa)}
.rp-shot .s-st{display:inline-flex;align-items:center;gap:6px;color:var(--hd);white-space:nowrap}
.rp-shot .s-dot{width:6px;height:6px;border-radius:2px;flex:none}
.rp-shot .s-kebab{color:var(--fa);justify-self:end;line-height:0}
@media (max-width:900px){
  .rp-shot .s-body{grid-template-columns:minmax(0,1fr)}
  .rp-shot .s-side{display:none}
}
@media (max-width:640px){
  .rp-shot .s-main{padding:14px}
  .rp-shot .s-strip{grid-template-columns:1fr 1fr}
  .rp-shot .s-tr{grid-template-columns:1.6fr .7fr .7fr 1fr}
  .rp-shot .s-hide{display:none}
}
`;
const kebab = (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" /></svg>
);
const chev = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
);
export default function AppShot() {
  const dot = (s: string) => (s === "active" ? "#1F6F4A" : s === "awaiting" ? "#B54708" : "#98A2B3");
  const word = (s: string) => (s === "active" ? "Active" : s === "awaiting" ? "Awaiting" : "Not shared");
  return (
    <div className="rp-shot">
      <style>{SHOT_CSS}</style>
      <div className="s-chrome"><i /><i /><i /><span className="s-url">app.readprospects.com/documents</span></div>
      <div className="s-body">
        <aside className="s-side">
          <div className="s-brand"><span className="s-ring" />ReadProspects</div>
          <div className="s-org">
            <span className="s-orgm">R</span>
            <span style={{ minWidth: 0 }}>
              <span className="s-orgk" style={{ display: "block" }}>Organization</span>
              <span className="s-orgn" style={{ display: "block" }}>ReadProspects Inc</span>
            </span>
            <span className="s-bell">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 01-3.4 0" /></svg>
              <span className="s-badge">2</span>
            </span>
          </div>
          <div className="s-k">Main</div>
          {NAV.map(([label, d, on]) => (
            <div key={label} className={"s-nav" + (on ? " on" : "")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
              {label}
            </div>
          ))}
          <div className="s-k" style={{ marginTop: 12 }}>Configure</div>
          {CFG.map(([label, d]) => (
            <div key={label} className="s-nav">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
              {label}
            </div>
          ))}
          <div className="s-foot">
            <div className="s-me"><span className="s-av">RP</span><span className="s-em">support@readprospects.com</span></div>
            <div className="s-btns"><span className="s-btn">View site</span><span className="s-btn">Sign out</span></div>
          </div>
        </aside>
        <main className="s-main">
          <h3 className="s-h1">Documents</h3>
          <p className="s-sub">Manage the documents you share and how they are read.</p>
          <div className="s-tools">
            <span className="s-sel">Active {chev}</span>
            <span className="s-sel s-hide">All {chev}</span>
            <span className="s-search">Search a document</span>
            <span className="s-out s-hide">Upload A/B variants</span>
            <span className="s-cta">+ Add document</span>
          </div>
          <div className="s-strip">
            <div className="s-cell g"><div className="s-cv">24</div><div className="s-cl">Total reads &middot; 6 pending</div></div>
            <div className="s-cell a"><div className="s-cv">9</div><div className="s-cl">Questions &middot; 2 escalated</div></div>
            <div className="s-cell i"><div className="s-cv">15</div><div className="s-cl">Active readers</div></div>
            <div className="s-cell"><div className="s-cv">5</div><div className="s-cl">Documents &middot; 4 shared</div></div>
          </div>
          <div className="s-tbl">
            <div className="s-tr s-th">
              <span>Document</span><span className="s-hide">Recipients</span><span>Reads</span><span className="s-hide">Questions</span>
              <span className="s-hide">Project</span><span className="s-hide">Shared</span><span>Status</span><span />
            </div>
            {ROWS.map((r) => (
              <div key={r.t} className="s-tr s-td">
                <span className="s-name">{r.t}</span>
                <span className="s-hide">{r.r}</span>
                <span>{r.o}</span>
                <span className={"s-hide" + (r.q ? "" : " s-dim")}>{r.q}</span>
                <span className={"s-hide" + (r.p === "\u2014" ? " s-dim" : "")}>{r.p}</span>
                <span className="s-hide s-dim">{r.d}</span>
                <span className="s-st"><i className="s-dot" style={{ background: dot(r.s) }} />{word(r.s)}</span>
                <span className="s-kebab s-hide">{kebab}</span>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}