import PDFDocument from 'pdfkit';
import QRCode      from 'qrcode';
import path        from 'path';
import fs          from 'fs';
import { FALLBACK_LAYOUT, TicketLayout } from './gemini-layout';

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
// 3.5" × 5" at 72pt/in = 252 × 360 logical; ×2 for high-DPI
const SCALE = 2;
const LW    = 252;
const LH    = 360;
const W     = LW * SCALE;   // 504 pt physical
const H     = LH * SCALE;   // 720 pt physical

const DARK_GREEN = '#0f2e14';
const WHITE      = '#ffffff';

// ── Helpers ──────────────────────────────────────────────────────────────────
function footerLabel(registrationType: string): string {
  if (registrationType === 'Architect - IIA Member' || registrationType === 'Architect - Non-IIA Member') return 'ARCHITECT';
  if (registrationType === 'Non-Architect' || registrationType === 'Non - Architect') return 'DELEGATE';
  return registrationType.toUpperCase();
}

function isArchitect(registrationType: string): boolean {
  return registrationType === 'Architect - IIA Member' || registrationType === 'Architect - Non-IIA Member';
}

// ── Main export ──────────────────────────────────────────────────────────────
export async function generateTicketPDF(ticket: TicketData): Promise<Buffer> {

  // 1. Load background image (no sharp — pdfkit scales it natively)
  const bgPath = path.join(process.cwd(), 'public', 'Id-background.png');
  let bgBuffer: Buffer | null = null;
  try {
    bgBuffer = fs.readFileSync(bgPath);
  } catch {
    /* proceed without background */
  }

  // 2. Layout
  const layout: TicketLayout = FALLBACK_LAYOUT;

  // 3. Generate QR code as PNG buffer (pdfkit will scale it to qrCode.size)
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

  const qrBuf = await QRCode.toBuffer(qrPayload, {
    width:                layout.qrCode.size * 2,   // 2× for crispness; pdfkit scales it down
    margin:               1,
    errorCorrectionLevel: 'M',
    color: { dark: DARK_GREEN, light: WHITE },
  });

  // 4. Build PDF
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [W, H], margin: 0 });
    const chunks: Buffer[] = [];
    doc.on('data',  c  => chunks.push(c));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    drawTextLayer(doc, ticket, bgBuffer, qrBuf, layout);
    doc.end();
  });
}

