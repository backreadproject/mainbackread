import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

// Burning signatures into the document.
//
// Fields are stored as fractions of the RENDERED page, because that is what the
// placement screen could see: pdf.js honours /Rotate, so a 90-degree scan is
// laid out in its rotated orientation. PDF user space does not -- it is always
// unrotated, and its origin is bottom-left rather than top-left.
//
// So every field needs two corrections: flip the vertical axis, and undo the
// page rotation. Get either wrong and signatures land mirrored or off-page, on
// documents that are usually the customer's most important ones.
export type StampField = {
  page: number;
  x: number; y: number; w: number; h: number;
  kind: string;
  date_mode: string | null;
  value: string | null;
  recipient_id: string;
};

export type StampSigner = {
  id: string;
  name: string;
  signed_at: string | null;
  signature_data: string | null;
};

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

// Pinned rather than locale-formatted. A server locale deciding whether a
// contract says 08/02 or 02/08 is not a risk worth carrying.
function longDate(iso: string): string {
  const d = new Date(iso);
  return String(d.getUTCDate()).padStart(2, "0") + " " + MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear();
}

type Box = { x: number; y: number; w: number; h: number; rot: number };

// Rendered rect (top-left origin) -> PDF placement anchor, size and rotation.
// Derived per angle rather than approximated; each case was checked by mapping
// the display corners back through the viewer's own rotation.
function place(px: number, py: number, pw: number, ph: number, W: number, H: number, r: number): Box {
  if (r === 90)  return { x: py,     y: px + pw,     w: pw, h: ph, rot: -90 };
  if (r === 180) return { x: W - px, y: py + ph,     w: pw, h: ph, rot: 180 };
  if (r === 270) return { x: W - py, y: H - px - pw, w: pw, h: ph, rot: 90 };
  return { x: px, y: H - py - ph, w: pw, h: ph, rot: 0 };
}

// A point offset inside the box, in the box's own frame, expressed in PDF space.
function local(b: Box, u: number, v: number) {
  const t = (b.rot * Math.PI) / 180;
  const c = Math.cos(t), s = Math.sin(t);
  return { x: b.x + u * c - v * s, y: b.y + u * s + v * c };
}

export async function stampDocument(
  original: Uint8Array,
  fields: StampField[],
  signers: Map<string, StampSigner>,
): Promise<Uint8Array> {
  // ignoreEncryption: many business PDFs carry an owner password with no user
  // password. Refusing those would reject documents that open fine everywhere.
  const pdf = await PDFDocument.load(original, { ignoreEncryption: true });
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();
  const images = new Map<string, Awaited<ReturnType<typeof pdf.embedPng>>>();

  for (const f of fields) {
    const page = pages[f.page - 1];
    if (!page) continue;
    const signer = signers.get(f.recipient_id);
    // Never stamp for someone who has not signed. A field belonging to a signer
    // who declined or is still pending simply does not appear.
    if (!signer || !signer.signed_at) continue;

    const { width: W, height: H } = page.getSize();
    const r = (((page.getRotation().angle % 360) + 360) % 360);
    const RW = r === 90 || r === 270 ? H : W;
    const RH = r === 90 || r === 270 ? W : H;

    const px = f.x * RW, py = f.y * RH, pw = f.w * RW, ph = f.h * RH;
    const box = place(px, py, pw, ph, W, H, r);

    if (f.kind === "signature") {
      const src = signer.signature_data || "";
      const comma = src.indexOf(",");
      if (comma < 0) continue;
      let img = images.get(signer.id);
      if (!img) {
        const bytes = Buffer.from(src.slice(comma + 1), "base64");
        img = src.startsWith("data:image/jpeg") || src.startsWith("data:image/jpg")
          ? await pdf.embedJpg(bytes)
          : await pdf.embedPng(bytes);
        images.set(signer.id, img);
      }
      // Fit inside and centre, never stretch. A stretched signature is a
      // different mark from the one the person made.
      const scale = Math.min(box.w / img.width, box.h / img.height);
      const dw = img.width * scale, dh = img.height * scale;
      const at = local(box, (box.w - dw) / 2, (box.h - dh) / 2);
      page.drawImage(img, { x: at.x, y: at.y, width: dw, height: dh, rotate: degrees(box.rot) });
      continue;
    }

    const text =
      f.kind === "date"
        ? (f.date_mode === "chosen" && f.value ? longDate(f.value) : longDate(signer.signed_at))
        : (f.value || "");
    if (!text) continue;

    let size = Math.min(box.h * 0.62, 14);
    while (size > 5 && helv.widthOfTextAtSize(text, size) > box.w - 4) size -= 0.5;
    const at = local(box, 2, (box.h - size) / 2 + size * 0.22);
    page.drawText(text, {
      x: at.x, y: at.y, size, font: helv,
      color: rgb(0.063, 0.094, 0.157),
      rotate: degrees(box.rot),
    });
  }

  return await pdf.save();
}

// Appends the certificate pages to the stamped document.
export async function appendPages(base: Uint8Array, extra: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.load(base, { ignoreEncryption: true });
  const add = await PDFDocument.load(extra);
  const copied = await doc.copyPages(add, add.getPageIndices());
  copied.forEach((p) => doc.addPage(p));
  return await doc.save();
}