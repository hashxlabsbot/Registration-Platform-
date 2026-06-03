import nodemailer from 'nodemailer';
import { generateTicketPDF, TicketData } from './pdf';

function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error('GMAIL_USER or GMAIL_APP_PASSWORD environment variable is not set');
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

export async function sendTicketEmail(ticket: TicketData, confirmed = false): Promise<void> {
  const pdfBuffer = await generateTicketPDF(ticket);
  const transporter = createTransporter();

  const badgeHtml = confirmed
    ? `<span style="display:inline-block;background:#c8a96e;border-radius:20px;padding:7px 22px;font-size:11px;font-weight:800;color:#0f2e14;letter-spacing:1.5px;text-transform:uppercase;">&#10003;&nbsp; Spot Confirmed</span>`
    : `<span style="display:inline-block;background:#e8f5e9;border:1px solid #81c784;border-radius:20px;padding:7px 22px;font-size:11px;font-weight:800;color:#2e7d32;letter-spacing:1.5px;text-transform:uppercase;">Registration Received</span>`;

  const welcomeText = confirmed
    ? `Your registration for <strong>Prakriti 2026</strong> is confirmed and your spot is reserved! We're thrilled to welcome you to this landmark architectural gathering. Your entry ticket is attached to this email as a PDF — save it and show it at the venue entrance.`
    : `Your registration for <strong>Prakriti 2026</strong> has been received. Our team will verify your UPI payment within 24–48 hours and confirm your spot. Your provisional entry ticket is attached for reference.`;

  const nextStepsHtml = confirmed
    ? `<strong>You're all set!</strong> Show your attached ticket (printed or on your phone) at the venue entrance on event day. Please carry a valid government-issued photo ID as well.`
    : `<strong>What's next?</strong> Our organizing team will verify your UPI payment and send you a confirmation email. Please keep your UTR number handy and carry a valid photo ID to the venue.`;

  const amountDisplay = ticket.totalAmount > 0
    ? `&#8377;${ticket.totalAmount.toLocaleString('en-IN')}`
    : 'Complimentary';

  const rows: [string, string][] = [
    ['Booking ID',        ticket.bookingId],
    ['Attendee Name',     ticket.name],
    ['Email Address',     ticket.email],
    ['Phone Number',      ticket.phone],
    ['Organization',      ticket.organization],
    ['Designation',       ticket.designation],
    ['Registration Type', ticket.registrationType],
    ['Amount',            amountDisplay],
  ];

  const rowsHtml = rows.map(([label, value], i) => `
    <tr style="${i > 0 ? 'border-top:1px solid #f0f4f0;' : ''}${i % 2 === 1 ? 'background:#fafcf8;' : ''}">
      <td style="padding:11px 20px;font-size:13px;color:#888888;width:40%;vertical-align:top;">${label}</td>
      <td style="padding:11px 20px;font-size:13px;color:#1a1a1a;font-weight:600;">${value}</td>
    </tr>`).join('');

  const subject = confirmed
    ? `You're Confirmed! Welcome to Prakriti 2026 · ${ticket.bookingId}`
    : `Registration Received — Prakriti 2026 · ${ticket.bookingId}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#eef2eb;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2eb;padding:36px 16px;">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 32px rgba(0,0,0,0.13);">

  <!-- TOP ACCENT LINE -->
  <tr><td style="background:#c8a96e;height:5px;font-size:0;line-height:0;">&nbsp;</td></tr>

  <!-- HEADER -->
  <tr>
    <td style="background:#0f2e14;padding:44px 48px 38px;text-align:center;">
      <p style="margin:0 0 8px;color:#c8a96e;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">The Indian Institute of Architects &middot; Faridabad Centre</p>
      <h1 style="margin:0;color:#ffffff;font-size:40px;font-weight:900;letter-spacing:-1px;line-height:1.05;">Prakriti 2026</h1>
      <p style="margin:10px 0 0;color:#a5d6a7;font-size:15px;font-style:italic;">${ticket.eventSubtitle}</p>
      <p style="margin:22px 0 0;">${badgeHtml}</p>
    </td>
  </tr>

  <!-- EVENT DETAILS STRIP -->
  <tr>
    <td style="background:#1a4a1a;padding:16px 48px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:50%;padding-right:20px;border-right:1px solid #2d6b2d;">
            <p style="margin:0;font-size:9px;color:#81c784;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">Date &amp; Time</p>
            <p style="margin:4px 0 0;font-size:13px;color:#ffffff;font-weight:600;">${ticket.eventDate}</p>
          </td>
          <td style="width:50%;padding-left:20px;">
            <p style="margin:0;font-size:9px;color:#81c784;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">Venue</p>
            <p style="margin:4px 0 0;font-size:13px;color:#ffffff;font-weight:600;">${ticket.eventVenue}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- WELCOME -->
  <tr>
    <td style="padding:38px 48px 0;">
      <h2 style="margin:0;font-size:24px;color:#0f2e14;font-weight:800;">Welcome, ${ticket.name}!</h2>
      <p style="margin:14px 0 0;font-size:15px;color:#555555;line-height:1.8;">${welcomeText}</p>
    </td>
  </tr>

  <!-- BOOKING SUMMARY -->
  <tr>
    <td style="padding:28px 48px 0;">
      <p style="margin:0 0 10px;font-size:9px;font-weight:800;color:#0f2e14;letter-spacing:2px;text-transform:uppercase;">Booking Summary</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dde8dd;border-radius:8px;overflow:hidden;">
        <tr style="background:#f1f8e9;">
          <td colspan="2" style="padding:12px 20px;border-bottom:1px solid #dde8dd;">
            <span style="font-size:14px;font-weight:800;color:#0f2e14;font-family:monospace;">${ticket.bookingId}</span>
            <span style="font-size:12px;color:#888;margin-left:12px;">${ticket.registrationType}</span>
          </td>
        </tr>
        ${rowsHtml}
      </table>
    </td>
  </tr>

  <!-- NEXT STEPS -->
  <tr>
    <td style="padding:20px 48px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffbf0;border:1px solid #e8d48a;border-radius:8px;">
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0;font-size:14px;color:#7a5c00;line-height:1.7;">${nextStepsHtml}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- TICKET ATTACHMENT NOTICE -->
  <tr>
    <td style="padding:14px 48px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f9f4;border:1px solid #c0dcc0;border-radius:8px;">
        <tr>
          <td style="padding:14px 20px;">
            <p style="margin:0;font-size:13px;color:#2e5e2e;line-height:1.6;">
              <strong>Attached ticket:</strong>&nbsp;
              <code style="background:#ddeedd;padding:2px 8px;border-radius:4px;font-size:12px;color:#0f2e14;font-family:monospace;">ticket-${ticket.bookingId}.pdf</code>
              &mdash; save it and present it at the entrance.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- DIVIDER -->
  <tr><td style="padding:30px 48px 0;"><hr style="border:none;border-top:1px solid #e8ede8;margin:0;"></td></tr>

  <!-- FOOTER -->
  <tr>
    <td style="padding:24px 48px 32px;text-align:center;">
      <p style="margin:0;font-size:13px;font-weight:700;color:#0f2e14;">${ticket.organizer}</p>
      <p style="margin:7px 0 0;font-size:12px;color:#999999;">
        For queries, write to us at
        <a href="mailto:${process.env.GMAIL_USER}" style="color:#2e7d32;text-decoration:none;font-weight:600;">${process.env.GMAIL_USER}</a>
      </p>
      <p style="margin:16px 0 0;font-size:11px;color:#cccccc;">This is an automated confirmation email &mdash; please do not reply directly.</p>
    </td>
  </tr>

  <!-- BOTTOM ACCENT LINE -->
  <tr><td style="background:#c8a96e;height:5px;font-size:0;line-height:0;">&nbsp;</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"Prakriti 2026 · IIA Faridabad" <${process.env.GMAIL_USER}>`,
    to: ticket.email,
    subject,
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
  utrNumber?: string;
}

