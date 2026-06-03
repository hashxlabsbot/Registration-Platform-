import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

export interface TicketData {
  bookingId: string;
  name: string;
  email: string;
  phone: string;
  organization: string;
  designation: string;
  registrationType: string;
  totalAmount: number;
  utrNumber?: string;
  eventName: string;
  eventSubtitle: string;
  eventDate: string;
  eventVenue: string;
  organizer: string;
}

// ── Scale factor for high-DPI / print quality ──────────────────────────────
// All drawing coordinates are in "logical" units; we multiply by SCALE
// when actually drawing, so the output PDF is 2× resolution internally.
const SCALE = 2;          // 2× = ~144 DPI in a 72dpi PDF viewer → crisp

// Logical dimensions (what the designer thinks in)
const LW = 288;           // logical width  (pt)
const LH = 430;           // logical height (pt)

// Physical PDF page size
const W = LW * SCALE;     // 576 pt
const H = LH * SCALE;     // 860 pt

// White zone boundaries derived from HTML ticket CSS:
// pt-[38%] in CSS = 38% of element WIDTH (not height) → 38% × (LW/LH) of height
// Inner div is aspect-square w-[62%], so zone height = 62% of width = 62% × (LW/LH) of height
const ZONE_TOP    = Math.round(0.38 * LW / LH * H);          // ≈ 222
const ZONE_BOTTOM = Math.round((0.38 + 0.62) * LW / LH * H); // ≈ 576

const DARK_GREEN = '#0f2e14';
const WHITE      = '#ffffff';

// ── Main export ───────────────────────────────────────────────────────────────
export async function generateTicketPDF(ticket: TicketData): Promise<Buffer> {
  // Load background at full physical resolution for maximum sharpness
  let bgBuf: Buffer | null = null;
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'public', 'Id-background.png'));
    bgBuf = await sharp(raw)
      .resize(W, H, { fit: 'fill', kernel: 'lanczos3' })
      .png({ compressionLevel: 0, quality: 100 })   // lossless PNG
      .toBuffer();
  } catch { /* proceed without background */ }

  // QR code at physical size — sharp, scannable
  const qrLogical = 80;    // logical pt
  const qrPhysical = qrLogical * SCALE;   // 160 pt in the PDF

  const qrPayload = JSON.stringify({
    id: ticket.bookingId, name: ticket.name, type: ticket.registrationType,
    amt: `Rs.${ticket.totalAmount}`, ph: ticket.phone, em: ticket.email,
    ev: 'PRAKRITI2026', dt: '20-06-2026',
  });
  const qrBuf = await QRCode.toBuffer(qrPayload, {
    width: qrPhysical * 4,   // generate at 4× then downscale → anti-aliased
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: DARK_GREEN, light: WHITE },
  });
  // Resize to exact physical size with lanczos for crisp edges
  const qrSharp = await sharp(qrBuf)
    .resize(qrPhysical, qrPhysical, { kernel: 'lanczos3' })
    .png({ compressionLevel: 0 })
    .toBuffer();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [W, H], margin: 0 });
    const chunks: Buffer[] = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    drawCard(doc, ticket, bgBuf, qrSharp, qrPhysical);
    doc.end();
  });
}

