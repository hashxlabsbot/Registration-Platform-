import { NextRequest, NextResponse } from 'next/server';
import { getRegistrationById } from '@/lib/registrations';
import { sendTicketEmail } from '@/lib/mailer';
import { generateTicketPDF, TicketData } from '@/lib/pdf';
import { getPdf, storePdf } from '@/lib/db';
import { isValidSession, SESSION_COOKIE } from '@/lib/auth';

export const runtime = 'nodejs';

// Re-send a ticket email to an attendee who lost/never received theirs.
export async function POST(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (!isValidSession(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { bookingId, email: overrideEmail } = await request.json();
  if (!bookingId) {
    return NextResponse.json({ error: 'bookingId is required.' }, { status: 400 });
  }

  const reg = await getRegistrationById(String(bookingId));
  if (!reg) {
    return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  }

  const email = (overrideEmail || reg.email || '').trim();
  if (!email) {
    return NextResponse.json({ error: 'No email on file. Provide one to resend.' }, { status: 400 });
  }

  const ticketData: TicketData = {
    bookingId: reg.bookingId,
    name: reg.name,
    email,
    phone: reg.phone,
    organization: reg.organization || '—',
    designation:  reg.designation  || '—',
    registrationType: reg.registrationType,
    totalAmount: reg.amount,
    utrNumber: reg.utrNumber || '—',
    eventName:     process.env.EVENT_NAME     || 'Prakriti 2026',
    eventSubtitle: process.env.EVENT_SUBTITLE || 'Architects for a Sustainable Tomorrow',
    eventDate:     process.env.EVENT_DATE     || 'Saturday, 20 June 2026 · 3:00 PM',
    eventVenue:    process.env.EVENT_VENUE    || 'Saffron Hall, Vardaan Grand — Sector-21C, GymKhana Club, Surajkund Road, Faridabad',
    organizer:     process.env.ORGANIZER      || 'The Indian Institute of Architects — Faridabad Centre',
  };

  try {
    let pdf = await getPdf(reg.bookingId);
    if (!pdf) {
      pdf = await generateTicketPDF(ticketData);
      storePdf(reg.bookingId, pdf).catch((err) => console.error('[resend:store]', err));
    }
    await sendTicketEmail(ticketData, true, [], pdf);
  } catch (err) {
    console.error('[resend]', err);
    return NextResponse.json({ error: 'Failed to send email. Try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, sentTo: email });
}
