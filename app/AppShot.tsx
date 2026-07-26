"use client";
import { useState } from "react";
// A faithful, code-built replica of the Overview screen for the marketing hero.
//
// Overview rather than Documents on purpose: a table of files looks like every
// other SaaS, while the intent field is the thing only this product has. The
// field is canvas in the real app; here it is SVG at the same geometry, same
// three bands, same tokens, because a marketing page cannot run an animation
// loop for a screenshot.
//
// Org is ReadProspects Inc, account is support@readprospects.com, initials
// avatar. Nothing personal, nothing from a real tenant.
type Node = { x: number; y: number; b: "ready" | "warm" | "glance"; n?: string; full?: string; doc?: string; reads?: string; dwell?: string; q?: string; why?: string };
const NODES: Node[] = [
  { x: 112, y: 168, b: "ready", n: "Dana W.", full: "Dana Whitfield", doc: "Q3 proposal \u2014 Northwind", reads: "12", dwell: "6m 40s", q: "3", why: "Re-read pricing three times and asked about the annual commit." },
  { x: 181, y: 124, b: "ready", n: "Marcus C.", full: "Marcus Cole", doc: "Pricing overview 2026", reads: "8", dwell: "4m 12s", q: "2", why: "Came back twice to the tiers table, then forwarded it." },
  { x: 157, y: 191, b: "ready", n: "Aisha B.", full: "Aisha Bello", doc: "Pricing overview 2026", reads: "9", dwell: "5m 30s", q: "4", why: "Asked what happens at the seat limit. Buying signal." },
  { x: 126, y: 119, b: "ready", n: "Elena R.", full: "Elena Ross", doc: "Security questionnaire", reads: "4", dwell: "3m 05s", q: "1", why: "Went straight to data retention and stayed there." },
  { x: 80, y: 121, b: "warm", full: "Sam Rivera", doc: "Q3 proposal \u2014 Northwind", reads: "2", dwell: "1m 18s", q: "0", why: "Opened twice, no questions yet." },
  { x: 217, y: 184, b: "warm", full: "Priya Raman", doc: "Implementation plan v2", reads: "2", dwell: "0m 54s", q: "1", why: "One question, then went quiet." },
  { x: 166, y: 79, b: "warm", full: "Tom Okafor", doc: "Pricing overview 2026", reads: "1", dwell: "1m 40s", q: "0", why: "Long single read of the pricing page." },
  { x: 106, y: 211, b: "warm", full: "Lena Fischer", doc: "Security questionnaire", reads: "2", dwell: "1m 02s", q: "0", why: "Skimmed, came back the next day." },
  { x: 51, y: 199, b: "glance" }, { x: 244, y: 91, b: "glance" }, { x: 190, y: 258, b: "glance" },
  { x: 66, y: 76, b: "glance" }, { x: 258, y: 170, b: "glance" }, { x: 131, y: 36, b: "glance" },
  { x: 96, y: 262, b: "glance" }, { x: 232, y: 246, b: "glance" },
];
const READERS = [
  ["DW", "Dana Whitfield", "Q3 proposal \u2014 Northwind", "12 reads"],
  ["AB", "Aisha Bello", "Pricing overview 2026", "9 reads"],
  ["ER", "Elena Ross", "Security questionnaire", "4 reads"],
];
const FEED = [
  ["eye", "Dana Whitfield opened Q3 proposal", "9m"],
  ["q", "Marcus Cole asked: \u201cIs the annual commit negotiable?\u201d", "1h"],
  ["eye", "Aisha Bello opened Pricing overview 2026", "3h"],
];
const NAV = [
  ["Overview", "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z", true],
  ["Documents", "M4 3h9l5 5v13H4zM13 3v5h5", false],
  ["Projects", "M3 6h6l2 3h10v10H3z", false],
  ["Activity", "M3 12h4l3 8 4-16 3 8h4", false],
  ["Recipients", "M17 20v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9.5 8.5a3.5 3.5 0 107 0 3.5 3.5 0 10-7 0M22 20v-2a4 4 0 00-3-3.9", false],
] as const;
const CFG = [
  ["Members", "M17 20v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9.5 8.5a3.5 3.5 0 107 0 3.5 3.5 0 10-7 0"],
  ["Settings", "M12 15a3 3 0 100-6 3 3 0 000 6M20 12l2-1-2-4-2 .6a8 8 0 00-2-1.2L15.5 4h-4l-.5 2.4a8 8 0 00-2 1.2L7 7l-2 4 2 1a8 8 0 000 2l-2 1 2 4 2-.6a8 8 0 002 1.2l.5 2.4h4l.5-2.4a8 8 0 002-1.2l2 .6 2-4-2-1a8 8 0 000-2"],
  ["Account", "M12 12a4 4 0 100-8 4 4 0 000 8M6 21v-1a4 4 0 014-4h4a4 4 0 014 4v1"],
] as const;
const SHOT_CSS = `
.rp-shot{--sl:#E4E7EC;--st:#475467;--sa:#ECF6F0;--sat:#14603C;--ca:#FFFFFF;--bd:#E4E7EC;--bs:#EFF1F4;
  --sf:#F9FAFB;--hd:#101828;--bo:#344054;--mu:#667085;--fa:#98A2B3;--gr:#1F6F4A;--gs:#ECF6F0;--gt:#14603C;
  --am:#B54708;--in:#3538CD;
  background:var(--ca);border-radius:14px;overflow:hidden;box-shadow:0 30px 80px -20px rgba(0,0,0,.75);
  font-family:var(--font-dm-sans),system-ui,sans-serif;letter-spacing:normal;text-align:left;color:var(--bo)}
.rp-shot *{box-sizing:border-box}
.rp-shot .s-chrome{display:flex;align-items:center;gap:7px;padding:9px 14px;background:var(--sf);border-bottom:1px solid var(--bd)}
.rp-shot .s-chrome i{width:9px;height:9px;border-radius:50%;background:var(--bd);display:block}
.rp-shot .s-url{font-size:11.5px;color:var(--fa);margin-left:10px}
.rp-shot .s-body{display:grid;grid-template-columns:206px minmax(0,1fr)}
.rp-shot .s-side{background:var(--ca);border-right:1px solid var(--sl);padding:14px 10px;display:flex;flex-direction:column;min-height:470px}
.rp-shot .s-brand{display:flex;align-items:center;gap:7px;padding:0 6px 12px;font-size:14px;font-weight:600;color:var(--hd)}
.rp-shot .s-ring{width:15px;height:15px;border:2px solid var(--gr);border-radius:50%;position:relative;flex:none}
.rp-shot .s-ring::after{content:"";position:absolute;inset:3.5px;background:var(--gr);border-radius:50%}
.rp-shot .s-org{display:flex;align-items:center;gap:7px;border:1px solid var(--sl);border-radius:6px;padding:7px 8px;margin-bottom:14px}
.rp-shot .s-orgm{width:21px;height:21px;border-radius:4px;background:var(--gr);color:#fff;font-size:10px;font-weight:600;display:flex;align-items:center;justify-content:center;flex:none}
.rp-shot .s-orgt{min-width:0;flex:1}
.rp-shot .s-orgk{display:block;font-size:8px;letter-spacing:.08em;text-transform:uppercase;color:var(--fa);line-height:1.3}
.rp-shot .s-orgn{display:block;font-size:11.5px;font-weight:600;color:var(--hd);line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rp-shot .s-bell{position:relative;color:var(--fa);flex:none;line-height:0}
.rp-shot .s-badge{position:absolute;top:-5px;right:-5px;min-width:13px;height:13px;border-radius:3px;background:#B42318;color:#fff;font-size:8.5px;font-weight:600;display:flex;align-items:center;justify-content:center;padding:0 3px}
.rp-shot .s-k{font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--fa);padding:0 6px;margin:6px 0 5px}
.rp-shot .s-nav{display:flex;align-items:center;gap:9px;padding:7px 8px;border-radius:6px;font-size:12.5px;color:var(--st);margin-bottom:1px}
.rp-shot .s-nav.on{background:var(--sa);color:var(--sat);font-weight:500}
.rp-shot .s-nav svg{width:15px;height:15px;flex:none}
.rp-shot .s-foot{margin-top:auto;padding-top:12px;border-top:1px solid var(--sl)}
.rp-shot .s-me{display:flex;align-items:center;gap:8px;margin-bottom:9px}
.rp-shot .s-av{width:22px;height:22px;border-radius:4px;background:var(--gs);color:var(--gt);font-size:9.5px;font-weight:600;display:flex;align-items:center;justify-content:center;flex:none}
.rp-shot .s-em{font-size:10.5px;color:var(--mu);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rp-shot .s-btns{display:flex;gap:6px}
.rp-shot .s-btn{flex:1;text-align:center;border:1px solid var(--bd);border-radius:6px;padding:5px 0;font-size:11px;color:var(--hd)}
.rp-shot .s-main{padding:18px;min-width:0}
.rp-shot .s-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px}
.rp-shot .s-live{display:inline-flex;align-items:center;gap:6px;font-size:9.5px;letter-spacing:.09em;color:var(--gt);background:var(--gs);border:1px solid #CFE7DA;border-radius:4px;padding:3px 8px}
.rp-shot .s-h1{font-size:20px;font-weight:600;color:var(--hd);letter-spacing:-.021em;margin:8px 0 0}
.rp-shot .s-sub{font-size:11.5px;color:var(--mu);margin:4px 0 0}
.rp-shot .s-new{background:var(--gr);color:#fff;border-radius:6px;padding:7px 11px;font-size:11.5px;font-weight:500;white-space:nowrap;flex:none}
.rp-shot .s-two{display:grid;grid-template-columns:1.45fr minmax(0,1fr);gap:12px}
.rp-shot .s-card{border:1px solid var(--bd);border-radius:6px;background:var(--ca);overflow:hidden}
.rp-shot .s-ch{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 13px}
.rp-shot .s-eye{font-size:8.5px;letter-spacing:.11em;text-transform:uppercase;color:var(--fa)}
.rp-shot .s-ct{font-size:13px;font-weight:600;color:var(--hd);margin-top:2px}
.rp-shot .s-cnt{font-size:10.5px;color:var(--mu);white-space:nowrap}
.rp-shot .s-field{padding:0 10px 8px}
.rp-shot .s-legend{display:flex;gap:14px;justify-content:center;padding:0 0 12px;font-size:10px;color:var(--mu)}
.rp-shot .s-legend i{width:6px;height:6px;border-radius:2px;display:inline-block;margin-right:5px;vertical-align:1px}
.rp-shot .s-chb{border-bottom:1px solid var(--bd)}
.rp-shot .s-row{display:flex;align-items:center;gap:10px;padding:10px 13px;border-bottom:1px solid var(--bs)}
.rp-shot .s-row:last-child{border-bottom:none}
.rp-shot .s-ini{width:24px;height:24px;border-radius:4px;background:var(--gs);color:var(--gt);font-size:9.5px;font-weight:600;display:flex;align-items:center;justify-content:center;flex:none}
.rp-shot .s-rn{font-size:12px;color:var(--hd);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rp-shot .s-rd{font-size:10.5px;color:var(--mu);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}
.rp-shot .s-rr{font-size:10.5px;color:var(--fa);white-space:nowrap;flex:none}
.rp-shot .s-st{display:inline-flex;align-items:center;gap:6px;font-size:10.5px;color:var(--hd);white-space:nowrap;flex:none}
.rp-shot .s-dot{width:6px;height:6px;border-radius:2px;flex:none}
.rp-shot .s-tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}
.rp-shot .s-tile{border:1px solid var(--bd);border-left:3px solid var(--bd);border-radius:6px;padding:10px 12px}
.rp-shot .s-tile.g{border-left-color:var(--gr)}
.rp-shot .s-tile.a{border-left-color:var(--am)}
.rp-shot .s-tile.i{border-left-color:var(--in)}
.rp-shot .s-tv{font-size:19px;font-weight:600;color:var(--hd);letter-spacing:-.02em;line-height:1.15}
.rp-shot .s-tl{font-size:10.5px;color:var(--mu);margin-top:2px}
.rp-shot .s-ic{width:22px;height:22px;border-radius:4px;display:flex;align-items:center;justify-content:center;flex:none}
.rp-shot .s-ic svg{width:12px;height:12px}
.rp-shot .s-fieldwrap{position:relative}
.rp-shot .s-node{cursor:pointer;transform-box:fill-box;transform-origin:center}
.rp-shot .s-node.d0{animation:sDrift 13s ease-in-out infinite}
.rp-shot .s-node.d1{animation:sDrift 17s ease-in-out infinite reverse}
.rp-shot .s-node.d2{animation:sDrift 21s ease-in-out infinite}
.rp-shot .s-node.d3{animation:sDrift 15s ease-in-out infinite reverse}
.rp-shot .s-pulse{animation:sPulse 3.4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
@keyframes sDrift{0%,100%{transform:translate(0,0)}33%{transform:translate(3px,-4px)}66%{transform:translate(-3px,2px)}}
@keyframes sPulse{0%,100%{opacity:.45;r:11}50%{opacity:.05;r:15}}
.rp-shot .s-pop{position:absolute;width:186px;background:#FFFFFF;border:1px solid var(--bd);border-radius:8px;
  box-shadow:0 12px 32px -12px rgba(16,24,40,.28);padding:11px 12px;z-index:5}
.rp-shot .s-popn{font-size:12.5px;font-weight:600;color:var(--hd)}
.rp-shot .s-popd{font-size:10.5px;color:var(--mu);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rp-shot .s-popk{display:flex;gap:12px;margin:9px 0}
.rp-shot .s-popk span{font-size:10.5px;color:var(--mu)}
.rp-shot .s-popk b{display:block;font-size:12.5px;color:var(--hd);font-weight:600}
.rp-shot .s-popw{font-size:11px;color:var(--bo);line-height:1.45;border-top:1px solid var(--bs);padding-top:8px}
.rp-shot .s-hint{text-align:center;font-size:10px;color:var(--fa);padding:0 0 10px}
@media (prefers-reduced-motion: reduce){
  .rp-shot .s-node,.rp-shot .s-pulse{animation:none}
}
@media (max-width:900px){
  .rp-shot .s-body{grid-template-columns:minmax(0,1fr)}
  .rp-shot .s-side{display:none}
  .rp-shot .s-two{grid-template-columns:minmax(0,1fr)}
}
@media (max-width:640px){
  .rp-shot .s-main{padding:13px}
  .rp-shot .s-tiles{grid-template-columns:1fr 1fr}
  .rp-shot .s-top{flex-direction:column}
}
`;
function Field({ open, setOpen }: { open: number | null; setOpen: (i: number | null) => void }) {
  const fill = (b: string) => (b === "ready" ? "#1F6F4A" : b === "warm" ? "#B54708" : "#98A2B3");
  const size = (b: string) => (b === "ready" ? 7 : b === "warm" ? 5.5 : 4.5);
  return (
    <svg viewBox="0 0 300 300" style={{ display: "block", width: "100%", height: "auto" }} role="img" aria-label="Intent field">
      <circle cx="150" cy="150" r="45" fill="none" stroke="#1F6F4A" strokeOpacity="0.55" strokeWidth="1.4" strokeDasharray="6 6" />
      <circle cx="150" cy="150" r="83" fill="none" stroke="#1F6F4A" strokeOpacity="0.4" strokeWidth="1.4" strokeDasharray="6 6" />
      <circle cx="150" cy="150" r="123" fill="none" stroke="#1F6F4A" strokeOpacity="0.28" strokeWidth="1.4" strokeDasharray="6 6" />
      {[0, 45, 90, 135].map((a) => {
        const rad = (a * Math.PI) / 180;
        return <line key={a} x1={150 - Math.cos(rad) * 123} y1={150 - Math.sin(rad) * 123} x2={150 + Math.cos(rad) * 123} y2={150 + Math.sin(rad) * 123} stroke="#1F6F4A" strokeOpacity="0.16" strokeWidth="1" />;
      })}
      {NODES.map((nd, i) => {
        const sel = open === i;
        const clickable = !!nd.full;
        return (
          <g key={i} className={"s-node d" + (i % 4)} onClick={clickable ? () => setOpen(sel ? null : i) : undefined} style={{ cursor: clickable ? "pointer" : "default" }}>
            {nd.b === "ready" && (
              <>
                <line x1="150" y1="150" x2={nd.x} y2={nd.y} stroke="#1F6F4A" strokeOpacity="0.26" strokeWidth="1" strokeDasharray="2 4" />
                <circle className="s-pulse" cx={nd.x} cy={nd.y} r="11" fill="none" stroke="#1F6F4A" strokeWidth="1.2" />
              </>
            )}
            {sel && <circle cx={nd.x} cy={nd.y} r={size(nd.b) + 6} fill="none" stroke="#1F6F4A" strokeWidth="2" />}
            {clickable && <circle cx={nd.x} cy={nd.y} r="15" fill="transparent" />}
            <circle cx={nd.x} cy={nd.y} r={size(nd.b)} fill={fill(nd.b)} />
            {nd.n && <text x={nd.x} y={nd.y - 14} textAnchor="middle" fontSize="10" fontWeight="600" fill="#101828" style={{ pointerEvents: "none" }}>{nd.n}</text>}
          </g>
        );
      })}
      {[["GLANCED", 31], ["WARMING", 71], ["READY", 109]].map(([label, y]) => (
        <g key={label as string} style={{ pointerEvents: "none" }}>
          <rect x={150 - 32} y={(y as number) - 9} width="64" height="13" fill="#FFFFFF" />
          <text x="150" y={y as number} textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#344054" letterSpacing="0.5">{label as string}</text>
        </g>
      ))}
      <circle cx="150" cy="150" r="23" fill="#FFFFFF" stroke="#E4E7EC" strokeWidth="1" />
      <text x="150" y="149" textAnchor="middle" fontSize="17" fontWeight="600" fill="#14603C" style={{ pointerEvents: "none" }}>4</text>
      <text x="150" y="162" textAnchor="middle" fontSize="8" fill="#667085" letterSpacing="0.4" style={{ pointerEvents: "none" }}>READY</text>
    </svg>
  );
}
export default function AppShot() {
  const [open, setOpen] = useState<number | null>(null);
  const sel = open === null ? null : NODES[open];
  // Popover placement in percent, so it tracks the SVG as it scales.
  const px = sel ? (sel.x > 150 ? { right: (300 - sel.x) / 3 + 6 + "%" } : { left: sel.x / 3 + 6 + "%" }) : {};
  const py = sel ? { top: Math.min(sel.y / 3, 58) + "%" } : {};
  return (
    <div className="rp-shot">
      <style>{SHOT_CSS}</style>
      <div className="s-chrome"><i /><i /><i /><span className="s-url">app.readprospects.com/overview</span></div>
      <div className="s-body">
        <aside className="s-side">
          <div className="s-brand"><span className="s-ring" />ReadProspects</div>
          <div className="s-org">
            <span className="s-orgm">R</span>
            <span className="s-orgt">
              <span className="s-orgk">Organization</span>
              <span className="s-orgn">ReadProspects Inc</span>
            </span>
            <span className="s-bell">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 01-3.4 0" /></svg>
              <span className="s-badge">2</span>
            </span>
          </div>
          <div className="s-k">Main</div>
          {NAV.map(([label, d, on]) => (
            <div key={label} className={"s-nav" + (on ? " on" : "")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>{label}
            </div>
          ))}
          <div className="s-k" style={{ marginTop: 12 }}>Configure</div>
          {CFG.map(([label, d]) => (
            <div key={label} className="s-nav">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>{label}
            </div>
          ))}
          <div className="s-foot">
            <div className="s-me"><span className="s-av">RP</span><span className="s-em">support@readprospects.com</span></div>
            <div className="s-btns"><span className="s-btn">View site</span><span className="s-btn">Sign out</span></div>
          </div>
        </aside>
        <main className="s-main">
          <div className="s-top">
            <div>
              <span className="s-live"><i style={{ width: 6, height: 6, borderRadius: 2, background: "#1F6F4A", display: "inline-block" }} />LIVE</span>
              <h3 className="s-h1">Good morning</h3>
              <p className="s-sub">Here is how your documents are being read today.</p>
            </div>
            <span className="s-new">+ New document</span>
          </div>
          <div className="s-two">
            <div className="s-card">
              <div className="s-ch">
                <div>
                  <div className="s-eye">Live &middot; intent field</div>
                  <div className="s-ct">Your room, right now</div>
                </div>
                <span className="s-cnt">4 / 16 readers</span>
              </div>
              <div className="s-field s-fieldwrap">
                <Field open={open} setOpen={setOpen} />
                {sel && (
                  <div className="s-pop" style={{ ...px, ...py }}>
                    <div className="s-popn">{sel.full}</div>
                    <div className="s-popd">{sel.doc}</div>
                    <div className="s-popk">
                      <span>reads<b>{sel.reads}</b></span>
                      <span>dwell<b>{sel.dwell}</b></span>
                      <span>questions<b>{sel.q}</b></span>
                    </div>
                    <div className="s-popw">{sel.why}</div>
                  </div>
                )}
              </div>
              <div className="s-hint">Click a reader</div>
              <div className="s-legend">
                <span><i style={{ background: "#1F6F4A" }} />Ready</span>
                <span><i style={{ background: "#B54708" }} />Warming</span>
                <span><i style={{ background: "#98A2B3" }} />Glanced</span>
              </div>
            </div>
            <div className="s-card">
              <div className="s-ch s-chb"><div className="s-ct">Ready to move</div><span className="s-cnt">See all</span></div>
              {READERS.map(([ini, name, doc, reads]) => (
                <div key={name} className="s-row">
                  <span className="s-ini">{ini}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="s-rn" style={{ display: "block" }}>{name}</span>
                    <span className="s-rd" style={{ display: "block" }}>{doc}</span>
                  </span>
                  <span className="s-st"><i className="s-dot" style={{ background: "#1F6F4A" }} />Ready</span>
                  <span className="s-rr">{reads}</span>
                </div>
              ))}
              <div className="s-ch s-chb" style={{ borderTop: "1px solid #E4E7EC" }}><div className="s-ct">Recent reads</div><span className="s-cnt">Activity</span></div>
              {FEED.map(([kind, text, when]) => (
                <div key={text} className="s-row">
                  <span className="s-ic" style={{ background: kind === "q" ? "#EEF0FB" : "#ECF6F0", color: kind === "q" ? "#2D2FA6" : "#14603C" }}>
                    {kind === "q"
                      ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                      : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>}
                  </span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, color: "#101828", lineHeight: 1.4 }}>{text}</span>
                  <span className="s-rr">{when}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="s-tiles">
            <div className="s-tile g"><div className="s-tv">24</div><div className="s-tl">Reads</div></div>
            <div className="s-tile a"><div className="s-tv">9</div><div className="s-tl">Questions</div></div>
            <div className="s-tile i"><div className="s-tv">16</div><div className="s-tl">Recipients</div></div>
            <div className="s-tile"><div className="s-tv">5</div><div className="s-tl">Documents</div></div>
          </div>
        </main>
      </div>
    </div>
  );
}