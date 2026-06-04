import PDFDocument from 'pdfkit';
import QRCode      from 'qrcode';
import sharp       from 'sharp';
import path        from 'path';
import fs          from 'fs';
import { analyzeBackgroundLayout, FALLBACK_LAYOUT, TicketLayout } from './gemini-layout';

// ── Ticket data shape ────────────────────────────────────────────────────────
export interface TicketData {
  bookingId:        string;
  name:             string;
  email:            string;
  phone:            string;
  organization:     string;
  designation:      string;
  registrationType: string;
  totalAmount:      number;
  utrNumber?:       string;
  eventName:        string;
  eventSubtitle:    string;
  eventDate:        string;
  eventVenue:       string;
  organizer:        string;
}

// ── Page dimensions (2× for high-DPI) ───────────────────────────────────────
const SCALE = 2;
const LW    = 288;   // logical width  (pt)
const LH    = 430;   // logical height (pt)
const W     = LW * SCALE;   // 576 pt physical
const H     = LH * SCALE;   // 860 pt physical

const DARK_GREEN = '#0f2e14';
const WHITE      = '#ffffff';

// ── Helpers ──────────────────────────────────────────────────────────────────
function displayRegType(registrationType: string): string {
  return registrationType === 'Non-Architect' || registrationType === 'Non - Architect'
    ? 'Delegate'
    : registrationType;
}

// ── Main export ──────────────────────────────────────────────────────────────
export async function generateTicketPDF(ticket: TicketData): Promise<Buffer> {

  // 1. Load background & get base64 for Gemini
  const bgPath = path.join(process.cwd(), 'public', 'Id-background.png');
  let bgBase64 = '';
  let bgResized: Buffer | null = null;

  try {
    const raw = fs.readFileSync(bgPath);
    bgResized = await sharp(raw)
      .resize(W, H, { fit: 'fill', kernel: 'lanczos3' })
      .png({ compressionLevel: 0 })
      .toBuffer();
    bgBase64 = bgResized.toString('base64');
  } catch {
    /* proceed without background */
  }

  // 2. Get AI layout (Gemini analyses the background image)
  const layout: TicketLayout = bgBase64
    ? await analyzeBackgroundLayout(bgBase64)
    : FALLBACK_LAYOUT;

  // 3. Generate QR code as sharp-resized PNG
  const qrSize = layout.qrCode.size;
  const qrPayload = JSON.stringify({
    id:   ticket.bookingId,
    name: ticket.name,
    type: ticket.registrationType,
    amt:  `Rs.${ticket.totalAmount}`,
    ph:   ticket.phone,
    em:   ticket.email,
    ev:   'PRAKRITI2026',
    dt:   '20-06-2026',
  });

  const qrRaw = await QRCode.toBuffer(qrPayload, {
    width: qrSize * 4,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: DARK_GREEN, light: WHITE },
  });
  const qrBuf = await sharp(qrRaw)
    .resize(qrSize, qrSize, { kernel: 'lanczos3' })
    .png({ compressionLevel: 0 })
    .toBuffer();

  // 4. Composite: background + QR border box + QR code using sharp
  let compositedBg: Buffer | null = bgResized;
  if (bgResized) {
    // Draw a white border around QR then overlay the QR image
    const borderPad = Math.round(2 * SCALE);
    const borderSize = qrSize + borderPad * 2;

    // Create white border tile
    const borderBox = await sharp({
      create: { width: borderSize, height: borderSize, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
    }).png().toBuffer();

    compositedBg = await sharp(bgResized)
      .composite([
        // White border box
        {
          input:  borderBox,
          left:   Math.round(layout.qrCode.x) - borderPad,
          top:    Math.round(layout.qrCode.y) - borderPad,
        },
        // QR code on top of white box
        {
          input: qrBuf,
          left:  Math.round(layout.qrCode.x),
          top:   Math.round(layout.qrCode.y),
        },
      ])
      .png({ compressionLevel: 0 })
      .toBuffer();
  }

  // 5. Use PDFKit to draw text and capsule elements on top of the composited image
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [W, H], margin: 0 });
    const chunks: Buffer[] = [];
    doc.on('data',  c  => chunks.push(c));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    drawTextLayer(doc, ticket, compositedBg, layout);
    doc.end();
  });
}

