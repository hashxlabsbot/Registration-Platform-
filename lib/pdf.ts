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
  const cx = W / 2;

  // ── Background ────────────────────────────────
  if (bgBuf) doc.image(bgBuf, 0, 0, { width: W, height: H });
  else       doc.rect(0, 0, W, H).fill(WHITE);

  // ── Layout math ────────────────────────────────
  const ibW = 178;
  const startY = 160; 
  
  let currentY = startY;

  // 1. Name (.nm)
  doc.font('Times-Bold').fontSize(16).fillColor('#1a3d21');
  const nameText = ticket.name.toUpperCase();
  const nameWidth = doc.widthOfString(nameText);
  if (nameWidth > ibW) {
    doc.fontSize(16 * (ibW / nameWidth)); // scale down
  }
  doc.text(nameText, cx - ibW / 2, currentY, { width: ibW, align: 'center' });
  currentY += doc.heightOfString(nameText) + 4;

  // 2. Divider (.divider)
  const divW = ibW * 0.82;
  doc.moveTo(cx - divW / 2, currentY)
     .lineTo(cx + divW / 2, currentY)
     .lineWidth(1.5).strokeColor('#a5d6a7').strokeOpacity(0.7).stroke();
  doc.strokeOpacity(1); // reset
  currentY += 6;

  // 3. Designation (.dg)
  const desig = ticket.designation && ticket.designation !== '—' ? ticket.designation : ticket.organization;
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#1a5c2a');
  doc.text(desig, cx - ibW / 2, currentY, { width: ibW, align: 'center' });
  currentY += doc.heightOfString(desig) + 6;

  // 4. Badges (.bd)
  doc.fontSize(7).font('Helvetica-Bold');
  const typeText = ticket.registrationType.toUpperCase();
  const idText = ticket.bookingId;
  
  const b1W = doc.widthOfString(typeText) + 12;
  const b2W = doc.widthOfString(idText) + 12;
  const gap = 4;
  const totalBdW = b1W + b2W + gap;
  const bdStartX = cx - totalBdW / 2;
  
  // Draw b1
  doc.roundedRect(bdStartX, currentY, b1W, 12, 3).fill('#1a5c2a');
  doc.fillColor('#ffffff').text(typeText, bdStartX + 6, currentY + 3);
  
  // Draw b2
  const b2X = bdStartX + b1W + gap;
  doc.roundedRect(b2X, currentY, b2W, 12, 3).fillOpacity(0.85).fill('#e8f5e9');
  doc.fillOpacity(1); // reset
  doc.roundedRect(b2X, currentY, b2W, 12, 3).lineWidth(0.5).strokeColor('#a5d6a7').stroke();
  doc.fillColor('#1b5e20').text(idText, b2X + 6, currentY + 3.5);
  
  currentY += 12 + 10;

  // 5. QR Code Area (.qs)
  const qrSz = 60;
  const qrX = cx - qrSz / 2;
  
  // Canvas border
  doc.roundedRect(qrX - 1, currentY - 1, qrSz + 2, qrSz + 2, 4)
     .lineWidth(1.5).strokeColor('#a5d6a7').strokeOpacity(0.8).stroke();
  doc.strokeOpacity(1);
  
  doc.image(qrBuf, qrX, currentY, { width: qrSz, height: qrSz });
  currentY += qrSz + 6;
  
  // QR Label (.ql)
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#2d5a35');
  doc.text("Scan at Venue Entrance", cx - ibW / 2, currentY, { width: ibW, align: 'center' });
}
