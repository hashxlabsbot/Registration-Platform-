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

// W stays at 288pt; H is slightly taller than the image's natural ratio so
// the white zone has comfortable room for all rows + QR.
// Background is stretched ~11 % vertically — imperceptible for a decorative image.
const W = 288;
const H = 430;

// White zone boundaries (scaled from original 1083×1453 image → H=430)
const ZONE_TOP    = Math.round(H * 300  / 1453);   //  89 — header/branding ends
const ZONE_BOTTOM = Math.round(H * 1090 / 1453);   // 322 — dark footer begins

const DARK_GREEN = '#0f2e14';
const GOLD       = '#c8a96e';
const WHITE      = '#ffffff';
const GRAY       = '#444444';

// ── Icon drawing ──────────────────────────────────────────────────────────────
type IconType = 'person' | 'tag' | 'cert' | 'id';

function drawIcon(
  doc: InstanceType<typeof PDFDocument>,
  cx: number, cy: number, r: number,
  type: IconType,
) {
  // White ring — makes icon pop against the dark left-side building
  doc.circle(cx, cy, r + 2.5).fill(WHITE);
  // Dark green fill
  doc.circle(cx, cy, r).fill(DARK_GREEN);

  doc.save();
  doc.circle(cx, cy, r - 0.5).clip();

  switch (type) {
    case 'person':
      doc.circle(cx, cy - r * 0.22, r * 0.28).fill(WHITE);
      doc.moveTo(cx - r * 0.55, cy + r)
         .lineTo(cx - r * 0.55, cy + r * 0.14)
         .quadraticCurveTo(cx - r * 0.52, cy + r * 0.01, cx - r * 0.2, cy + r * 0.01)
         .lineTo(cx + r * 0.2,  cy + r * 0.01)
         .quadraticCurveTo(cx + r * 0.52, cy + r * 0.01, cx + r * 0.55, cy + r * 0.14)
         .lineTo(cx + r * 0.55, cy + r)
         .fill(WHITE);
      break;

    case 'tag': {
      const bW = r * 0.90, bH = r * 1.12;
      const bX = cx - bW / 2, bY = cy - bH * 0.47;
      doc.roundedRect(bX, bY, bW, bH, 1.5).fill(WHITE);
      doc.circle(cx, bY + 0.5, r * 0.11).fill(DARK_GREEN);
      doc.rect(bX + bW * 0.12, bY + bH * 0.30, bW * 0.76, r * 0.12).fill(DARK_GREEN);
      doc.rect(bX + bW * 0.18, bY + bH * 0.54, bW * 0.64, r * 0.09).fill(DARK_GREEN);
      doc.rect(bX + bW * 0.18, bY + bH * 0.70, bW * 0.50, r * 0.09).fill(DARK_GREEN);
      break;
    }

    case 'cert': {
      const outerR = r * 0.66, innerR = r * 0.28;
      const a0 = -Math.PI / 2, step = (2 * Math.PI) / 5;
      let first = true;
      for (let i = 0; i < 5; i++) {
        const oa = a0 + i * step, ia = oa + step / 2;
        const ox = cx + outerR * Math.cos(oa), oy = cy + outerR * Math.sin(oa);
        const ix = cx + innerR * Math.cos(ia), iy = cy + innerR * Math.sin(ia);
        if (first) { doc.moveTo(ox, oy); first = false; } else doc.lineTo(ox, oy);
        doc.lineTo(ix, iy);
      }
      doc.closePath().fill(WHITE);
      break;
    }

    case 'id': {
      const cW = r * 1.55, cH = r * 0.98;
      const cX = cx - cW / 2, cY = cy - cH / 2;
      doc.roundedRect(cX, cY, cW, cH, 1.5).fill(WHITE);
      const pS = r * 0.38, pX = cX + r * 0.1, pY = cY + (cH - pS) / 2;
      doc.rect(pX, pY, pS, pS).fill(DARK_GREEN);
      const lX = pX + pS + r * 0.1, lW = cW - (lX - cX) - r * 0.1;
      doc.rect(lX, cY + cH * 0.20, lW,        r * 0.11).fill(DARK_GREEN);
      doc.rect(lX, cY + cH * 0.46, lW * 0.80, r * 0.09).fill(DARK_GREEN);
      doc.rect(lX, cY + cH * 0.67, lW * 0.60, r * 0.09).fill(DARK_GREEN);
      break;
    }
  }

  doc.restore();
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function generateTicketPDF(ticket: TicketData): Promise<Buffer> {
  let bgBuf: Buffer | null = null;
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'public', 'Id-background.png'));
    bgBuf = await sharp(raw).resize(W, H, { fit: 'fill' }).png().toBuffer();
  } catch { /* proceed without background */ }

  const qrPayload = JSON.stringify({
    id: ticket.bookingId, name: ticket.name, type: ticket.registrationType,
    amt: `Rs.${ticket.totalAmount}`, ph: ticket.phone, em: ticket.email,
    ev: 'PRAKRITI2026', dt: '20-06-2026',
  });
  const qrBuf = await QRCode.toBuffer(qrPayload, {
    width: 300, margin: 1, errorCorrectionLevel: 'M',
    color: { dark: DARK_GREEN, light: WHITE },
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [W, H], margin: 0 });
    const chunks: Buffer[] = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    drawCard(doc, ticket, bgBuf, qrBuf);
    doc.end();
  });
}