// ── Text & capsule layer (PDFKit) ────────────────────────────────────────────
function drawTextLayer(
  doc:     InstanceType<typeof PDFDocument>,
  ticket:  TicketData,
  bgBuf:   Buffer | null,
  layout:  TicketLayout,
) {
  const cx    = W / 2;
  const ibW   = layout.name.maxWidth;

  // ── Background (composited: bg + QR already baked in) ──────────────────────
  if (bgBuf) doc.image(bgBuf, 0, 0, { width: W, height: H });
  else       doc.rect(0, 0, W, H).fill(WHITE);

  // ── 1. Name ─────────────────────────────────────────────────────────────────
  const nameText = ticket.name.toUpperCase();
  doc.font('Times-Bold')
     .fontSize(layout.name.fontSize)
     .fillColor(layout.name.color);

  // Auto-shrink if too wide
  const nameWidth = doc.widthOfString(nameText);
  if (nameWidth > ibW) {
    doc.fontSize(layout.name.fontSize * (ibW / nameWidth));
  }
  doc.text(nameText, cx - ibW / 2, layout.name.y, { width: ibW, align: 'center' });

  // ── 2. Divider ──────────────────────────────────────────────────────────────
  if (layout.divider) {
    const { x1, y, x2 } = layout.divider;
    doc.moveTo(x1, y).lineTo(x2, y)
       .lineWidth(1.5 * SCALE)
       .strokeColor('#a5d6a7')
       .strokeOpacity(0.7)
       .stroke();
    doc.strokeOpacity(1);
  }

  // ── 3. Designation / Organisation ──────────────────────────────────────────
  const desig = ticket.designation && ticket.designation !== '—'
    ? ticket.designation
    : ticket.organization;
  doc.font('Helvetica-Bold')
     .fontSize(layout.designation.fontSize)
     .fillColor(layout.designation.color);
  doc.text(desig, cx - ibW / 2, layout.designation.y, { width: ibW, align: 'center' });

  // ── 4. Booking ID badge (light-green pill) ──────────────────────────────────
  doc.fontSize(layout.bookingId.fontSize).font('Helvetica-Bold');
  const idText = ticket.bookingId;
  const badgeW = doc.widthOfString(idText) + 12 * SCALE;
  const badgeH = 12 * SCALE;
  const badgeX = cx - badgeW / 2;
  const badgeY = layout.bookingId.y;

  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 3 * SCALE)
     .fillOpacity(0.85).fill('#e8f5e9');
  doc.fillOpacity(1);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 3 * SCALE)
     .lineWidth(0.5 * SCALE).strokeColor('#a5d6a7').stroke();
  doc.fillColor('#1b5e20')
     .text(idText, badgeX + 6 * SCALE, badgeY + 3.5 * SCALE);

  // ── 5. QR label (below QR) ──────────────────────────────────────────────────
  const qrBottom = layout.qrCode.y + layout.qrCode.size + 6 * SCALE;
  doc.fontSize(7 * SCALE).font('Helvetica-Bold').fillColor('#2d5a35');
  doc.text('Scan at Venue Entrance', cx - ibW / 2, qrBottom, { width: ibW, align: 'center' });

  // ── 6. Registration type capsule (dark-green pill, below QR label) ──────────
  const regLabel  = displayRegType(ticket.registrationType).toUpperCase();
  const capsuleY  = qrBottom + doc.heightOfString('Scan at Venue Entrance', { width: ibW }) + 6 * SCALE;

  doc.fontSize(13 * SCALE).font('Helvetica-Bold');
  const capW = Math.min(doc.widthOfString(regLabel) + 28 * SCALE, ibW);
  const capH = 18 * SCALE;
  const capX = cx - capW / 2;

  doc.roundedRect(capX, capsuleY, capW, capH, capH / 2).fill('#1a5c2a');
  doc.fillColor('#ffffff')
     .text(regLabel, capX + 14 * SCALE, capsuleY + 4 * SCALE, {
       width: capW - 28 * SCALE,
       align: 'center',
     });
}
