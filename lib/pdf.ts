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
    // A5 landscape — looks great as an event ticket
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

    // Subtle dot pattern in left panel
    for (let row = 0; row < 25; row++) {
      for (let col = 0; col < 12; col++) {
        doc.circle(col * 18 + 9, row * 18 + 9, 1).fill('rgba(200,169,110,0.12)');
      }
    }

    // ── QR Code ──────────────────────────────────────────────────────────────
    const qrPayload = JSON.stringify({
      id: ticket.bookingId,
      n: ticket.name,
      t: ticket.registrationType,
      e: 'PRAKRITI2026',
    });
    const qrBuf = await QRCode.toBuffer(qrPayload, {
      width: 140,
      margin: 1,
      color: { dark: DARK_GREEN, light: WHITE },
    });

    // QR white card
    const qrX = 35;
    const qrY = 50;
    doc.roundedRect(qrX - 8, qrY - 8, 156, 156, 6).fill(WHITE);
    doc.image(qrBuf, qrX, qrY, { width: 140 });

    // Corner accents on QR
    const ca = (x: number, y: number, d1: number, d2: number) => {
      doc.moveTo(x, y + d1).lineTo(x, y).lineTo(x + d2, y)
        .strokeColor(GOLD).lineWidth(1.5).stroke();
    };
    ca(qrX - 8, qrY - 8, 12, 12);
    ca(qrX + 148, qrY - 8, 12, -12);
    ca(qrX - 8, qrY + 148, -12, 12);
    ca(qrX + 148, qrY + 148, -12, -12);

    // "Scan at Entrance" label
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
      .text('Design · Conserve · Restore', 0, H - 70, { width: LEFT_W, align: 'center' });

    // IIA label at bottom
    doc.fillColor(MID_GREEN).fontSize(6.5).font('Helvetica')
      .text('INDIAN INSTITUTE OF ARCHITECTS', 0, H - 52, { width: LEFT_W, align: 'center' });
    doc.text('FARIDABAD CENTRE', 0, H - 42, { width: LEFT_W, align: 'center' });

    // ── Vertical gold divider line ────────────────────────────────────────────
    doc.moveTo(LEFT_W, 20).lineTo(LEFT_W, H - 20)
      .strokeColor(GOLD).lineWidth(0.5).stroke();

    // ── RIGHT PANEL ──────────────────────────────────────────────────────────
    const RX = LEFT_W + 28; // right panel start x
    const RW = W - RX - 24; // right panel width

    // ── Header row ────────────────────────────────────────────────────────────
    // Entry Ticket badge
    doc.roundedRect(RX, 22, 80, 16, 8).fill(GOLD);
    doc.fillColor(DARK_GREEN).fontSize(6.5).font('Helvetica-Bold')
      .text('● ENTRY TICKET', RX, 27, { width: 80, align: 'center' });

    // ADMIT ONE
    doc.fillColor(GRAY).fontSize(7).font('Helvetica')
      .text('ADMIT ONE', W - 100, 27);

    // ── Event name ────────────────────────────────────────────────────────────
    doc.fillColor(DARK_GREEN).fontSize(30).font('Helvetica-Bold')
      .text('Prakriti 2026', RX, 46, { width: RW });
    doc.fillColor(MID_GREEN).fontSize(10).font('Helvetica')
      .text(ticket.eventSubtitle, RX, 83, { width: RW });

    // Thin gold rule
    doc.moveTo(RX, 100).lineTo(RX + RW, 100)
      .strokeColor(GOLD).lineWidth(0.8).stroke();

    // ── Event info row ────────────────────────────────────────────────────────
    const infoY = 108;
    // Date
    doc.fillColor(GRAY).fontSize(7).font('Helvetica').text('DATE', RX, infoY);
    doc.fillColor(DARK_TEXT).fontSize(9).font('Helvetica-Bold').text('Saturday, 20 June 2026', RX, infoY + 9);
    // Time
    doc.fillColor(GRAY).fontSize(7).font('Helvetica').text('TIME', RX + 130, infoY);
    doc.fillColor(DARK_TEXT).fontSize(9).font('Helvetica-Bold').text('3:00 PM Onwards', RX + 130, infoY + 9);
    // Venue
    doc.fillColor(GRAY).fontSize(7).font('Helvetica').text('VENUE', RX, infoY + 24);
    doc.fillColor(DARK_TEXT).fontSize(9).font('Helvetica-Bold')
      .text('Saffron Hall, Vardaan Group, Faridabad', RX, infoY + 33, { width: RW });

    // ── Dashed separator ─────────────────────────────────────────────────────
    const sepY = 160;
    doc.moveTo(RX, sepY).lineTo(RX + RW, sepY)
      .dash(4, { space: 3 }).strokeColor('#cccccc').lineWidth(0.7).stroke();
    doc.undash();

    // ── Attendee details grid ─────────────────────────────────────────────────
    const COL1 = RX;
    const COL2 = RX + 175;
    const detY = 170;

    function detailBlock(label: string, value: string, x: number, y: number, w = 160) {
      doc.fillColor(GRAY).fontSize(6.5).font('Helvetica')
        .text(label.toUpperCase(), x, y, { width: w });
      doc.fillColor(DARK_TEXT).fontSize(9.5).font('Helvetica-Bold')
        .text(value || '—', x, y + 9, { width: w });
    }

    detailBlock('Attendee Name', ticket.name, COL1, detY, 160);
    detailBlock('Registration Type', ticket.registrationType, COL2, detY, 130);

    detailBlock('Email', ticket.email, COL1, detY + 30, 160);
    detailBlock('Phone', `+91 ${ticket.phone}`, COL2, detY + 30, 130);

    detailBlock('Organization', ticket.organization, COL1, detY + 60, 160);
    detailBlock('Designation', ticket.designation, COL2, detY + 60, 130);

    // ── Amount + UTR highlight box ─────────────────────────────────────────────
    const boxY2 = detY + 92;
    doc.roundedRect(COL1, boxY2, RW, 36, 4).fill(PALE_GREEN).stroke('#d0e8d0');

    doc.fillColor(GRAY).fontSize(6.5).font('Helvetica')
      .text('AMOUNT PAID', COL1 + 12, boxY2 + 6);
    doc.fillColor(MID_GREEN).fontSize(14).font('Helvetica-Bold')
      .text(`₹${ticket.totalAmount.toLocaleString('en-IN')}`, COL1 + 12, boxY2 + 15);

    doc.fillColor(GRAY).fontSize(6.5).font('Helvetica')
      .text('UPI TRANSACTION / UTR', COL1 + 130, boxY2 + 6);
    doc.fillColor(DARK_GREEN).fontSize(9).font('Helvetica-Bold')
      .text(ticket.utrNumber ?? '—', COL1 + 130, boxY2 + 17, { width: RW - 140 });

    // ── Bottom dashed separator ───────────────────────────────────────────────
    const sep2Y = boxY2 + 46;
    doc.moveTo(RX, sep2Y).lineTo(RX + RW, sep2Y)
      .dash(4, { space: 3 }).strokeColor('#cccccc').lineWidth(0.7).stroke();
    doc.undash();

    // ── Terms ─────────────────────────────────────────────────────────────────
    const termsY = sep2Y + 8;
    doc.fillColor('#888888').fontSize(7).font('Helvetica')
      .text('• Carry valid photo ID (Aadhaar / PAN / Passport)  •  Non-transferable  •  Entry subject to payment verification  •  Gates open at 2:30 PM', RX, termsY, { width: RW });

    // ── Footer bar ────────────────────────────────────────────────────────────
    doc.rect(LEFT_W + 1, H - 28, W - LEFT_W - 1, 28).fill(DARK_GREEN);
    doc.fillColor('#558b5e').fontSize(7).font('Helvetica')
      .text('Computer-generated ticket · No physical signature required', RX, H - 21, { width: RW * 0.6 });
    doc.fillColor(GOLD).fontSize(7).font('Helvetica-Bold')
      .text(`Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`, RX + RW * 0.6, H - 21, { width: RW * 0.4, align: 'right' });

    doc.end();
  });
}
