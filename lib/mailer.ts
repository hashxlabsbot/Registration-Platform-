import { generateTicketPDF, TicketData } from './pdf';

const BREVO_API = 'https://api.brevo.com/v3/smtp/email';

function apiKey(): string {
  const key = process.env.BREVO_API_KEY;
  if (!key) throw new Error('BREVO_API_KEY environment variable is not set');
  return key;
}

function sender() {
  return {
    email: process.env.SENDER_EMAIL || 'prakriti2026.iiafaridabad@gmail.com',
    name:  process.env.SENDER_NAME  || 'Prakriti 2026 · IIA Faridabad',
  };
}

// Calls Brevo API with up to 3 retries on transient failures (5xx / 429)
async function sendEmail(payload: object): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(BREVO_API, {
      method: 'POST',
      headers: {
        'accept':       'application/json',
        'content-type': 'application/json',
        'api-key':      apiKey(),
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) return;

    const body = await res.text();

    // 4xx (except 429) = config/auth error — no point retrying
    if (res.status < 500 && res.status !== 429) {
      throw new Error(`Brevo API ${res.status}: ${body}`);
    }

    lastError = new Error(`Brevo API ${res.status} (attempt ${attempt}/3): ${body}`);
    console.error('[mailer] transient error, will retry:', lastError.message);

    // Respect Retry-After header if present (429), otherwise exponential backoff
    const retryAfter = res.headers.get('Retry-After');
    const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : attempt * 1500;
    await new Promise(r => setTimeout(r, waitMs));
  }

  throw lastError!;
}