// ── Text layer (PDFKit only — no sharp) ──────────────────────────────────────
function drawTextLayer(
  doc:     InstanceType<typeof PDFDocument>,
  ticket:  TicketData,
  bgBuf:   Buffer | null,
  qrBuf:   Buffer,
  layout:  TicketLayout,
) {
  const cx  = W / 2;
  const ibW = layout.name.maxWidth;

  // ── Background ───────────────────────────────────────────────────────────────
  if (bgBuf) doc.image(bgBuf, 0, 0, { width: W, height: H });
  else       doc.rect(0, 0, W, H).fill(WHITE);

  // ── 1. Date + Venue bar ──────────────────────────────────────────────────────
  const mainSz = 14;
  const supSz  = 8;
  const venue  = 'FARIDABAD';
  const barH   = 34;
  const barY   = Math.round(H / 2 - barH / 2);

  doc.rect(0, barY, W, barH).fill('#1a5c2a');
  doc.font('Helvetica-Bold');

  const gap = 20;
  doc.font('Helvetica-Bold').fontSize(mainSz);
  const w20    = doc.widthOfString('20');
  const wJune  = doc.widthOfString(' JUNE, 2026');
  const wVenue = venue ? doc.widthOfString(venue) : 0;
  doc.fontSize(supSz);
  const wTH    = doc.widthOfString('TH');

  const totalW = w20 + wTH + wJune + (venue ? gap + wVenue : 0);
  const bx     = (W - totalW) / 2;
  const mainY  = barY + (barH - mainSz) / 2 - 1;

  doc.fontSize(mainSz).fillColor('#ffffff');
  doc.text('20', bx, mainY, { lineBreak: false });
  doc.fontSize(supSz);
  doc.text('TH', bx + w20, mainY - 4, { lineBreak: false });
  doc.fontSize(mainSz);
  doc.text(' JUNE, 2026', bx + w20 + wTH, mainY, { lineBreak: false });
  if (venue) {
    doc.text(venue, bx + w20 + wTH + wJune + gap, mainY, { lineBreak: false });
  }

  // ── 2. Name ──────────────────────────────────────────────────────────────────
  const namePrefix = isArchitect(ticket.registrationType) ? 'AR. ' : '';
  const nameText   = (namePrefix + ticket.name).toUpperCase();
  doc.font('Times-Bold')
     .fontSize(layout.name.fontSize)
     .fillColor(layout.name.color);

  const nameWidth = doc.widthOfString(nameText);
  if (nameWidth > ibW) doc.fontSize(layout.name.fontSize * (ibW / nameWidth));
  doc.text(nameText, cx - ibW / 2, layout.name.y, { width: ibW, align: 'center' });

  // ── 3. Divider ───────────────────────────────────────────────────────────────
  if (layout.divider) {
    const { x1, y, x2 } = layout.divider;
    doc.moveTo(x1, y).lineTo(x2, y)
       .lineWidth(1)
       .strokeColor('#a5d6a7')
       .strokeOpacity(0.7)
       .stroke();
    doc.strokeOpacity(1);
  }

  // ── 4. Designation ───────────────────────────────────────────────────────────
  const desig = ticket.designation && ticket.designation !== '—' ? ticket.designation : '';
  if (desig) {
    doc.font('Helvetica-Bold')
       .fontSize(layout.designation.fontSize)
       .fillColor(layout.designation.color);
    doc.text(desig.toUpperCase(), cx - ibW / 2, layout.designation.y, { width: ibW, align: 'center' });
  }

  // ── 5. Firm name ─────────────────────────────────────────────────────────────
  const org = ticket.organization && ticket.organization !== '—' ? ticket.organization : '';
  if (org) {
    const firmY   = layout.firm?.y        ?? layout.designation.y + 22;
    const firmSz  = layout.firm?.fontSize ?? 12;
    const firmCol = layout.firm?.color    ?? '#2d6a3f';
    doc.font('Helvetica')
       .fontSize(firmSz)
       .fillColor(firmCol);
    doc.text(org.toUpperCase(), cx - ibW / 2, firmY, { width: ibW, align: 'center' });
  }

  // ── 6. QR white border box + QR image (pdfkit rects — no sharp needed) ───────
  const qrX      = Math.round(layout.qrCode.x);
  const qrY      = Math.round(layout.qrCode.y);
  const qrSize   = layout.qrCode.size;
  const borderPad = Math.round(2 * SCALE);

  doc.rect(qrX - borderPad, qrY - borderPad, qrSize + borderPad * 2, qrSize + borderPad * 2)
     .fill(WHITE);

  doc.image(qrBuf, qrX, qrY, { width: qrSize, height: qrSize });

  // ── 7. QR label ──────────────────────────────────────────────────────────────
  const qrBottom = qrY + qrSize + 5;
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#2d5a35');
  doc.text('SCAN AT VENUE ENTRANCE', cx - ibW / 2, qrBottom, { width: ibW, align: 'center' });

  // ── 8. Footer bar ─────────────────────────────────────────────────────────────
  const footerY = layout.regType.y;
  const footerH = H - footerY;
  const label   = footerLabel(ticket.registrationType);
  doc.rect(0, footerY, W, footerH).fill('#1a5c2a');
  doc.font('Helvetica-Bold')
     .fontSize(layout.regType.fontSize)
     .fillColor('#ffffff');
  const labelY = footerY + (footerH - layout.regType.fontSize) / 2 - 2;
  doc.text(label, 0, labelY, { width: W, align: 'center', characterSpacing: 2 });
}