// ── Card ──────────────────────────────────────────────────────────────────────
function drawCard(
  doc: InstanceType<typeof PDFDocument>,
  ticket: TicketData,
  bgBuf: Buffer | null,
  qrBuf: Buffer,
) {
  const cx     = W / 2;
  const ICON_R = 10;
  const ICON_X = 20;
  const TEXT_X = ICON_X + ICON_R + 2.5 + 6;   // right of white ring + gap = 38.5
  const PAD_R  = 14;
  const ROW_H  = 27;

  // ── Background — fully visible, no overlays ────────────────────────────────
  if (bgBuf) doc.image(bgBuf, 0, 0, { width: W, height: H });
  else       doc.rect(0, 0, W, H).fill(WHITE);

  // ── Rows — vertically centred in the white zone ────────────────────────────
  const qrSz     = 64;
  const qrCardH  = qrSz + 5 * 2;                             // 74
  const totalH   = ROW_H * 4 + qrCardH + 10;                 // 192
  const topPad   = Math.round((ZONE_BOTTOM - ZONE_TOP - totalH) / 2);  // ~21

  let y = ZONE_TOP + topPad;   // ≈ 110

  const drawRow = (icon: IconType, label: string, value: string, highlighted: boolean) => {
    const iconCY = y + ROW_H / 2;
    drawIcon(doc, ICON_X, iconCY, ICON_R, icon);

    if (highlighted) {
      doc.roundedRect(TEXT_X - 3, y + 2, W - TEXT_X - PAD_R + 3, ROW_H - 4, 3)
         .fill(DARK_GREEN);
      doc.fillColor(GOLD).fontSize(5.5).font('Helvetica')
         .text(label, TEXT_X + 2, y + 5, { characterSpacing: 0.8 });
      const fs = value.length > 26 ? 9 : value.length > 20 ? 10.5 : 12;
      doc.fillColor(WHITE).fontSize(fs).font('Helvetica-Bold')
         .text(value, TEXT_X + 2, y + 13, { width: W - TEXT_X - PAD_R - 4 });
    } else {
      doc.fillColor(GRAY).fontSize(5.5).font('Helvetica')
         .text(label, TEXT_X, y + 4, { characterSpacing: 0.8 });
      const fs = value.length > 24 ? 10 : value.length > 18 ? 11.5 : 13;
      doc.fillColor(DARK_GREEN).fontSize(fs).font('Helvetica-Bold')
         .text(value, TEXT_X, y + 13, { width: W - TEXT_X - PAD_R });
    }

    // Thin separator
    doc.moveTo(TEXT_X, y + ROW_H + 1).lineTo(W - PAD_R, y + ROW_H + 1)
       .strokeColor('#cccccc').lineWidth(0.4).stroke();

    y += ROW_H + 3;
  };

  const desig = ticket.designation && ticket.designation !== '—'
    ? ticket.designation.toUpperCase() : '—';

  drawRow('person', 'NAME OF ATTENDEE',  ticket.name.toUpperCase(),             false);
  drawRow('tag',    'DESIGNATION',       desig,                                  false);
  drawRow('cert',   'REGISTRATION TYPE', ticket.registrationType.toUpperCase(), true);
  drawRow('id',     'REGISTRATION ID',   ticket.bookingId,                      false);

  y += 8;

  // ── QR code ────────────────────────────────────────────────────────────────
  const qrCardX = cx - (qrSz + 10) / 2;
  doc.roundedRect(qrCardX, y, qrSz + 10, qrCardH, 5).fill(WHITE);
  doc.roundedRect(qrCardX, y, qrSz + 10, qrCardH, 5)
     .strokeColor(GOLD).lineWidth(0.6).stroke();
  doc.image(qrBuf, qrCardX + 5, y + 5, { width: qrSz, height: qrSz });
}
