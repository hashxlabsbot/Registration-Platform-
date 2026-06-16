import { NextRequest, NextResponse } from 'next/server';
import { sendTicketEmail } from '@/lib/mailer';
import { generateTicketPDF, TicketData } from '@/lib/pdf';
import { isValidSession, SESSION_COOKIE } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Admin-only — authenticated via the session cookie, not a URL secret.
  if (!isValidSession(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const to = request.nextUrl.searchParams.get('to') || process.env.ADMIN_EMAIL || process.env.BREVO_SMTP_LOGIN!;

  const eventFields = {
    eventName:     process.env.EVENT_NAME     || 'Prakriti 2026',
    eventSubtitle: process.env.EVENT_SUBTITLE || 'Architects for a Sustainable Tomorrow',
    eventDate:     process.env.EVENT_DATE     || 'Saturday, 20 June 2026 · 3:00 PM',
    eventVenue:    process.env.EVENT_VENUE    || 'Saffron Hall, Vardaan Grand — Sector-21C, GymKhana Club, Surajkund Road, Faridabad',
    organizer:     process.env.ORGANIZER      || 'The Indian Institute of Architects — Faridabad Centre',
  };

  try {
    const primaryTicket: TicketData = {
      bookingId:        'PK-TEST1234',
      name:             'Test Attendee',
      email:            to,
      phone:            '9876543210',
      organization:     'Test Org',
      designation:      'Senior Architect',
      registrationType: 'Architect - IIA Member',
      totalAmount:      3001,
      utrNumber:        'TEST_UTR',
      ...eventFields,
    };

    const memberTickets: TicketData[] = [
      {
        bookingId:        'PK-TEST1234-M1',
        name:             'Test Member One',
        email:            to,
        phone:            '9876543211',
        organization:     'Test Org',
        designation:      'Spouse',
        registrationType: 'Non-Architect',
        totalAmount:      1000,
        utrNumber:        'TEST_UTR',
        ...eventFields,
      },
      {
        bookingId:        'PK-TEST1234-M2',
        name:             'Test Member Two',
        email:            to,
        phone:            '9876543212',
        organization:     'Test Org',
        designation:      'Colleague',
        registrationType: 'Non-Architect',
        totalAmount:      1000,
        utrNumber:        'TEST_UTR',
        ...eventFields,
      },
    ];

    // Generate member PDFs to attach to the primary email
    const memberPdfs = await Promise.all(memberTickets.map(mt => generateTicketPDF(mt)));
    const memberAttachments = memberPdfs.map((pdf, i) => ({
      name:    `ticket-${memberTickets[i].bookingId}.pdf`,
      content: pdf.toString('base64'),
    }));

    // Primary gets all 3 tickets attached; each member gets their own email
    await Promise.all([
      sendTicketEmail(primaryTicket, true, memberAttachments),
      ...memberTickets.map(mt => sendTicketEmail(mt, true)),
    ]);

    return NextResponse.json({
      success: true,
      sentTo:  to,
      tickets: [primaryTicket.bookingId, ...memberTickets.map(m => m.bookingId)],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