export async function sendAdminNotification(data: AdminNotificationData): Promise<void> {
  const transporter = createTransporter();
  const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER!;

  const rows: [string, string][] = [
    ['Booking ID',            data.bookingId],
    ['Name',                  data.name],
    ['Gender',                data.gender || '—'],
    ['Nationality',           data.nationality || '—'],
    ['Email',                 data.email],
    ['Phone',                 data.phone],
    ['WhatsApp',              data.whatsapp || '—'],
    ['Organization',          data.organization],
    ['Designation',           data.designation],
    ['Address',               data.address || '—'],
    ['District',              data.district || '—'],
    ['State',                 data.state || '—'],
    ['Pincode',               data.pincode || '—'],
    ['Registration Type',     data.registrationType],
    ['Amount',                `&#8377;${data.totalAmount.toLocaleString('en-IN')}`],
    ['COA Number',            data.coaNumber || '—'],
    ['IIA Membership No.',    data.iiaMembershipNumber || '—'],
    ['UPI Transaction / UTR', data.utrNumber || '—'],
    ['Registered At',         new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST'],
  ];

  const rowsHtml = rows.map(([label, value], i) => `
    <tr style="${i % 2 === 1 ? 'background:#fafafa;' : ''}${i > 0 ? 'border-top:1px solid #f0f4f0;' : ''}">
      <td style="padding:9px 16px;font-size:12px;color:#777777;width:38%;">${label}</td>
      <td style="padding:9px 16px;font-size:12px;color:#1a1a1a;font-weight:600;">${value}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:30px 0;">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

  <tr>
    <td style="background:#0f2e14;padding:20px 40px;">
      <p style="margin:0;color:#c8a96e;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">New Registration &mdash; Prakriti 2026</p>
      <h2 style="margin:4px 0 0;color:#ffffff;font-size:20px;font-weight:800;">${data.name}</h2>
      <p style="margin:2px 0 0;color:#a5d6a7;font-size:13px;">${data.organization} &middot; ${data.designation}</p>
    </td>
  </tr>

  <tr>
    <td style="padding:24px 40px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8efe8;border-radius:6px;overflow:hidden;">
        ${rowsHtml}
      </table>
      <p style="margin:14px 0 0;font-size:12px;color:#999;">Verify the UTR/payment ID above before confirming entry.</p>
    </td>
  </tr>

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
