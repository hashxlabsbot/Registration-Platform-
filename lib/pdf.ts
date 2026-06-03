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

// ── Constants ─────────────────────────────────────────────────────────────────
const W = 288;   // 4 inches — standard conference badge width
const H = 440;   // ~6.1 inches — standard badge height

const DARK_GREEN  = '#0f2e14';
const MID_GREEN   = '#2e7d32';
const GOLD        = '#c8a96e';
const WHITE       = '#ffffff';
const OFF_WHITE   = '#f4f7f0';
const GRAY        = '#888888';
const LIGHT_GRAY  = '#cccccc';

// Colour per registration type (for the badge pill)
function typeAccent(regType: string): { bg: string; text: string } {
  if (regType.includes('IIA Member') && !regType.includes('Non')) return { bg: '#1a4a1a', text: '#c8a96e' };
  if (regType.includes('Non-IIA'))    return { bg: '#1a2a4a', text: '#93c5fd' };
  if (regType.includes('Spouse'))     return { bg: '#2d1a4a', text: '#d8b4fe' };
  if (regType.includes('Non-Arch'))   return { bg: '#4a2a0a', text: '#fbbf24' };
  if (regType.includes('Special'))    return { bg: '#3d2e0a', text: '#c8a96e' };
  return { bg: '#1a4a1a', text: '#c8a96e' };
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function generateTicketPDF(ticket: TicketData): Promise<Buffer> {

  // 1. Load IIA logo → PNG
  let logoPng: Buffer | null = null;
  try {
    const svgBuf = fs.readFileSync(path.join(process.cwd(), 'public', 'IIA-Logo.svg'));
    logoPng = await sharp(svgBuf)
      .resize(140, 140, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
  } catch { /* logo unavailable — continue */ }

  // 2. Generate QR code
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
    width: 300, margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: DARK_GREEN, light: WHITE },
  });

  // 3. Render PDF
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [W, H], margin: 0 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    drawCard(doc, ticket, logoPng, qrBuf);

    doc.end();
  });
}