export async function sendTicketEmail(
  ticket: TicketData,
  confirmed = false,
  extraAttachments: { name: string; content: string }[] = [],
): Promise<void> {
  const pdfBuffer = await generateTicketPDF(ticket);

  const badgeHtml = confirmed
    ? `<span style="display:inline-block;background:#c8a96e;border-radius:20px;padding:8px 24px;font-size:11px;font-weight:800;color:#0b2310;letter-spacing:1.5px;text-transform:uppercase;box-shadow:0 2px 8px rgba(200,169,110,0.3);">&#10003;&nbsp; Spot Confirmed</span>`
    : `<span style="display:inline-block;background:#e8f5e9;border:1px solid #81c784;border-radius:20px;padding:8px 24px;font-size:11px;font-weight:800;color:#1b4f26;letter-spacing:1.5px;text-transform:uppercase;">Registration Received</span>`;

  const welcomeText = confirmed
    ? `Your registration for <strong>Prakriti 2026</strong> is confirmed and your spot is reserved! We're thrilled to welcome you to this landmark architectural gathering. Your entry ticket is attached to this email as a PDF — save it and show it at the venue entrance.`
    : `Your registration for <strong>Prakriti 2026</strong> has been received. Our team will verify your UPI payment within 24–48 hours and confirm your spot. Your provisional entry ticket is attached for reference.`;

  const nextStepsHtml = confirmed
    ? `<strong>You're all set!</strong> Show your attached ticket (printed or on your phone) at the venue entrance on event day. Please carry a valid government-issued photo ID as well.`
    : `<strong>What's next?</strong> Our organizing team will verify your UPI payment and send you a confirmation email. Please keep your UTR number handy and carry a valid photo ID to the venue.`;

  const amountDisplay = ticket.totalAmount > 0
    ? `&#8377;${ticket.totalAmount.toLocaleString('en-IN')}`
    : 'Complimentary';

  const displayRegType = (ticket.registrationType === 'Non-Architect' || ticket.registrationType === 'Non - Architect')
    ? 'Delegate'
    : ticket.registrationType;

  const rows: [string, string][] = [
    ['Booking ID',        ticket.bookingId],
    ['Attendee Name',     ticket.name],
    ['Email Address',     ticket.email],
    ['Phone Number',      ticket.phone],
    ['Organization',      ticket.organization],
    ['Designation',       ticket.designation],
    ['Registration Type', displayRegType],
    ['Amount',            amountDisplay],
  ];

  const rowsHtml = rows.map(([label, value], i) => `
    <tr style="${i > 0 ? 'border-top:1px solid #eef3ef;' : ''}${i % 2 === 1 ? 'background:#fafcf9;' : ''}">
      <td style="padding:12px 20px;font-size:13px;color:#666666;width:40%;vertical-align:top;">${label}</td>
      <td style="padding:12px 20px;font-size:13px;color:#222222;font-weight:600;vertical-align:top;">${value}</td>
    </tr>`).join('');

  const subject = confirmed
    ? `You're Confirmed! Welcome to Prakriti 2026 · ${ticket.bookingId}`
    : `Registration Received — Prakriti 2026 · ${ticket.bookingId}`;

  const contactEmail = process.env.ADMIN_EMAIL || sender().email;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f5f7f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<!-- Preheader Text -->
<div style="display:none;font-size:1px;color:#f5f7f4;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
  Your spot is secured! See you on Saturday, 20 June 2026 for Prakriti 2026.
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7f4;padding:36px 16px;">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(10,35,16,0.08);">

  <!-- TOP ACCENT LINE -->
  <tr><td style="background:#c8a96e;height:6px;font-size:0;line-height:0;">&nbsp;</td></tr>

  <!-- HEADER WITH BACKGROUND HERO IMAGE -->
  <tr>
    <td background="https://img.sanishtech.com/u/c02df2ca1883f430e77e5ce5a5add772.jpg" bgcolor="#0b2310" style="background-image: url('https://img.sanishtech.com/u/c02df2ca1883f430e77e5ce5a5add772.jpg'); background-size: cover; background-position: center; padding: 0; text-align: center; vertical-align: middle;">
      <!--[if gte mso 9]>
      <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:320px;">
        <v:fill type="tile" src="https://img.sanishtech.com/u/c02df2ca1883f430e77e5ce5a5add772.jpg" color="#0b2310" />
        <v:textbox inset="0,0,0,0">
      <![endif]-->
      <div style="background-color: rgba(11, 35, 16, 0.80); padding: 64px 40px 56px; text-align: center;">
        <p style="margin:0 0 12px;color:#c8a96e;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;line-height:1.2;">The Indian Institute of Architects &middot; Faridabad Centre</p>
        <h1 style="margin:0 0 8px;color:#ffffff;font-size:36px;font-weight:800;letter-spacing:-0.5px;line-height:1.1;">Prakriti 2026</h1>
        <p style="margin:0 0 24px;color:#a5d6a7;font-size:15px;font-weight:400;letter-spacing:0.5px;font-style:italic;">${ticket.eventSubtitle}</p>
        <div style="margin:0 auto;text-align:center;">
          ${badgeHtml}
        </div>
      </div>
      <!--[if gte mso 9]>
        </v:textbox>
      </v:rect>
      <![endif]-->
    </td>
  </tr>

  <!-- EVENT DETAILS STRIP -->
  <tr>
    <td style="background:#143e1d;padding:20px 40px;border-bottom:1px solid #1c5228;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:50%;padding-right:20px;vertical-align:top;border-right:1px solid #1c5228;">
            <p style="margin:0;font-size:9px;color:#a5d6a7;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">📅 Date &amp; Time</p>
            <p style="margin:6px 0 0;font-size:13px;color:#ffffff;font-weight:600;line-height:1.4;">${ticket.eventDate}</p>
          </td>
          <td style="width:50%;padding-left:20px;vertical-align:top;">
            <p style="margin:0;font-size:9px;color:#a5d6a7;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">📍 Venue</p>
            <p style="margin:6px 0 0;font-size:13px;color:#ffffff;font-weight:600;line-height:1.4;">${ticket.eventVenue.split(',')[0]}<br/><span style="font-size:11px;color:#81c784;font-weight:normal;">Faridabad, Haryana</span></p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- WELCOME -->
  <tr>
    <td style="padding:40px 40px 20px;">
      <h2 style="margin:0;font-size:24px;color:#0b2310;font-weight:800;letter-spacing:-0.5px;">Welcome, ${ticket.name}!</h2>
      <p style="margin:14px 0 0;font-size:15px;color:#444444;line-height:1.7;">${welcomeText}</p>
    </td>
  </tr>

  <!-- BOOKING SUMMARY -->
  <tr>
    <td style="padding:20px 40px 20px;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:800;color:#0b2310;letter-spacing:2px;text-transform:uppercase;">Booking Summary</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e1ebe2;border-radius:12px;overflow:hidden;background:#ffffff;">
        <tr style="background:#eef5ef;">
          <td colspan="2" style="padding:14px 20px;border-bottom:1px solid #e1ebe2;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-size:15px;font-weight:800;color:#0b2310;font-family:monospace;letter-spacing:0.5px;">${ticket.bookingId}</span>
                </td>
                <td align="right">
                  <span style="display:inline-block;background:#ffffff;border:1px solid #cddccf;border-radius:12px;padding:3px 10px;font-size:10px;font-weight:700;color:#1b4f26;text-transform:uppercase;letter-spacing:0.5px;">${displayRegType}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        ${rowsHtml}
      </table>
    </td>
  </tr>

  <!-- NEXT STEPS -->
  <tr>
    <td style="padding:10px 40px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffcf5;border:1px solid #ebd8a0;border-radius:12px;">
        <tr>
          <td style="padding:18px 20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:24px;vertical-align:top;font-size:16px;line-height:1;">💡</td>
                <td style="padding-left:12px;font-size:14px;color:#705100;line-height:1.6;font-weight:500;">
                  ${nextStepsHtml}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- TICKET ATTACHMENT NOTICE -->
  <tr>
    <td style="padding:10px 40px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4faf5;border:1px solid #c5e0cb;border-radius:12px;">
        <tr>
          <td style="padding:16px 20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:24px;vertical-align:top;font-size:16px;line-height:1;">📎</td>
                <td style="padding-left:12px;font-size:13px;color:#1b4f26;line-height:1.6;">
                  <strong>${extraAttachments.length > 0 ? `${1 + extraAttachments.length} Entry Ticket PDFs Attached (yours + ${extraAttachments.length} member ticket${extraAttachments.length > 1 ? 's' : ''}):` : 'Provisional Entry Ticket PDF Attached:'}</strong>
                  <br/>
                  <code style="background:#d9ebdcd7;padding:2px 6px;border-radius:4px;font-size:12px;color:#0b2310;font-family:monospace;font-weight:bold;">ticket-${ticket.bookingId}.pdf</code>
                  ${extraAttachments.map(a => `<br/><code style="background:#d9ebdcd7;padding:2px 6px;border-radius:4px;font-size:12px;color:#0b2310;font-family:monospace;font-weight:bold;">${a.name}</code>`).join('')}
                  <br/>Please download and present each ticket (on your smartphone or printed) at the reception desk.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- VENUE LOCATION -->
  <tr>
    <td style="padding:10px 40px 30px;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:800;color:#0b2310;letter-spacing:2px;text-transform:uppercase;">Location Details</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e1ebe2;border-radius:12px;overflow:hidden;background:#ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.02);">
        <tr>
          <td style="padding:20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:24px;vertical-align:top;font-size:18px;line-height:1;">📍</td>
                <td style="padding-left:12px;vertical-align:top;">
                  <h3 style="margin:0 0 6px;font-size:16px;color:#0b2310;font-weight:800;line-height:1.2;">${ticket.eventVenue.split(',')[0]}</h3>
                  <p style="margin:0 0 16px;font-size:13px;color:#666666;line-height:1.5;">${ticket.eventVenue}</p>
                  <a href="https://maps.google.com/?q=${encodeURIComponent(ticket.eventVenue)}" target="_blank" style="display:inline-block;background:#0b2310;border:1px solid #0b2310;border-radius:8px;padding:10px 20px;font-size:13px;font-weight:700;color:#ffffff;text-decoration:none;text-align:center;">🧭 Open in Google Maps</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:#0b2310;padding:48px 40px;text-align:center;border-top:1px solid #1c5228;">
      <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#c8a96e;letter-spacing:0.5px;">${ticket.organizer}</p>
      <p style="margin:0 0 24px;font-size:12px;color:#a5d6a7;line-height:1.5;">
        For registration queries or support, reach us at<br/>
        <a href="mailto:${contactEmail}" style="color:#ffffff;text-decoration:underline;font-weight:600;">${contactEmail}</a>
      </p>
      <div style="border-top:1px solid #1c5228;padding-top:24px;">
        <p style="margin:0;font-size:11px;color:#81c784;">This is an automated confirmation email regarding your registration.</p>
        <p style="margin:4px 0 0;font-size:10px;color:#6b9a6d;">&copy; 2026 IIA Faridabad Centre. All rights reserved.</p>
      </div>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  await sendEmail({
    sender:    sender(),
    to:        [{ email: ticket.email }],
    replyTo:   { email: contactEmail },
    subject,
    htmlContent,
    headers: {
      'List-Unsubscribe': `<mailto:${contactEmail}?subject=unsubscribe>`,
      'X-Mailer': 'Prakriti2026-Mailer/1.0',
    },
    attachment: [
      {
        name:    `ticket-${ticket.bookingId}.pdf`,
        content: pdfBuffer.toString('base64'),
      },
      ...extraAttachments,
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
  members?: { name: string; relation: string; email: string; phone: string }[];
}

export async function sendAdminNotification(data: AdminNotificationData): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || sender().email;

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

  const membersHtml = (data.members && data.members.length > 0) ? `
    <p style="margin:14px 0 6px;font-size:11px;font-weight:700;color:#0b2310;letter-spacing:1.5px;text-transform:uppercase;">Additional Members (${data.members.length})</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8efe8;border-radius:6px;overflow:hidden;margin-bottom:8px;">
      <tr style="background:#eef5ef;">
        <td style="padding:8px 12px;font-size:11px;font-weight:700;color:#0b2310;width:25%;">Name</td>
        <td style="padding:8px 12px;font-size:11px;font-weight:700;color:#0b2310;width:20%;">Relation</td>
        <td style="padding:8px 12px;font-size:11px;font-weight:700;color:#0b2310;width:30%;">Email</td>
        <td style="padding:8px 12px;font-size:11px;font-weight:700;color:#0b2310;width:25%;">Phone</td>
      </tr>
      ${data.members.map((m, i) => `
      <tr style="${i > 0 ? 'border-top:1px solid #f0f4f0;' : ''}${i % 2 === 1 ? 'background:#fafafa;' : ''}">
        <td style="padding:8px 12px;font-size:12px;color:#1a1a1a;font-weight:600;">${m.name}</td>
        <td style="padding:8px 12px;font-size:12px;color:#555;">${m.relation}</td>
        <td style="padding:8px 12px;font-size:12px;color:#555;">${m.email}</td>
        <td style="padding:8px 12px;font-size:12px;color:#555;">+91 ${m.phone}</td>
      </tr>`).join('')}
    </table>` : '';

  const htmlContent = `<!DOCTYPE html>
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
      ${membersHtml}
      <p style="margin:14px 0 0;font-size:12px;color:#999;">Verify the UTR/payment ID above before confirming entry.</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  await sendEmail({
    sender:      sender(),
    to:          [{ email: adminEmail }],
    replyTo:     { email: data.email },
    subject:     `[New Registration] ${data.name} — ${data.registrationType} · ${data.bookingId}`,
    htmlContent,
  });
}
