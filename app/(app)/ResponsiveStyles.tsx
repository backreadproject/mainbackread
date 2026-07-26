// Injects global responsive utility classes used across screens.
// Rendered once (in the app layout). Pure CSS; no client logic needed.
export default function ResponsiveStyles() {
  return (
    <style>{`
      /* Stat-card grids: 4 across on desktop -> 2 on phone */
      .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
      .stat-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
      .card-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
      .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }

      /* Content padding shrinks on mobile */
      .screen-pad { padding: 26px 30px; }

      @media (max-width: 1024px) {
        .card-grid-3 { grid-template-columns: repeat(2, 1fr); }
        .stat-grid-3 { grid-template-columns: repeat(3, 1fr); }
      }
      /* Tab bars that might overflow scroll horizontally instead of colliding */
      .tab-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      .tab-scroll::-webkit-scrollbar { display: none; }

      @media (max-width: 720px) {
        .page-header { flex-direction: column !important; gap: 14px; align-items: stretch !important; }
        .page-header select, .page-header label, .page-header a, .page-header button { width: 100%; box-sizing: border-box; text-align: center; }
        .tab-bar { flex-wrap: wrap; gap: 10px !important; }
        .tab-bar > span { margin-left: 0 !important; }
        .stat-grid { grid-template-columns: repeat(2, 1fr); }
        .stat-grid-3 { grid-template-columns: repeat(2, 1fr); }
        /* Strips built during the sharp reskin. Same intent, different class. */
        .stat-strip { grid-template-columns: repeat(2, 1fr) !important; }
        .lim-grid { grid-template-columns: repeat(2, 1fr) !important; }
        .card-grid-3 { grid-template-columns: 1fr; }
        .two-col { grid-template-columns: 1fr; }
        .screen-pad { padding: 18px 16px; }
        /* Clear the fixed support launcher, which otherwise sits on the last row. */
        .app-content main { padding-bottom: 96px !important; }

        /* Table rows reflow into stacked cards */
        .row-head { display: none !important; }
        .data-row {
          display: block !important;
          border: 1px solid var(--rp-border);
          border-radius: 12px;
          margin-bottom: 10px;
          padding: 14px 16px !important;
        }
        .data-row > * { display: flex !important; width: auto; justify-content: space-between; align-items: center; gap: 12px; padding: 5px 0; }
        .data-cell {
          white-space: normal !important;
          overflow: visible !important;
          text-overflow: clip !important;
          overflow-wrap: anywhere;
        }
        /* The label must not wrap or it stacks under itself; only the value does. */
        .data-cell[data-label]::before { flex: 0 0 auto; white-space: nowrap; }
        .data-cell[data-label]::before {
          content: attr(data-label);
          font-size: 12px; font-weight: 600; color: var(--rp-muted);
          text-transform: uppercase; letter-spacing: 0.03em;
        }
        .sm-hide { display: none !important; }
        .dc-title {
          font-size: 15px !important; font-weight: 700 !important;
          padding-bottom: 8px !important; margin-bottom: 4px;
          border-bottom: 1px solid var(--rp-border);
          white-space: normal !important; justify-content: flex-start !important;
        }
      }
    `}</style>
  );
}