// ── Card drawing ──────────────────────────────────────────────────────────────
function drawCard(
  doc: InstanceType<typeof PDFDocument>,
  ticket: TicketData,
  logoPng: Buffer | null,
  qrBuf: Buffer,
) {
  const cx = W / 2; // center x

  // ────────────────────────────────────────────────────────────────────────────
  // SECTION 1 — Dark green header  (y: 0 → 168)
  // ────────────────────────────────────────────────────────────────────────────
  const HEADER_H = 168;
  doc.rect(0, 0, W, HEADER_H).fill(DARK_GREEN);

  // Subtle dot grid texture
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 16; col++) {
      doc.circle(col * 19 + 9, row * 19 + 9, 0.8).fill('rgba(200,169,110,0.08)');
    }
  }

  // Gold top border stripe
  doc.rect(0, 0, W, 3).fill(GOLD);

  // IIA Logo — centered at top
  if (logoPng) {
    const logoSize = 48;
    doc.image(logoPng, cx - logoSize / 2, 12, { width: logoSize, height: logoSize });
  } else {
    doc.fillColor(GOLD).fontSize(10).font('Helvetica-Bold')
      .text('IIA', 0, 28, { width: W, align: 'center' });
  }

  // Thin gold rule below logo
  doc.moveTo(cx - 40, 64).lineTo(cx + 40, 64)
    .strokeColor(GOLD).lineWidth(0.5).opacity(0.5).stroke().opacity(1);

  // "PRAKRITI" — large decorative gold lettering
  doc.fillColor(GOLD).fontSize(34).font('Helvetica-Bold')
    .text('PRAKRITI', 0, 70, { width: W, align: 'center', characterSpacing: 4 });

  // "2026" — white, below
  doc.fillColor(WHITE).fontSize(15).font('Helvetica-Bold')
    .text('2026', 0, 106, { width: W, align: 'center', characterSpacing: 6 });

  // Subtitle
  doc.fillColor(GOLD).fontSize(5.5).font('Helvetica')
    .text('ARCHITECTS FOR A SUSTAINABLE TOMORROW', 0, 124, {
      width: W, align: 'center', characterSpacing: 1.2,
    });

  // Gold ornamental rule at bottom of header
  doc.moveTo(24, 144).lineTo(W - 24, 144)
    .strokeColor(GOLD).lineWidth(0.4).opacity(0.4).stroke().opacity(1);

  doc.fillColor(MID_GREEN).fontSize(5.5).font('Helvetica')
    .text('INDIAN INSTITUTE OF ARCHITECTS — FARIDABAD CENTRE', 0, 150, {
      width: W, align: 'center', characterSpacing: 0.6,
    });

  // ────────────────────────────────────────────────────────────────────────────
  // SECTION 2 — Attendee details  (y: 168 → 300)
  // ────────────────────────────────────────────────────────────────────────────
  doc.rect(0, HEADER_H, W, 132).fill(WHITE);

  const bodyY = HEADER_H + 18;
  const PAD   = 22;

  // "REGISTERED ATTENDEE" label
  doc.fillColor(LIGHT_GRAY).fontSize(6).font('Helvetica')
    .text('REGISTERED ATTENDEE', PAD, bodyY, { characterSpacing: 1.5 });

  // Name — large and bold
  const name = ticket.name.toUpperCase();
  const nameFontSize = name.length > 22 ? 16 : 19;
  doc.fillColor(DARK_GREEN).fontSize(nameFontSize).font('Helvetica-Bold')
    .text(name, PAD, bodyY + 9, { width: W - PAD * 2 });

  // Designation
  const desig = ticket.designation && ticket.designation !== '—' ? ticket.designation : '';
  const org   = ticket.organization && ticket.organization !== '—' ? ticket.organization : '';
  const desigLine = [desig, org].filter(Boolean).join('  ·  ');

  let detailY = bodyY + 9 + nameFontSize + 4;
  if (desigLine) {
    doc.fillColor(GRAY).fontSize(8).font('Helvetica')
      .text(desigLine, PAD, detailY, { width: W - PAD * 2 });
    detailY += 13;
  }

  // Thin rule
  doc.moveTo(PAD, detailY + 4).lineTo(W - PAD, detailY + 4)
    .strokeColor('#e0e0e0').lineWidth(0.5).stroke();

  // Registration type badge
  const accent  = typeAccent(ticket.registrationType);
  const typeLabel = ticket.registrationType.toUpperCase();
  const badgeY  = detailY + 12;
  const badgeW  = Math.min(W - PAD * 2, typeLabel.length * 5.2 + 20);

  doc.roundedRect(PAD, badgeY, badgeW, 16, 3).fill(accent.bg);
  doc.fillColor(accent.text).fontSize(6.5).font('Helvetica-Bold')
    .text(typeLabel, PAD, badgeY + 5, { width: badgeW, align: 'center', characterSpacing: 0.8 });

  // Amount (right-aligned)
  if (ticket.totalAmount > 0) {
    doc.fillColor(DARK_GREEN).fontSize(8).font('Helvetica-Bold')
      .text(`Rs. ${ticket.totalAmount.toLocaleString('en-IN')}`, PAD + badgeW + 8, badgeY + 4);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // SECTION 3 — QR code  (y: 300 → 408)
  // ────────────────────────────────────────────────────────────────────────────
  const QR_TOP = HEADER_H + 132;
  const QR_H   = H - QR_TOP - 32;

  doc.rect(0, QR_TOP, W, QR_H + 32).fill(OFF_WHITE);

  // Dashed top border
  doc.moveTo(0, QR_TOP).lineTo(W, QR_TOP)
    .dash(3, { space: 3 }).strokeColor(LIGHT_GRAY).lineWidth(0.6).stroke().undash();

  // "ENTRY PASS" label
  doc.fillColor(GRAY).fontSize(6).font('Helvetica')
    .text('ENTRY PASS — SCAN AT VENUE ENTRANCE', 0, QR_TOP + 10, {
      width: W, align: 'center', characterSpacing: 1.2,
    });

  // QR code — centered, large
  const qrSize = 108;
  const qrX    = cx - qrSize / 2;
  const qrY    = QR_TOP + 22;

  // White background + subtle shadow via rounded rect
  doc.roundedRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, 4)
    .fill(WHITE);
  doc.image(qrBuf, qrX, qrY, { width: qrSize, height: qrSize });

  // Corner accents
  const ca = (x: number, y: number, dx: number, dy: number) =>
    doc.moveTo(x, y + dy).lineTo(x, y).lineTo(x + dx, y)
      .strokeColor(GOLD).lineWidth(1.2).stroke();
  ca(qrX - 5, qrY - 5,  10,  10);
  ca(qrX + qrSize + 5, qrY - 5,  -10,  10);
  ca(qrX - 5, qrY + qrSize + 5,  10, -10);
  ca(qrX + qrSize + 5, qrY + qrSize + 5, -10, -10);

  // Booking ID below QR
  doc.fillColor(GRAY).fontSize(5.5).font('Helvetica')
    .text('BOOKING ID', 0, qrY + qrSize + 14, { width: W, align: 'center', characterSpacing: 1.5 });
  doc.fillColor(DARK_GREEN).fontSize(9.5).font('Helvetica-Bold')
    .text(ticket.bookingId, 0, qrY + qrSize + 22, { width: W, align: 'center', characterSpacing: 2 });

  // ────────────────────────────────────────────────────────────────────────────
  // SECTION 4 — Footer stripe  (y: H-32 → H)
  // ────────────────────────────────────────────────────────────────────────────
  doc.rect(0, H - 32, W, 32).fill(DARK_GREEN);

  // Gold top border on footer
  doc.rect(0, H - 32, W, 1.5).fill(GOLD);

  doc.fillColor(GOLD).fontSize(6.5).font('Helvetica-Bold')
    .text('20 JUNE 2026', 0, H - 23, { width: W, align: 'center', characterSpacing: 1 });
  doc.fillColor(MID_GREEN).fontSize(5.5).font('Helvetica')
    .text('SAFFRON HALL, VARDAAN GROUP, FARIDABAD', 0, H - 13, {
      width: W, align: 'center', characterSpacing: 0.5,
    });
}
