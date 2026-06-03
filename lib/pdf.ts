import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

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

const DARK_GREEN  = '#1a4a1a';
const MID_GREEN   = '#2e7d32';
const LIGHT_GREEN = '#a5d6a7';
const PALE_GREEN  = '#f1f8f1';
const GOLD        = '#c8a96e';
const WHITE       = '#ffffff';
const GRAY        = '#666666';
const DARK_TEXT   = '#1a1a1a';

export async function generateTicketPDF(ticket: TicketData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: [595, 420], margin: 0 });
    const chunks: Buffer[] = [];

    doc.on('data', (c) => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = 595;
    const H = 420;

    // ── Background ───────────────────────────────────────────────────────────
    doc.rect(0, 0, W, H).fill('#f8fdf4');

    // ── LEFT dark-green panel ────────────────────────────────────────────────
    const LEFT_W = 210;
    doc.rect(0, 0, LEFT_W, H).fill(DARK_GREEN);

    // Dot pattern
    for (let row = 0; row < 25; row++) {
      for (let col = 0; col < 12; col++) {
        doc.circle(col * 18 + 9, row * 18 + 9, 1).fill('rgba(200,169,110,0.10)');
      }
    }

    // ── QR Code — full attendee details ──────────────────────────────────────
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
      width: 140,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: DARK_GREEN, light: WHITE },
    });

    const qrX = 35;
    const qrY = 50;
    doc.roundedRect(qrX - 8, qrY - 8, 156, 156, 6).fill(WHITE);
    doc.image(qrBuf, qrX, qrY, { width: 140 });

    // Corner accents
    const ca = (x: number, y: number, d1: number, d2: number) => {
      doc.moveTo(x, y + d1).lineTo(x, y).lineTo(x + d2, y)
        .strokeColor(GOLD).lineWidth(1.5).stroke();
    };
    ca(qrX - 8, qrY - 8,  12,  12);
    ca(qrX + 148, qrY - 8,  12, -12);
    ca(qrX - 8, qrY + 148, -12,  12);
    ca(qrX + 148, qrY + 148, -12, -12);

    doc.fillColor(LIGHT_GREEN).fontSize(7.5).font('Helvetica')
      .text('SCAN AT VENUE ENTRANCE', qrX - 8, qrY + 155, { width: 156, align: 'center' });

    // ── Booking ID box ────────────────────────────────────────────────────────
    doc.roundedRect(qrX - 8, qrY + 168, 156, 28, 4).fill(GOLD);
    doc.fillColor(DARK_GREEN).fontSize(7).font('Helvetica-Bold')
      .text('BOOKING ID', qrX - 8, qrY + 173, { width: 156, align: 'center' });
    doc.fillColor(DARK_GREEN).fontSize(11).font('Helvetica-Bold')
      .text(ticket.bookingId, qrX - 8, qrY + 183, { width: 156, align: 'center' });

    // ── Event title in left panel ─────────────────────────────────────────────
    doc.fillColor(WHITE).fontSize(24).font('Helvetica-Bold')
      .text('Prakriti', 0, H - 120, { width: LEFT_W, align: 'center' });
    doc.fillColor(GOLD).fontSize(20).font('Helvetica-Bold')
      .text('2026', 0, H - 93, { width: LEFT_W, align: 'center' });
    doc.fillColor(LIGHT_GREEN).fontSize(7).font('Helvetica')
      .text('Design - Conserve - Restore', 0, H - 70, { width: LEFT_W, align: 'center' });
    doc.fillColor(MID_GREEN).fontSize(6.5).font('Helvetica')
      .text('INDIAN INSTITUTE OF ARCHITECTS', 0, H - 52, { width: LEFT_W, align: 'center' });
    doc.text('FARIDABAD CENTRE', 0, H - 42, { width: LEFT_W, align: 'center' });

    // ── Vertical gold divider ─────────────────────────────────────────────────
    doc.moveTo(LEFT_W, 20).lineTo(LEFT_W, H - 20)
      .strokeColor(GOLD).lineWidth(0.5).stroke();

    // ── RIGHT PANEL ──────────────────────────────────────────────────────────
    const RX = LEFT_W + 28;
    const RW = W - RX - 24;

    // ── Entry Ticket badge (drawn, no special chars) ──────────────────────────
    doc.roundedRect(RX, 22, 84, 16, 8).fill(GOLD);
    // Draw small circle instead of ● character
    doc.circle(RX + 10, 30, 3).fill(DARK_GREEN);
    doc.fillColor(DARK_GREEN).fontSize(6.5).font('Helvetica-Bold')
      .text('ENTRY TICKET', RX + 16, 27, { width: 64, align: 'center' });

    doc.fillColor(GRAY).fontSize(7).font('Helvetica')
      .text('ADMIT ONE', W - 100, 27);

    // ── Event name ────────────────────────────────────────────────────────────
    doc.fillColor(DARK_GREEN).fontSize(30).font('Helvetica-Bold')
      .text('Prakriti 2026', RX, 46, { width: RW });
    doc.fillColor(MID_GREEN).fontSize(10).font('Helvetica')
      .text(ticket.eventSubtitle, RX, 83, { width: RW });

    doc.moveTo(RX, 100).lineTo(RX + RW, 100)
      .strokeColor(GOLD).lineWidth(0.8).stroke();

    // ── Event info ────────────────────────────────────────────────────────────
    const infoY = 108;
    doc.fillColor(GRAY).fontSize(7).font('Helvetica').text('DATE', RX, infoY);
    doc.fillColor(DARK_TEXT).fontSize(9).font('Helvetica-Bold').text('Saturday, 20 June 2026', RX, infoY + 9);
    doc.fillColor(GRAY).fontSize(7).font('Helvetica').text('TIME', RX + 130, infoY);
    doc.fillColor(DARK_TEXT).fontSize(9).font('Helvetica-Bold').text('3:00 PM Onwards', RX + 130, infoY + 9);
    doc.fillColor(GRAY).fontSize(7).font('Helvetica').text('VENUE', RX, infoY + 24);
    doc.fillColor(DARK_TEXT).fontSize(9).font('Helvetica-Bold')
      .text('Saffron Hall, Vardaan Group, Faridabad', RX, infoY + 33, { width: RW });

    // ── Dashed separator ─────────────────────────────────────────────────────
    const sepY = 160;
    doc.moveTo(RX, sepY).lineTo(RX + RW, sepY)
      .dash(4, { space: 3 }).strokeColor('#cccccc').lineWidth(0.7).stroke();
    doc.undash();

    // ── Attendee details ──────────────────────────────────────────────────────
    const COL1 = RX;
    const COL2 = RX + 175;
    const detY = 170;

    function det(label: string, value: string, x: number, y: number, w = 160) {
      doc.fillColor(GRAY).fontSize(6.5).font('Helvetica').text(label.toUpperCase(), x, y, { width: w });
      doc.fillColor(DARK_TEXT).fontSize(9.5).font('Helvetica-Bold').text(value || '-', x, y + 9, { width: w });
    }

    det('Attendee Name',      ticket.name,            COL1, detY,      160);
    det('Registration Type',  ticket.registrationType, COL2, detY,      130);
    det('Email',              ticket.email,            COL1, detY + 30, 160);
    det('Phone',              `+91 ${ticket.phone}`,   COL2, detY + 30, 130);
    det('Organization',       ticket.organization,     COL1, detY + 60, 160);
    det('Designation',        ticket.designation,      COL2, detY + 60, 130);

    // ── Amount + Payment ref box (no rupee symbol — use Rs.) ─────────────────
    const boxY = detY + 92;
    doc.roundedRect(COL1, boxY, RW, 36, 4).fill(PALE_GREEN).stroke('#d0e8d0');

    doc.fillColor(GRAY).fontSize(6.5).font('Helvetica')
      .text('AMOUNT PAID', COL1 + 12, boxY + 6);
    doc.fillColor(MID_GREEN).fontSize(14).font('Helvetica-Bold')
      .text(`Rs. ${ticket.totalAmount.toLocaleString('en-IN')}`, COL1 + 12, boxY + 15);

    doc.fillColor(GRAY).fontSize(6.5).font('Helvetica')
      .text('PAYMENT REF / UTR', COL1 + 130, boxY + 6);
    doc.fillColor(DARK_GREEN).fontSize(9).font('Helvetica-Bold')
      .text(ticket.utrNumber ?? '-', COL1 + 130, boxY + 17, { width: RW - 140 });

    // ── Terms ─────────────────────────────────────────────────────────────────
    const sep2Y = boxY + 46;
    doc.moveTo(RX, sep2Y).lineTo(RX + RW, sep2Y)
      .dash(4, { space: 3 }).strokeColor('#cccccc').lineWidth(0.7).stroke();
    doc.undash();

    doc.fillColor('#888888').fontSize(7).font('Helvetica')
      .text(
        'Carry valid photo ID (Aadhaar / PAN / Passport)  -  Non-transferable  -  Gates open at 2:30 PM',
        RX, sep2Y + 8, { width: RW }
      );

    // ── Footer ────────────────────────────────────────────────────────────────
    doc.rect(LEFT_W + 1, H - 28, W - LEFT_W - 1, 28).fill(DARK_GREEN);
    doc.fillColor('#558b5e').fontSize(7).font('Helvetica')
      .text('Computer-generated ticket - No physical signature required', RX, H - 21, { width: RW * 0.6 });
    doc.fillColor(GOLD).fontSize(7).font('Helvetica-Bold')
      .text(
        `Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`,
        RX + RW * 0.6, H - 21, { width: RW * 0.4, align: 'right' }
      );

    doc.end();
  });
}
