import nodemailer from 'nodemailer';
import { generateTicketPDF, TicketData } from './pdf';

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

export async function sendTicketEmail(ticket: TicketData): Promise<void> {
  const pdfBuffer = await generateTicketPDF(ticket);
  const transporter = createTransporter();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <tr><td style="background:#1a4a1a;padding:36px 40px;text-align:center;">
          <p style="margin:0 0 6px;color:#c8a96e;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">Registration Received</p>
          <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;">Prakriti 2026</h1>
          <p style="margin:6px 0 0;color:#a5d6a7;font-size:13px;">${ticket.eventSubtitle}</p>
          <p style="margin:4px 0 0;color:#81c784;font-size:11px;">${ticket.eventDate} &nbsp;·&nbsp; ${ticket.eventVenue}</p>
        </td></tr>

        <tr><td style="padding:32px 40px 0;">
          <p style="margin:0;font-size:16px;color:#333333;">Hi <strong>${ticket.name}</strong>,</p>
          <p style="margin:12px 0 0;font-size:14px;color:#555555;line-height:1.6;">
            Your registration for <strong>Prakriti 2026</strong> has been received. Your entry ticket is attached as a PDF — please present it at the venue entrance after payment verification.
          </p>
        </td></tr>

        <tr><td style="padding:24px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8efe8;border-radius:6px;overflow:hidden;">
            <tr style="background:#f1f8e9;">
              <td colspan="2" style="padding:12px 16px;font-size:11px;font-weight:bold;color:#2e7d32;letter-spacing:1px;text-transform:uppercase;">Booking Summary</td>
            </tr>
            ${[
              ['Booking ID', ticket.bookingId],
              ['Attendee', ticket.name],
              ['Email', ticket.email],
              ['Phone', ticket.phone],
              ['Organization', ticket.organization],
              ['Designation', ticket.designation],
              ['Registration Type', ticket.registrationType],
              ['Amount', `₹${ticket.totalAmount.toLocaleString('en-IN')}`],
            ]
              .map(
                ([label, value], i) => `
            <tr style="border-top:1px solid #f0f4f0;${i % 2 === 1 ? 'background:#fafafa;' : ''}">
              <td style="padding:10px 16px;font-size:13px;color:#777777;width:40%;">${label}</td>
              <td style="padding:10px 16px;font-size:13px;color:#1a1a1a;font-weight:bold;">${value}</td>
            </tr>`
              )
              .join('')}
          </table>
        </td></tr>

        <tr><td style="padding:0 40px 32px;">
          <div style="background:#fff8e1;border-left:4px solid #f5a623;border-radius:0 4px 4px 0;padding:14px 16px;">
            <p style="margin:0;font-size:13px;color:#7a5c00;line-height:1.5;">
              <strong>What happens next?</strong> The organizing team will verify your payment. Your entry ticket will be confirmed and emailed to you shortly. Please carry a valid photo ID to the venue.
            </p>
          </div>
        </td></tr>

        <tr><td style="background:#1a4a1a;padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#558b5e;">This is an automatically generated email — please do not reply.</p>
          <p style="margin:6px 0 0;font-size:11px;color:#2e5e2e;">${ticket.organizer}</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"Prakriti 2026" <${process.env.GMAIL_USER}>`,
    to: ticket.email,
    subject: `Registration Received — Prakriti 2026 · ${ticket.bookingId}`,
    html,
    attachments: [
      {
        filename: `ticket-${ticket.bookingId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}

export interface AdminNotificationData extends TicketData {
  gender: string;
  nationality: string;
  whatsapp: string;
  address: string;
  district: string;
  state: string;
  pincode: string;
  coaNumber: string;
  iiaMembershipNumber: string;
}

export async function sendAdminNotification(
  data: AdminNotificationData
): Promise<void> {
  const transporter = createTransporter();
  const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER!;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <tr><td style="background:#1a4a1a;padding:20px 40px;">
          <p style="margin:0;color:#c8a96e;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">New Registration — Prakriti 2026</p>
          <h2 style="margin:4px 0 0;color:#ffffff;font-size:20px;">${data.name}</h2>
          <p style="margin:2px 0 0;color:#a5d6a7;font-size:13px;">${data.organization} · ${data.designation}</p>
        </td></tr>

        <tr><td style="padding:24px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8efe8;border-radius:6px;overflow:hidden;">
            ${[
              ['Booking ID', data.bookingId],
              ['Name', data.name],
              ['Gender', data.gender],
              ['Nationality', data.nationality],
              ['Email', data.email],
              ['Phone', data.phone],
              ['WhatsApp', data.whatsapp || '—'],
              ['Organization', data.organization],
              ['Designation', data.designation],
              ['Address', data.address || '—'],
              ['District', data.district],
              ['State', data.state],
              ['Pincode', data.pincode],
              ['Registration Type', data.registrationType],
              ['Amount', `₹${data.totalAmount.toLocaleString('en-IN')}`],
              ['COA Number', data.coaNumber || '—'],
              ['IIA Membership No.', data.iiaMembershipNumber || '—'],
              ['Registered At', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST'],
            ]
              .map(
                ([label, value], i) => `
            <tr style="${i % 2 === 1 ? 'background:#fafafa;' : ''}${i > 0 ? 'border-top:1px solid #f0f4f0;' : ''}">
              <td style="padding:9px 16px;font-size:12px;color:#777777;width:38%;">${label}</td>
              <td style="padding:9px 16px;font-size:12px;color:#1a1a1a;font-weight:bold;">${value}</td>
            </tr>`
              )
              .join('')}
          </table>
          <p style="margin:14px 0 0;font-size:12px;color:#999;">
            Payment screenshot is attached. Please verify in your UPI app and confirm entry.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"Prakriti 2026 Registrations" <${process.env.GMAIL_USER}>`,
    to: adminEmail,
    subject: `[New Registration] ${data.name} — ${data.registrationType} · ${data.bookingId}`,
    html,
  });
}