// ── Card ──────────────────────────────────────────────────────────────────────
function drawCard(
  doc: InstanceType<typeof PDFDocument>,
  ticket: TicketData,
  bgBuf: Buffer | null,
  qrBuf: Buffer,
  qrPhysical: number,
) {
  const cx = W / 2;

  // ── Background (full bleed, lossless) ──────────────────────────────────────
  if (bgBuf) doc.image(bgBuf, 0, 0, { width: W, height: H });
  else       doc.rect(0, 0, W, H).fill(WHITE);

  // ── Layout ─────────────────────────────────────────────────────────────────
  // Inner box width = 62% of page width (matches HTML w-[62%])
  const ibW = Math.round(0.62 * W);

  // Zone height and vertical centering with padding (matches HTML p-2 + justify-center)
  const zoneH  = ZONE_BOTTOM - ZONE_TOP;
  const padPt  = Math.round(0.04 * zoneH);   // ~4% padding each side
  let currentY = ZONE_TOP + padPt + 12 * SCALE;

  // 1. Name
  doc.font('Times-Bold').fontSize(16 * SCALE).fillColor('#1a3d21');
  const nameText = ticket.name.toUpperCase();
  const nameWidth = doc.widthOfString(nameText);
  if (nameWidth > ibW) {
    doc.fontSize(16 * SCALE * (ibW / nameWidth));
  }
  doc.text(nameText, cx - ibW / 2, currentY, { width: ibW, align: 'center' });
  currentY += doc.heightOfString(nameText, { width: ibW }) + 4 * SCALE;

  // 2. Divider
  const divW = ibW * 0.82;
  doc
    .moveTo(cx - divW / 2, currentY)
    .lineTo(cx + divW / 2, currentY)
    .lineWidth(1.5 * SCALE)
    .strokeColor('#a5d6a7')
    .strokeOpacity(0.7)
    .stroke();
  doc.strokeOpacity(1);
  currentY += 6 * SCALE;

  // 3. Designation / Organisation
  const desig =
    ticket.designation && ticket.designation !== '—'
      ? ticket.designation
      : ticket.organization;
  doc.font('Helvetica-Bold').fontSize(9 * SCALE).fillColor('#1a5c2a');
  doc.text(desig, cx - ibW / 2, currentY, { width: ibW, align: 'center' });
  currentY += doc.heightOfString(desig, { width: ibW }) + 6 * SCALE;

  // 4. Badges
  doc.fontSize(7 * SCALE).font('Helvetica-Bold');
  const typeText = ticket.registrationType.toUpperCase();
  const idText   = ticket.bookingId;

  const b1W = doc.widthOfString(typeText) + 12 * SCALE;
  const b2W = doc.widthOfString(idText)   + 12 * SCALE;
  const gap = 4 * SCALE;
  const totalBdW = b1W + b2W + gap;
  const bdStartX = cx - totalBdW / 2;
  const bdH = 12 * SCALE;

  // Badge 1 — registration type (dark green)
  doc.roundedRect(bdStartX, currentY, b1W, bdH, 3 * SCALE).fill('#1a5c2a');
  doc.fillColor('#ffffff').text(typeText, bdStartX + 6 * SCALE, currentY + 3 * SCALE);

  // Badge 2 — booking ID (light green outline)
  const b2X = bdStartX + b1W + gap;
  doc.roundedRect(b2X, currentY, b2W, bdH, 3 * SCALE).fillOpacity(0.85).fill('#e8f5e9');
  doc.fillOpacity(1);
  doc.roundedRect(b2X, currentY, b2W, bdH, 3 * SCALE)
     .lineWidth(0.5 * SCALE).strokeColor('#a5d6a7').stroke();
  doc.fillColor('#1b5e20').text(idText, b2X + 6 * SCALE, currentY + 3.5 * SCALE);

  currentY += bdH + 10 * SCALE;

  // 5. QR Code
  const qrX = cx - qrPhysical / 2;

  // Border around QR
  doc.roundedRect(qrX - 2 * SCALE, currentY - 2 * SCALE, qrPhysical + 4 * SCALE, qrPhysical + 4 * SCALE, 4 * SCALE)
     .lineWidth(1.5 * SCALE).strokeColor('#a5d6a7').strokeOpacity(0.8).stroke();
  doc.strokeOpacity(1);

  doc.image(qrBuf, qrX, currentY, { width: qrPhysical, height: qrPhysical });
  currentY += qrPhysical + 6 * SCALE;

  // 6. QR label
  doc.fontSize(7 * SCALE).font('Helvetica-Bold').fillColor('#2d5a35');
  doc.text('Scan at Venue Entrance', cx - ibW / 2, currentY, { width: ibW, align: 'center' });
}
