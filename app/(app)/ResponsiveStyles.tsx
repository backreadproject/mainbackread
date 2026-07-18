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
      @media (max-width: 720px) {
        .stat-grid { grid-template-columns: repeat(2, 1fr); }
        .stat-grid-3 { grid-template-columns: repeat(2, 1fr); }
        .card-grid-3 { grid-template-columns: 1fr; }
        .two-col { grid-template-columns: 1fr; }
        .screen-pad { padding: 18px 16px; }

        /* Table rows reflow into stacked cards */
        .row-head { display: none !important; }
        .data-row {
          display: block !important;
          border: 1px solid var(--row-border, #EAECEF);
          border-radius: 12px;
          margin-bottom: 10px;
          padding: 14px 16px !important;
        }
        .data-row > * { display: block; width: 100%; }
        .data-cell { margin-bottom: 6px; }
        .data-cell:last-child { margin-bottom: 0; }
      }
    `}</style>
  );
}
