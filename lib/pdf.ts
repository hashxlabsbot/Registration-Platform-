import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export interface TicketData {
  bookingId: string;
  name: string;
  email: string;
  phone: string;
  organization: string;
  designation: string;
  eventName: string;
  eventSubtitle: string;
  eventDate: string;
  eventVenue: string;
  organizer: string;
  registrationType: string;
  totalAmount: number;
}

const PRIMARY = '#1a4a1a';   // deep green matching event theme
const ACCENT = '#2e7d32';
const GOLD = '#c8a96e';

export async function generateTicketPDF(ticket: TicketData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width;

    // ── Header banner ────────────────────────────────────────────────────────
    doc.rect(0, 0, W, 155).fill(PRIMARY);

    doc.fillColor(GOLD)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('ENTRY TICKET — LIMITED REGISTRATION', 0, 22, { align: 'center', width: W });

    doc.fillColor('white')
      .fontSize(30)
      .font('Helvetica-Bold')
      .text('Prakriti 2026', 0, 42, { align: 'center', width: W });

    doc.fillColor('#a5d6a7')
      .fontSize(13)
      .font('Helvetica')
      .text(ticket.eventSubtitle, 0, 82, { align: 'center', width: W });

    doc.fillColor('#81c784')
      .fontSize(10)
      .text(ticket.organizer, 0, 104, { align: 'center', width: W });

    // ── Booking ID strip ─────────────────────────────────────────────────────
    doc.rect(0, 143, W, 34).fill(ACCENT);
    doc.fillColor('white')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(`BOOKING ID: ${ticket.bookingId}`, 0, 150, { align: 'center', width: W });

    // ── QR Code ──────────────────────────────────────────────────────────────
    const qrPayload = JSON.stringify({
      bookingId: ticket.bookingId,
      name: ticket.name,
      type: ticket.registrationType,
      event: 'PRAKRITI2026',
    });
    const qrBuffer = await QRCode.toBuffer(qrPayload, {
      width: 155,
      margin: 1,
      color: { dark: PRIMARY, light: '#ffffff' },
    });

    const qrX = W - 210;
    const qrY = 195;
    doc.rect(qrX - 12, qrY - 12, 182, 182).fill('white').stroke('#e0e0e0');
    doc.image(qrBuffer, qrX, qrY, { width: 155 });
    doc.fillColor('#666666')
      .fontSize(8)
      .font('Helvetica')
      .text('Scan at venue entrance', qrX - 12, qrY + 162, { width: 182, align: 'center' });

    // ── Attendee details ──────────────────────────────────────────────────────
    const rows: [string, string][] = [
      ['Attendee Name', ticket.name],
      ['Organization', ticket.organization],
      ['Designation', ticket.designation],
      ['Email', ticket.email],
      ['Phone', ticket.phone],
      ['Registration Type', ticket.registrationType],
      ['Amount Paid', `₹${ticket.totalAmount.toLocaleString('en-IN')}`],
    ];

    let y = 195;
    const detailX = 50;
    rows.forEach(([label, value]) => {
      doc.fillColor('#777777').fontSize(8).font('Helvetica').text(label.toUpperCase(), detailX, y);
      doc.fillColor('#1a1a1a')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(value, detailX, y + 11, { width: qrX - detailX - 20 });
      y += 32;
    });

    // ── Event info box ────────────────────────────────────────────────────────
    const boxY = y + 10;
    doc.rect(detailX, boxY, W - 100, 52).fill('#f1f8e9').stroke('#a5d6a7');
    doc.fillColor(PRIMARY).fontSize(9).font('Helvetica-Bold')
      .text('EVENT DETAILS', detailX + 12, boxY + 8);
    doc.fillColor('#333333').fontSize(10).font('Helvetica')
      .text(`${ticket.eventDate}`, detailX + 12, boxY + 22);
    doc.text(`${ticket.eventVenue}`, detailX + 12, boxY + 35, { width: W - 124 });

    // ── Dashed separator ──────────────────────────────────────────────────────
    const divY = boxY + 70;
    doc.moveTo(50, divY).lineTo(W - 50, divY)
      .dash(6, { space: 4 }).strokeColor('#bbbbbb').lineWidth(1).stroke();
    doc.undash();
    doc.fillColor('#aaaaaa').fontSize(10).text('✂', 30, divY - 7);

    // ── Terms ─────────────────────────────────────────────────────────────────
    let ty = divY + 16;
    doc.fillColor('#444444').fontSize(10).font('Helvetica-Bold').text('Important Information', detailX, ty);
    ty += 16;
    const terms = [
      '• Carry a valid photo ID (Aadhar / PAN / Passport) along with this ticket.',
      '• Entry is subject to physical verification of payment at the venue.',
      '• This ticket is non-transferable and strictly for the registered individual.',
      '• Gates open 30 minutes before the event. Please be seated by 2:45 PM.',
    ];
    terms.forEach((t) => {
      doc.fillColor('#555555').fontSize(9).font('Helvetica').text(t, detailX, ty);
      ty += 14;
    });

    // ── Footer ────────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 55;
    doc.rect(0, footerY, W, 55).fill(PRIMARY);
    doc.fillColor('#a5d6a7').fontSize(9).font('Helvetica')
      .text('This is a computer-generated ticket. No physical signature required.', 0, footerY + 10, { align: 'center', width: W });
    doc.fillColor('#558b5e')
      .text(
        `Generated on ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`,
        0, footerY + 26, { align: 'center', width: W }
      );
    doc.fillColor(GOLD).fontSize(10).font('Helvetica-Bold')
      .text('prakriti 2026 · IIA Faridabad Centre', 0, footerY + 40, { align: 'center', width: W });

    doc.end();
  });
}
