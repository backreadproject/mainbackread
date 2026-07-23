export type CsvRow = Record<string, string>;

/** Minimal RFC-4180 parser: quoted fields, embedded commas and newlines,
 *  doubled quotes, CRLF, and a stripped BOM. No dependency. */
export function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  const t = text.replace(/^\uFEFF/, "");
  const table: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < t.length) {
    const ch = t[i];
    if (inQuotes) {
      if (ch === '"') {
        if (t[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += ch; i++; continue;
    }
    if (ch === '"') { inQuotes = true; i++; continue; }
    if (ch === ",") { row.push(field); field = ""; i++; continue; }
    if (ch === "\r") { i++; continue; }
    if (ch === "\n") { row.push(field); table.push(row); row = []; field = ""; i++; continue; }
    field += ch; i++;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); table.push(row); }

  const nonEmpty = table.filter((r) => r.some((c) => c.trim() !== ""));
  if (nonEmpty.length === 0) return { headers: [], rows: [] };

  const headers = nonEmpty[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const rows = nonEmpty.slice(1).map((r) => {
    const obj: CsvRow = {};
    headers.forEach((h, k) => { obj[h] = (r[k] ?? "").trim(); });
    return obj;
  });
  return { headers, rows };
}

export const CSV_TEMPLATE_HEADERS = ["first_name", "last_name", "email", "label", "variant"];

/** A template with two example rows, one showing an explicit variant. */
export function csvTemplate(): string {
  return [
    CSV_TEMPLATE_HEADERS.join(","),
    "Sarah,Chen,sarah@example.com,,A",
    "Tomas,Alvarez,tomas@example.com,Tomas at Northwind,",
  ].join("\r\n");
}

export function downloadCsvTemplate(filename = "readprospects-recipients.csv"): void {
  const blob = new Blob([csvTemplate()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function looksLikeEmail(s: string): boolean {
  const v = s.trim();
  return v.length > 3 && v.includes("@") && !/\s/.test(v) && v.indexOf("@") > 0 && v.lastIndexOf(".") > v.indexOf("@");
}
